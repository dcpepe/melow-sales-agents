import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET() {
  try {
    const keys = await kv.keys("analysis:*");
    const recent: Record<string, unknown>[] = [];

    const pipeline = kv.pipeline();
    for (const key of keys.slice(0, 50)) {
      pipeline.get(key);
    }
    const results = keys.length > 0 ? await pipeline.exec() : [];

    for (const data of results) {
      if (data && typeof data === "object") {
        const d = data as Record<string, unknown>;
        const medpicc = d.medpicc as Record<string, unknown> | undefined;
        const callAnalysis = d.call_analysis as Record<string, unknown> | undefined;

        // Extract MEDPICC category scores
        const medpiccCategories: Record<string, number> = {};
        if (medpicc) {
          for (const key of ["metrics", "economic_buyer", "decision_criteria", "decision_process", "paper_process", "identify_pain", "champion", "competition"]) {
            const cat = medpicc[key] as Record<string, unknown> | undefined;
            if (cat) medpiccCategories[key] = cat.score as number;
          }
        }

        recent.push({
          id: d.id,
          deal_name: d.deal_name,
          company: d.company,
          participants: d.participants,
          call_score: callAnalysis?.call_score,
          medpicc_score: medpicc?.overall_score,
          risk_assessment: medpicc?.risk_assessment,
          deal_probability: medpicc?.deal_probability,
          recommended_actions: medpicc?.recommended_actions,
          medpicc_categories: medpiccCategories,
          open_questions: callAnalysis?.open_questions,
          key_mistakes: callAnalysis?.key_mistakes,
          created_at: d.created_at || null,
        });
      }
    }

    return NextResponse.json({ analyses: recent });
  } catch (error) {
    console.error("List analyses error:", error);
    return NextResponse.json({ analyses: [] });
  }
}
