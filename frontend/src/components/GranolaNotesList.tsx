"use client";

import { useState, useEffect } from "react";
import {
  listAllGranolaNotes,
  getGranolaNoteDetail,
  GranolaNoteListItem,
} from "@/lib/api";

interface GranolaNotesListProps {
  onSelect: (transcript: string, title: string, participants: string) => void;
}

export default function GranolaNotesList({ onSelect }: GranolaNotesListProps) {
  const [notes, setNotes] = useState<GranolaNoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNote, setLoadingNote] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAllGranolaNotes()
      .then(setNotes)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load notes"))
      .finally(() => setLoading(false));
  }, []);

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
    <div className="bg-white rounded-xl border border-gray-100">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Import from Granola</h3>
          <span className="text-xs text-gray-300">{notes.length} meetings</span>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search all meetings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 placeholder:text-gray-300"
          />
        </div>
      </div>

      {error && <div className="px-5 py-2 text-xs text-red-500">{error}</div>}

      <div className="max-h-[350px] overflow-y-auto">
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-gray-300">Loading all meetings...</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-300">
              {notes.length === 0 ? "No meetings found" : "No matches"}
            </p>
          </div>
        ) : (
          filtered.map((note) => (
            <button
              key={note.id}
              onClick={() => handleSelect(note.id)}
              disabled={loadingNote === note.id}
              className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left disabled:opacity-50 border-b border-gray-50 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {loadingNote === note.id ? "Importing..." : note.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {note.created_at ? new Date(note.created_at).toLocaleDateString() : ""}
                  {note.owner ? ` · ${note.owner.name}` : ""}
                </p>
              </div>
              <svg className="w-4 h-4 text-gray-200 flex-shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
