"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";

interface AnalysisVersion {
  id: string;
  version: number;
  content: string;
  created_at: string;
}

interface CachedAnalysisProps {
  dealId: string;
  type: "meeting_prep" | "action_plan" | "frank_analysis";
  title: string;
  icon: string;
  generateLabel: string;
  gradientFrom: string;
  gradientTo: string;
  /** If provided, renders custom content instead of markdown */
  renderContent?: (content: string) => React.ReactNode;
}

export default function CachedAnalysis({
  dealId,
  type,
  title,
  icon,
  generateLabel,
  gradientFrom,
  gradientTo,
  renderContent,
}: CachedAnalysisProps) {
  const [content, setContent] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<AnalysisVersion[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<number | null>(null);

  // Cache-first load
  useEffect(() => {
    fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deal_id: dealId, type, force: false }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.cached && data.version) {
          setContent(data.version.content);
          setCurrentVersion(data.version.version);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dealId, type]);

  const generate = useCallback(async (force: boolean) => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: dealId, type, force }),
      });
      const data = await res.json();

      if (data.version) {
        setContent(data.version.content);
        setCurrentVersion(data.version.version);
      } else if (data.job?.status === "failed") {
        setError(data.job.error || "Generation failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setGenerating(false);
    }
  }, [dealId, type]);

  async function loadVersionHistory() {
    const res = await fetch(`/api/versions?deal_id=${dealId}&type=${type}`);
    const data = await res.json();
    setVersions(data.versions || []);
    setShowHistory(true);
  }

  function viewVersion(v: AnalysisVersion) {
    setContent(v.content);
    setViewingVersion(v.version);
  }

  function backToLatest() {
    if (versions.length > 0) {
      const latest = versions[0];
      setContent(latest.content);
      setCurrentVersion(latest.version);
    }
    setViewingVersion(null);
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  // Generating state
  if (generating) {
    return (
      <div className="bg-white rounded-xl border p-10 text-center">
        <div className="text-4xl mb-3 animate-bounce">{icon}</div>
        <p className="text-sm font-medium text-gray-900">Generating {title.toLowerCase()}...</p>
        <p className="text-xs text-gray-400 mt-1">You can navigate away — this runs in the background</p>
        <div className="mt-4 w-48 mx-auto bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div className="h-full bg-gray-900 rounded-full animate-pulse" style={{ width: "60%" }} />
        </div>
      </div>
    );
  }

  // Empty state — no cached content
  if (!content) {
    return (
      <div className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-xl p-10 text-center relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 36px)",
          }} />
        </div>
        <div className="relative z-10">
          <div className="text-5xl mb-4">{icon}</div>
          <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
          <p className="text-white/70 text-sm mb-8 max-w-lg mx-auto">Click to generate. Results are cached and versioned.</p>
          {error && <p className="text-red-300 text-sm mb-4">{error}</p>}
          <button
            onClick={() => generate(true)}
            className="bg-white/20 backdrop-blur text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white/30 transition-all hover:scale-105 border border-white/20"
          >
            {generateLabel}
          </button>
        </div>
      </div>
    );
  }

  // Content loaded
  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {currentVersion && !viewingVersion && (
            <span className="text-xs text-gray-400">v{currentVersion}</span>
          )}
          {viewingVersion && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
              Viewing v{viewingVersion}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {viewingVersion && (
            <button onClick={backToLatest} className="text-sm text-blue-600 hover:underline font-medium">
              Back to latest
            </button>
          )}
          <button
            onClick={loadVersionHistory}
            className="text-sm text-gray-500 hover:text-gray-900 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            History
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(content)}
            className="text-sm text-gray-500 hover:text-gray-900 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            Copy
          </button>
          <button
            onClick={() => generate(true)}
            disabled={generating}
            className="text-sm text-gray-700 font-medium px-3 py-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Version History Panel */}
      {showHistory && versions.length > 0 && (
        <div className="bg-gray-50 rounded-xl border p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">Version History</h4>
            <button onClick={() => setShowHistory(false)} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {versions.map((v) => (
              <button
                key={v.version}
                onClick={() => viewVersion(v)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                  (viewingVersion || currentVersion) === v.version
                    ? "bg-white border shadow-sm"
                    : "hover:bg-white"
                }`}
              >
                <div>
                  <span className="font-medium text-gray-900">Version {v.version}</span>
                  {v.version === versions[0]?.version && (
                    <span className="text-[10px] text-green-600 font-medium ml-2">LATEST</span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(v.created_at).toLocaleDateString(undefined, {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        {renderContent ? (
          renderContent(content)
        ) : (
          <div className="prose prose-sm prose-gray max-w-none [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_li]:pl-1 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_blockquote]:border-l-3 [&_blockquote]:border-blue-400 [&_blockquote]:bg-blue-50 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:rounded-r-lg [&_blockquote]:italic [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
