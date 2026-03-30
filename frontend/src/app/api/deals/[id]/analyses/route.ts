import { NextRequest, NextResponse } from "next/server";
import { loadDeal } from "@/lib/server/storage";
import { kv } from "@vercel/kv";

// GET /api/deals/:id/analyses — fetch all call analyses for a deal
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deal = await loadDeal(id);
    if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    const analysisIds = (deal.analysis_ids as string[]) || [];
    if (analysisIds.length === 0) return NextResponse.json({ analyses: [] });

    const pipeline = kv.pipeline();
    for (const aid of analysisIds) {
      pipeline.get(`analysis:${aid}`);
    }
    const results = await pipeline.exec();

    const analyses = results.filter(Boolean);
    return NextResponse.json({ analyses });
  } catch (error) {
    console.error("Get deal analyses error:", error);
    return NextResponse.json({ analyses: [] });
  }
}
