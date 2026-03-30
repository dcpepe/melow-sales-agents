"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDeal, getDealAnalyses, Deal, CallAnalysisDetail } from "@/lib/api";
import ActionPlanTab from "@/components/ActionPlanTab";
import DealRoomTab from "@/components/DealRoomTab";
import ChatSidebar from "@/components/ChatSidebar";
import DealHeader from "@/components/DealHeader";
import MeetingPrepTab from "@/components/MeetingPrepTab";
import AgentRunner from "@/components/AgentRunner";

type Tab = "overview" | "calls" | "prep" | "actions" | "dealroom";

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

export default function DealIntelligencePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [analyses, setAnalyses] = useState<CallAnalysisDetail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    getDeal(id)
      .then(setDeal)
      .catch(() => setError("Deal not found"));
    getDealAnalyses(id)
      .then(setAnalyses)
      .catch(() => {});
  }, [id]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "calls", label: `Calls (${analyses.length})` },
    { key: "prep", label: "Meeting Prep" },
    { key: "actions", label: "Action Plan" },
    { key: "dealroom", label: "Deal Room" },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={() => router.push("/deals")} className="text-gray-900 font-medium hover:underline text-sm">
            Back to deals &rarr;
          </button>
        </div>
      </div>
    );
  }

  if (!deal) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>;
  }

  // MEDPICC progression data from analyses (oldest to newest)
  const sortedAnalyses = [...analyses].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Aggregate open questions from all calls
  const allOpenQuestions = analyses.flatMap((a) =>
    (a.call_analysis?.open_questions || []).map((q) => ({
      question: q,
      date: a.created_at,
    }))
  );

  function scoreColor(score: number | null) {
    if (score === null) return "text-gray-400";
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center gap-4 mb-3">
            <button onClick={() => router.push("/deals")} className="text-gray-400 hover:text-gray-900 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <DealHeader deal={deal} onUpdate={setDeal} />
            </div>
            <button
              onClick={() => router.push(`/analyze`)}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 flex-shrink-0"
            >
              + Add Call
            </button>
          </div>

          {/* Stats bar */}
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-gray-400">Call Score</p>
              <p className={`text-xl font-bold ${scoreColor(deal.latest_call_score)}`}>{deal.latest_call_score ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">MEDPICC</p>
              <p className={`text-xl font-bold ${scoreColor(deal.latest_medpicc_score)}`}>{deal.latest_medpicc_score != null ? `${Math.round(deal.latest_medpicc_score)}%` : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Win Prob</p>
              <p className={`text-xl font-bold ${scoreColor(deal.latest_deal_probability)}`}>{deal.latest_deal_probability != null ? `${Math.round(deal.latest_deal_probability)}%` : "—"}</p>
            </div>
            {deal.latest_risk_assessment && (
              <div>
                <p className="text-xs text-gray-400">Risk</p>
                <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  deal.latest_risk_assessment === "High" ? "bg-red-50 text-red-700" :
                  deal.latest_risk_assessment === "Medium" ? "bg-yellow-50 text-yellow-700" :
                  "bg-green-50 text-green-700"
                }`}>{deal.latest_risk_assessment}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* MEDPICC Current State */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Current MEDPICC State</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(MEDPICC_LABELS).map(([key, label]) => {
                  const score = deal.latest_medpicc_categories?.[key] ?? 0;
                  const bg = score >= 4 ? "bg-green-500" : score >= 2 ? "bg-yellow-400" : "bg-red-500";
                  return (
                    <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center text-white font-bold text-lg mx-auto mb-2`}>
                        {score}
                      </div>
                      <p className="text-xs text-gray-600">{label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MEDPICC Progression */}
            {sortedAnalyses.length > 1 && (
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">MEDPICC Progression</h3>
                <div className="space-y-3">
                  {Object.entries(MEDPICC_LABELS).map(([key, label]) => {
                    const scores = sortedAnalyses.map((a) => {
                      const medpicc = a.medpicc as unknown as Record<string, unknown>;
                      const cat = medpicc?.[key] as Record<string, unknown> | undefined;
                      return (cat?.score as number) ?? 0;
                    });
                    const first = scores[0];
                    const last = scores[scores.length - 1];
                    const trend = last - first;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-32">{label}</span>
                        <div className="flex gap-1 flex-1">
                          {scores.map((s, i) => (
                            <div
                              key={i}
                              className={`h-6 flex-1 rounded ${
                                s >= 4 ? "bg-green-500" : s >= 2 ? "bg-yellow-400" : "bg-red-500"
                              } flex items-center justify-center`}
                            >
                              <span className="text-[10px] text-white font-bold">{s}</span>
                            </div>
                          ))}
                        </div>
                        <span className={`text-sm font-semibold w-10 text-right ${
                          trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-400"
                        }`}>
                          {trend > 0 ? `+${trend}` : trend === 0 ? "—" : trend}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-3">Each block = one call, left to right = oldest to newest</p>
              </div>
            )}

            {/* Score Trend */}
            {sortedAnalyses.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border p-5">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Call Score Trend</h4>
                  <div className="flex items-end gap-2 h-24">
                    {sortedAnalyses.map((a, i) => {
                      const score = (a.call_analysis as unknown as Record<string, unknown>)?.call_score as number || 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs font-bold text-gray-700">{score}</span>
                          <div
                            className={`w-full rounded-t ${score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-400" : "bg-red-500"}`}
                            style={{ height: `${Math.max(score, 5)}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-white rounded-xl border p-5">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Deal Probability Trend</h4>
                  <div className="flex items-end gap-2 h-24">
                    {sortedAnalyses.map((a, i) => {
                      const prob = (a.medpicc as unknown as Record<string, unknown>)?.deal_probability as number || 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs font-bold text-gray-700">{Math.round(prob)}%</span>
                          <div
                            className={`w-full rounded-t ${prob >= 60 ? "bg-green-500" : prob >= 30 ? "bg-yellow-400" : "bg-red-500"}`}
                            style={{ height: `${Math.max(prob, 5)}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Open Questions */}
            {allOpenQuestions.length > 0 && (
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold text-gray-900 mb-3">What We Still Don&apos;t Know</h3>
                <ul className="space-y-2">
                  {allOpenQuestions.slice(0, 10).map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-red-400 flex-shrink-0 mt-0.5">?</span>
                      <span className="text-gray-700">{item.question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Agent Actions */}
            {analyses.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Run Agents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <AgentRunner
                    dealId={id}
                    recipe="deal_assistant"
                    title="Deal Health Check"
                    icon="🏥"
                    description="Analyze health, risks, and next actions"
                    renderParsed={(p) => (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            p.health === "strong" ? "bg-green-100 text-green-800" :
                            p.health === "at_risk" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }`}>{(p.health as string || "").toUpperCase()}</span>
                          <span className="text-2xl font-bold text-gray-900">{p.score as number}/100</span>
                        </div>
                        <p className="text-sm text-gray-700">{p.health_summary as string}</p>
                        {(p.risks as { risk: string; severity: string; mitigation: string }[])?.map((r, i) => (
                          <div key={i} className={`p-3 rounded-lg border-l-4 ${r.severity === "high" ? "border-l-red-500 bg-red-50" : r.severity === "medium" ? "border-l-yellow-500 bg-yellow-50" : "border-l-gray-300 bg-gray-50"}`}>
                            <p className="text-sm font-medium text-gray-900">{r.risk}</p>
                            <p className="text-xs text-gray-500 mt-1">{r.mitigation}</p>
                          </div>
                        ))}
                        {(p.next_actions as { action: string; timing: string }[])?.map((a, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className="bg-green-100 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                            <div>
                              <p className="text-gray-900 font-medium">{a.action}</p>
                              <p className="text-xs text-gray-500">{a.timing}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                  <AgentRunner
                    dealId={id}
                    recipe="frank_deal"
                    title="Run Frank"
                    icon="😎"
                    description="Frank's deal-specific coaching"
                    saveVersion
                  />
                  <AgentRunner
                    dealId={id}
                    recipe="followup_email"
                    title="Follow-Up Email"
                    icon="✉️"
                    description="Generate a ready-to-send follow-up"
                    renderParsed={(p) => (
                      <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-xs font-medium text-gray-500 mb-1">Subject</p>
                          <p className="text-sm font-semibold text-gray-900">{p.subject as string}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-xs font-medium text-gray-500 mb-1">To: {p.to as string}</p>
                          <p className="text-sm text-gray-700 whitespace-pre-line">{p.body as string}</p>
                        </div>
                        <p className="text-xs text-gray-400 italic">{p.why_this_works as string}</p>
                        <button
                          onClick={() => navigator.clipboard.writeText(`Subject: ${p.subject}\n\n${p.body}`)}
                          className="text-xs text-gray-600 font-medium hover:text-gray-900"
                        >
                          Copy email
                        </button>
                      </div>
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Calls Tab */}
        {activeTab === "calls" && (
          <div className="space-y-3">
            {analyses.length === 0 ? (
              <div className="bg-white rounded-xl border p-8 text-center">
                <p className="text-gray-400 mb-4">No calls analyzed yet</p>
                <button
                  onClick={() => router.push("/analyze")}
                  className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800"
                >
                  Add a Call
                </button>
              </div>
            ) : (
              analyses.map((call) => {
                const cs = call.call_analysis as unknown as Record<string, unknown>;
                const mp = call.medpicc as unknown as Record<string, unknown>;
                return (
                  <button
                    key={call.id}
                    onClick={() => router.push(`/deals/${id}/calls/${call.id}`)}
                    className="w-full bg-white rounded-xl border p-5 text-left hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">
                          {new Date(call.created_at).toLocaleDateString(undefined, {
                            weekday: "short", year: "numeric", month: "short", day: "numeric",
                          })}
                        </p>
                        {call.participants && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-md">{call.participants}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className={`font-bold ${scoreColor(cs?.call_score as number)}`}>
                            {(cs?.call_score as number) ?? "—"}
                          </p>
                          <p className="text-[10px] text-gray-400">Call</p>
                        </div>
                        <div className="text-center">
                          <p className={`font-bold ${scoreColor(mp?.overall_score as number)}`}>
                            {mp?.overall_score != null ? `${Math.round(mp.overall_score as number)}%` : "—"}
                          </p>
                          <p className="text-[10px] text-gray-400">MEDPICC</p>
                        </div>
                        <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Meeting Prep */}
        {activeTab === "prep" && analyses.length > 0 && (
          <MeetingPrepTab dealId={id} />
        )}

        {/* Action Plan & Deal Room */}
        {activeTab === "actions" && analyses.length > 0 && (
          <ActionPlanTab dealId={id} />
        )}
        {activeTab === "dealroom" && analyses.length > 0 && (
          <DealRoomTab dealId={id} />
        )}

        <ChatSidebar dealId={id} />
      </main>
    </div>
  );
}
