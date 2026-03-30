import { NextRequest, NextResponse } from "next/server";
import { listGranolaNotes } from "@/lib/server/granola";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const createdAfter = searchParams.get("created_after") || undefined;
    const cursor = searchParams.get("cursor") || undefined;

    const result = await listGranolaNotes(createdAfter, cursor);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Granola list notes error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch notes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
