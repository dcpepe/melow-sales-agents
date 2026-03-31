"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Deal, listDeals, deleteDeal } from "@/lib/api";
import TeamSelector from "@/components/TeamSelector";
import DealEvolutionChart from "@/components/DealEvolutionChart";
import MedpiccBars from "@/components/MedpiccBars";
import { getMemberByName } from "@/lib/team";

type Filter = "all" | "high" | "medium" | "low";



export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedDeal, setExpandedDeal] = useState<string | null>(null);

  useEffect(() => {
    listDeals()
      .then(setDeals)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Delete this deal? This cannot be undone.")) return;
    await deleteDeal(id);
    setDeals((prev) => prev.filter((d) => d.id !== id));
  }

  const filtered = deals
    .filter((d) => {
      if (filter === "high") return d.latest_risk_assessment === "High";
      if (filter === "medium") return d.latest_risk_assessment === "Medium";
      if (filter === "low") return d.latest_risk_assessment === "Low";
      return true;
    })
    .filter((d) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return d.deal_name.toLowerCase().includes(q) || d.company.toLowerCase().includes(q);
    });

  // Pipeline stats
  const highRisk = deals.filter((d) => d.latest_risk_assessment === "High").length;
  const medRisk = deals.filter((d) => d.latest_risk_assessment === "Medium").length;
  const lowRisk = deals.filter((d) => d.latest_risk_assessment === "Low").length;
  const avgScore = deals.length
    ? Math.round(deals.reduce((s, d) => s + (d.medpicc_score_current || d.latest_medpicc_score || 0), 0) / deals.length)
    : 0;
  const avgWin = deals.length
    ? Math.round(deals.reduce((s, d) => s + (d.win_probability_current || d.latest_deal_probability || 0), 0) / deals.length)
    : 0;

  function scoreColor(score: number | null | undefined) {
    if (score == null) return "text-gray-400";
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  }

  function trend(deal: Deal): { arrow: string; color: string } | null {
    const h = deal.medpicc_history;
    if (!h || h.length < 2) return null;
    const last = h[h.length - 1].score;
    const prev = h[h.length - 2].score;
    if (last > prev) return { arrow: "↑", color: "text-green-600" };
    if (last < prev) return { arrow: "↓", color: "text-red-600" };
    return { arrow: "→", color: "text-gray-400" };
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Deal Intelligence</h1>
              <p className="text-sm text-gray-500">{deals.length} deals in pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TeamSelector />
            <button
              onClick={() => router.push("/analyze")}
              className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              + New Deal
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading deals...</div>
        ) : deals.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No deals yet</h2>
            <p className="text-gray-500 mb-6">Add your first deal to start building your pipeline</p>
            <button onClick={() => router.push("/analyze")} className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800">
              Add a Deal
            </button>
          </div>
        ) : (
          <>
            {/* Pipeline Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <div className="bg-white rounded-xl border p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Avg MEDPICC</p>
                <p className={`text-2xl font-bold mt-1 ${scoreColor(avgScore)}`}>{avgScore}%</p>
              </div>
              <div className="bg-white rounded-xl border p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Avg Win Prob</p>
                <p className={`text-2xl font-bold mt-1 ${scoreColor(avgWin)}`}>{avgWin}%</p>
              </div>
              <button onClick={() => setFilter(filter === "high" ? "all" : "high")} className={`rounded-xl border p-4 text-left transition-colors ${filter === "high" ? "bg-red-50 border-red-200" : "bg-white hover:bg-red-50"}`}>
                <p className="text-xs text-gray-400 uppercase tracking-wider">High Risk</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{highRisk}</p>
              </button>
              <button onClick={() => setFilter(filter === "medium" ? "all" : "medium")} className={`rounded-xl border p-4 text-left transition-colors ${filter === "medium" ? "bg-yellow-50 border-yellow-200" : "bg-white hover:bg-yellow-50"}`}>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Medium Risk</p>
                <p className="text-2xl font-bold mt-1 text-yellow-600">{medRisk}</p>
              </button>
              <button onClick={() => setFilter(filter === "low" ? "all" : "low")} className={`rounded-xl border p-4 text-left transition-colors ${filter === "low" ? "bg-green-50 border-green-200" : "bg-white hover:bg-green-50"}`}>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Low Risk</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{lowRisk}</p>
              </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-md">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search deals..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              {filter !== "all" && (
                <button onClick={() => setFilter("all")} className="text-sm text-gray-500 hover:text-gray-900">Clear filter</button>
              )}
              <span className="text-sm text-gray-400">{filtered.length} deals</span>
            </div>

            {/* Deal Cards */}
            <div className="space-y-3">
              {filtered.map((deal) => {
                const t = trend(deal);
                const isExpanded = expandedDeal === deal.id;
                const ownerMember = deal.owner ? getMemberByName(deal.owner) : undefined;
                const medpiccScore = deal.medpicc_score_current ?? deal.latest_medpicc_score;
                const winProb = deal.win_probability_current ?? deal.latest_deal_probability;
                // Inline intelligence
                const biggestRisk = deal.key_mistakes?.[0] || deal.open_questions?.[0] || null;
                const nextAction = deal.recommended_actions?.[0] || deal.coaching?.[0] || null;

                return (
                  <div key={deal.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all group">
                    {/* Main Row */}
                    <div
                      className="p-5 flex items-center gap-4 cursor-pointer"
                      onClick={() => setExpandedDeal(isExpanded ? null : deal.id)}
                    >
                      {/* Owner */}
                      <div className={`w-9 h-9 ${ownerMember?.color || "bg-gray-200"} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`} title={deal.owner || "Unassigned"}>
                        {ownerMember?.initials || "?"}
                      </div>

                      {/* Name + Inline Intelligence */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">{deal.deal_name || "Untitled"}</h3>
                          {deal.latest_risk_assessment && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              deal.latest_risk_assessment === "High" ? "bg-red-50 text-red-700" :
                              deal.latest_risk_assessment === "Medium" ? "bg-yellow-50 text-yellow-700" :
                              "bg-green-50 text-green-700"
                            }`}>{deal.latest_risk_assessment}</span>
                          )}
                          {deal.stage && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700">{deal.stage}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{deal.company} · {deal.call_count} call{deal.call_count !== 1 ? "s" : ""}</p>
                        {/* Inline intelligence */}
                        {(biggestRisk || nextAction) && (
                          <div className="flex gap-4 mt-1.5">
                            {biggestRisk && (
                              <p className="text-xs text-red-600 truncate max-w-[250px]">
                                <span className="font-medium">Risk:</span> {biggestRisk}
                              </p>
                            )}
                            {nextAction && (
                              <p className="text-xs text-green-700 truncate max-w-[250px]">
                                <span className="font-medium">Next:</span> {nextAction}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Live MEDPICC Panel */}
                      <div className="flex items-center gap-5 flex-shrink-0">
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <p className={`text-lg font-bold ${scoreColor(medpiccScore)}`}>
                              {medpiccScore != null ? `${Math.round(medpiccScore)}%` : "—"}
                            </p>
                            {t && <span className={`text-sm font-bold ${t.color}`}>{t.arrow}</span>}
                          </div>
                          <p className="text-[10px] text-gray-400 uppercase">MEDPICC</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-lg font-bold ${scoreColor(winProb)}`}>
                            {winProb != null ? `${Math.round(winProb)}%` : "—"}
                          </p>
                          <p className="text-[10px] text-gray-400 uppercase">Win</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-lg font-bold ${scoreColor(deal.latest_call_score)}`}>
                            {deal.latest_call_score ?? "—"}
                          </p>
                          <p className="text-[10px] text-gray-400 uppercase">Call</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/deals/${deal.id}`); }}
                          className="text-gray-400 hover:text-gray-900 p-1.5 rounded-md hover:bg-gray-100"
                          title="Open deal"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, deal.id)}
                          className="text-gray-300 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Expanded Section */}
                    {isExpanded && (
                      <div className="border-t px-5 py-5 bg-gray-50/50 space-y-5">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                          {/* MEDPICC Breakdown */}
                          <div className="bg-white rounded-xl border p-5">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">MEDPICC Breakdown</h4>
                            <MedpiccBars categories={deal.latest_medpicc_categories || {}} breakdown={deal.medpicc_breakdown as Record<string, { score: number; summary: string; missing_info: string[] }> | undefined} />
                          </div>

                          {/* Evolution Chart */}
                          {deal.medpicc_history && deal.medpicc_history.length > 0 && (
                            <DealEvolutionChart history={deal.medpicc_history} />
                          )}
                        </div>

                        {/* Risks + Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {deal.key_mistakes && deal.key_mistakes.length > 0 && (
                            <div className="bg-white rounded-xl border border-l-4 border-l-red-500 p-4">
                              <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Key Risks</h4>
                              <ul className="space-y-1.5">
                                {deal.key_mistakes.map((m, i) => (
                                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                                    <span className="text-red-400 flex-shrink-0 mt-0.5">!</span>
                                    {m}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {deal.recommended_actions && deal.recommended_actions.length > 0 && (
                            <div className="bg-white rounded-xl border border-l-4 border-l-green-500 p-4">
                              <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Next Actions</h4>
                              <ol className="space-y-1.5 list-decimal list-inside">
                                {deal.recommended_actions.map((a, i) => (
                                  <li key={i} className="text-sm text-gray-700">{a}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => router.push(`/deals/${deal.id}`)}
                          className="text-sm font-medium text-gray-900 hover:underline"
                        >
                          Open full deal intelligence &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
