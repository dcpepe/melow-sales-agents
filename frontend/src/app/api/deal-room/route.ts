import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { callClaude } from "@/lib/server/llm";
import { DEAL_ROOM_PROMPT, fillTemplate } from "@/lib/server/prompts";
import { loadAnalysis, loadDeal, saveDealRoom } from "@/lib/server/storage";
import { kv } from "@vercel/kv";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { deal_id, analysis_id } = await req.json();

    let companyName = "Unknown Company";
    let participants = "Not specified";
    let labeledTranscript = "";

    if (deal_id) {
      // Deal-scoped: combine all call transcripts
      const deal = await loadDeal(deal_id);
      if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

      companyName = (deal.company as string) || (deal.deal_name as string) || "Unknown Company";

      const analysisIds = (deal.analysis_ids as string[]) || [];
      if (analysisIds.length === 0) {
        return NextResponse.json({ error: "No calls for this deal" }, { status: 400 });
      }

      const idsToLoad = analysisIds.slice(0, 5);
      const pipeline = kv.pipeline();
      for (const id of idsToLoad) pipeline.get(`analysis:${id}`);
      const results = (await pipeline.exec()).filter(Boolean) as Record<string, unknown>[];

      labeledTranscript = results.map((a, i) => {
        const date = a.created_at ? new Date(a.created_at as string).toLocaleDateString() : `Call ${i + 1}`;
        return `--- CALL: ${date} ---\n${a.labeled_transcript}`;
      }).join("\n\n");

      if (results.length > 0) {
        participants = (results[0].participants as string) || "Not specified";
      }
    } else if (analysis_id) {
      // Backward compat
      const analysis = await loadAnalysis(analysis_id);
      if (!analysis) return NextResponse.json({ error: "Analysis not found" }, { status: 404 });

      companyName = (analysis.company as string) || "Unknown Company";
      participants = (analysis.participants as string) || "Not specified";
      labeledTranscript = analysis.labeled_transcript as string;
    } else {
      return NextResponse.json({ error: "deal_id or analysis_id required" }, { status: 400 });
    }

    const dealRoomId = randomUUID();
    const prompt = fillTemplate(DEAL_ROOM_PROMPT, {
      labeled_transcript: labeledTranscript,
      company_name: companyName,
      participants,
    });

    const dealRoomData = await callClaude(prompt);
    const dealRoom = { id: dealRoomId, ...dealRoomData };
    await saveDealRoom(dealRoomId, dealRoom as Record<string, unknown>);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    return NextResponse.json({
      deal_room: dealRoom,
      shareable_url: `${baseUrl}/deal-room/${dealRoomId}`,
    });
  } catch (error) {
    console.error("Deal room error:", error);
    return NextResponse.json({ error: "Deal room generation failed" }, { status: 500 });
  }
}
