/**
 * DealAnalysisService
 *
 * Handles all deal-level metric computation, MEDPICC history tracking,
 * and versioned analysis caching. Never overwrites — always appends.
 */

import { kv } from "@vercel/kv";
import { loadDeal, saveDeal, loadAnalysis } from "./storage";

// --- Types ---

interface MedpiccSnapshot {
  score: number;
  win_probability: number;
  timestamp: string;
  source: "call" | "email" | "manual";
}

interface AnalysisVersion {
  id: string;
  deal_id: string;
  type: string;
  version: number;
  content: string;
  created_at: string;
}

// Cache key prefixes
const CACHE_PREFIX = "cache:";
const VERSION_COUNTER_PREFIX = "version:";

// --- Core Methods ---

/**
 * Recompute deal metrics from the latest analysis.
 * Called after adding/removing a call.
 */
export async function recomputeDealMetrics(dealId: string): Promise<void> {
  const deal = await loadDeal(dealId);
  if (!deal) return;

  const analysisIds = (deal.analysis_ids as string[]) || [];
  if (analysisIds.length === 0) {
    // No calls — reset scores
    deal.medpicc_score_current = null;
    deal.win_probability_current = null;
    deal.latest_call_score = null;
    deal.latest_medpicc_score = null;
    deal.latest_risk_assessment = null;
    deal.latest_deal_probability = null;
    deal.latest_medpicc_categories = {};
    deal.last_updated_at = new Date().toISOString();
    deal.updated_at = deal.last_updated_at;
    await saveDeal(dealId, deal);
    return;
  }

  // Load latest analysis
  const latest = await loadAnalysis(analysisIds[0]);
  if (!latest) return;

  const medpicc = latest.medpicc as Record<string, unknown> | undefined;
  const callAnalysis = latest.call_analysis as Record<string, unknown> | undefined;

  // Extract MEDPICC category scores
  const categories: Record<string, number> = {};
  if (medpicc) {
    for (const key of ["metrics", "economic_buyer", "decision_criteria", "decision_process", "paper_process", "identify_pain", "champion", "competition"]) {
      const cat = medpicc[key] as Record<string, unknown> | undefined;
      if (cat) categories[key] = cat.score as number;
    }
  }

  const overallScore = (medpicc?.overall_score as number) ?? null;
  const winProb = (medpicc?.deal_probability as number) ?? null;

  // Update current scores
  deal.medpicc_score_current = overallScore;
  deal.win_probability_current = winProb;

  // Sync legacy aliases
  deal.latest_call_score = (callAnalysis?.call_score as number) ?? null;
  deal.latest_medpicc_score = overallScore;
  deal.latest_risk_assessment = (medpicc?.risk_assessment as string) ?? null;
  deal.latest_deal_probability = winProb;
  deal.latest_medpicc_categories = categories;

  deal.call_count = analysisIds.length;
  deal.last_updated_at = new Date().toISOString();
  deal.updated_at = deal.last_updated_at;

  await saveDeal(dealId, deal);
}

/**
 * Append a MEDPICC snapshot to the deal's history.
 * Never overwrites existing entries — always appends.
 */
export async function appendMedpiccSnapshot(
  dealId: string,
  score: number,
  winProbability: number,
  source: "call" | "email" | "manual"
): Promise<void> {
  const deal = await loadDeal(dealId);
  if (!deal) return;

  const history = (deal.medpicc_history as MedpiccSnapshot[]) || [];
  history.push({
    score,
    win_probability: winProbability,
    timestamp: new Date().toISOString(),
    source,
  });

  deal.medpicc_history = history;
  await saveDeal(dealId, deal);
}

/**
 * Get the latest cached analysis of a given type for a deal.
 * Returns null if no cached version exists.
 */
export async function getLatestAnalysis(
  dealId: string,
  type: "meeting_prep" | "action_plan" | "frank_analysis"
): Promise<AnalysisVersion | null> {
  const versionKey = `${VERSION_COUNTER_PREFIX}${dealId}:${type}`;
  const currentVersion = await kv.get<number>(versionKey);

  if (!currentVersion) return null;

  const cacheKey = `${CACHE_PREFIX}${dealId}:${type}:${currentVersion}`;
  return kv.get<AnalysisVersion>(cacheKey);
}

/**
 * Save a new versioned analysis. Never overwrites — creates new version.
 * Returns the saved version object.
 */
export async function saveNewAnalysisVersion(
  dealId: string,
  type: "meeting_prep" | "action_plan" | "frank_analysis",
  content: string
): Promise<AnalysisVersion> {
  const versionKey = `${VERSION_COUNTER_PREFIX}${dealId}:${type}`;

  // Increment version counter atomically
  const newVersion = await kv.incr(versionKey);

  const version: AnalysisVersion = {
    id: `${dealId}:${type}:${newVersion}`,
    deal_id: dealId,
    type,
    version: newVersion,
    content,
    created_at: new Date().toISOString(),
  };

  // Store the version (90-day TTL)
  const cacheKey = `${CACHE_PREFIX}${dealId}:${type}:${newVersion}`;
  await kv.set(cacheKey, version, { ex: 60 * 60 * 24 * 90 });

  return version;
}

/**
 * Get all versions of an analysis type for a deal (for history viewing).
 * Returns versions in reverse chronological order (newest first).
 */
export async function getAnalysisVersions(
  dealId: string,
  type: "meeting_prep" | "action_plan" | "frank_analysis",
  limit: number = 10
): Promise<AnalysisVersion[]> {
  const versionKey = `${VERSION_COUNTER_PREFIX}${dealId}:${type}`;
  const currentVersion = await kv.get<number>(versionKey);

  if (!currentVersion) return [];

  const versions: AnalysisVersion[] = [];
  const startVersion = Math.max(1, currentVersion - limit + 1);

  const pipeline = kv.pipeline();
  for (let v = currentVersion; v >= startVersion; v--) {
    pipeline.get(`${CACHE_PREFIX}${dealId}:${type}:${v}`);
  }
  const results = await pipeline.exec();

  for (const result of results) {
    if (result) versions.push(result as AnalysisVersion);
  }

  return versions;
}

/**
 * Initialize MEDPICC history for a deal that doesn't have one.
 * Used for backward compatibility with old deals.
 */
export async function initializeMedpiccHistory(dealId: string): Promise<void> {
  const deal = await loadDeal(dealId);
  if (!deal) return;

  // Already has history — skip
  if (deal.medpicc_history && (deal.medpicc_history as MedpiccSnapshot[]).length > 0) return;

  // Initialize from current scores
  const score = (deal.medpicc_score_current as number) ?? (deal.latest_medpicc_score as number);
  const winProb = (deal.win_probability_current as number) ?? (deal.latest_deal_probability as number);

  if (score != null && winProb != null) {
    deal.medpicc_history = [{
      score,
      win_probability: winProb,
      timestamp: (deal.updated_at as string) || new Date().toISOString(),
      source: "call" as const,
    }];
  } else {
    deal.medpicc_history = [];
  }

  // Ensure new fields exist
  if (deal.medpicc_score_current === undefined) {
    deal.medpicc_score_current = deal.latest_medpicc_score ?? null;
  }
  if (deal.win_probability_current === undefined) {
    deal.win_probability_current = deal.latest_deal_probability ?? null;
  }
  if (deal.last_updated_at === undefined) {
    deal.last_updated_at = deal.updated_at || new Date().toISOString();
  }

  await saveDeal(dealId, deal);
}
