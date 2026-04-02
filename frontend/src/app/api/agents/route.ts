import { NextRequest, NextResponse } from "next/server";
import { runAgent, buildGlobalContext, buildDeepDealContext, ModelTier } from "@/lib/agents/engine";
import { saveNewAnalysisVersion } from "@/lib/server/deal-analysis-service";

export const maxDuration = 120;

/**
 * POST /api/agents — run an agent recipe
 *
 * Body: {
 *   recipe: string,           // recipe name from RECIPES
 *   deal_id?: string,         // for deal-specific agents
 *   model?: "fast" | "reasoning",
 *   save_version?: boolean,   // persist result as a new version
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { recipe, deal_id, model, save_version } = await req.json();

    if (!recipe) {
      return NextResponse.json({ error: "recipe is required" }, { status: 400 });
    }

    // Build context based on recipe type
    let context: { deal_id?: string; raw_context?: string };

    if (deal_id && recipe === "meddpicc_followup") {
      // Deep context for MEDDPICC follow-up agent — full transcripts, detailed MEDPICC
      const deepCtx = await buildDeepDealContext(deal_id);
      context = { raw_context: deepCtx };
    } else if (deal_id) {
      context = { deal_id };
    } else {
      // No deal_id — use global context (works for global_intelligence, objection_handler, etc.)
      const globalCtx = await buildGlobalContext();
      context = { raw_context: globalCtx };
    }

    const result = await runAgent(recipe, context, (model as ModelTier) || "fast");

    // Optionally save as a versioned analysis
    let version = null;
    if (save_version && deal_id) {
      const cacheType = recipe === "frank_deal" ? "frank_analysis"
        : recipe === "meeting_prep" ? "meeting_prep"
        : recipe === "action_plan" ? "action_plan"
        : null;

      if (cacheType) {
        version = await saveNewAnalysisVersion(
          deal_id,
          cacheType as "meeting_prep" | "action_plan" | "frank_analysis",
          result.parsed ? JSON.stringify(result.parsed) : result.output
        );
      }
    }

    return NextResponse.json({
      result: {
        output: result.output,
        parsed: result.parsed,
        model_used: result.model_used,
        tokens_used: result.tokens_used,
        recipe: result.recipe,
      },
      version,
    });
  } catch (error) {
    console.error("Agent error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Agent failed: ${message}` }, { status: 500 });
  }
}
