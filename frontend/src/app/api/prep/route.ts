import { NextRequest, NextResponse } from "next/server";
import { callClaudeText } from "@/lib/server/llm";
import { loadDeal } from "@/lib/server/storage";
import { saveNewAnalysisVersion } from "@/lib/server/deal-analysis-service";
import { kv } from "@vercel/kv";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { deal_id } = await req.json();
    if (!deal_id) return NextResponse.json({ error: "deal_id required" }, { status: 400 });

    const deal = await loadDeal(deal_id);
    if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    const analysisIds = (deal.analysis_ids as string[]) || [];
    if (analysisIds.length === 0) {
      return NextResponse.json({ error: "No calls analyzed yet" }, { status: 400 });
    }

    // Load up to 3 most recent analyses
    const pipeline = kv.pipeline();
    for (const id of analysisIds.slice(0, 3)) pipeline.get(`analysis:${id}`);
    const analyses = (await pipeline.exec()).filter(Boolean) as Record<string, unknown>[];

    // Build context
    const callSummaries = analyses.map((a, i) => {
      const ca = a.call_analysis as Record<string, unknown>;
      const mp = a.medpicc as Record<string, unknown>;
      const date = a.created_at ? new Date(a.created_at as string).toLocaleDateString() : `Call ${i + 1}`;
      return `CALL: ${date}
Score: ${ca?.call_score}/100
Transcript: ${(a.labeled_transcript as string || "").slice(0, 2000)}
Key Mistakes: ${JSON.stringify(ca?.key_mistakes)}
Missed Opportunities: ${JSON.stringify(ca?.missed_opportunities)}
Open Questions: ${JSON.stringify(ca?.open_questions)}
Coaching: ${JSON.stringify(ca?.coaching)}
MEDPICC: Overall ${mp?.overall_score}%, Risk: ${mp?.risk_assessment}, Win: ${mp?.deal_probability}%
Recommended Actions: ${JSON.stringify(mp?.recommended_actions)}`;
    });

    const prompt = `You are preparing a sales rep for their next meeting with a prospect. This is a real deal — be specific and actionable.

DEAL: ${deal.deal_name} at ${deal.company}
Stage: ${deal.stage || "Unknown"}
Calls Analyzed: ${analyses.length}

PREVIOUS CALL DATA:
${callSummaries.join("\n\n---\n\n")}

Generate a meeting prep brief. Structure it clearly with these sections:

1. **DEAL STATUS** — Where we stand in 2-3 sentences. Include risk level and win probability.

2. **WHAT WE KNOW** — Key facts established from previous calls. Be specific — names, numbers, timelines mentioned.

3. **WHAT WE DON'T KNOW** — Critical gaps that MUST be filled in the next meeting. Prioritize by deal impact.

4. **MEETING OBJECTIVES** — 3 specific things to accomplish. Not vague — "Confirm budget range of X" not "Discuss budget."

5. **OPENING PLAY** — Exact script for how to open the meeting. First 60 seconds — what to say to set the tone and agenda.

6. **KEY QUESTIONS TO ASK** — 5-7 questions in priority order. For each, explain what you're trying to uncover and why it matters.

7. **LANDMINES TO AVOID** — Things NOT to do/say based on previous calls. Mistakes that were made before.

8. **POWER MOVES** — 2-3 bold actions that could accelerate the deal. Things most reps wouldn't think of.

Be brutally specific. Reference real names, numbers, and moments from the transcripts. No generic advice.`;

    const prep = await callClaudeText(prompt);

    // Save versioned cache (never overwrites previous versions)
    const version = await saveNewAnalysisVersion(deal_id, "meeting_prep", prep);

    return NextResponse.json({
      prep,
      version: version.version,
      generated_at: version.created_at,
    });
  } catch (error) {
    console.error("Prep error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Prep failed: ${message}` }, { status: 500 });
  }
}
