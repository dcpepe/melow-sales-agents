import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/server/gmail";

// GET /api/gmail/auth — redirect to Google OAuth consent screen
export async function GET() {
  try {
    const url = getAuthUrl();
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Gmail auth error:", error);
    return NextResponse.json({ error: "Failed to start auth" }, { status: 500 });
  }
}
