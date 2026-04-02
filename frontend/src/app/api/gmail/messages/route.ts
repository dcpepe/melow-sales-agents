import { NextRequest, NextResponse } from "next/server";
import { listMessages } from "@/lib/server/gmail";

// GET /api/gmail/messages?q=search&max=20
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || undefined;
    const max = parseInt(searchParams.get("max") || "20");

    const messages = await listMessages(query, max);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Gmail messages error:", error);
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
