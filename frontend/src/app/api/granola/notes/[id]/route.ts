import { NextRequest, NextResponse } from "next/server";
import { getGranolaNoteWithTranscript } from "@/lib/server/granola";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const note = await getGranolaNoteWithTranscript(id);
    return NextResponse.json(note);
  } catch (error) {
    console.error("Granola get note error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch note";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
