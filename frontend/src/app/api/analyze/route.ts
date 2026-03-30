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

export const maxDuration = 120;

// Check if transcript already has speaker labels (e.g. from Granola)
function hasExistingLabels(transcript: string): boolean {
  const labelPattern = /^\[.+?\]:/m;
  return labelPattern.test(transcript);
}

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

    let labeledTranscript: string;
    let speakerTurns: { speaker: string; text: string }[];

    if (hasExistingLabels(transcript)) {
      // Transcript already has labels (e.g. from Granola) — use as-is
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
      // Run speaker inference using fast model
      const speakerPrompt = fillTemplate(SPEAKER_INFERENCE_PROMPT, { transcript });
      const result = await callClaude(speakerPrompt, true);
      speakerTurns = result as unknown as { speaker: string; text: string }[];
      labeledTranscript = speakerTurns
        .map((t) => `[${t.speaker}]: ${t.text}`)
        .join("\n\n");
    }

    // Run call analysis and MEDPICC in parallel
    const [callAnalysis, medpicc] = await Promise.all([
      callClaude(fillTemplate(CALL_ANALYSIS_PROMPT, { labeled_transcript: labeledTranscript })),
      callClaude(fillTemplate(MEDPICC_PROMPT, { labeled_transcript: labeledTranscript })),
    ]);

    // Store results
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
      created_at: new Date().toISOString(),
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Analysis failed: ${message}` },
      { status: 500 }
    );
  }
}
