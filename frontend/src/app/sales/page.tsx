"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { listAllGranolaNotes, getGranolaNoteDetail, GranolaNoteListItem, Deal, listDeals } from "@/lib/api";
import TeamSelector from "@/components/TeamSelector";
import FrankGolden from "@/components/FrankGolden";
import GmailConnect from "@/components/GmailConnect";
import { getMemberByName } from "@/lib/team";

export default function SalesDashboard() {
  const router = useRouter();
  const [recentDeals, setRecentDeals] = useState<Deal[]>([]);
  const [granolaNotes, setGranolaNotes] = useState<GranolaNoteListItem[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [importingNote, setImportingNote] = useState<string | null>(null);
  const [noteSearch, setNoteSearch] = useState("");

  useEffect(() => {
    listDeals().then(setRecentDeals).catch(() => {}).finally(() => setLoadingDeals(false));
    listAllGranolaNotes().then(setGranolaNotes).catch(() => {}).finally(() => setLoadingNotes(false));
  }, []);

  async function handleImportNote(noteId: string) {
    setImportingNote(noteId);
    try {
      const note = await getGranolaNoteDetail(noteId);
      let transcript = "";
      if (note.transcript && note.transcript.length > 0) {
        transcript = note.transcript.map((e) => `[${e.speaker.name || e.speaker.source}]: ${e.text}`).join("\n");
      } else if (note.summary) { transcript = note.summary; }
      const participants = note.participants ? note.participants.map((p) => p.name).join(", ") : "";
      sessionStorage.setItem("granola_import", JSON.stringify({ transcript, deal: note.title, participants }));
      router.push("/analyze?from=granola");
    } catch { setImportingNote(null); }
  }

  function scoreColor(score: number | null | undefined) {
    if (score == null) return "text-gray-300";
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-500";
  }

  const filteredNotes = noteSearch
    ? granolaNotes.filter((n) => n.title.toLowerCase().includes(noteSearch.toLowerCase()) || (n.owner?.name || "").toLowerCase().includes(noteSearch.toLowerCase()))
    : granolaNotes;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="text-gray-300 hover:text-gray-900">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-gray-900 text-sm font-semibold">Sales</span>
          </div>
          <div className="flex items-center gap-2">
            <GmailConnect />
            <TeamSelector />
            <button onClick={() => router.push("/analyze")} className="text-sm text-gray-900 font-medium px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
              + New Deal
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Nav links */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { label: "Deals", href: "/deals" },
            { label: "MEDDPICC Agent", href: "/follow-up" },
            { label: "Agents", href: "/agents" },
            { label: "Objections", href: "/objections" },
            { label: "Qualification", href: "/qualification" },
            { label: "Coaching", href: "/coaching" },
          ].map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="px-4 py-2 rounded-lg bg-gray-50 text-sm text-gray-700 font-medium hover:bg-gray-100 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Frank */}
        <FrankGolden />

        {/* Recent Deals */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Recent Deals</h2>
            {recentDeals.length > 0 && (
              <button onClick={() => router.push("/deals")} className="text-xs text-gray-400 hover:text-gray-900">View all</button>
            )}
          </div>
          {loadingDeals ? (
            <p className="text-sm text-gray-300 py-4">Loading...</p>
          ) : recentDeals.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-gray-400 mb-2">No deals yet</p>
              <button onClick={() => router.push("/analyze")} className="text-sm text-gray-900 font-medium hover:underline">Add your first deal</button>
            </div>
          ) : (
            <div className="space-y-1">
              {recentDeals.slice(0, 8).map((deal) => {
                const member = deal.owner ? getMemberByName(deal.owner) : undefined;
                return (
                  <button
                    key={deal.id}
                    onClick={() => router.push(`/deals/${deal.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    {member ? (
                      <div className={`w-6 h-6 ${member.color} rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>{member.initials}</div>
                    ) : (
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{deal.deal_name || "Untitled"}</p>
                      <p className="text-xs text-gray-400">{deal.company}{deal.call_count > 0 ? ` · ${deal.call_count} call${deal.call_count !== 1 ? "s" : ""}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className={`text-sm font-semibold ${scoreColor(deal.latest_call_score)}`}>{deal.latest_call_score ?? "—"}</span>
                      <span className={`text-sm font-semibold ${scoreColor(deal.latest_medpicc_score)}`}>{deal.latest_medpicc_score != null ? `${Math.round(deal.latest_medpicc_score)}%` : "—"}</span>
                      {deal.latest_risk_assessment && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          deal.latest_risk_assessment === "High" ? "bg-red-50 text-red-600" :
                          deal.latest_risk_assessment === "Medium" ? "bg-yellow-50 text-yellow-600" :
                          "bg-green-50 text-green-600"
                        }`}>{deal.latest_risk_assessment}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Granola */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Granola Meetings</h2>
            <span className="text-xs text-gray-300">{granolaNotes.length}</span>
          </div>
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={noteSearch}
              onChange={(e) => setNoteSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 placeholder:text-gray-300"
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto space-y-0.5">
            {loadingNotes ? (
              <p className="text-sm text-gray-300 py-4">Loading...</p>
            ) : filteredNotes.length === 0 ? (
              <p className="text-sm text-gray-300 py-4 text-center">{granolaNotes.length === 0 ? "No notes found" : "No matches"}</p>
            ) : (
              filteredNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => handleImportNote(note.id)}
                  disabled={importingNote === note.id}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{importingNote === note.id ? "Importing..." : note.title}</p>
                    <p className="text-xs text-gray-400">{note.created_at ? new Date(note.created_at).toLocaleDateString() : ""}{note.owner ? ` · ${note.owner.name}` : ""}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-200 flex-shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))
            )}
          </div>
          {false && (
            <span></span>
          )}
        </div>
      </main>
    </div>
  );
}
