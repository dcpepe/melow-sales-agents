import { NextRequest, NextResponse } from "next/server";
import { getAnalysisVersions, getLatestAnalysis } from "@/lib/server/deal-analysis-service";

// GET /api/versions?deal_id=X&type=Y — get version history
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dealId = searchParams.get("deal_id");
  const type = searchParams.get("type") as "meeting_prep" | "action_plan" | "frank_analysis";

  if (!dealId || !type) {
    return NextResponse.json({ error: "deal_id and type required" }, { status: 400 });
  }

  const [versions, latest] = await Promise.all([
    getAnalysisVersions(dealId, type, 10),
    getLatestAnalysis(dealId, type),
  ]);

  return NextResponse.json({
    versions,
    latest,
    total: versions.length,
  });
}
