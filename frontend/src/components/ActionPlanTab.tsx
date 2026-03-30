"use client";

import { useState } from "react";
import { getActionPlan, ActionPlan } from "@/lib/api";

export default function ActionPlanTab({ analysisId }: { analysisId: string }) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const result = await getActionPlan(analysisId);
      setPlan(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate action plan");
    } finally {
      setLoading(false);
    }
  }

  if (!plan) {
    return (
      <div className="bg-gradient-to-br from-red-950 to-gray-900 rounded-xl p-8 text-center">
        <div className="text-5xl mb-4">&#128520;</div>
        <h3 className="text-xl font-bold text-white mb-2">Sales Demon Mode</h3>
        <p className="text-red-200 text-sm mb-6 max-w-md mx-auto">
          Generate a ruthless action plan to close every MEDPICC gap.
          Exact scripts, specific targets, aggressive timelines.
        </p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Unleashing..." : "Activate Sales Demon"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Deal Killer + Power Move */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-950 rounded-xl p-5 border border-red-900">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">&#128680;</span>
            <h3 className="font-bold text-red-400 text-sm uppercase tracking-wider">Deal Killer</h3>
          </div>
          <p className="text-white text-sm leading-relaxed">{plan.deal_killer}</p>
        </div>
        <div className="bg-emerald-950 rounded-xl p-5 border border-emerald-900">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">&#9889;</span>
            <h3 className="font-bold text-emerald-400 text-sm uppercase tracking-wider">Power Move</h3>
          </div>
          <p className="text-white text-sm leading-relaxed">{plan.power_move}</p>
        </div>
      </div>

      {/* Gap Action Cards */}
      {plan.gaps.map((gap, i) => (
        <div key={i} className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold text-white ${
                gap.score <= 1 ? "bg-red-600" : gap.score <= 2 ? "bg-orange-500" : "bg-yellow-500"
              }`}>
                {gap.category}
              </span>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{gap.category_name}</h3>
                <p className="text-xs text-gray-500">Score: {gap.score}/5</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <p className="text-sm text-gray-700"><span className="font-semibold">Gap:</span> {gap.gap}</p>
              <p className="text-sm text-red-600 mt-1"><span className="font-semibold">Why it matters:</span> {gap.urgency}</p>
            </div>
            <div className="space-y-3">
              {gap.actions.map((action, j) => (
                <div key={j} className="bg-gray-50 rounded-lg p-4 border-l-4 border-l-gray-900">
                  <p className="text-sm font-semibold text-gray-900 mb-2">{action.action}</p>
                  <div className="bg-white rounded-md p-3 border mb-2">
                    <p className="text-sm text-gray-600 italic">&ldquo;{action.script}&rdquo;</p>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span><span className="font-medium text-gray-700">Target:</span> {action.target}</span>
                    <span><span className="font-medium text-gray-700">When:</span> {action.timing}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Email Draft */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">&#9993;&#65039;</span>
          <h3 className="font-semibold text-gray-900">Follow-Up Email Draft</h3>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border">
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{plan.email_draft}</p>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(plan.email_draft)}
          className="mt-3 text-sm text-gray-500 hover:text-gray-900 font-medium"
        >
          Copy to clipboard
        </button>
      </div>
    </div>
  );
}
