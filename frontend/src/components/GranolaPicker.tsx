"use client";

import { useState, useEffect } from "react";
import {
  listGranolaNotes,
  getGranolaNoteDetail,
  GranolaNoteListItem,
} from "@/lib/api";

interface GranolaPickerProps {
  onSelect: (transcript: string, title: string, participants: string) => void;
}

export default function GranolaPicker({ onSelect }: GranolaPickerProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<GranolaNoteListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingNote, setLoadingNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && notes.length === 0) {
      fetchNotes();
    }
  }, [open]);

  async function fetchNotes() {
    setLoading(true);
    setError(null);
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const result = await listGranolaNotes(thirtyDaysAgo);
      setNotes(result.notes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notes");
    } finally {
      setLoading(false);
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
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load note");
    } finally {
      setLoadingNote(null);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4-4h8m-4-8V3m0 0L9 7m3-4l3 4" />
        </svg>
        Import from Granola
      </button>
    );
  }

  return (
    <div className="border rounded-xl bg-white shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm">Granola Notes</h3>
        <button
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          Close
        </button>
      </div>

      {error && <p className="text-red-600 text-xs mb-2">{error}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm py-4 text-center">Loading notes...</p>
      ) : notes.length === 0 ? (
        <p className="text-gray-400 text-sm py-4 text-center">No notes found</p>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-1">
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => handleSelect(note.id)}
              disabled={loadingNote === note.id}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <p className="text-sm font-medium text-gray-900 truncate">
                {loadingNote === note.id ? "Loading..." : note.title}
              </p>
              <p className="text-xs text-gray-500">
                {note.created_at
                  ? new Date(note.created_at).toLocaleDateString()
                  : ""}
                {note.owner ? ` · ${note.owner.name}` : ""}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
