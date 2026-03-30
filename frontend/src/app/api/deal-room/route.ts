import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { callClaude } from "@/lib/server/llm";
import { DEAL_ROOM_PROMPT, fillTemplate } from "@/lib/server/prompts";
import { loadAnalysis, saveDealRoom } from "@/lib/server/storage";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { analysis_id } = await req.json();

    if (!analysis_id) {
      return NextResponse.json({ error: "analysis_id is required" }, { status: 400 });
    }

    const analysis = await loadAnalysis(analysis_id);
    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    const dealRoomId = randomUUID();
    const companyName = (analysis.company as string) || "Unknown Company";
    const participants = (analysis.participants as string) || "Not specified";

    const prompt = fillTemplate(DEAL_ROOM_PROMPT, {
      labeled_transcript: analysis.labeled_transcript as string,
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
    return NextResponse.json(
      { error: "Deal room generation failed" },
      { status: 500 }
    );
  }
}
