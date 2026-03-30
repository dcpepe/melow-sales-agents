"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FrankAvatar from "@/components/FrankAvatar";
import FrankChat from "@/components/FrankChat";

interface CoachingData {
  overall_grade: string;
  headline: string;
  score_breakdown: Record<string, number>;
  stop_doing: { behavior: string; evidence: string; impact: string }[];
  start_doing: { behavior: string; how: string; example_script: string }[];
  double_down: { strength: string; evidence: string; amplify: string }[];
  deal_specific: { deal_name: string; verdict: string; one_thing: string }[];
  this_week: string[];
  generated_at: string;
  deal_count: number;
}

const SCORE_LABELS: Record<string, string> = {
  discovery: "Discovery",
  pain_identification: "Pain ID",
  business_impact: "Business Impact",
  stakeholder_mapping: "Stakeholders",
  urgency_creation: "Urgency",
  demo_execution: "Demo",
  next_steps: "Next Steps",
};

export default function CoachingPage() {
  const router = useRouter();
  const [data, setData] = useState<CoachingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [noDeals, setNoDeals] = useState(false);

  useEffect(() => {
    fetch("/api/coaching", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "full" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.no_deals) setNoDeals(true);
        else if (d.overall_grade) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function regenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "full", force_regenerate: true }),
      });
      const d = await res.json();
      if (d.overall_grade) setData(d);
    } catch {}
    setLoading(false);
  }

  function scoreColor(s: number) {
    if (s >= 70) return "bg-green-500";
    if (s >= 50) return "bg-yellow-400";
    return "bg-red-500";
  }

  function gradeColor(g: string) {
    if (g === "A") return "text-green-600 bg-green-50 border-green-200";
    if (g === "B") return "text-blue-600 bg-blue-50 border-blue-200";
    if (g === "C") return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FrankAvatar size="lg" />
          <p className="mt-4 text-sm font-medium text-gray-900">Frank is reviewing your pipeline...</p>
          <p className="text-xs text-gray-400 mt-1">This takes a moment</p>
        </div>
      </div>
    );
  }

  if (noDeals) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FrankAvatar size="lg" />
          <p className="mt-4 text-gray-500">No deals to coach on yet.</p>
          <button onClick={() => router.push("/analyze")} className="mt-3 text-sm font-medium text-gray-900 hover:underline">
            Add your first deal &rarr;
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <FrankAvatar size="md" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Frank&apos;s Room</h1>
              <p className="text-sm text-gray-500">Based on {data.deal_count} deals in your pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={regenerate}
              className="text-sm text-gray-500 hover:text-gray-900 font-medium"
            >
              Refresh
            </button>
            <button
              onClick={() => setChatOpen(true)}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat with Frank
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Grade + Headline */}
        <div className="bg-white rounded-xl border p-6 flex items-center gap-6">
          <div className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center text-4xl font-black ${gradeColor(data.overall_grade)}`}>
            {data.overall_grade}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{data.headline}</p>
            {data.generated_at && (
              <p className="text-xs text-gray-400 mt-1">Last reviewed {new Date(data.generated_at).toLocaleDateString()}</p>
            )}
          </div>
        </div>

        {/* Skill Breakdown */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Skill Breakdown</h2>
          <div className="space-y-3">
            {Object.entries(data.score_breakdown || {}).map(([key, score]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-28">{SCORE_LABELS[key] || key}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${scoreColor(score)}`} style={{ width: `${score}%` }} />
                </div>
                <span className="text-sm font-bold text-gray-900 w-8 text-right">{score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Three columns: Stop / Start / Double Down */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* STOP */}
          <div className="bg-white rounded-xl border border-l-4 border-l-red-500 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h3 className="font-bold text-red-700 text-sm uppercase tracking-wider">Stop Doing</h3>
            </div>
            <div className="space-y-4">
              {(data.stop_doing || []).map((item, i) => (
                <div key={i}>
                  <p className="text-sm font-semibold text-gray-900">{item.behavior}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.evidence}</p>
                  <p className="text-xs text-red-600 mt-0.5">{item.impact}</p>
                </div>
              ))}
            </div>
          </div>

          {/* START */}
          <div className="bg-white rounded-xl border border-l-4 border-l-green-500 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="font-bold text-green-700 text-sm uppercase tracking-wider">Start Doing</h3>
            </div>
            <div className="space-y-4">
              {(data.start_doing || []).map((item, i) => (
                <div key={i}>
                  <p className="text-sm font-semibold text-gray-900">{item.behavior}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.how}</p>
                  <div className="mt-1.5 bg-green-50 rounded-md px-3 py-2 border border-green-100">
                    <p className="text-xs text-green-800 italic">&ldquo;{item.example_script}&rdquo;</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DOUBLE DOWN */}
          <div className="bg-white rounded-xl border border-l-4 border-l-blue-500 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="font-bold text-blue-700 text-sm uppercase tracking-wider">Double Down</h3>
            </div>
            <div className="space-y-4">
              {(data.double_down || []).map((item, i) => (
                <div key={i}>
                  <p className="text-sm font-semibold text-gray-900">{item.strength}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.evidence}</p>
                  <p className="text-xs text-blue-600 mt-0.5">{item.amplify}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Deal-Specific Verdicts */}
        {data.deal_specific && data.deal_specific.length > 0 && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Deal Verdicts</h2>
            <div className="space-y-3">
              {data.deal_specific.map((deal, i) => (
                <div key={i} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{deal.deal_name}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{deal.verdict}</p>
                  </div>
                  <div className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium max-w-[200px] text-center">
                    {deal.one_thing}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* This Week */}
        {data.this_week && data.this_week.length > 0 && (
          <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-xl p-6 text-white">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              This Week&apos;s Focus
            </h2>
            <div className="space-y-3">
              {data.this_week.map((action, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm leading-relaxed opacity-90">{action}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {chatOpen && <FrankChat onClose={() => setChatOpen(false)} />}
    </div>
  );
}
