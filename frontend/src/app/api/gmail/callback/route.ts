import { NextRequest, NextResponse } from "next/server";
import { handleCallback } from "@/lib/server/gmail";

// GET /api/gmail/callback — OAuth2 callback from Google
export async function GET(req: NextRequest) {
  try {
    const code = new URL(req.url).searchParams.get("code");
    if (!code) {
      return NextResponse.redirect(new URL("/sales?gmail=error", req.url));
    }

    await handleCallback(code);
    return NextResponse.redirect(new URL("/sales?gmail=connected", req.url));
  } catch (error) {
    console.error("Gmail callback error:", error);
    return NextResponse.redirect(new URL("/sales?gmail=error", req.url));
  }
}
