import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/server/gmail";

// POST /api/gmail/send — send an email
export async function POST(req: NextRequest) {
  try {
    const { to, subject, body, thread_id } = await req.json();
    if (!to || !subject || !body) {
      return NextResponse.json({ error: "to, subject, and body required" }, { status: 400 });
    }

    const messageId = await sendEmail(to, subject, body, thread_id);
    return NextResponse.json({ sent: true, message_id: messageId });
  } catch (error) {
    console.error("Gmail send error:", error);
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
