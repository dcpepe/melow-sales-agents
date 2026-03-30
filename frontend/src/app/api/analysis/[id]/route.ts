import { NextRequest, NextResponse } from "next/server";
import { loadAnalysis, deleteAnalysis, removeAnalysisFromDeal } from "@/lib/server/storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await loadAnalysis(id);
  if (!data) return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Remove from parent deal if linked
  const analysis = await loadAnalysis(id);
  if (analysis?.deal_id) {
    await removeAnalysisFromDeal(analysis.deal_id as string, id);
  }
  await deleteAnalysis(id);
  return NextResponse.json({ ok: true });
}
