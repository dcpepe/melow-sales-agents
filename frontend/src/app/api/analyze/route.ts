import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { callClaude } from "@/lib/server/llm";
import {
  SPEAKER_INFERENCE_PROMPT,
  CALL_ANALYSIS_PROMPT,
  MEDPICC_PROMPT,
  fillTemplate,
} from "@/lib/server/prompts";
import { saveAnalysis } from "@/lib/server/storage";

export const maxDuration = 120; // allow up to 2 min for LLM calls

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcript, deal_name, company, participants } = body;

    if (!transcript || transcript.length < 50) {
      return NextResponse.json(
        { error: "Transcript must be at least 50 characters" },
        { status: 400 }
      );
    }

    // Step 1: Speaker inference
    const speakerPrompt = fillTemplate(SPEAKER_INFERENCE_PROMPT, { transcript });
    const speakerTurns = (await callClaude(speakerPrompt)) as unknown as {
      speaker: string;
      text: string;
    }[];

    const labeledTranscript = speakerTurns
      .map((t) => `[${t.speaker}]: ${t.text}`)
      .join("\n\n");

    // Step 2: Run call analysis and MEDPICC in parallel
    const [callAnalysis, medpicc] = await Promise.all([
      callClaude(fillTemplate(CALL_ANALYSIS_PROMPT, { labeled_transcript: labeledTranscript })),
      callClaude(fillTemplate(MEDPICC_PROMPT, { labeled_transcript: labeledTranscript })),
    ]);

    // Step 3: Store results
    const analysisId = randomUUID();
    const analysisData = {
      id: analysisId,
      transcript,
      deal_name: deal_name || null,
      company: company || null,
      participants: participants || null,
      speaker_turns: speakerTurns,
      labeled_transcript: labeledTranscript,
      call_analysis: callAnalysis,
      medpicc,
    };
    await saveAnalysis(analysisId, analysisData);

    return NextResponse.json({
      id: analysisId,
      speaker_turns: speakerTurns,
      call_analysis: callAnalysis,
      medpicc,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed. Check server logs." },
      { status: 500 }
    );
  }
}
