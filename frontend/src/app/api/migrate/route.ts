import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { kv } from "@vercel/kv";
import { saveDeal, saveAnalysis, addDealToIndex, listDealIds } from "@/lib/server/storage";

export const maxDuration = 60;

// POST /api/migrate — one-time migration of orphan analyses into deals
export async function POST() {
  try {
    // Check if already migrated
    const existingDealIds = await listDealIds();
    if (existingDealIds.length > 0) {
      return NextResponse.json({ message: "Already migrated", deals: existingDealIds.length });
    }

    // Find all analysis keys
    const keys = await kv.keys("analysis:*");
    if (keys.length === 0) {
      return NextResponse.json({ message: "No analyses to migrate", deals: 0 });
    }

    // Fetch all analyses
    const pipeline = kv.pipeline();
    for (const key of keys) {
      pipeline.get(key);
    }
    const results = await pipeline.exec();

    // Group by company (case-insensitive) or deal_name
    const groups: Record<string, Record<string, unknown>[]> = {};
    for (const data of results) {
      if (!data || typeof data !== "object") continue;
      const d = data as Record<string, unknown>;
      const key = ((d.company as string) || (d.deal_name as string) || "Unknown").toLowerCase().trim();
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    }

    let dealsCreated = 0;
    let analysesLinked = 0;

    for (const [, analyses] of Object.entries(groups)) {
      // Sort by created_at (newest first)
      analyses.sort((a, b) => {
        const da = new Date(a.created_at as string || 0).getTime();
        const db = new Date(b.created_at as string || 0).getTime();
        return db - da;
      });

      const newest = analyses[0];
      const dealId = randomUUID();
      const now = new Date().toISOString();

      // Extract latest scores from newest analysis
      const medpicc = newest.medpicc as Record<string, unknown> | undefined;
      const callAnalysis = newest.call_analysis as Record<string, unknown> | undefined;
      const medpiccCategories: Record<string, number> = {};
      if (medpicc) {
        for (const key of ["metrics", "economic_buyer", "decision_criteria", "decision_process", "paper_process", "identify_pain", "champion", "competition"]) {
          const cat = medpicc[key] as Record<string, unknown> | undefined;
          if (cat) medpiccCategories[key] = cat.score as number;
        }
      }

      const analysisIds = analyses.map((a) => a.id as string);

      // Create deal
      await saveDeal(dealId, {
        id: dealId,
        deal_name: (newest.deal_name as string) || (newest.company as string) || "Untitled Deal",
        company: (newest.company as string) || "",
        created_at: (analyses[analyses.length - 1].created_at as string) || now,
        updated_at: now,
        latest_call_score: callAnalysis?.call_score ?? null,
        latest_medpicc_score: medpicc?.overall_score ?? null,
        latest_risk_assessment: medpicc?.risk_assessment ?? null,
        latest_deal_probability: medpicc?.deal_probability ?? null,
        latest_medpicc_categories: medpiccCategories,
        call_count: analyses.length,
        analysis_ids: analysisIds,
      });
      await addDealToIndex(dealId);
      dealsCreated++;

      // Update each analysis with deal_id
      for (const analysis of analyses) {
        analysis.deal_id = dealId;
        await saveAnalysis(analysis.id as string, analysis);
        analysesLinked++;
      }
    }

    return NextResponse.json({
      message: "Migration complete",
      deals: dealsCreated,
      analyses: analysesLinked,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: `Migration failed: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    );
  }
}
