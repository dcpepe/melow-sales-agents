import { NextResponse } from "next/server";
import { isConnected, getProfile, clearTokens } from "@/lib/server/gmail";

export const dynamic = "force-dynamic";

// GET /api/gmail/status — check if Gmail is connected
export async function GET() {
  try {
    const connected = await isConnected();
    if (!connected) return NextResponse.json({ connected: false });

    const profile = await getProfile();
    return NextResponse.json({ connected: true, ...profile });
  } catch {
    // Token might be invalid — clear it
    await clearTokens();
    return NextResponse.json({ connected: false });
  }
}
