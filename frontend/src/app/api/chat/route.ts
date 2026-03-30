import { NextRequest, NextResponse } from "next/server";
import { loadAnalysis } from "@/lib/server/storage";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";

export async function POST(req: NextRequest) {
  try {
    const { analysis_id, messages } = await req.json();

    if (!analysis_id || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "analysis_id and messages required" }, { status: 400 });
    }

    const analysis = await loadAnalysis(analysis_id);
    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    const medpicc = analysis.medpicc as Record<string, unknown>;
    const callAnalysis = analysis.call_analysis as Record<string, unknown>;

    const systemPrompt = `You are an expert sales advisor embedded in a deal intelligence platform. You have access to the full context of a sales call analysis. Be direct, specific, and actionable. No fluff.

DEAL: ${analysis.deal_name || "Unknown"} at ${analysis.company || "Unknown Company"}
PARTICIPANTS: ${analysis.participants || "Not specified"}

TRANSCRIPT:
${analysis.labeled_transcript}

CALL ANALYSIS:
- Call Score: ${callAnalysis?.call_score}/100
- Key Mistakes: ${JSON.stringify(callAnalysis?.key_mistakes)}
- Missed Opportunities: ${JSON.stringify(callAnalysis?.missed_opportunities)}
- Open Questions: ${JSON.stringify(callAnalysis?.open_questions)}
- Coaching: ${JSON.stringify(callAnalysis?.coaching)}

MEDPICC SCORING:
- Overall: ${medpicc?.overall_score}%
- Risk: ${medpicc?.risk_assessment}
- Deal Probability: ${medpicc?.deal_probability}%
- Metrics: ${JSON.stringify(medpicc?.metrics)}
- Economic Buyer: ${JSON.stringify(medpicc?.economic_buyer)}
- Decision Criteria: ${JSON.stringify(medpicc?.decision_criteria)}
- Decision Process: ${JSON.stringify(medpicc?.decision_process)}
- Paper Process: ${JSON.stringify(medpicc?.paper_process)}
- Identify Pain: ${JSON.stringify(medpicc?.identify_pain)}
- Champion: ${JSON.stringify(medpicc?.champion)}
- Competition: ${JSON.stringify(medpicc?.competition)}
- Recommended Actions: ${JSON.stringify(medpicc?.recommended_actions)}

Answer questions about this deal concisely. When asked for scripts or emails, write them ready to use. When asked what's missing, be brutally honest.`;

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
