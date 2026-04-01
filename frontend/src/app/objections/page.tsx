"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Deal, listDeals, runAgentApi } from "@/lib/api";

interface Objection {
  objection: string;
  real_concern?: string;
  script: string;
  trap_question?: string;
  wrong_response?: string;
  right_response?: string;
}

interface ObjectionData {
  deal_specific: Objection[];
  common: Objection[];
}

export default function ObjectionsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<string>("");
  const [data, setData] = useState<ObjectionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<string | null>(null);
  const [mode, setMode] = useState<"overall" | "deal">("overall");

  useEffect(() => { listDeals().then(setDeals).catch(() => {}); }, []);

  // Auto-generate overall on mount
  useEffect(() => { generateOverall(); }, []);

  async function generateOverall() {
    setLoading(true); setData(null); setMode("overall");
    try {
      // Use global intelligence context for overall objections
      const res = await runAgentApi({ recipe: "objection_handler", model: "fast" });
      if (res.result.parsed) setData(res.result.parsed as unknown as ObjectionData);
    } catch {} finally { setLoading(false); }
  }

  async function generateForDeal() {
    if (!selectedDeal) return;
    setLoading(true); setData(null); setMode("deal");
    try {
      const res = await runAgentApi({ recipe: "objection_handler", deal_id: selectedDeal, model: "fast" });
      if (res.result.parsed) setData(res.result.parsed as unknown as ObjectionData);
    } catch {} finally { setLoading(false); }
  }

  const allObjections = [
    ...(data?.deal_specific || []).map((o) => ({ ...o, type: "specific" as const })),
    ...(data?.common || []).map((o) => ({ ...o, type: "common" as const })),
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/sales")} className="text-gray-300 hover:text-gray-900">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-gray-900 text-sm font-semibold">Objection Handling</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Toggle: Overall vs Per-Deal */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={generateOverall}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              mode === "overall" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            Overall
          </button>
          <div className="flex items-center gap-2">
            <select
              value={selectedDeal}
              onChange={(e) => setSelectedDeal(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <option value="">Per deal...</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>{d.deal_name}</option>
              ))}
            </select>
            {selectedDeal && (
              <button
                onClick={generateForDeal}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-30"
              >
                Generate
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Generating objection playbook...</p>
          </div>
        )}

        {/* Results */}
        {!loading && allObjections.length > 0 && (
          <div className="space-y-2">
            {allObjections.map((obj, i) => {
              const key = `${obj.type}-${i}`;
              const open = expandedIdx === key;
              return (
                <div key={key}>
                  <button
                    onClick={() => setExpandedIdx(open ? null : key)}
                    className={`w-full text-left px-5 py-4 rounded-xl flex items-center justify-between transition-colors ${
                      open ? "bg-gray-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900 pr-4">&ldquo;{obj.objection}&rdquo;</p>
                    <svg className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {open && (
                    <div className="px-5 pb-4 space-y-3">
                      {obj.real_concern && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Real concern</p>
                          <p className="text-sm text-gray-600">{obj.real_concern}</p>
                        </div>
                      )}
                      {obj.wrong_response && (
                        <div>
                          <p className="text-xs font-semibold text-red-400 uppercase mb-1">Don&apos;t say</p>
                          <p className="text-sm text-gray-400 line-through">{obj.wrong_response}</p>
                        </div>
                      )}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs font-semibold text-green-600 uppercase mb-1">Say this</p>
                        <p className="text-sm text-gray-900">&ldquo;{obj.right_response || obj.script}&rdquo;</p>
                      </div>
                      {obj.trap_question && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Follow up with</p>
                          <p className="text-sm text-gray-700">&ldquo;{obj.trap_question}&rdquo;</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && !data && !loading && (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-300">Generating your playbook...</p>
          </div>
        )}
      </main>
    </div>
  );
}
