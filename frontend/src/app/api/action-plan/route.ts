import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/server/llm";
import { MEDPICC_ACTION_PLAN_PROMPT, fillTemplate } from "@/lib/server/prompts";
import { loadAnalysis, loadDeal } from "@/lib/server/storage";
import { kv } from "@vercel/kv";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { deal_id, analysis_id } = await req.json();

    let labeledTranscript = "";
    let medpiccScores = "";

    if (deal_id) {
      // Deal-scoped: load all analyses, combine transcripts, use latest MEDPICC
      const deal = await loadDeal(deal_id);
      if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

      const analysisIds = (deal.analysis_ids as string[]) || [];
      if (analysisIds.length === 0) {
        return NextResponse.json({ error: "No calls analyzed for this deal" }, { status: 400 });
      }

      // Load up to 3 most recent
      const idsToLoad = analysisIds.slice(0, 3);
      const pipeline = kv.pipeline();
      for (const id of idsToLoad) pipeline.get(`analysis:${id}`);
      const results = (await pipeline.exec()).filter(Boolean) as Record<string, unknown>[];

      // Combine transcripts
      labeledTranscript = results.map((a, i) => {
        const date = a.created_at ? new Date(a.created_at as string).toLocaleDateString() : `Call ${i + 1}`;
        return `--- CALL: ${date} ---\n${a.labeled_transcript}`;
      }).join("\n\n");

      // Use latest MEDPICC scores
      const latestMedpicc = results[0]?.medpicc as Record<string, unknown> | undefined;
      if (latestMedpicc) {
        medpiccScores = [
          `M (Metrics): ${(latestMedpicc.metrics as Record<string, unknown>)?.score}/5`,
          `E (Economic Buyer): ${(latestMedpicc.economic_buyer as Record<string, unknown>)?.score}/5`,
          `D (Decision Criteria): ${(latestMedpicc.decision_criteria as Record<string, unknown>)?.score}/5`,
          `D (Decision Process): ${(latestMedpicc.decision_process as Record<string, unknown>)?.score}/5`,
          `P (Paper Process): ${(latestMedpicc.paper_process as Record<string, unknown>)?.score}/5`,
          `I (Identify Pain): ${(latestMedpicc.identify_pain as Record<string, unknown>)?.score}/5`,
          `C (Champion): ${(latestMedpicc.champion as Record<string, unknown>)?.score}/5`,
          `C (Competition): ${(latestMedpicc.competition as Record<string, unknown>)?.score}/5`,
        ].join("\n");
      }
    } else if (analysis_id) {
      // Backward compat: single analysis
      const analysis = await loadAnalysis(analysis_id);
      if (!analysis) return NextResponse.json({ error: "Analysis not found" }, { status: 404 });

      labeledTranscript = analysis.labeled_transcript as string;
      const medpicc = analysis.medpicc as Record<string, unknown>;
      medpiccScores = [
        `M (Metrics): ${(medpicc.metrics as Record<string, unknown>)?.score}/5`,
        `E (Economic Buyer): ${(medpicc.economic_buyer as Record<string, unknown>)?.score}/5`,
        `D (Decision Criteria): ${(medpicc.decision_criteria as Record<string, unknown>)?.score}/5`,
        `D (Decision Process): ${(medpicc.decision_process as Record<string, unknown>)?.score}/5`,
        `P (Paper Process): ${(medpicc.paper_process as Record<string, unknown>)?.score}/5`,
        `I (Identify Pain): ${(medpicc.identify_pain as Record<string, unknown>)?.score}/5`,
        `C (Champion): ${(medpicc.champion as Record<string, unknown>)?.score}/5`,
        `C (Competition): ${(medpicc.competition as Record<string, unknown>)?.score}/5`,
      ].join("\n");
    } else {
      return NextResponse.json({ error: "deal_id or analysis_id required" }, { status: 400 });
    }

    const prompt = fillTemplate(MEDPICC_ACTION_PLAN_PROMPT, {
      labeled_transcript: labeledTranscript,
      medpicc_scores: medpiccScores,
    });

    const result = await callClaude(prompt);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Action plan error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Action plan failed: ${message}` }, { status: 500 });
  }
}
