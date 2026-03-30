import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/server/llm";
import { MEDPICC_ACTION_PLAN_PROMPT, fillTemplate } from "@/lib/server/prompts";
import { loadAnalysis } from "@/lib/server/storage";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { analysis_id } = await req.json();
    if (!analysis_id) {
      return NextResponse.json({ error: "analysis_id required" }, { status: 400 });
    }

    const analysis = await loadAnalysis(analysis_id);
    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    const medpicc = analysis.medpicc as Record<string, unknown>;
    const scores = [
      `M (Metrics): ${(medpicc.metrics as Record<string, unknown>)?.score}/5`,
      `E (Economic Buyer): ${(medpicc.economic_buyer as Record<string, unknown>)?.score}/5`,
      `D (Decision Criteria): ${(medpicc.decision_criteria as Record<string, unknown>)?.score}/5`,
      `D (Decision Process): ${(medpicc.decision_process as Record<string, unknown>)?.score}/5`,
      `P (Paper Process): ${(medpicc.paper_process as Record<string, unknown>)?.score}/5`,
      `I (Identify Pain): ${(medpicc.identify_pain as Record<string, unknown>)?.score}/5`,
      `C (Champion): ${(medpicc.champion as Record<string, unknown>)?.score}/5`,
      `C (Competition): ${(medpicc.competition as Record<string, unknown>)?.score}/5`,
    ].join("\n");

    const prompt = fillTemplate(MEDPICC_ACTION_PLAN_PROMPT, {
      labeled_transcript: analysis.labeled_transcript as string,
      medpicc_scores: scores,
    });

    const result = await callClaude(prompt);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Action plan error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Action plan failed: ${message}` }, { status: 500 });
  }
}
