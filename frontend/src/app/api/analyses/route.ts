import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET() {
  try {
    const keys = await kv.keys("analysis:*");
    const recent: Record<string, unknown>[] = [];

    // Get the 20 most recent (keys are unordered, so we fetch and sort)
    const pipeline = kv.pipeline();
    for (const key of keys.slice(0, 50)) {
      pipeline.get(key);
    }
    const results = keys.length > 0 ? await pipeline.exec() : [];

    for (const data of results) {
      if (data && typeof data === "object") {
        const d = data as Record<string, unknown>;
        recent.push({
          id: d.id,
          deal_name: d.deal_name,
          company: d.company,
          call_score: (d.call_analysis as Record<string, unknown>)?.call_score,
          medpicc_score: (d.medpicc as Record<string, unknown>)?.overall_score,
          risk_assessment: (d.medpicc as Record<string, unknown>)?.risk_assessment,
        });
      }
    }

    return NextResponse.json({ analyses: recent });
  } catch (error) {
    console.error("List analyses error:", error);
    return NextResponse.json({ analyses: [] });
  }
}
