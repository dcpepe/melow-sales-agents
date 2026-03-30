"use client";

import { useState } from "react";
import { getActionPlan, ActionPlan } from "@/lib/api";

const DEMON_TIPS = [
  "Identifying MEDPICC gaps...",
  "Crafting attack scripts...",
  "Mapping power players...",
  "Calculating kill shots...",
  "Building war plan...",
  "Weaponizing intel...",
  "Finding the jugular...",
  "Loading deal ammo...",
];

function DemonLoader() {
  const [tipIdx, setTipIdx] = useState(0);

  useState(() => {
    const interval = setInterval(() => setTipIdx((i) => (i + 1) % DEMON_TIPS.length), 2000);
    return () => clearInterval(interval);
  });

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center overflow-hidden">
      {/* Animated background pulse */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-radial from-red-900/30 via-transparent to-transparent animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-red-600/10 animate-ping" style={{ animationDuration: "3s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-red-600/15 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.5s" }} />
      </div>

      {/* Floating emojis */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-float pointer-events-none select-none text-2xl"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
            opacity: 0.4,
          }}
        >
          {["😈", "🔥", "⚔️", "🎯", "💥", "⚡"][i % 6]}
        </div>
      ))}

      {/* Center content */}
      <div className="relative z-10 text-center">
        <div className="text-8xl mb-6 animate-bounce" style={{ animationDuration: "1.5s" }}>
          😈
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Summoning Sales Demon</h2>
        <div className="bg-red-900/50 backdrop-blur-sm border border-red-800 px-6 py-3 rounded-xl inline-block">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
            </div>
            <p className="text-red-200 text-sm font-medium">{DEMON_TIPS[tipIdx]}</p>
          </div>
        </div>
        <p className="mt-4 text-red-400/60 text-xs">No mercy. No fluff. Just results.</p>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(5deg); }
          75% { transform: translateY(20px) rotate(-5deg); }
        }
        .animate-float { animation: float ease-in-out infinite; }
      `}</style>
    </div>
  );
}

export default function ActionPlanTab({ analysisId, dealId }: { analysisId?: string; dealId?: string }) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const result = await getActionPlan({ dealId, analysisId });
      setPlan(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate action plan");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <DemonLoader />;

  if (!plan) {
    return (
      <div className="bg-gradient-to-br from-red-950 to-gray-900 rounded-xl p-10 text-center relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 36px)",
          }} />
        </div>
        <div className="relative z-10">
          <div className="text-6xl mb-4">😈</div>
          <h3 className="text-2xl font-bold text-white mb-3">Sales Demon Mode</h3>
          <p className="text-red-200 text-sm mb-8 max-w-lg mx-auto leading-relaxed">
            Generate a ruthless, no-BS action plan that closes every MEDPICC gap.
            Exact scripts to say, specific people to target, aggressive timelines.
          </p>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button
            onClick={handleGenerate}
            className="bg-red-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-red-500 transition-all hover:scale-105 shadow-lg shadow-red-900/50"
          >
            Activate Sales Demon
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Deal Killer + Power Move */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-950 rounded-xl p-5 border border-red-900">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🚨</span>
            <h3 className="font-bold text-red-400 text-sm uppercase tracking-wider">Deal Killer</h3>
          </div>
          <p className="text-white text-sm leading-relaxed">{plan.deal_killer}</p>
        </div>
        <div className="bg-emerald-950 rounded-xl p-5 border border-emerald-900">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⚡</span>
            <h3 className="font-bold text-emerald-400 text-sm uppercase tracking-wider">Power Move</h3>
          </div>
          <p className="text-white text-sm leading-relaxed">{plan.power_move}</p>
        </div>
      </div>

      {/* Gap Action Cards */}
      {plan.gaps.map((gap, i) => (
        <div key={i} className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold text-white ${
                gap.score <= 1 ? "bg-red-600" : gap.score <= 2 ? "bg-orange-500" : "bg-yellow-500"
              }`}>
                {gap.category}
              </span>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{gap.category_name}</h3>
                <p className="text-xs text-gray-500">Score: {gap.score}/5</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <p className="text-sm text-gray-700"><span className="font-semibold">Gap:</span> {gap.gap}</p>
              <p className="text-sm text-red-600 mt-1"><span className="font-semibold">Why it matters:</span> {gap.urgency}</p>
            </div>
            <div className="space-y-3">
              {gap.actions.map((action, j) => (
                <div key={j} className="bg-gray-50 rounded-lg p-4 border-l-4 border-l-gray-900">
                  <p className="text-sm font-semibold text-gray-900 mb-2">{action.action}</p>
                  <div className="bg-white rounded-md p-3 border mb-2">
                    <p className="text-sm text-gray-600 italic">&ldquo;{action.script}&rdquo;</p>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span><span className="font-medium text-gray-700">Target:</span> {action.target}</span>
                    <span><span className="font-medium text-gray-700">When:</span> {action.timing}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Email Draft */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">✉️</span>
          <h3 className="font-semibold text-gray-900">Follow-Up Email Draft</h3>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border">
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{plan.email_draft}</p>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(plan.email_draft)}
          className="mt-3 text-sm text-gray-500 hover:text-gray-900 font-medium"
        >
          Copy to clipboard
        </button>
      </div>
    </div>
  );
}
