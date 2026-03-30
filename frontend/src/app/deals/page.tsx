"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DealListItem, listDeals, deleteDeal } from "@/lib/api";

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<DealListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listDeals()
      .then((data) => setDeals(data.deals))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Delete this deal? This cannot be undone.")) return;
    await deleteDeal(id);
    setDeals((prev) => prev.filter((d) => d.id !== id));
  }

  const filtered = search
    ? deals.filter(
        (d) =>
          (d.deal_name || "").toLowerCase().includes(search.toLowerCase()) ||
          (d.company || "").toLowerCase().includes(search.toLowerCase())
      )
    : deals;

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
        {risk} Risk
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="text-gray-400 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Deal Archive</h1>
              <p className="text-sm text-gray-500">{deals.length} deals analyzed</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/analyze")}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            + New Analysis
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
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
        </div>

        {/* Deals Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading deals...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">{deals.length === 0 ? "No deals yet" : "No matching deals"}</p>
            {deals.length === 0 && (
              <button
                onClick={() => router.push("/analyze")}
                className="text-gray-900 font-medium hover:underline text-sm"
              >
                Analyze your first call &rarr;
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((deal) => (
              <div
                key={deal.id}
                onClick={() => {
                  sessionStorage.setItem("deal_view", JSON.stringify(deal));
                  router.push(`/deals/${deal.id}`);
                }}
                className="bg-white rounded-xl border shadow-sm p-5 text-left hover:border-gray-300 hover:shadow-md transition-all group cursor-pointer relative"
              >
                <button
                  onClick={(e) => handleDelete(e, deal.id)}
                  className="absolute top-3 right-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  title="Delete deal"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <div className="flex items-start justify-between mb-3 pr-6">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-gray-700">
                      {deal.deal_name || "Untitled Deal"}
                    </h3>
                    {deal.company && (
                      <p className="text-sm text-gray-500 truncate">{deal.company}</p>
                    )}
                  </div>
                  {riskBadge(deal.risk_assessment)}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-400">Call Score</p>
                    <p className={`text-lg font-bold ${scoreColor(deal.call_score)}`}>
                      {deal.call_score ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">MEDPICC</p>
                    <p className={`text-lg font-bold ${scoreColor(deal.medpicc_score)}`}>
                      {deal.medpicc_score != null ? `${Math.round(deal.medpicc_score)}%` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Win Prob</p>
                    <p className={`text-lg font-bold ${scoreColor(deal.deal_probability)}`}>
                      {deal.deal_probability != null ? `${Math.round(deal.deal_probability)}%` : "—"}
                    </p>
                  </div>
                </div>

                {deal.created_at && (
                  <p className="text-xs text-gray-400">
                    {new Date(deal.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
