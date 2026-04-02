"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Deal, listDeals, runAgentApi, AgentResult } from "@/lib/api";
import ReactMarkdown from "react-markdown";

const AGENTS = [
  { id: "deal_assistant", name: "Deal Health Check", desc: "Analyze health, risks, next actions", scope: "deal" },
  { id: "frank_deal", name: "Run Frank", desc: "Frank's deal-specific coaching", scope: "deal" },
  { id: "meeting_prep", name: "Meeting Prep", desc: "Prep brief for next meeting", scope: "deal" },
  { id: "action_plan", name: "Sales Demon Mode", desc: "MEDPICC gap-closing action plan", scope: "deal" },
  { id: "meddpicc_followup", name: "MEDDPICC Follow-Up", desc: "Deal assessment + strategic emails", scope: "deal" },
  { id: "followup_email", name: "Quick Follow-Up", desc: "Simple post-call email", scope: "deal" },
  { id: "objection_handler", name: "Objection Handler", desc: "Objection responses + scripts", scope: "deal" },
  { id: "qualification_sheet", name: "Qualification Sheet", desc: "MEDPICC qualification questions", scope: "deal" },
  { id: "global_intelligence", name: "Pipeline Intelligence", desc: "Analyze entire pipeline", scope: "global" },
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

  useEffect(() => { listDeals().then(setDeals).catch(() => {}); }, []);

  const agent = AGENTS.find((a) => a.id === selectedAgent);
  const needsDeal = agent?.scope === "deal";

  async function runAgent() {
    if (!selectedAgent) return;
    if (needsDeal && !selectedDeal) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await runAgentApi({
        recipe: selectedAgent,
        deal_id: needsDeal ? selectedDeal : undefined,
        model, save_version: true,
      });
      setResult(data.result);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/sales")} className="text-gray-300 hover:text-gray-900">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-gray-900 text-sm font-semibold">Agents</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Controls */}
          <div className="space-y-6">
            {/* Agent list */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Select Agent</p>
              <div className="space-y-0.5">
                {AGENTS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAgent(a.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-colors ${
                      selectedAgent === a.id ? "bg-gray-900 text-white" : "hover:bg-gray-50 text-gray-900"
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-medium ${selectedAgent === a.id ? "text-white" : "text-gray-900"}`}>{a.name}</p>
                      <p className={`text-xs ${selectedAgent === a.id ? "text-gray-400" : "text-gray-400"}`}>{a.desc}</p>
                    </div>
                    {a.scope === "global" && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${selectedAgent === a.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>global</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Deal picker */}
            {needsDeal && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Select Deal</p>
                {deals.length === 0 ? (
                  <p className="text-sm text-gray-300">No deals yet</p>
                ) : (
                  <div className="space-y-0.5 max-h-48 overflow-y-auto">
                    {deals.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDeal(d.id)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${
                          selectedDeal === d.id ? "bg-gray-900 text-white" : "hover:bg-gray-50 text-gray-900"
                        }`}
                      >
                        <p className="font-medium truncate">{d.deal_name}</p>
                        <p className={`text-xs ${selectedDeal === d.id ? "text-gray-400" : "text-gray-400"}`}>{d.company}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Model + Run */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Model</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setModel("fast")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${model === "fast" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
                >
                  Fast
                </button>
                <button
                  onClick={() => setModel("reasoning")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${model === "reasoning" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
                >
                  Reasoning
                </button>
              </div>
              <button
                onClick={runAgent}
                disabled={loading || !selectedAgent || (needsDeal && !selectedDeal)}
                className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Running..." : "Run Agent"}
              </button>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-2">
            {loading && (
              <div className="border border-gray-100 rounded-xl p-12 text-center">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium text-gray-900">Running {agent?.name}...</p>
              </div>
            )}

            {!loading && !result && (
              <div className="border border-gray-100 rounded-xl p-12 text-center">
                <p className="text-sm font-medium text-gray-900 mb-1">Select an agent and run it</p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Pick an agent from the left, choose a deal if needed, select your model, and hit Run.
                </p>
              </div>
            )}

            {result && (
              <div className="border border-gray-100 rounded-xl">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{agent?.name}</h3>
                    <span className="text-[10px] text-gray-300">{result.tokens_used} tokens</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => navigator.clipboard.writeText(result.output)} className="text-xs text-gray-400 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-50">Copy</button>
                    <button onClick={runAgent} className="text-xs text-gray-400 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-50">Re-run</button>
                  </div>
                </div>
                <div className="p-5">
                  {result.parsed ? (
                    <pre className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 overflow-auto max-h-[600px] whitespace-pre-wrap font-mono text-xs">
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
