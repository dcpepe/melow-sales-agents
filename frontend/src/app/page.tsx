"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { listGranolaNotes, getGranolaNoteDetail, GranolaNoteListItem, Deal, listDeals } from "@/lib/api";
import TeamSelector from "@/components/TeamSelector";
import FrankGolden from "@/components/FrankGolden";
import { getMemberByName } from "@/lib/team";

export default function Dashboard() {
  const router = useRouter();
  const [recentDeals, setRecentDeals] = useState<Deal[]>([]);
  const [granolaNotes, setGranolaNotes] = useState<GranolaNoteListItem[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreNotes, setHasMoreNotes] = useState(false);
  const [notesCursor, setNotesCursor] = useState<string | undefined>();
  const [importingNote, setImportingNote] = useState<string | null>(null);
  const [noteSearch, setNoteSearch] = useState("");

  useEffect(() => {
    listDeals()
      .then((data) => setRecentDeals(data))
      .catch(() => {})
      .finally(() => setLoadingDeals(false));

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
      sessionStorage.setItem("granola_import", JSON.stringify({
        transcript,
        deal: note.title,
        participants,
      }));
      router.push("/analyze?from=granola");
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
            <p className="text-sm text-gray-500 mt-0.5">Deal tracking, MEDPICC scoring &amp; deal rooms</p>
          </div>
          <div className="flex items-center gap-3">
            <TeamSelector />
            <button
              onClick={() => router.push("/deals")}
              className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Deal Intelligence
            </button>
            <button
              onClick={() => router.push("/analyze")}
              className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              + New Deal
            </button>
          </div>
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
            <p className="text-sm text-gray-500 mt-1">Add a new deal by pasting a call transcript</p>
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
            <p className="text-sm text-gray-500 mt-1">Add a new deal from your Granola meetings</p>
          </button>

          <button
            onClick={() => router.push("/deals")}
            className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl shadow-sm p-5 text-left hover:from-gray-800 hover:to-gray-600 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="font-semibold text-white">
              {recentDeals.length} {recentDeals.length === 1 ? "Deal" : "Deals"}
            </h3>
            <p className="text-sm text-gray-300 mt-1">
              {recentDeals.length > 0
                ? `View all deals & pipeline intelligence`
                : "No deals yet — add your first one"}
            </p>
          </button>
        </div>

        {/* Frank Golden — Sales Coach */}
        <FrankGolden />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Deals */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Deals</h2>
              {recentDeals.length > 0 && (
                <button
                  onClick={() => router.push("/deals")}
                  className="text-xs text-gray-500 hover:text-gray-900 font-medium"
                >
                  View all &rarr;
                </button>
              )}
            </div>
            <div className="divide-y">
              {loadingDeals ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">Loading...</div>
              ) : recentDeals.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-gray-400 mb-3">No deals yet</p>
                  <button
                    onClick={() => router.push("/analyze")}
                    className="text-sm text-gray-900 font-medium hover:underline"
                  >
                    Add your first deal &rarr;
                  </button>
                </div>
              ) : (
                recentDeals.slice(0, 8).map((deal) => (
                  <button
                    key={deal.id}
                    onClick={() => router.push(`/deals/${deal.id}`)}
                    className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    {(() => {
                      const member = deal.owner ? getMemberByName(deal.owner) : undefined;
                      return member ? (
                        <div className={`w-7 h-7 ${member.color} rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`} title={member.name}>
                          {member.initials}
                        </div>
                      ) : (
                        <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-[10px] flex-shrink-0">?</div>
                      );
                    })()}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {deal.deal_name || deal.company || "Untitled Deal"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {deal.company}{deal.call_count > 0 ? ` · ${deal.call_count} call${deal.call_count !== 1 ? "s" : ""}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <p className={`text-sm font-bold ${scoreColor(deal.latest_call_score)}`}>
                          {deal.latest_call_score ?? "—"}
                        </p>
                        <p className="text-xs text-gray-400">Call</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${scoreColor(deal.latest_medpicc_score)}`}>
                          {deal.latest_medpicc_score !== null ? `${Math.round(deal.latest_medpicc_score)}%` : "—"}
                        </p>
                        <p className="text-xs text-gray-400">MEDPICC</p>
                      </div>
                      {riskBadge(deal.latest_risk_assessment)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Granola Notes */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-5 py-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">Granola Meetings</h2>
                <span className="text-xs text-gray-400">{granolaNotes.length} loaded</span>
              </div>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search meetings..."
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
                />
                {noteSearch && (
                  <button
                    onClick={() => setNoteSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {(() => {
              const filtered = noteSearch
                ? granolaNotes.filter((n) =>
                    n.title.toLowerCase().includes(noteSearch.toLowerCase()) ||
                    (n.owner?.name || "").toLowerCase().includes(noteSearch.toLowerCase())
                  )
                : granolaNotes;
              return (
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {loadingNotes ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">Loading...</div>
              ) : filtered.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-gray-400">
                    {granolaNotes.length === 0 ? "No Granola notes found" : "No matching meetings"}
                  </p>
                  {granolaNotes.length === 0 && (
                    <p className="text-xs text-gray-300 mt-1">Check your GRANOLA_API_KEY</p>
                  )}
                </div>
              ) : (
                filtered.map((note) => (
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
              );
            })()}
            {hasMoreNotes && !noteSearch && (
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
