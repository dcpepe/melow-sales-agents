/**
 * Agent Engine — programmable recipe execution system
 *
 * runAgent(recipeName, context, model) executes a recipe with injected context.
 */

import Anthropic from "@anthropic-ai/sdk";
import { RECIPES } from "./recipes";
import { loadDeal, loadAnalysis, listDealIds } from "../server/storage";
import { kv } from "@vercel/kv";

// --- Types ---

export type ModelTier = "fast" | "reasoning";

interface AgentContext {
  deal_id?: string;
  raw_context?: string;
}

export interface AgentResult {
  output: string;
  parsed?: Record<string, unknown>;
  model_used: string;
  tokens_used?: number;
  recipe: string;
}

// --- Models ---

const MODELS: Record<ModelTier, string> = {
  fast: "claude-sonnet-4-20250514",
  reasoning: "claude-sonnet-4-20250514", // Use Sonnet for reliability — Opus can timeout on Vercel
};

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// --- Context Builders ---

export async function buildDealContext(dealId: string): Promise<string> {
  const deal = await loadDeal(dealId);
  if (!deal) throw new Error("Deal not found");

  const parts: string[] = [];
  parts.push(`DEAL: ${deal.deal_name} at ${deal.company}`);
  parts.push(`Stage: ${deal.stage || "Unknown"} | Owner: ${deal.owner || "Unassigned"}`);
  parts.push(`MEDPICC: ${deal.medpicc_score_current ?? deal.latest_medpicc_score ?? "—"}%`);
  parts.push(`Win Probability: ${deal.win_probability_current ?? deal.latest_deal_probability ?? "—"}%`);
  parts.push(`Risk: ${deal.latest_risk_assessment || "Unknown"} | Calls: ${deal.call_count}`);

  const cats = (deal.latest_medpicc_categories as Record<string, number>) || {};
  if (Object.keys(cats).length > 0) {
    parts.push(`\nMEDPICC CATEGORIES:`);
    for (const [key, score] of Object.entries(cats)) parts.push(`  ${key}: ${score}/5`);
  }

  const history = (deal.medpicc_history as { score: number; win_probability: number; timestamp: string; source: string }[]) || [];
  if (history.length > 0) {
    parts.push(`\nSCORE HISTORY:`);
    for (const h of history) parts.push(`  ${new Date(h.timestamp).toLocaleDateString()}: MEDPICC ${h.score}%, Win ${h.win_probability}% (${h.source})`);
  }

  const analysisIds = (deal.analysis_ids as string[]) || [];
  if (analysisIds.length > 0) {
    const idsToLoad = analysisIds.slice(0, 3);
    const pipeline = kv.pipeline();
    for (const id of idsToLoad) pipeline.get(`analysis:${id}`);
    const analyses = (await pipeline.exec()).filter(Boolean) as Record<string, unknown>[];

    for (let i = 0; i < analyses.length; i++) {
      const a = analyses[i];
      const ca = a.call_analysis as Record<string, unknown>;
      const mp = a.medpicc as Record<string, unknown>;
      const date = a.created_at ? new Date(a.created_at as string).toLocaleDateString() : `Call ${i + 1}`;
      parts.push(`\n--- CALL: ${date} ---`);
      parts.push(`Score: ${ca?.call_score}/100`);
      parts.push(`Mistakes: ${JSON.stringify(ca?.key_mistakes)}`);
      parts.push(`Missed: ${JSON.stringify(ca?.missed_opportunities)}`);
      parts.push(`Open Questions: ${JSON.stringify(ca?.open_questions)}`);
      parts.push(`Coaching: ${JSON.stringify(ca?.coaching)}`);
      parts.push(`Actions: ${JSON.stringify(mp?.recommended_actions)}`);
      parts.push(`\nTranscript:\n${(a.labeled_transcript as string || "").slice(0, 3000)}`);
    }
  }

  return parts.join("\n");
}

export async function buildGlobalContext(): Promise<string> {
  const dealIds = await listDealIds();
  if (dealIds.length === 0) return "No deals in pipeline.";

  const pipeline = kv.pipeline();
  for (const id of dealIds.slice(0, 20)) pipeline.get(`deal:${id}`);
  const deals = (await pipeline.exec()).filter(Boolean) as Record<string, unknown>[];

  const parts: string[] = [`PIPELINE: ${deals.length} deals\n`];

  for (const deal of deals) {
    const analysisIds = (deal.analysis_ids as string[]) || [];
    let latestCoaching = "";
    let latestMistakes = "";

    if (analysisIds.length > 0) {
      const latest = await loadAnalysis(analysisIds[0]);
      if (latest) {
        const ca = latest.call_analysis as Record<string, unknown>;
        latestCoaching = JSON.stringify((ca?.coaching as string[])?.slice(0, 2));
        latestMistakes = JSON.stringify((ca?.key_mistakes as string[])?.slice(0, 2));
      }
    }

    parts.push(`Deal: ${deal.deal_name} (${deal.company})`);
    parts.push(`  MEDPICC: ${deal.latest_medpicc_score ?? "—"}% | Win: ${deal.latest_deal_probability ?? "—"}% | Risk: ${deal.latest_risk_assessment || "—"} | Calls: ${deal.call_count}`);
    parts.push(`  Stage: ${deal.stage || "Unknown"} | Owner: ${deal.owner || "Unassigned"}`);
    if (latestMistakes) parts.push(`  Mistakes: ${latestMistakes}`);
    if (latestCoaching) parts.push(`  Coaching: ${latestCoaching}`);
    parts.push("");
  }

  return parts.join("\n");
}

/**
 * Build deep deal context for the MEDDPICC follow-up agent.
 * Includes full MEDPICC notes, complete transcripts, and deal metadata.
 */
export async function buildDeepDealContext(dealId: string): Promise<string> {
  const deal = await loadDeal(dealId);
  if (!deal) throw new Error("Deal not found");

  const parts: string[] = [];

  // Deal metadata
  parts.push(`DEAL CONTEXT:`);
  parts.push(`Account: ${deal.deal_name} at ${deal.company}`);
  parts.push(`Stage: ${deal.stage || "Unknown"}`);
  parts.push(`Owner: ${deal.owner || "Unassigned"}`);
  parts.push(`Notes: ${deal.notes || "None"}`);

  // Calculate days since last touch
  const lastUpdated = deal.last_updated_at || deal.updated_at;
  if (lastUpdated) {
    const days = Math.floor((Date.now() - new Date(lastUpdated as string).getTime()) / (1000 * 60 * 60 * 24));
    parts.push(`Last updated: ${days} days ago (${lastUpdated})`);
  }
  parts.push(`Total calls: ${deal.call_count}`);

  // MEDPICC scores with full notes
  const cats = (deal.latest_medpicc_categories as Record<string, number>) || {};
  parts.push(`\nMEDDPICC CURRENT SCORES:`);
  for (const [key, score] of Object.entries(cats)) {
    parts.push(`  ${key}: ${score}/5`);
  }

  // MEDPICC history
  const history = (deal.medpicc_history as { score: number; win_probability: number; timestamp: string; source: string }[]) || [];
  if (history.length > 0) {
    parts.push(`\nSCORE HISTORY (${history.length} snapshots):`);
    for (const h of history) {
      parts.push(`  ${new Date(h.timestamp).toLocaleDateString()}: MEDPICC ${h.score}%, Win ${h.win_probability}% (${h.source})`);
    }
  }

  // Load ALL analyses (not just 3) for deep context
  const analysisIds = (deal.analysis_ids as string[]) || [];
  if (analysisIds.length > 0) {
    const pipeline = kv.pipeline();
    for (const id of analysisIds.slice(0, 3)) pipeline.get(`analysis:${id}`);
    const analyses = (await pipeline.exec()).filter(Boolean) as Record<string, unknown>[];

    // Full MEDPICC assessment from latest analysis
    if (analyses.length > 0) {
      const latestMp = analyses[0].medpicc as Record<string, unknown>;
      if (latestMp) {
        parts.push(`\nDETAILED MEDDPICC ASSESSMENT (from latest call):`);
        for (const key of ["metrics", "economic_buyer", "decision_criteria", "decision_process", "paper_process", "identify_pain", "champion", "competition"]) {
          const cat = latestMp[key] as Record<string, unknown> | undefined;
          if (cat) {
            parts.push(`  ${key} (${cat.score}/5): ${cat.summary}`);
            const missing = cat.missing_info as string[] | undefined;
            if (missing && missing.length > 0) {
              parts.push(`    Missing: ${missing.join("; ")}`);
            }
          }
        }
      }

      // Coaching and mistakes from latest
      const latestCa = analyses[0].call_analysis as Record<string, unknown>;
      if (latestCa) {
        parts.push(`\nLATEST CALL INTELLIGENCE:`);
        parts.push(`  Call Score: ${latestCa.call_score}/100`);
        parts.push(`  Key Mistakes: ${JSON.stringify(latestCa.key_mistakes)}`);
        parts.push(`  Missed Opportunities: ${JSON.stringify(latestCa.missed_opportunities)}`);
        parts.push(`  Open Questions: ${JSON.stringify(latestCa.open_questions)}`);
        parts.push(`  Coaching: ${JSON.stringify(latestCa.coaching)}`);
      }
    }

    // Full transcripts (more generous limit for deep analysis)
    parts.push(`\n${"=".repeat(60)}`);
    parts.push(`FULL TRANSCRIPTS (${analyses.length} calls):`);
    parts.push(`${"=".repeat(60)}`);

    for (let i = 0; i < analyses.length; i++) {
      const a = analyses[i];
      const date = a.created_at ? new Date(a.created_at as string).toLocaleDateString() : `Call ${i + 1}`;
      const transcript = (a.labeled_transcript as string || "").slice(0, 4000);
      parts.push(`\n--- CALL ${i + 1}: ${date} ---`);
      parts.push(transcript);
    }
  }

  return parts.join("\n");
}

// --- Engine ---

function extractJSON(text: string): Record<string, unknown> | undefined {
  let str = text.trim();
  if (str.startsWith("```")) {
    const lines = str.split("\n");
    lines.shift();
    while (lines.length && lines[lines.length - 1].trim() === "```") lines.pop();
    str = lines.join("\n");
  }
  try {
    return JSON.parse(str);
  } catch {
    const start = str.indexOf("{");
    const end = str.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      try { return JSON.parse(str.slice(start, end + 1)); } catch { /* nope */ }
    }
  }
  return undefined;
}

/**
 * Run an agent with a recipe name, context, and model tier.
 */
export async function runAgent(
  recipeName: string,
  context: AgentContext,
  model: ModelTier = "fast"
): Promise<AgentResult> {
  const recipe = RECIPES[recipeName];
  if (!recipe) throw new Error(`Unknown recipe: ${recipeName}`);

  // Build context
  let contextStr: string;
  if (context.raw_context) {
    contextStr = context.raw_context;
  } else if (context.deal_id) {
    contextStr = await buildDealContext(context.deal_id);
  } else {
    throw new Error("Either deal_id or raw_context required");
  }

  const modelId = MODELS[model];

  const response = await client.messages.create({
    model: modelId,
    max_tokens: 4096,
    system: recipe.instructions,
    messages: [{ role: "user", content: `Here is the context:\n\n${contextStr}` }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const parsed = recipe.outputFormat === "json" ? extractJSON(text) : undefined;

  return {
    output: text,
    parsed,
    model_used: modelId,
    tokens_used: response.usage?.output_tokens,
    recipe: recipeName,
  };
}
