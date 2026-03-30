"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function MeetingPrepTab({ dealId }: { dealId: string }) {
  const [loading, setLoading] = useState(false);
  const [prep, setPrep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: dealId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPrep(data.prep);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate prep");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-10 text-center">
        <div className="inline-block animate-spin-slow mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        </div>
        <p className="text-sm font-medium text-gray-900">Building your meeting prep...</p>
        <p className="text-xs text-gray-400 mt-1">Reviewing transcripts and finding your angles</p>
        <style jsx>{`
          @keyframes spin-slow { from { transform: rotateY(0); } to { transform: rotateY(360deg); } }
          .animate-spin-slow { animation: spin-slow 2s ease-in-out infinite; perspective: 200px; }
        `}</style>
      </div>
    );
  }

  if (!prep) {
    return (
      <div className="bg-gradient-to-br from-blue-950 to-indigo-900 rounded-xl p-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 36px)",
          }} />
        </div>
        <div className="relative z-10">
          <div className="text-5xl mb-4">&#128203;</div>
          <h3 className="text-2xl font-bold text-white mb-3">Meeting Prep</h3>
          <p className="text-blue-200 text-sm mb-8 max-w-lg mx-auto leading-relaxed">
            Generate a detailed prep brief for your next meeting. Includes deal status,
            key questions, opening script, power moves, and landmines to avoid.
          </p>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button
            onClick={handleGenerate}
            className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-500 transition-all hover:scale-105 shadow-lg shadow-blue-900/50"
          >
            Prep for Next Meeting
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900">Meeting Prep Brief</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(prep)}
            className="text-sm text-gray-500 hover:text-gray-900 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            Copy
          </button>
          <button
            onClick={handleGenerate}
            className="text-sm text-gray-500 hover:text-gray-900 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            Regenerate
          </button>
        </div>
      </div>

      {/* Prep Content */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="prose prose-sm prose-gray max-w-none [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_li]:pl-1 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_hr]:my-4 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_blockquote]:border-l-3 [&_blockquote]:border-blue-400 [&_blockquote]:bg-blue-50 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:rounded-r-lg [&_blockquote]:italic [&_blockquote]:text-gray-700 [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs">
          <ReactMarkdown>{prep}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
