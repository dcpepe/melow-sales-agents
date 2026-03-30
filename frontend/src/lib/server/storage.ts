import { kv } from "@vercel/kv";

const ANALYSIS_PREFIX = "analysis:";
const DEAL_PREFIX = "deal:";
const DEAL_ROOM_PREFIX = "dealroom:";
const DEAL_INDEX_KEY = "deal:index";
const ANALYSIS_TTL = 60 * 60 * 24 * 90; // 90 days
const DEAL_TTL = 60 * 60 * 24 * 180; // 180 days

// --- Analyses ---

export async function saveAnalysis(id: string, data: Record<string, unknown>) {
  await kv.set(`${ANALYSIS_PREFIX}${id}`, data, { ex: ANALYSIS_TTL });
}

export async function loadAnalysis(id: string): Promise<Record<string, unknown> | null> {
  return kv.get(`${ANALYSIS_PREFIX}${id}`);
}

export async function deleteAnalysis(id: string): Promise<void> {
  await kv.del(`${ANALYSIS_PREFIX}${id}`);
}

// --- Deals ---

export async function saveDeal(id: string, data: Record<string, unknown>) {
  await kv.set(`${DEAL_PREFIX}${id}`, data, { ex: DEAL_TTL });
}

export async function loadDeal(id: string): Promise<Record<string, unknown> | null> {
  return kv.get(`${DEAL_PREFIX}${id}`);
}

export async function deleteDeal(id: string): Promise<void> {
  // Load deal to get analysis IDs
  const deal = await loadDeal(id);
  if (deal) {
    const analysisIds = (deal.analysis_ids as string[]) || [];
    // Delete all child analyses
    if (analysisIds.length > 0) {
      const pipeline = kv.pipeline();
      for (const aid of analysisIds) {
        pipeline.del(`${ANALYSIS_PREFIX}${aid}`);
      }
      await pipeline.exec();
    }
  }
  // Delete deal itself
  await kv.del(`${DEAL_PREFIX}${id}`);
  // Remove from index
  await removeDealFromIndex(id);
}

export async function listDealIds(): Promise<string[]> {
  const ids = await kv.get<string[]>(DEAL_INDEX_KEY);
  return ids || [];
}

export async function addDealToIndex(id: string): Promise<void> {
  const ids = await listDealIds();
  if (!ids.includes(id)) {
    ids.unshift(id); // newest first
    await kv.set(DEAL_INDEX_KEY, ids);
  }
}

export async function removeDealFromIndex(id: string): Promise<void> {
  const ids = await listDealIds();
  const filtered = ids.filter((i) => i !== id);
  await kv.set(DEAL_INDEX_KEY, filtered);
}

export async function addAnalysisToDeal(
  dealId: string,
  analysisId: string,
  latestScores: {
    call_score: number | null;
    medpicc_score: number | null;
    risk_assessment: string | null;
    deal_probability: number | null;
    medpicc_categories: Record<string, number>;
  }
): Promise<void> {
  const deal = await loadDeal(dealId);
  if (!deal) return;

  const analysisIds = (deal.analysis_ids as string[]) || [];
  analysisIds.unshift(analysisId); // newest first

  deal.analysis_ids = analysisIds;
  deal.call_count = analysisIds.length;
  deal.latest_call_score = latestScores.call_score;
  deal.latest_medpicc_score = latestScores.medpicc_score;
  deal.latest_risk_assessment = latestScores.risk_assessment;
  deal.latest_deal_probability = latestScores.deal_probability;
  deal.latest_medpicc_categories = latestScores.medpicc_categories;
  deal.updated_at = new Date().toISOString();

  await saveDeal(dealId, deal);
}

export async function removeAnalysisFromDeal(dealId: string, analysisId: string): Promise<void> {
  const deal = await loadDeal(dealId);
  if (!deal) return;

  const analysisIds = ((deal.analysis_ids as string[]) || []).filter((id) => id !== analysisId);
  deal.analysis_ids = analysisIds;
  deal.call_count = analysisIds.length;

  // Recalc latest scores from newest remaining analysis
  if (analysisIds.length > 0) {
    const latest = await loadAnalysis(analysisIds[0]);
    if (latest) {
      const medpicc = latest.medpicc as Record<string, unknown> | undefined;
      const callAnalysis = latest.call_analysis as Record<string, unknown> | undefined;
      deal.latest_call_score = callAnalysis?.call_score ?? null;
      deal.latest_medpicc_score = medpicc?.overall_score ?? null;
      deal.latest_risk_assessment = medpicc?.risk_assessment ?? null;
      deal.latest_deal_probability = medpicc?.deal_probability ?? null;

      const cats: Record<string, number> = {};
      if (medpicc) {
        for (const key of ["metrics", "economic_buyer", "decision_criteria", "decision_process", "paper_process", "identify_pain", "champion", "competition"]) {
          const cat = medpicc[key] as Record<string, unknown> | undefined;
          if (cat) cats[key] = cat.score as number;
        }
      }
      deal.latest_medpicc_categories = cats;
    }
  } else {
    deal.latest_call_score = null;
    deal.latest_medpicc_score = null;
    deal.latest_risk_assessment = null;
    deal.latest_deal_probability = null;
    deal.latest_medpicc_categories = {};
  }

  deal.updated_at = new Date().toISOString();
  await saveDeal(dealId, deal);
}

// --- Deal Rooms ---

export async function saveDealRoom(id: string, data: Record<string, unknown>) {
  await kv.set(`${DEAL_ROOM_PREFIX}${id}`, data, { ex: ANALYSIS_TTL });
}

export async function loadDealRoom(id: string): Promise<Record<string, unknown> | null> {
  return kv.get(`${DEAL_ROOM_PREFIX}${id}`);
}
