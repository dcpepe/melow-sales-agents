"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Deal, listDeals, runAgentApi, AgentResult } from "@/lib/api";
import ReactMarkdown from "react-markdown";

const AGENTS = [
  { id: "deal_assistant", name: "Deal Health Check", icon: "🏥", desc: "Analyze health, risks, next actions", scope: "deal" },
  { id: "frank_deal", name: "Run Frank", icon: "😎", desc: "Frank's deal-specific coaching", scope: "deal" },
  { id: "meeting_prep", name: "Meeting Prep", icon: "📋", desc: "Prep brief for next meeting", scope: "deal" },
  { id: "action_plan", name: "Sales Demon Mode", icon: "😈", desc: "MEDPICC gap-closing action plan", scope: "deal" },
  { id: "followup_email", name: "Follow-Up Email", icon: "✉️", desc: "Post-call email ready to send", scope: "deal" },
  { id: "objection_handler", name: "Objection Handler", icon: "🛡️", desc: "Objection responses + scripts", scope: "deal" },
  { id: "qualification_sheet", name: "Qualification Sheet", icon: "📝", desc: "MEDPICC qualification questions", scope: "deal" },
  { id: "global_intelligence", name: "Pipeline Intelligence", icon: "🌐", desc: "Analyze entire pipeline", scope: "global" },
];

const PROSE = "prose prose-sm prose-gray max-w-none [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-4 [&_h3]:text-sm [&_h3]:font-semibold [&_strong]:font-semibold [&_strong]:text-gray-900";

export default function AgentsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [model, setModel] = useState<"fast" | "reasoning">("fast");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDeals().then(setDeals).catch(() => {});
  }, []);

  const agent = AGENTS.find((a) => a.id === selectedAgent);
  const needsDeal = agent?.scope === "deal";

  async function runAgent() {
    if (!selectedAgent) return;
    if (needsDeal && !selectedDeal) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await runAgentApi({
        recipe: selectedAgent,
        deal_id: needsDeal ? selectedDeal : undefined,
        model,
        save_version: true,
      });
      setResult(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agent Console</h1>
              <p className="text-sm text-gray-500">Run AI agents on your deals</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Controls */}
          <div className="space-y-4">
            {/* Agent Selection */}
            <div className="bg-white rounded-xl border p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Select Agent</h3>
              <div className="space-y-1.5">
                {AGENTS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAgent(a.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${
                      selectedAgent === a.id ? "bg-gray-900 text-white" : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg">{a.icon}</span>
                    <div>
                      <p className={`text-sm font-medium ${selectedAgent === a.id ? "text-white" : "text-gray-900"}`}>{a.name}</p>
                      <p className={`text-xs ${selectedAgent === a.id ? "text-gray-300" : "text-gray-500"}`}>{a.desc}</p>
                    </div>
                    {a.scope === "global" && (
                      <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${selectedAgent === a.id ? "bg-white/20" : "bg-blue-50 text-blue-600"}`}>global</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Deal Selection */}
            {needsDeal && (
              <div className="bg-white rounded-xl border p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Select Deal</h3>
                {deals.length === 0 ? (
                  <p className="text-sm text-gray-400">No deals yet</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {deals.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDeal(d.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedDeal === d.id ? "bg-gray-900 text-white" : "hover:bg-gray-50 text-gray-900"
                        }`}
                      >
                        <p className="font-medium truncate">{d.deal_name}</p>
                        <p className={`text-xs ${selectedDeal === d.id ? "text-gray-300" : "text-gray-500"}`}>{d.company}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Model + Run */}
            <div className="bg-white rounded-xl border p-4 space-y-3">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Model</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setModel("fast")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${model === "fast" ? "bg-gray-900 text-white" : "border text-gray-600 hover:bg-gray-50"}`}
                  >
                    ⚡ Fast
                  </button>
                  <button
                    onClick={() => setModel("reasoning")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${model === "reasoning" ? "bg-gray-900 text-white" : "border text-gray-600 hover:bg-gray-50"}`}
                  >
                    🧠 Reasoning
                  </button>
                </div>
              </div>
              <button
                onClick={runAgent}
                disabled={loading || !selectedAgent || (needsDeal && !selectedDeal)}
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Running..." : "Run Agent"}
              </button>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-2">
            {loading && (
              <div className="bg-white rounded-xl border p-12 text-center">
                <div className="text-4xl mb-4 animate-bounce">{agent?.icon || "🤖"}</div>
                <p className="text-sm font-medium text-gray-900">Running {agent?.name}...</p>
                <div className="mt-4 w-48 mx-auto bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-gray-900 rounded-full animate-pulse" style={{ width: "65%" }} />
                </div>
              </div>
            )}

            {!loading && !result && (
              <div className="bg-white rounded-xl border p-12 text-center">
                <div className="text-5xl mb-4">🤖</div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Select an agent and run it</h2>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Pick an agent from the left, choose a deal (if needed), select your model, and hit Run.
                </p>
              </div>
            )}

            {result && (
              <div className="bg-white rounded-xl border shadow-sm">
                <div className="px-5 py-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{agent?.icon}</span>
                    <h3 className="font-semibold text-gray-900">{agent?.name} Result</h3>
                    <span className="text-xs text-gray-400">
                      {result.model_used.split("-").slice(0, 2).join("-")} · {result.tokens_used} tokens
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(result.output)}
                      className="text-xs text-gray-500 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
                    >
                      Copy
                    </button>
                    <button
                      onClick={runAgent}
                      className="text-xs text-gray-500 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
                    >
                      Re-run
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  {result.parsed ? (
                    <pre className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 overflow-auto max-h-[600px] whitespace-pre-wrap">
                      {JSON.stringify(result.parsed, null, 2)}
                    </pre>
                  ) : (
                    <div className={PROSE}>
                      <ReactMarkdown>{result.output}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
