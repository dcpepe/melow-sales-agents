"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Deal, listDeals, runAgentApi } from "@/lib/api";
import { Suspense } from "react";

interface EmailVariant {
  strategy_label: string;
  tradeoff: string;
  subject: string;
  body: string;
}

interface GapPriority {
  field: string;
  why: string;
  how: string;
}

interface FollowUpData {
  deal_state: string;
  days_since_last_touch: number | null;
  assessment: Record<string, string>;
  key_risks: string[];
  recommended_next_move: string;
  gap_priority: GapPriority[];
  email_variants: EmailVariant[];
}

const MEDDPICC_LABELS: Record<string, string> = {
  metrics: "Metrics",
  economic_buyer: "Economic Buyer",
  decision_process: "Decision Process",
  decision_criteria: "Decision Criteria",
  identified_pain: "Identified Pain",
  champion: "Champion",
  paper_process: "Paper Process",
  competition: "Competition",
};

function FollowUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState(searchParams.get("deal_id") || "");
  const [data, setData] = useState<FollowUpData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [expandedField, setExpandedField] = useState<string | null>(null);

  useEffect(() => { listDeals().then(setDeals).catch(() => {}); }, []);

  async function generate() {
    if (!selectedDeal) return;
    setLoading(true); setError(null); setData(null);
    try {
      const res = await runAgentApi({
        recipe: "meddpicc_followup",
        deal_id: selectedDeal,
        model: "fast",
        save_version: true,
      });
      if (res.result.parsed) setData(res.result.parsed as unknown as FollowUpData);
      else setError("Failed to parse response");
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }

  function copyEmail(idx: number, variant: EmailVariant) {
    navigator.clipboard.writeText(`Subject: ${variant.subject}\n\n${variant.body}`);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  const stateColor: Record<string, string> = {
    warm: "bg-green-50 text-green-700",
    cooling: "bg-yellow-50 text-yellow-700",
    cold: "bg-red-50 text-red-700",
    post_meeting: "bg-blue-50 text-blue-700",
  };

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
            <span className="text-gray-900 text-sm font-semibold">MEDDPICC Follow-Up</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Deal picker */}
        <div className="flex items-end gap-3 mb-8">
          <div className="flex-1">
            <select
              value={selectedDeal}
              onChange={(e) => { setSelectedDeal(e.target.value); setData(null); }}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <option value="">Select a deal...</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>{d.deal_name} ({d.company})</option>
              ))}
            </select>
          </div>
          <button
            onClick={generate}
            disabled={loading || !selectedDeal}
            className="px-6 py-3 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-20 transition-colors"
          >
            {loading ? "Analyzing..." : "Generate"}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Deep-reading transcripts and building strategy...</p>
            <p className="text-xs text-gray-300 mt-1">This takes 30-60 seconds</p>
          </div>
        )}

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        {data && (
          <div className="space-y-8">
            {/* Deal state + next move */}
            <div className="flex items-start justify-between">
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${stateColor[data.deal_state] || "bg-gray-50 text-gray-600"}`}>
                  {data.deal_state.replace("_", " ")}
                </span>
                {data.days_since_last_touch != null && (
                  <span className="text-xs text-gray-400 ml-2">{data.days_since_last_touch} days since last touch</span>
                )}
              </div>
            </div>

            {/* Recommended next move */}
            <div className="bg-gray-50 rounded-xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recommended Next Move</p>
              <p className="text-sm text-gray-900 font-medium">{data.recommended_next_move}</p>
            </div>

            {/* Gap priorities */}
            {data.gap_priority && data.gap_priority.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Priority Gaps to Close</p>
                <div className="space-y-2">
                  {data.gap_priority.map((gap, i) => (
                    <div key={i} className="bg-red-50 rounded-xl p-4">
                      <p className="text-sm font-medium text-red-900">{gap.field}</p>
                      <p className="text-xs text-red-700 mt-1">{gap.why}</p>
                      <p className="text-xs text-red-600 mt-1 font-medium">{gap.how}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MEDDPICC Assessment */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">MEDDPICC Assessment</p>
              <div className="space-y-0.5">
                {Object.entries(data.assessment).map(([key, text]) => (
                  <div key={key}>
                    <button
                      onClick={() => setExpandedField(expandedField === key ? null : key)}
                      className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-colors ${expandedField === key ? "bg-gray-50" : "hover:bg-gray-50"}`}
                    >
                      <span className="text-sm font-medium text-gray-900">{MEDDPICC_LABELS[key] || key}</span>
                      <svg className={`w-4 h-4 text-gray-300 transition-transform ${expandedField === key ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedField === key && (
                      <div className="px-4 pb-3">
                        <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Key Risks */}
            {data.key_risks && data.key_risks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Key Risks</p>
                <div className="space-y-2">
                  {data.key_risks.map((risk, i) => (
                    <p key={i} className="text-sm text-gray-700">{risk}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Email Variants */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Email Variants</p>
              <div className="space-y-4">
                {data.email_variants?.map((variant, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{variant.strategy_label}</p>
                        <p className="text-xs text-gray-400">{variant.tradeoff}</p>
                      </div>
                      <button
                        onClick={() => copyEmail(i, variant)}
                        className="text-xs text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
                      >
                        {copiedIdx === i ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="px-5 py-4">
                      <p className="text-xs text-gray-400 mb-2">Subject: <span className="text-gray-700 font-medium">{variant.subject}</span></p>
                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{variant.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function FollowUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <FollowUpContent />
    </Suspense>
  );
}
