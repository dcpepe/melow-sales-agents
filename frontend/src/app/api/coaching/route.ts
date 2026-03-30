import { NextRequest, NextResponse } from "next/server";
import { callClaude, callClaudeText } from "@/lib/server/llm";
import { listDealIds, loadAnalysis } from "@/lib/server/storage";
import { kv } from "@vercel/kv";

export const maxDuration = 120;

const SUMMARY_CACHE_KEY = "coaching:team:summary";
const FULL_CACHE_KEY = "coaching:team:full";
const CACHE_TTL = 60 * 60 * 24 * 3; // 3 days

async function buildDealContext() {
  const dealIds = await listDealIds();
  if (dealIds.length === 0) return null;

  const pipeline = kv.pipeline();
  for (const id of dealIds.slice(0, 15)) pipeline.get(`deal:${id}`);
  const deals = (await pipeline.exec()).filter(Boolean) as Record<string, unknown>[];

  const summaries: string[] = [];
  for (const deal of deals) {
    const analysisIds = (deal.analysis_ids as string[]) || [];
    if (analysisIds.length === 0) continue;

    const latest = await loadAnalysis(analysisIds[0]);
    if (!latest) continue;

    const ca = latest.call_analysis as Record<string, unknown>;
    const mp = latest.medpicc as Record<string, unknown>;
    const breakdown = ca?.breakdown as Record<string, number> | undefined;

    summaries.push(
      `Deal: ${deal.deal_name} (${deal.company}) | ${deal.call_count} calls | Owner: ${deal.owner || "unassigned"}
Call Score: ${ca?.call_score}/100 | MEDPICC: ${mp?.overall_score}% | Risk: ${mp?.risk_assessment} | Win: ${mp?.deal_probability}%
Breakdown: Discovery ${breakdown?.discovery_quality}, Pain ${breakdown?.pain_identification}, Impact ${breakdown?.business_impact_clarity}, Stakeholders ${breakdown?.stakeholder_mapping}, Urgency ${breakdown?.urgency_creation}, Demo ${breakdown?.demo_clarity}, Next Steps ${breakdown?.next_steps_strength}
Key Mistakes: ${JSON.stringify(ca?.key_mistakes)}
Coaching: ${JSON.stringify(ca?.coaching)}
Missed: ${JSON.stringify(ca?.missed_opportunities)}
Open Questions: ${JSON.stringify(ca?.open_questions)}`
    );
  }

  return { deals, summaries, count: deals.length };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { force_regenerate, mode } = body;

    // Full structured coaching for the coaching page
    if (mode === "full") {
      if (!force_regenerate) {
        const cached = await kv.get(FULL_CACHE_KEY);
        if (cached) return NextResponse.json(cached);
      }

      const ctx = await buildDealContext();
      if (!ctx) return NextResponse.json({ no_deals: true });

      const prompt = `You are analyzing a sales team's pipeline to provide structured coaching feedback. Be specific and reference real deal names.

PIPELINE DATA:
${ctx.summaries.join("\n\n---\n\n")}

Return ONLY valid JSON matching this structure:
{
  "overall_grade": "<A/B/C/D/F>",
  "headline": "<one punchy sentence summarizing the team's state>",
  "score_breakdown": {
    "discovery": <0-100>,
    "pain_identification": <0-100>,
    "business_impact": <0-100>,
    "stakeholder_mapping": <0-100>,
    "urgency_creation": <0-100>,
    "demo_execution": <0-100>,
    "next_steps": <0-100>
  },
  "stop_doing": [
    {"behavior": "<what to stop>", "evidence": "<which deals show this>", "impact": "<what it costs>"}
  ],
  "start_doing": [
    {"behavior": "<what to start>", "how": "<specific technique>", "example_script": "<exact words to use>"}
  ],
  "double_down": [
    {"strength": "<what's working>", "evidence": "<where it showed>", "amplify": "<how to do more>"}
  ],
  "deal_specific": [
    {"deal_name": "<name>", "verdict": "<1 sentence>", "one_thing": "<the single most important action>"}
  ],
  "this_week": ["<action 1>", "<action 2>", "<action 3>"]
}`;

      const result = await callClaude(prompt);
      const data = { ...result, generated_at: new Date().toISOString(), deal_count: ctx.count };
      await kv.set(FULL_CACHE_KEY, data, { ex: CACHE_TTL });
      return NextResponse.json(data);
    }

    // Summary mode (for dashboard card)
    if (!force_regenerate) {
      const cached = await kv.get<{ summary: string; generated_at: string }>(SUMMARY_CACHE_KEY);
      if (cached) return NextResponse.json(cached);
    }

    const ctx = await buildDealContext();
    if (!ctx) return NextResponse.json({ no_deals: true });

    const prompt = `You are Frank Golden, a legendary sales coach from New York City. You wear sunglasses everywhere and carry two big bags of cash.

You're reviewing your team's pipeline:

${ctx.summaries.join("\n\n---\n\n")}

Give a SHORT (4-6 sentences max) coaching summary. Be direct, specific, and reference real deal names. Identify the 1-2 biggest patterns. End with one thing to do THIS WEEK.

Tone: confident, warm but tough, NYC energy. No bullet points — conversational, like talking at a team meeting.

Return ONLY the text, no JSON, no formatting headers.`;

    const summary = await callClaudeText(prompt);
    const data = { summary, generated_at: new Date().toISOString() };
    await kv.set(SUMMARY_CACHE_KEY, data, { ex: CACHE_TTL });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Coaching error:", error);
    return NextResponse.json({ error: "Coaching generation failed" }, { status: 500 });
  }
}
