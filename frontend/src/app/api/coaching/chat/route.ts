import { NextRequest, NextResponse } from "next/server";
import { listDealIds, loadAnalysis } from "@/lib/server/storage";
import { kv } from "@vercel/kv";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    // Load all deals + latest analyses for context
    const dealIds = await listDealIds();
    const dealSummaries: string[] = [];

    if (dealIds.length > 0) {
      const pipeline = kv.pipeline();
      for (const id of dealIds.slice(0, 15)) pipeline.get(`deal:${id}`);
      const deals = (await pipeline.exec()).filter(Boolean) as Record<string, unknown>[];

      for (const deal of deals) {
        const analysisIds = (deal.analysis_ids as string[]) || [];
        if (analysisIds.length === 0) {
          dealSummaries.push(`Deal: ${deal.deal_name} (${deal.company}) — No calls analyzed yet`);
          continue;
        }

        // Load latest analysis
        const latest = await loadAnalysis(analysisIds[0]);
        if (!latest) continue;

        const ca = latest.call_analysis as Record<string, unknown>;
        const mp = latest.medpicc as Record<string, unknown>;
        const breakdown = ca?.breakdown as Record<string, number> | undefined;

        dealSummaries.push(
          `Deal: ${deal.deal_name} (${deal.company}) | ${deal.call_count} calls
Call Score: ${ca?.call_score}/100 | MEDPICC: ${mp?.overall_score}% | Risk: ${mp?.risk_assessment} | Win Prob: ${mp?.deal_probability}%
Breakdown: Discovery ${breakdown?.discovery_quality}, Pain ${breakdown?.pain_identification}, Impact ${breakdown?.business_impact_clarity}, Stakeholders ${breakdown?.stakeholder_mapping}, Urgency ${breakdown?.urgency_creation}, Demo ${breakdown?.demo_clarity}, Next Steps ${breakdown?.next_steps_strength}
Key Mistakes: ${JSON.stringify(ca?.key_mistakes)}
Coaching Tips: ${JSON.stringify(ca?.coaching)}
Missed Opportunities: ${JSON.stringify(ca?.missed_opportunities)}
Open Questions: ${JSON.stringify(ca?.open_questions)}
Transcript excerpt: ${(latest.labeled_transcript as string || "").slice(0, 1000)}...`
        );
      }
    }

    const systemPrompt = `You are Frank Golden, a legendary sales coach based in New York City. You wear sunglasses everywhere — even indoors — and you always carry two big bags of cash, because that's what your reps earn when they follow your advice.

PERSONA:
- Direct, no-BS, and a little cocky — but only because you've closed more deals than most people have had hot dinners
- Warm but tough — you care deeply about your reps winning, which is why you don't sugarcoat
- NYC energy — confident, fast, street-smart
- You call people "kid" sometimes, reference specific deals by name, and point out patterns
- When coaching, you give exact scripts — "Here's what you should have said..."
- If someone is avoiding hard conversations (budget, timeline, competition), you call them out
- You believe every deal can be won if you do the work

TEAM'S PIPELINE DATA:
${dealSummaries.length > 0 ? dealSummaries.join("\n\n") : "No deals in the pipeline yet."}

RULES:
- Always reference specific deals and data when coaching
- When asked "what am I doing wrong", give a ranked list with evidence from the data
- When asked to role-play, play the tough prospect — push back, ask hard questions, be skeptical
- Keep responses focused and actionable — Frank doesn't ramble
- Use the breakdown scores to identify skill gaps (anything below 50 is a problem)
- If MEDPICC categories are weak, explain exactly what questions to ask to fill the gap`;

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
    console.error("Frank chat error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Chat failed: ${message}` }, { status: 500 });
  }
}
