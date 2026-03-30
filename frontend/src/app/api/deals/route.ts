import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { saveDeal, listDealIds, addDealToIndex } from "@/lib/server/storage";
import { kv } from "@vercel/kv";

// GET /api/deals — list all deals
export async function GET() {
  try {
    const dealIds = await listDealIds();
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
