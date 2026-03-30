"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { runAgentApi, AgentResult } from "@/lib/api";

interface AgentRunnerProps {
  dealId: string;
  recipe: string;
  title: string;
  icon: string;
  description: string;
  model?: "fast" | "reasoning";
  saveVersion?: boolean;
  /** Custom renderer for parsed JSON output */
  renderParsed?: (parsed: Record<string, unknown>) => React.ReactNode;
}

const PROSE_CLASSES = "prose prose-sm prose-gray max-w-none [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_blockquote]:border-l-2 [&_blockquote]:border-blue-400 [&_blockquote]:pl-3 [&_blockquote]:italic";

export default function AgentRunner({
  dealId,
  recipe,
  title,
  icon,
  description,
  model = "fast",
  saveVersion = true,
  renderParsed,
}: AgentRunnerProps) {
  const [result, setResult] = useState<AgentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const data = await runAgentApi({
        recipe,
        deal_id: dealId,
        model,
        save_version: saveVersion,
      });
      setResult(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center">
        <div className="text-3xl mb-3 animate-bounce">{icon}</div>
        <p className="text-sm font-medium text-gray-900">Running {title}...</p>
        <p className="text-xs text-gray-400 mt-1">This may take a moment</p>
        <div className="mt-3 w-40 mx-auto bg-gray-100 rounded-full h-1 overflow-hidden">
          <div className="h-full bg-gray-900 rounded-full animate-pulse" style={{ width: "70%" }} />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <button
        onClick={run}
        className="w-full bg-white rounded-xl border p-5 text-left hover:border-gray-300 hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl group-hover:scale-110 transition-transform">{icon}</div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
          {error && <p className="text-xs text-red-500 ml-auto">{error}</p>}
        </div>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="px-5 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          <span className="text-[10px] text-gray-400">{result.model_used.split("-").slice(0, 2).join("-")}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigator.clipboard.writeText(result.output)} className="text-xs text-gray-500 hover:text-gray-900">Copy</button>
          <button onClick={run} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Re-run
          </button>
        </div>
      </div>
      <div className="p-5">
        {result.parsed && renderParsed ? (
          renderParsed(result.parsed)
        ) : (
          <div className={PROSE_CLASSES}>
            <ReactMarkdown>{result.output}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
