import { NextRequest, NextResponse } from "next/server";
import { loadDealRoom } from "@/lib/server/storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await loadDealRoom(id);

  if (!data) {
    return NextResponse.json({ error: "Deal room not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
