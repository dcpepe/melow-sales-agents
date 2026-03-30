import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { callClaude } from "@/lib/server/llm";
import {
  SPEAKER_INFERENCE_PROMPT,
  CALL_ANALYSIS_PROMPT,
  MEDPICC_PROMPT,
  fillTemplate,
} from "@/lib/server/prompts";
import { saveAnalysis, saveDeal, addDealToIndex, addAnalysisToDeal } from "@/lib/server/storage";

export const maxDuration = 120;

function hasExistingLabels(transcript: string): boolean {
  const labelPattern = /^\[.+?\]:/m;
  return labelPattern.test(transcript);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcript, deal_id, new_deal, participants } = body;

    if (!transcript || transcript.length < 50) {
      return NextResponse.json(
        { error: "Transcript must be at least 50 characters" },
        { status: 400 }
      );
    }

    if (!deal_id && !new_deal) {
      return NextResponse.json(
        { error: "Either deal_id or new_deal is required" },
        { status: 400 }
      );
    }

    // Resolve deal_id — create deal if needed
    let resolvedDealId = deal_id;
    if (!resolvedDealId && new_deal) {
      const newDealId = randomUUID();
      const now = new Date().toISOString();
      await saveDeal(newDealId, {
        id: newDealId,
        deal_name: new_deal.deal_name || "Untitled Deal",
        company: new_deal.company || "",
        created_at: now,
        updated_at: now,
        latest_call_score: null,
        latest_medpicc_score: null,
        latest_risk_assessment: null,
        latest_deal_probability: null,
        latest_medpicc_categories: {},
        call_count: 0,
        analysis_ids: [],
      });
      await addDealToIndex(newDealId);
      resolvedDealId = newDealId;
    }

    // Speaker inference
    let labeledTranscript: string;
    let speakerTurns: { speaker: string; text: string }[];

    if (hasExistingLabels(transcript)) {
      labeledTranscript = transcript;
      speakerTurns = transcript
        .split("\n")
        .filter((line: string) => line.trim())
        .map((line: string) => {
          const match = line.match(/^\[(.+?)\]:\s*(.*)$/);
          if (match) return { speaker: match[1], text: match[2] };
          return { speaker: "Unknown", text: line };
        });
    } else {
      const speakerPrompt = fillTemplate(SPEAKER_INFERENCE_PROMPT, { transcript });
      const result = await callClaude(speakerPrompt, true);
      speakerTurns = result as unknown as { speaker: string; text: string }[];
      labeledTranscript = speakerTurns
        .map((t) => `[${t.speaker}]: ${t.text}`)
        .join("\n\n");
    }

    const contextForLLM = participants
      ? `${labeledTranscript}\n${participants}`
      : labeledTranscript;

    // Run call analysis and MEDPICC in parallel
    const [callAnalysis, medpicc] = await Promise.all([
      callClaude(fillTemplate(CALL_ANALYSIS_PROMPT, { labeled_transcript: contextForLLM })),
      callClaude(fillTemplate(MEDPICC_PROMPT, { labeled_transcript: contextForLLM })),
    ]);

    // Save analysis with deal_id
    const analysisId = randomUUID();
    const analysisData = {
      id: analysisId,
      deal_id: resolvedDealId,
      transcript,
      participants: participants || null,
      speaker_turns: speakerTurns,
      labeled_transcript: labeledTranscript,
      call_analysis: callAnalysis,
      medpicc,
      created_at: new Date().toISOString(),
    };
    await saveAnalysis(analysisId, analysisData);

    // Link analysis to deal and update cached scores
    const medpiccData = medpicc as Record<string, unknown>;
    const medpiccCategories: Record<string, number> = {};
    for (const key of ["metrics", "economic_buyer", "decision_criteria", "decision_process", "paper_process", "identify_pain", "champion", "competition"]) {
      const cat = medpiccData[key] as Record<string, unknown> | undefined;
      if (cat) medpiccCategories[key] = cat.score as number;
    }

    await addAnalysisToDeal(resolvedDealId, analysisId, {
      call_score: (callAnalysis as Record<string, unknown>).call_score as number,
      medpicc_score: medpiccData.overall_score as number,
      risk_assessment: medpiccData.risk_assessment as string,
      deal_probability: medpiccData.deal_probability as number,
      medpicc_categories: medpiccCategories,
    });

    return NextResponse.json({
      id: analysisId,
      deal_id: resolvedDealId,
      speaker_turns: speakerTurns,
      call_analysis: callAnalysis,
      medpicc,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Analysis failed: ${message}` },
      { status: 500 }
    );
  }
}
