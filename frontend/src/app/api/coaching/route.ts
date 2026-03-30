import { NextRequest, NextResponse } from "next/server";
import { callClaudeText } from "@/lib/server/llm";
import { listDealIds, loadAnalysis } from "@/lib/server/storage";
import { kv } from "@vercel/kv";

export const maxDuration = 60;

const CACHE_KEY = "coaching:team:summary";
const CACHE_TTL = 60 * 60 * 24 * 3; // 3 days

export async function POST(req: NextRequest) {
  try {
    const { force_regenerate } = await req.json().catch(() => ({}));

    // Check cache
    if (!force_regenerate) {
      const cached = await kv.get<{ summary: string; generated_at: string }>(CACHE_KEY);
      if (cached) return NextResponse.json(cached);
    }

    // Load all deals
    const dealIds = await listDealIds();
    if (dealIds.length === 0) {
      return NextResponse.json({ no_deals: true });
    }

    const pipeline = kv.pipeline();
    for (const id of dealIds) pipeline.get(`deal:${id}`);
    const deals = (await pipeline.exec()).filter(Boolean) as Record<string, unknown>[];

    // Load latest analysis for each deal (for coaching data)
    const analysisSummaries: string[] = [];
    for (const deal of deals.slice(0, 10)) {
      const analysisIds = (deal.analysis_ids as string[]) || [];
      if (analysisIds.length === 0) continue;

      const latest = await loadAnalysis(analysisIds[0]);
      if (!latest) continue;

      const ca = latest.call_analysis as Record<string, unknown>;
      const mp = latest.medpicc as Record<string, unknown>;
      const breakdown = ca?.breakdown as Record<string, number> | undefined;

      analysisSummaries.push(
        `Deal: ${deal.deal_name} (${deal.company})
Call Score: ${ca?.call_score}/100
MEDPICC: ${mp?.overall_score}% | Risk: ${mp?.risk_assessment} | Win: ${mp?.deal_probability}%
Breakdown: Discovery ${breakdown?.discovery_quality}, Pain ${breakdown?.pain_identification}, Impact ${breakdown?.business_impact_clarity}, Stakeholders ${breakdown?.stakeholder_mapping}, Urgency ${breakdown?.urgency_creation}, Demo ${breakdown?.demo_clarity}, Next Steps ${breakdown?.next_steps_strength}
Key Mistakes: ${JSON.stringify(ca?.key_mistakes)}
Coaching: ${JSON.stringify(ca?.coaching)}
Missed: ${JSON.stringify(ca?.missed_opportunities)}`
      );
    }

    const prompt = `You are Frank Golden, a legendary sales coach from New York City. You wear sunglasses everywhere and carry two big bags of cash — because that's what your reps earn when they listen to you.

You're reviewing your team's pipeline. Here's what you see:

${analysisSummaries.join("\n\n---\n\n")}

Give a SHORT (4-6 sentences max) coaching summary. Be direct, specific, and reference real deal names. Identify the 1-2 biggest patterns holding the team back. End with one specific thing to do THIS WEEK.

Tone: confident, warm but tough, NYC energy. You care about your reps winning. No bullet points — write it conversationally like you're talking to them at a team meeting.

Return ONLY the text, no JSON, no formatting headers.`;

    const summary = await callClaudeText(prompt);

    const data = { summary, generated_at: new Date().toISOString() };
    await kv.set(CACHE_KEY, data, { ex: CACHE_TTL });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Coaching error:", error);
    return NextResponse.json({ error: "Coaching generation failed" }, { status: 500 });
  }
}
