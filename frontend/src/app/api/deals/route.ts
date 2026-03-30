import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { saveDeal, listDealIds, addDealToIndex, saveAnalysis } from "@/lib/server/storage";
import { initializeMedpiccHistory } from "@/lib/server/deal-analysis-service";
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

    const overallScore = (medpicc?.overall_score as number) ?? null;
    const winProb = (medpicc?.deal_probability as number) ?? null;

    // Initialize medpicc_history from existing analyses (oldest to newest)
    const history = analyses
      .slice()
      .reverse()
      .filter((a) => a.medpicc)
      .map((a) => {
        const mp = a.medpicc as Record<string, unknown>;
        return {
          score: (mp?.overall_score as number) ?? 0,
          win_probability: (mp?.deal_probability as number) ?? 0,
          timestamp: (a.created_at as string) || now,
          source: "call" as const,
        };
      });

    await saveDeal(dealId, {
      id: dealId,
      deal_name: (newest.deal_name as string) || (newest.company as string) || "Untitled Deal",
      company: (newest.company as string) || "",
      created_at: (analyses[analyses.length - 1].created_at as string) || now,
      updated_at: now,
      last_updated_at: now,
      medpicc_score_current: overallScore,
      win_probability_current: winProb,
      latest_call_score: callAnalysis?.call_score ?? null,
      latest_medpicc_score: overallScore,
      latest_risk_assessment: medpicc?.risk_assessment ?? null,
      latest_deal_probability: winProb,
      latest_medpicc_categories: cats,
      medpicc_history: history,
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

    const deals = results.filter(Boolean) as Record<string, unknown>[];

    // Backward compat: initialize medpicc_history for deals missing it
    for (const deal of deals) {
      if (!deal.medpicc_history || !(deal.medpicc_history as unknown[]).length) {
        await initializeMedpiccHistory(deal.id as string);
      }
    }

    // Enrich with latest analysis intelligence (cached, no recomputation)
    const enrichedDeals = [];
    for (const deal of deals) {
      const analysisIds = (deal.analysis_ids as string[]) || [];
      let intelligence: Record<string, unknown> = {};
      if (analysisIds.length > 0) {
        const latest = await kv.get<Record<string, unknown>>(`analysis:${analysisIds[0]}`);
        if (latest) {
          const ca = latest.call_analysis as Record<string, unknown> | undefined;
          const mp = latest.medpicc as Record<string, unknown> | undefined;
          intelligence = {
            key_mistakes: ((ca?.key_mistakes as string[]) || []).slice(0, 3),
            open_questions: ((ca?.open_questions as string[]) || []).slice(0, 3),
            coaching: ((ca?.coaching as string[]) || []).slice(0, 3),
            recommended_actions: ((mp?.recommended_actions as string[]) || []).slice(0, 3),
            medpicc_breakdown: {
              metrics: mp?.metrics,
              economic_buyer: mp?.economic_buyer,
              decision_criteria: mp?.decision_criteria,
              decision_process: mp?.decision_process,
              paper_process: mp?.paper_process,
              identify_pain: mp?.identify_pain,
              champion: mp?.champion,
              competition: mp?.competition,
            },
          };
        }
      }
      enrichedDeals.push({ ...deal, ...intelligence });
    }

    return NextResponse.json({ deals: enrichedDeals });
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
      last_updated_at: now,
      medpicc_score_current: null,
      win_probability_current: null,
      latest_call_score: null,
      latest_medpicc_score: null,
      latest_risk_assessment: null,
      latest_deal_probability: null,
      latest_medpicc_categories: {},
      medpicc_history: [],
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
