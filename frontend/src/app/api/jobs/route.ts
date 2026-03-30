import { NextRequest, NextResponse } from "next/server";
import { createJob, updateJob, getLatestJob } from "@/lib/server/job-queue";
import { getLatestAnalysis, saveNewAnalysisVersion, recomputeDealMetrics } from "@/lib/server/deal-analysis-service";
import { loadDeal, loadAnalysis } from "@/lib/server/storage";
import { callClaude, callClaudeText } from "@/lib/server/llm";
import { MEDPICC_ACTION_PLAN_PROMPT, fillTemplate } from "@/lib/server/prompts";
import { kv } from "@vercel/kv";

export const maxDuration = 120;

/**
 * POST /api/jobs — trigger an async job
 * Body: { deal_id, type, force?: boolean }
 *
 * If force=false and cached data exists, returns immediately with cached version.
 * If force=true or no cache, creates a job and runs it.
 */
export async function POST(req: NextRequest) {
  try {
    const { deal_id, type, force } = await req.json();

    if (!deal_id || !type) {
      return NextResponse.json({ error: "deal_id and type required" }, { status: 400 });
    }

    // Check if there's already a running job
    const existingJob = await getLatestJob(deal_id, type);
    if (existingJob && (existingJob.status === "pending" || existingJob.status === "running")) {
      return NextResponse.json({ job: existingJob, cached: false });
    }

    // Cache-first: return cached version if not forcing refresh
    if (!force) {
      const cached = await getLatestAnalysis(deal_id, type);
      if (cached) {
        return NextResponse.json({
          cached: true,
          version: cached,
          job: null,
        });
      }
    }

    // Create job and run it
    const job = await createJob(deal_id, type);
    await updateJob(job.id, { status: "running" });

    // Execute the job inline (Vercel serverless — no separate worker)
    try {
      let content: string;

      if (type === "medpicc_recompute") {
        await recomputeDealMetrics(deal_id);
        await updateJob(job.id, {
          status: "completed",
          completed_at: new Date().toISOString(),
        });
        return NextResponse.json({ job: { ...job, status: "completed" }, cached: false });
      }

      if (type === "meeting_prep") {
        content = await generateMeetingPrep(deal_id);
      } else if (type === "action_plan") {
        content = await generateActionPlan(deal_id);
      } else if (type === "frank_analysis") {
        content = await generateFrankAnalysis(deal_id);
      } else {
        throw new Error(`Unknown job type: ${type}`);
      }

      const version = await saveNewAnalysisVersion(deal_id, type, content);
      await updateJob(job.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
        result_version: version.version,
      });

      return NextResponse.json({
        job: { ...job, status: "completed", result_version: version.version },
        version,
        cached: false,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      await updateJob(job.id, { status: "failed", error: msg });
      return NextResponse.json({ job: { ...job, status: "failed", error: msg }, cached: false }, { status: 500 });
    }
  } catch (error) {
    console.error("Job error:", error);
    return NextResponse.json({ error: "Job failed" }, { status: 500 });
  }
}

// --- Generation functions ---

async function loadDealTranscripts(dealId: string, limit = 3): Promise<{ deal: Record<string, unknown>; transcripts: string }> {
  const deal = await loadDeal(dealId);
  if (!deal) throw new Error("Deal not found");

  const analysisIds = (deal.analysis_ids as string[]) || [];
  if (analysisIds.length === 0) throw new Error("No calls for this deal");

  const idsToLoad = analysisIds.slice(0, limit);
  const pipeline = kv.pipeline();
  for (const id of idsToLoad) pipeline.get(`analysis:${id}`);
  const results = (await pipeline.exec()).filter(Boolean) as Record<string, unknown>[];

  const transcripts = results.map((a, i) => {
    const date = a.created_at ? new Date(a.created_at as string).toLocaleDateString() : `Call ${i + 1}`;
    return `--- CALL: ${date} ---\n${a.labeled_transcript}`;
  }).join("\n\n");

  return { deal, transcripts };
}

async function generateMeetingPrep(dealId: string): Promise<string> {
  const { deal, transcripts } = await loadDealTranscripts(dealId);
  const analysisIds = (deal.analysis_ids as string[]) || [];
  const pipeline = kv.pipeline();
  for (const id of analysisIds.slice(0, 3)) pipeline.get(`analysis:${id}`);
  const analyses = (await pipeline.exec()).filter(Boolean) as Record<string, unknown>[];

  const callSummaries = analyses.map((a, i) => {
    const ca = a.call_analysis as Record<string, unknown>;
    const mp = a.medpicc as Record<string, unknown>;
    const date = a.created_at ? new Date(a.created_at as string).toLocaleDateString() : `Call ${i + 1}`;
    return `CALL: ${date}\nScore: ${ca?.call_score}/100\nOpen Questions: ${JSON.stringify(ca?.open_questions)}\nCoaching: ${JSON.stringify(ca?.coaching)}\nRecommended Actions: ${JSON.stringify(mp?.recommended_actions)}`;
  });

  const prompt = `You are preparing a sales rep for their next meeting. Be specific and actionable.

DEAL: ${deal.deal_name} at ${deal.company}
Stage: ${deal.stage || "Unknown"}

PREVIOUS CALLS:
${callSummaries.join("\n\n---\n\n")}

TRANSCRIPTS:
${transcripts.slice(0, 6000)}

Generate a meeting prep brief with: DEAL STATUS, WHAT WE KNOW, WHAT WE DON'T KNOW, MEETING OBJECTIVES (3), OPENING PLAY (exact script), KEY QUESTIONS (5-7), LANDMINES TO AVOID, POWER MOVES (2-3). Reference real names and moments.`;

  return callClaudeText(prompt);
}

async function generateActionPlan(dealId: string): Promise<string> {
  const { deal, transcripts } = await loadDealTranscripts(dealId);
  const latest = await loadAnalysis((deal.analysis_ids as string[])[0]);
  if (!latest) throw new Error("No analysis found");

  const medpicc = latest.medpicc as Record<string, unknown>;
  const scores = ["metrics", "economic_buyer", "decision_criteria", "decision_process", "paper_process", "identify_pain", "champion", "competition"]
    .map((k) => `${k}: ${(medpicc[k] as Record<string, unknown>)?.score}/5`)
    .join("\n");

  const prompt = fillTemplate(MEDPICC_ACTION_PLAN_PROMPT, {
    labeled_transcript: transcripts.slice(0, 6000),
    medpicc_scores: scores,
  });

  const result = await callClaude(prompt);
  return JSON.stringify(result);
}

async function generateFrankAnalysis(dealId: string): Promise<string> {
  const { deal, transcripts } = await loadDealTranscripts(dealId);
  const latest = await loadAnalysis((deal.analysis_ids as string[])[0]);
  if (!latest) throw new Error("No analysis found");

  const ca = latest.call_analysis as Record<string, unknown>;
  const mp = latest.medpicc as Record<string, unknown>;

  const prompt = `You are Frank Golden, legendary sales coach from NYC. Review this specific deal and give structured coaching.

DEAL: ${deal.deal_name} at ${deal.company}
Call Score: ${ca?.call_score}/100 | MEDPICC: ${mp?.overall_score}% | Risk: ${mp?.risk_assessment}
Key Mistakes: ${JSON.stringify(ca?.key_mistakes)}
Coaching: ${JSON.stringify(ca?.coaching)}

TRANSCRIPTS:
${transcripts.slice(0, 4000)}

Give your coaching in this format:
1. VERDICT (1 sentence — how this deal looks)
2. BIGGEST PROBLEM (what's killing this deal)
3. WHAT TO DO NEXT (3 specific actions with scripts)
4. WHAT TO STOP DOING (2 things)
5. YOUR PREDICTION (will this deal close? why/why not?)

Be direct, reference the transcript, give exact words to say.`;

  return callClaudeText(prompt);
}
