import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { saveDeal, listDealIds, addDealToIndex, saveAnalysis } from "@/lib/server/storage";
import { kv } from "@vercel/kv";

async function autoMigrateOrphans() {
  const keys = await kv.keys("analysis:*");
  if (keys.length === 0) return;

  const pipeline = kv.pipeline();
  for (const key of keys) pipeline.get(key);
  const results = await pipeline.exec();

  // Only migrate analyses that have no deal_id
  const orphans = (results.filter(Boolean) as Record<string, unknown>[]).filter(
    (a) => !a.deal_id
  );
  if (orphans.length === 0) return;

  // Group by company (case-insensitive)
  const groups: Record<string, Record<string, unknown>[]> = {};
  for (const a of orphans) {
    const key = ((a.company as string) || (a.deal_name as string) || "Unknown").toLowerCase().trim();
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }

  for (const [, analyses] of Object.entries(groups)) {
    analyses.sort((a, b) => {
      const da = new Date((a.created_at as string) || 0).getTime();
      const db = new Date((b.created_at as string) || 0).getTime();
      return db - da;
    });

    const newest = analyses[0];
    const dealId = randomUUID();
    const now = new Date().toISOString();

    const medpicc = newest.medpicc as Record<string, unknown> | undefined;
    const callAnalysis = newest.call_analysis as Record<string, unknown> | undefined;
    const cats: Record<string, number> = {};
    if (medpicc) {
      for (const k of ["metrics", "economic_buyer", "decision_criteria", "decision_process", "paper_process", "identify_pain", "champion", "competition"]) {
        const cat = medpicc[k] as Record<string, unknown> | undefined;
        if (cat) cats[k] = cat.score as number;
      }
    }

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
      latest_medpicc_categories: cats,
      call_count: analyses.length,
      analysis_ids: analyses.map((a) => a.id as string),
    });
    await addDealToIndex(dealId);

    for (const analysis of analyses) {
      analysis.deal_id = dealId;
      await saveAnalysis(analysis.id as string, analysis);
    }
  }
}

// GET /api/deals — list all deals
export async function GET() {
  try {
    let dealIds = await listDealIds();

    // Auto-migrate orphan analyses on first load
    if (dealIds.length === 0) {
      await autoMigrateOrphans();
      dealIds = await listDealIds();
    }

    if (dealIds.length === 0) return NextResponse.json({ deals: [] });

    const pipeline = kv.pipeline();
    for (const id of dealIds) {
      pipeline.get(`deal:${id}`);
    }
    const results = await pipeline.exec();

    const deals = results.filter(Boolean);
    return NextResponse.json({ deals });
  } catch (error) {
    console.error("List deals error:", error);
    return NextResponse.json({ deals: [] });
  }
}

// POST /api/deals — create a new deal
export async function POST(req: NextRequest) {
  try {
    const { deal_name, company } = await req.json();
    if (!deal_name) {
      return NextResponse.json({ error: "deal_name is required" }, { status: 400 });
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const deal = {
      id,
      deal_name,
      company: company || "",
      created_at: now,
      updated_at: now,
      latest_call_score: null,
      latest_medpicc_score: null,
      latest_risk_assessment: null,
      latest_deal_probability: null,
      latest_medpicc_categories: {},
      call_count: 0,
      analysis_ids: [],
    };

    await saveDeal(id, deal);
    await addDealToIndex(id);

    return NextResponse.json(deal);
  } catch (error) {
    console.error("Create deal error:", error);
    return NextResponse.json({ error: "Failed to create deal" }, { status: 500 });
  }
}
