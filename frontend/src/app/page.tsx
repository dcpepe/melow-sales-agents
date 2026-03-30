"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { listGranolaNotes, getGranolaNoteDetail, GranolaNoteListItem } from "@/lib/api";

interface RecentAnalysis {
  id: string;
  deal_name: string | null;
  company: string | null;
  call_score: number | null;
  medpicc_score: number | null;
  risk_assessment: string | null;
}

export default function Dashboard() {
  const router = useRouter();
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [granolaNotes, setGranolaNotes] = useState<GranolaNoteListItem[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreNotes, setHasMoreNotes] = useState(false);
  const [notesCursor, setNotesCursor] = useState<string | undefined>();
  const [importingNote, setImportingNote] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analyses")
      .then((r) => r.json())
      .then((data) => setRecentAnalyses(data.analyses || []))
      .catch(() => {})
      .finally(() => setLoadingAnalyses(false));

    listGranolaNotes()
      .then((data) => {
        setGranolaNotes(data.notes || []);
        setHasMoreNotes(data.hasMore);
        setNotesCursor(data.cursor);
      })
      .catch(() => {})
      .finally(() => setLoadingNotes(false));
  }, []);

  async function loadMoreNotes() {
    if (!notesCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await listGranolaNotes(undefined, notesCursor);
      setGranolaNotes((prev) => [...prev, ...(data.notes || [])]);
      setHasMoreNotes(data.hasMore);
      setNotesCursor(data.cursor);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleImportNote(noteId: string) {
    setImportingNote(noteId);
    try {
      const note = await getGranolaNoteDetail(noteId);
      let transcript = "";
      if (note.transcript && note.transcript.length > 0) {
        transcript = note.transcript
          .map((entry) => {
            const speaker = entry.speaker.name || entry.speaker.source;
            return `[${speaker}]: ${entry.text}`;
          })
          .join("\n");
      } else if (note.summary) {
        transcript = note.summary;
      }
      const participants = note.participants
        ? note.participants.map((p) => p.name).join(", ")
        : "";
      const params = new URLSearchParams({
        transcript,
        deal: note.title,
        participants,
      });
      router.push(`/analyze?${params}`);
    } catch {
      setImportingNote(null);
    }
  }

  function scoreColor(score: number | null) {
    if (score === null) return "text-gray-400";
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  }

  function riskBadge(risk: string | null) {
    if (!risk) return null;
    const colors: Record<string, string> = {
      Low: "bg-green-50 text-green-700",
      Medium: "bg-yellow-50 text-yellow-700",
      High: "bg-red-50 text-red-700",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[risk] || "bg-gray-100 text-gray-600"}`}>
        {risk}
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Melow Sales Intelligence</h1>
            <p className="text-sm text-gray-500 mt-0.5">Call analysis, MEDPICC scoring &amp; deal rooms</p>
          </div>
          <button
            onClick={() => router.push("/analyze")}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            + New Analysis
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => router.push("/analyze")}
            className="bg-white rounded-xl border shadow-sm p-5 text-left hover:border-gray-300 transition-colors group"
          >
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center mb-3 group-hover:bg-gray-700 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Paste Transcript</h3>
            <p className="text-sm text-gray-500 mt-1">Analyze a sales call from a pasted transcript</p>
          </button>

          <button
            onClick={() => router.push("/analyze")}
            className="bg-white rounded-xl border shadow-sm p-5 text-left hover:border-gray-300 transition-colors group"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-500 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Import from Granola</h3>
            <p className="text-sm text-gray-500 mt-1">Pull transcripts directly from your Granola meetings</p>
          </button>

          <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl shadow-sm p-5 text-left">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="font-semibold text-white">
              {recentAnalyses.length} {recentAnalyses.length === 1 ? "Analysis" : "Analyses"}
            </h3>
            <p className="text-sm text-gray-300 mt-1">
              {recentAnalyses.length > 0
                ? `Avg call score: ${Math.round(recentAnalyses.reduce((sum, a) => sum + (a.call_score || 0), 0) / recentAnalyses.length)}`
                : "No analyses yet"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Analyses */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Analyses</h2>
            </div>
            <div className="divide-y">
              {loadingAnalyses ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">Loading...</div>
              ) : recentAnalyses.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-gray-400 mb-3">No analyses yet</p>
                  <button
                    onClick={() => router.push("/analyze")}
                    className="text-sm text-gray-900 font-medium hover:underline"
                  >
                    Analyze your first call &rarr;
                  </button>
                </div>
              ) : (
                recentAnalyses.map((analysis) => (
                  <button
                    key={analysis.id}
                    onClick={() => router.push(`/analyze?id=${analysis.id}`)}
                    className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {analysis.deal_name || analysis.company || "Untitled Analysis"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {analysis.company && analysis.deal_name ? analysis.company : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <p className={`text-sm font-bold ${scoreColor(analysis.call_score)}`}>
                          {analysis.call_score ?? "—"}
                        </p>
                        <p className="text-xs text-gray-400">Call</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${scoreColor(analysis.medpicc_score)}`}>
                          {analysis.medpicc_score !== null ? `${Math.round(analysis.medpicc_score)}%` : "—"}
                        </p>
                        <p className="text-xs text-gray-400">MEDPICC</p>
                      </div>
                      {riskBadge(analysis.risk_assessment)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Granola Notes */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Granola Meetings</h2>
              <span className="text-xs text-gray-400">{granolaNotes.length} loaded</span>
            </div>
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {loadingNotes ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">Loading...</div>
              ) : granolaNotes.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-gray-400">No Granola notes found</p>
                  <p className="text-xs text-gray-300 mt-1">Check your GRANOLA_API_KEY</p>
                </div>
              ) : (
                granolaNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => handleImportNote(note.id)}
                    disabled={importingNote === note.id}
                    className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {importingNote === note.id ? "Importing..." : note.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {note.created_at ? new Date(note.created_at).toLocaleDateString() : ""}
                        {note.owner ? ` · ${note.owner.name}` : ""}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))
              )}
            </div>
            {hasMoreNotes && (
              <div className="px-5 py-3 border-t">
                <button
                  onClick={loadMoreNotes}
                  disabled={loadingMore}
                  className="w-full text-sm text-gray-600 font-medium hover:text-gray-900 disabled:opacity-50"
                >
                  {loadingMore ? "Loading..." : "Load More Meetings"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
