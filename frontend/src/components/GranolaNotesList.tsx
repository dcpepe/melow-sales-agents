"use client";

import { useState, useEffect } from "react";
import {
  listGranolaNotes,
  getGranolaNoteDetail,
  GranolaNoteListItem,
} from "@/lib/api";

interface GranolaNotesListProps {
  onSelect: (transcript: string, title: string, participants: string) => void;
}

export default function GranolaNotesList({ onSelect }: GranolaNotesListProps) {
  const [notes, setNotes] = useState<GranolaNoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loadingNote, setLoadingNote] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listGranolaNotes()
      .then((data) => {
        setNotes(data.notes || []);
        setHasMore(data.hasMore);
        setCursor(data.cursor);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load notes"))
      .finally(() => setLoading(false));
  }, []);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await listGranolaNotes(undefined, cursor);
      setNotes((prev) => [...prev, ...(data.notes || [])]);
      setHasMore(data.hasMore);
      setCursor(data.cursor);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleSelect(noteId: string) {
    setLoadingNote(noteId);
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
      onSelect(transcript, note.title, participants);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load note");
    } finally {
      setLoadingNote(null);
    }
  }

  const filtered = search
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          (n.owner?.name || "").toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="px-5 py-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Import from Granola</h3>
          <span className="text-xs text-gray-400">{notes.length} meetings</span>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search meetings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder:text-gray-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {error && <div className="px-5 py-2 text-xs text-red-600">{error}</div>}

      <div className="divide-y max-h-[350px] overflow-y-auto">
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">Loading meetings...</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400">
              {notes.length === 0 ? "No Granola notes found" : "No matching meetings"}
            </p>
          </div>
        ) : (
          filtered.map((note) => (
            <button
              key={note.id}
              onClick={() => handleSelect(note.id)}
              disabled={loadingNote === note.id}
              className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {loadingNote === note.id ? "Importing..." : note.title}
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

      {hasMore && !search && (
        <div className="px-5 py-3 border-t">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full text-sm text-gray-600 font-medium hover:text-gray-900 disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load More Meetings"}
          </button>
        </div>
      )}
    </div>
  );
}
