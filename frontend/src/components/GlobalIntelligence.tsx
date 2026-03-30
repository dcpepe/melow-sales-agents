"use client";

import { useState } from "react";
import { runAgentApi } from "@/lib/api";

interface GlobalData {
  pipeline_health: string;
  summary: string;
  top_deals: { name: string; company: string; why: string; win_prob: number; action: string }[];
  at_risk: { name: string; company: string; risk: string; save_action: string }[];
  insights: string[];
  priorities: { action: string; deal: string; impact: string }[];
  team_coaching: string[];
}

export default function GlobalIntelligence() {
  const [data, setData] = useState<GlobalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await runAgentApi({ recipe: "global_intelligence", model: "fast" });
      if (res.result.parsed) setData(res.result.parsed as unknown as GlobalData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center mb-6">
        <div className="text-3xl mb-3 animate-bounce">🌐</div>
        <p className="text-sm font-medium text-gray-900">Analyzing pipeline...</p>
        <div className="mt-3 w-40 mx-auto bg-gray-100 rounded-full h-1 overflow-hidden">
          <div className="h-full bg-gray-900 rounded-full animate-pulse" style={{ width: "60%" }} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <button
        onClick={run}
        className="w-full bg-gradient-to-r from-indigo-950 to-blue-900 rounded-xl p-5 text-left hover:from-indigo-900 hover:to-blue-800 transition-all mb-6 group"
      >
        <div className="flex items-center gap-3">
          <div className="text-3xl group-hover:scale-110 transition-transform">🌐</div>
          <div>
            <h3 className="font-semibold text-white">Pipeline Intelligence</h3>
            <p className="text-xs text-blue-200">Run AI analysis across all your deals</p>
          </div>
          {error && <p className="text-xs text-red-300 ml-auto">{error}</p>}
        </div>
      </button>
    );
  }

  const healthColor = data.pipeline_health === "strong" ? "bg-green-100 text-green-800"
    : data.pipeline_health === "moderate" ? "bg-yellow-100 text-yellow-800"
    : "bg-red-100 text-red-800";

  return (
    <div className="bg-white rounded-xl border shadow-sm mb-6">
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>🌐</span>
          <h3 className="font-semibold text-gray-900">Pipeline Intelligence</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${healthColor}`}>
            {data.pipeline_health}
          </span>
        </div>
        <button onClick={run} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-sm text-gray-700">{data.summary}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Deals */}
          <div>
            <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Top Deals to Focus</h4>
            {data.top_deals?.map((d, i) => (
              <div key={i} className="mb-2 p-2 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{d.name}</p>
                  <span className="text-xs text-green-700">{d.win_prob}% win</span>
                </div>
                <p className="text-xs text-gray-600">{d.why}</p>
                <p className="text-xs text-green-700 font-medium mt-0.5">{d.action}</p>
              </div>
            ))}
          </div>

          {/* At Risk */}
          <div>
            <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">At Risk</h4>
            {data.at_risk?.map((d, i) => (
              <div key={i} className="mb-2 p-2 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{d.name}</p>
                <p className="text-xs text-red-600">{d.risk}</p>
                <p className="text-xs text-gray-700 font-medium mt-0.5">{d.save_action}</p>
              </div>
            ))}
          </div>
        </div>

        {/* This Week */}
        {data.priorities?.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">This Week&apos;s Priorities</h4>
            <div className="space-y-1.5">
              {data.priorities.map((p, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="bg-gray-900 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                  <div>
                    <p className="text-gray-900">{p.action}</p>
                    <p className="text-xs text-gray-400">{p.deal} — {p.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
