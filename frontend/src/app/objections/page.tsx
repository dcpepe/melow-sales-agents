"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Deal, listDeals, runAgentApi } from "@/lib/api";

interface Objection {
  objection: string;
  real_concern?: string;
  response_framework?: string;
  script: string;
  trap_question?: string;
  wrong_response?: string;
  right_response?: string;
  when_to_use?: string;
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

  useEffect(() => {
    listDeals().then(setDeals).catch(() => {});
  }, []);

  async function generate() {
    if (!selectedDeal) return;
    setLoading(true);
    try {
      const res = await runAgentApi({ recipe: "objection_handler", deal_id: selectedDeal, model: "fast" });
      if (res.result.parsed) setData(res.result.parsed as unknown as ObjectionData);
    } catch {}
    setLoading(false);
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
            <h1 className="text-2xl font-bold text-gray-900">🛡️ Objection Handling</h1>
            <p className="text-sm text-gray-500">Scripts and frameworks for every objection</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Deal picker + generate */}
        <div className="bg-white rounded-xl border p-5 mb-6 flex items-end gap-4">
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Select a deal for tailored objections</label>
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
            {loading ? "Generating..." : "Generate Playbook"}
          </button>
        </div>

        {loading && (
          <div className="bg-white rounded-xl border p-12 text-center">
            <div className="text-4xl mb-4 animate-bounce">🛡️</div>
            <p className="text-sm font-medium text-gray-900">Building objection playbook...</p>
          </div>
        )}

        {data && (
          <div className="space-y-8">
            {/* Deal-Specific */}
            {data.deal_specific?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Deal-Specific Objections</h2>
                <div className="space-y-3">
                  {data.deal_specific.map((obj, i) => {
                    const key = `specific-${i}`;
                    const open = expandedIdx === key;
                    return (
                      <div key={i} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <button
                          onClick={() => setExpandedIdx(open ? null : key)}
                          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-red-500 text-lg">❌</span>
                            <p className="text-sm font-medium text-gray-900">&ldquo;{obj.objection}&rdquo;</p>
                          </div>
                          <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {open && (
                          <div className="px-5 pb-5 space-y-3 border-t pt-4">
                            {obj.real_concern && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Real Concern</p>
                                <p className="text-sm text-gray-700">{obj.real_concern}</p>
                              </div>
                            )}
                            {obj.response_framework && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Framework</p>
                                <p className="text-sm text-gray-700">{obj.response_framework}</p>
                              </div>
                            )}
                            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                              <p className="text-xs font-semibold text-green-700 uppercase mb-1">Script</p>
                              <p className="text-sm text-green-900 italic">&ldquo;{obj.script}&rdquo;</p>
                            </div>
                            {obj.trap_question && (
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Trap Question</p>
                                <p className="text-sm text-blue-900">&ldquo;{obj.trap_question}&rdquo;</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Common */}
            {data.common?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Common Objections</h2>
                <div className="space-y-3">
                  {data.common.map((obj, i) => {
                    const key = `common-${i}`;
                    const open = expandedIdx === key;
                    return (
                      <div key={i} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <button
                          onClick={() => setExpandedIdx(open ? null : key)}
                          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50"
                        >
                          <p className="text-sm font-medium text-gray-900">&ldquo;{obj.objection}&rdquo;</p>
                          <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {open && (
                          <div className="px-5 pb-5 space-y-3 border-t pt-4">
                            {obj.wrong_response && (
                              <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                                <p className="text-xs font-semibold text-red-600 uppercase mb-1">Don&apos;t Say</p>
                                <p className="text-sm text-red-800 line-through">&ldquo;{obj.wrong_response}&rdquo;</p>
                              </div>
                            )}
                            {obj.right_response && (
                              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                                <p className="text-xs font-semibold text-green-700 uppercase mb-1">Say This</p>
                                <p className="text-sm text-green-900 italic">&ldquo;{obj.right_response}&rdquo;</p>
                              </div>
                            )}
                            {obj.when_to_use && (
                              <p className="text-xs text-gray-500"><span className="font-medium">When:</span> {obj.when_to_use}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
