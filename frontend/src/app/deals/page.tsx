"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Deal, listDeals, deleteDeal } from "@/lib/api";
import TeamSelector from "@/components/TeamSelector";
import { getMemberByName } from "@/lib/team";

type Filter = "all" | "high" | "medium" | "low";

const MEDPICC_LABELS: Record<string, string> = {
  metrics: "Metrics",
  economic_buyer: "Economic Buyer",
  decision_criteria: "Decision Criteria",
  decision_process: "Decision Process",
  paper_process: "Paper Process",
  identify_pain: "Identify Pain",
  champion: "Champion",
  competition: "Competition",
};

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedDeal, setExpandedDeal] = useState<string | null>(null);

  useEffect(() => {
    listDeals()
      .then((data) => setDeals(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Delete this deal? This cannot be undone.")) return;
    await deleteDeal(id);
    setDeals((prev) => prev.filter((d) => d.id !== id));
  }

  // Filtering
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
      return (
        (d.deal_name || "").toLowerCase().includes(q) ||
        (d.company || "").toLowerCase().includes(q)
      );
    });

  // Pipeline stats
  const highRisk = deals.filter((d) => d.latest_risk_assessment === "High").length;
  const medRisk = deals.filter((d) => d.latest_risk_assessment === "Medium").length;
  const lowRisk = deals.filter((d) => d.latest_risk_assessment === "Low").length;
  const avgCallScore = deals.length
    ? Math.round(deals.reduce((s, d) => s + (d.latest_call_score || 0), 0) / deals.length)
    : 0;
  const avgMedpicc = deals.length
    ? Math.round(deals.reduce((s, d) => s + (d.latest_medpicc_score || 0), 0) / deals.length)
    : 0;
  const avgWinProb = deals.length
    ? Math.round(deals.reduce((s, d) => s + (d.latest_deal_probability || 0), 0) / deals.length)
    : 0;

  // Find weakest MEDPICC categories across all deals
  const categoryTotals: Record<string, { sum: number; count: number }> = {};
  for (const deal of deals) {
    if (!deal.latest_medpicc_categories) continue;
    for (const [key, score] of Object.entries(deal.latest_medpicc_categories)) {
      if (!categoryTotals[key]) categoryTotals[key] = { sum: 0, count: 0 };
      categoryTotals[key].sum += score;
      categoryTotals[key].count++;
    }
  }
  const weakestCategories = Object.entries(categoryTotals)
    .map(([key, { sum, count }]) => ({ key, label: MEDPICC_LABELS[key] || key, avg: sum / count }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 4);

  const allOpenQuestions: { deal: string; question: string }[] = [];

  function scoreColor(score: number | null) {
    if (score === null) return "text-gray-400";
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  }

  function riskBadge(risk: string | null) {
    if (!risk) return null;
    const colors: Record<string, string> = {
      Low: "bg-green-50 text-green-700 border-green-200",
      Medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
      High: "bg-red-50 text-red-700 border-red-200",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[risk] || "bg-gray-100 text-gray-600"}`}>
        {risk}
      </span>
    );
  }

  function medpiccBar(categories: Record<string, number> | null) {
    if (!categories) return null;
    const letters = [
      { key: "metrics", l: "M" },
      { key: "economic_buyer", l: "E" },
      { key: "decision_criteria", l: "D" },
      { key: "decision_process", l: "D" },
      { key: "paper_process", l: "P" },
      { key: "identify_pain", l: "I" },
      { key: "champion", l: "C" },
      { key: "competition", l: "C" },
    ];
    return (
      <div className="flex gap-0.5">
        {letters.map(({ key, l }, i) => {
          const score = categories[key] ?? 0;
          const bg = score >= 4 ? "bg-green-500" : score >= 2 ? "bg-yellow-400" : "bg-red-500";
          return (
            <div
              key={i}
              className={`w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center text-white ${bg}`}
              title={`${MEDPICC_LABELS[key]}: ${score}/5`}
            >
              {l}
            </div>
          );
        })}
      </div>
    );
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
            <div className="text-5xl mb-4">&#128202;</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No deals yet</h2>
            <p className="text-gray-500 mb-6">Add your first deal to start building your pipeline</p>
            <button
              onClick={() => router.push("/analyze")}
              className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800"
            >
              Add a Deal
            </button>
          </div>
        ) : (
          <>
            {/* Pipeline Health */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <div className="bg-white rounded-xl border p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Avg Call Score</p>
                <p className={`text-2xl font-bold mt-1 ${scoreColor(avgCallScore)}`}>{avgCallScore}</p>
              </div>
              <div className="bg-white rounded-xl border p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Avg MEDPICC</p>
                <p className={`text-2xl font-bold mt-1 ${scoreColor(avgMedpicc)}`}>{avgMedpicc}%</p>
              </div>
              <div className="bg-white rounded-xl border p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Avg Win Prob</p>
                <p className={`text-2xl font-bold mt-1 ${scoreColor(avgWinProb)}`}>{avgWinProb}%</p>
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

            {/* Insights Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Weakest MEDPICC Areas */}
              {weakestCategories.length > 0 && (
                <div className="bg-white rounded-xl border p-5">
                  <h3 className="font-semibold text-gray-900 text-sm mb-3">Weakest MEDPICC Areas Across Pipeline</h3>
                  <div className="space-y-2">
                    {weakestCategories.map((cat) => (
                      <div key={cat.key} className="flex items-center gap-3">
                        <div className="w-full bg-gray-100 rounded-full h-2 flex-1">
                          <div
                            className={`h-2 rounded-full ${cat.avg >= 3 ? "bg-yellow-400" : "bg-red-500"}`}
                            style={{ width: `${(cat.avg / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-700 w-36 text-right">{cat.label}</span>
                        <span className="text-sm font-bold text-gray-900 w-10">{cat.avg.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">Focus coaching and next calls on these areas</p>
                </div>
              )}

              {/* Open Questions */}
              {allOpenQuestions.length > 0 && (
                <div className="bg-white rounded-xl border p-5">
                  <h3 className="font-semibold text-gray-900 text-sm mb-3">Things We Don&apos;t Know Yet</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {allOpenQuestions.slice(0, 8).map((item, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-red-400 mt-0.5 flex-shrink-0">?</span>
                        <div>
                          <p className="text-sm text-gray-700">{item.question}</p>
                          <p className="text-xs text-gray-400">{item.deal}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Search + Filter Bar */}
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
                <button
                  onClick={() => setFilter("all")}
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Clear filter
                </button>
              )}
              <span className="text-sm text-gray-400">{filtered.length} deals</span>
            </div>

            {/* Deal List */}
            <div className="space-y-3">
              {filtered.map((deal) => (
                <div
                  key={deal.id}
                  className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all group"
                >
                  {/* Main Row */}
                  <div
                    className="p-5 flex items-center gap-4 cursor-pointer"
                    onClick={() => setExpandedDeal(expandedDeal === deal.id ? null : deal.id)}
                  >
                    {/* Owner Avatar */}
                    {(() => {
                      const m = deal.owner ? getMemberByName(deal.owner) : undefined;
                      return (
                        <div className={`w-8 h-8 ${m?.color || "bg-gray-200"} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`} title={deal.owner || "Unassigned"}>
                          {m?.initials || "?"}
                        </div>
                      );
                    })()}

                    {/* Name + Company */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {deal.deal_name || "Untitled Deal"}
                        </h3>
                        {riskBadge(deal.latest_risk_assessment)}
                      </div>
                      {deal.company && (
                        <p className="text-sm text-gray-500 truncate">{deal.company}</p>
                      )}
                    </div>

                    {/* MEDPICC mini bar */}
                    <div className="hidden md:block">
                      {medpiccBar(deal.latest_medpicc_categories)}
                    </div>

                    {/* Scores */}
                    <div className="flex items-center gap-5">
                      <div className="text-center">
                        <p className={`text-lg font-bold ${scoreColor(deal.latest_call_score)}`}>
                          {deal.latest_call_score ?? "—"}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase">Call</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-lg font-bold ${scoreColor(deal.latest_medpicc_score)}`}>
                          {deal.latest_medpicc_score != null ? `${Math.round(deal.latest_medpicc_score)}%` : "—"}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase">MEDPICC</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-lg font-bold ${scoreColor(deal.latest_deal_probability)}`}>
                          {deal.latest_deal_probability != null ? `${Math.round(deal.latest_deal_probability)}%` : "—"}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase">Win</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/deals/${deal.id}`);
                        }}
                        className="text-gray-400 hover:text-gray-900 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                        title="View full analysis"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, deal.id)}
                        className="text-gray-300 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete deal"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {expandedDeal === deal.id && (
                    <div className="border-t px-5 py-4 bg-gray-50/50 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* What's Missing */}
                        {deal.latest_medpicc_categories && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">MEDPICC Gaps</h4>
                            <div className="space-y-1.5">
                              {Object.entries(deal.latest_medpicc_categories)
                                .filter(([, score]) => score <= 2)
                                .sort(([, a], [, b]) => a - b)
                                .map(([key, score]) => (
                                  <div key={key} className="flex items-center gap-2">
                                    <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center text-white ${score <= 1 ? "bg-red-500" : "bg-orange-400"}`}>
                                      {score}
                                    </span>
                                    <span className="text-sm text-gray-700">{MEDPICC_LABELS[key]}</span>
                                  </div>
                                ))}
                              {Object.entries(deal.latest_medpicc_categories).filter(([, s]) => s <= 2).length === 0 && (
                                <p className="text-sm text-green-600">All categories scored 3+</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Call Count */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Calls</h4>
                          <p className="text-sm text-gray-700">{deal.call_count} call{deal.call_count !== 1 ? "s" : ""} analyzed</p>
                        </div>
                      </div>

                      {/* Created */}
                      {deal.created_at && (
                        <div>
                          <p className="text-xs text-gray-400">Created {new Date(deal.created_at).toLocaleDateString()}</p>
                        </div>
                      )}

                      <button
                        onClick={() => router.push(`/deals/${deal.id}`)}
                        className="text-sm font-medium text-gray-900 hover:underline"
                      >
                        Open full analysis &rarr;
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
