import { NextRequest, NextResponse } from "next/server";
import { loadAnalysis, loadDeal } from "@/lib/server/storage";
import { kv } from "@vercel/kv";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";

async function loadDealContext(dealId: string): Promise<{ deal: Record<string, unknown>; analyses: Record<string, unknown>[] } | null> {
  const deal = await loadDeal(dealId);
  if (!deal) return null;

  const analysisIds = (deal.analysis_ids as string[]) || [];
  if (analysisIds.length === 0) return { deal, analyses: [] };

  // Load up to 5 most recent analyses
  const idsToLoad = analysisIds.slice(0, 5);
  const pipeline = kv.pipeline();
  for (const id of idsToLoad) pipeline.get(`analysis:${id}`);
  const results = await pipeline.exec();

  return { deal, analyses: results.filter(Boolean) as Record<string, unknown>[] };
}

function buildTranscriptContext(analyses: Record<string, unknown>[]): string {
  if (analyses.length === 1) {
    return analyses[0].labeled_transcript as string;
  }
  return analyses.map((a, i) => {
    const date = a.created_at ? new Date(a.created_at as string).toLocaleDateString() : `Call ${i + 1}`;
    return `--- CALL: ${date} ---\n${a.labeled_transcript}`;
  }).join("\n\n");
}

export async function POST(req: NextRequest) {
  try {
    const { deal_id, analysis_id, messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    let dealName = "Unknown";
    let company = "Unknown Company";
    let participants = "Not specified";
    let transcriptContext = "";
    let callAnalysisContext = "";
    let medpiccContext = "";
    let callCount = 1;

    if (deal_id) {
      const ctx = await loadDealContext(deal_id);
      if (!ctx) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

      dealName = ctx.deal.deal_name as string || "Unknown";
      company = ctx.deal.company as string || "Unknown Company";
      callCount = ctx.analyses.length;
      transcriptContext = buildTranscriptContext(ctx.analyses);

      // Build analysis context from all calls
      const analysisDetails = ctx.analyses.map((a, i) => {
        const ca = a.call_analysis as Record<string, unknown>;
        const mp = a.medpicc as Record<string, unknown>;
        const date = a.created_at ? new Date(a.created_at as string).toLocaleDateString() : `Call ${i + 1}`;
        return `Call ${date}:\n- Score: ${ca?.call_score}/100\n- MEDPICC: ${mp?.overall_score}%\n- Risk: ${mp?.risk_assessment}\n- Open Questions: ${JSON.stringify(ca?.open_questions)}\n- Coaching: ${JSON.stringify(ca?.coaching)}`;
      });
      callAnalysisContext = analysisDetails.join("\n\n");

      // Latest MEDPICC
      if (ctx.analyses.length > 0) {
        const mp = ctx.analyses[0].medpicc as Record<string, unknown>;
        medpiccContext = JSON.stringify(mp, null, 2);
        participants = (ctx.analyses[0].participants as string) || "Not specified";
      }
    } else if (analysis_id) {
      // Backward compat: single analysis
      const analysis = await loadAnalysis(analysis_id);
      if (!analysis) return NextResponse.json({ error: "Analysis not found" }, { status: 404 });

      dealName = (analysis.deal_name as string) || "Unknown";
      company = (analysis.company as string) || "Unknown Company";
      participants = (analysis.participants as string) || "Not specified";
      transcriptContext = analysis.labeled_transcript as string;

      const ca = analysis.call_analysis as Record<string, unknown>;
      const mp = analysis.medpicc as Record<string, unknown>;
      callAnalysisContext = `- Score: ${ca?.call_score}/100\n- Open Questions: ${JSON.stringify(ca?.open_questions)}\n- Coaching: ${JSON.stringify(ca?.coaching)}`;
      medpiccContext = JSON.stringify(mp, null, 2);
    } else {
      return NextResponse.json({ error: "deal_id or analysis_id required" }, { status: 400 });
    }

    const systemPrompt = `You are an expert sales advisor embedded in a deal intelligence platform. You have full context from ${callCount} call${callCount !== 1 ? "s" : ""} for this deal. Be direct, specific, and actionable. No fluff.

DEAL: ${dealName} at ${company}
PARTICIPANTS: ${participants}
CALLS ANALYZED: ${callCount}

TRANSCRIPTS:
${transcriptContext}

CALL ANALYSIS:
${callAnalysisContext}

LATEST MEDPICC:
${medpiccContext}

Answer questions about this deal concisely. When you have multiple calls, reference how things have evolved. When asked for scripts or emails, write them ready to use. Be brutally honest about what's missing.`;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("Chat error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Chat failed: ${message}` }, { status: 500 });
  }
}
