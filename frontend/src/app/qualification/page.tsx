"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Deal, listDeals, runAgentApi } from "@/lib/api";

interface QualQuestion {
  question: string;
  insight: string;
  priority: number;
}

interface QualCategory {
  letter: string;
  name: string;
  current_score: number;
  known: string[];
  gaps: string[];
  questions: QualQuestion[];
}

interface QualData {
  categories: QualCategory[];
  killer_questions: { question: string; why: string }[];
  disqualification_signals: { signal: string; meaning: string }[];
}

export default function QualificationPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<string>("");
  const [data, setData] = useState<QualData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  useEffect(() => {
    listDeals().then(setDeals).catch(() => {});
  }, []);

  async function generate() {
    if (!selectedDeal) return;
    setLoading(true);
    try {
      const res = await runAgentApi({ recipe: "qualification_sheet", deal_id: selectedDeal, model: "fast" });
      if (res.result.parsed) setData(res.result.parsed as unknown as QualData);
    } catch {}
    setLoading(false);
  }

  function scoreColor(s: number) {
    if (s >= 4) return "bg-green-500";
    if (s >= 2) return "bg-yellow-400";
    return "bg-red-500";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-4">
          <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-900">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📝 Qualification Cheat Sheet</h1>
            <p className="text-sm text-gray-500">MEDPICC questions organized by category</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Deal picker */}
        <div className="bg-white rounded-xl border p-5 mb-6 flex items-end gap-4">
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Select a deal</label>
            <select
              value={selectedDeal}
              onChange={(e) => { setSelectedDeal(e.target.value); setData(null); }}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">Choose a deal...</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>{d.deal_name} ({d.company})</option>
              ))}
            </select>
          </div>
          <button
            onClick={generate}
            disabled={loading || !selectedDeal}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-30"
          >
            {loading ? "Generating..." : "Generate Cheat Sheet"}
          </button>
        </div>

        {loading && (
          <div className="bg-white rounded-xl border p-12 text-center">
            <div className="text-4xl mb-4 animate-bounce">📝</div>
            <p className="text-sm font-medium text-gray-900">Building qualification cheat sheet...</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Killer Questions */}
            {data.killer_questions?.length > 0 && (
              <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-xl p-6 text-white">
                <h2 className="font-bold mb-4 flex items-center gap-2">
                  <span>🎯</span> Killer Questions
                </h2>
                <div className="space-y-3">
                  {data.killer_questions.map((q, i) => (
                    <div key={i} className="bg-white/10 rounded-lg p-4">
                      <p className="text-sm font-medium">&ldquo;{q.question}&rdquo;</p>
                      <p className="text-xs text-gray-300 mt-1">{q.why}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MEDPICC Categories */}
            <div className="space-y-3">
              {data.categories?.map((cat) => {
                const open = expandedCat === cat.letter + cat.name;
                return (
                  <div key={cat.letter + cat.name} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <button
                      onClick={() => setExpandedCat(open ? null : cat.letter + cat.name)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${scoreColor(cat.current_score)} rounded-lg flex items-center justify-center text-white text-sm font-bold`}>
                          {cat.letter}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                          <p className="text-xs text-gray-500">Score: {cat.current_score}/5 · {cat.gaps?.length || 0} gaps · {cat.questions?.length || 0} questions</p>
                        </div>
                      </div>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {open && (
                      <div className="px-5 pb-5 border-t pt-4 space-y-4">
                        {/* Known */}
                        {cat.known?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1.5">What We Know</p>
                            <ul className="space-y-1">
                              {cat.known.map((k, i) => (
                                <li key={i} className="text-sm text-gray-700 flex gap-2">
                                  <span className="text-green-500 flex-shrink-0">✓</span>{k}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Gaps */}
                        {cat.gaps?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1.5">Gaps</p>
                            <ul className="space-y-1">
                              {cat.gaps.map((g, i) => (
                                <li key={i} className="text-sm text-gray-700 flex gap-2">
                                  <span className="text-red-500 flex-shrink-0">!</span>{g}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Questions */}
                        <div>
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Questions to Ask</p>
                          <div className="space-y-2">
                            {cat.questions?.sort((a, b) => a.priority - b.priority).map((q, i) => (
                              <div key={i} className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                <div className="flex items-start gap-2">
                                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                                    {q.priority}
                                  </span>
                                  <div>
                                    <p className="text-sm font-medium text-blue-900">&ldquo;{q.question}&rdquo;</p>
                                    <p className="text-xs text-blue-700 mt-0.5">{q.insight}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Disqualification Signals */}
            {data.disqualification_signals?.length > 0 && (
              <div className="bg-red-50 rounded-xl border border-red-200 p-5">
                <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                  <span>⚠️</span> Disqualification Signals
                </h3>
                <div className="space-y-2">
                  {data.disqualification_signals.map((s, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-red-500 flex-shrink-0 mt-0.5">🚩</span>
                      <div>
                        <p className="text-sm font-medium text-red-900">{s.signal}</p>
                        <p className="text-xs text-red-700">{s.meaning}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
