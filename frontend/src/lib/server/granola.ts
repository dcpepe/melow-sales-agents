const GRANOLA_API_BASE = "https://public-api.granola.ai/v1";

interface GranolaSpeaker {
  source: string;
  name?: string;
}

interface GranolaTranscriptEntry {
  speaker: GranolaSpeaker;
  text: string;
}

export interface GranolaNoteListItem {
  id: string;
  title: string;
  owner?: { name: string; email: string };
  created_at?: string;
}

export interface GranolaNoteDetail {
  id: string;
  title: string;
  owner?: { name: string; email: string };
  summary?: string;
  transcript?: GranolaTranscriptEntry[];
  participants?: { name: string; email?: string }[];
  created_at?: string;
}

interface ListNotesResponse {
  notes: GranolaNoteListItem[];
  hasMore: boolean;
  cursor?: string;
}

function getApiKey(): string {
  const key = process.env.GRANOLA_API_KEY;
  if (!key) throw new Error("GRANOLA_API_KEY is not set");
  return key;
}

export async function listGranolaNotes(
  createdAfter?: string,
  cursor?: string
): Promise<ListNotesResponse> {
  const params = new URLSearchParams();
  if (createdAfter) params.set("created_after", createdAfter);
  if (cursor) params.set("cursor", cursor);

  const url = `${GRANOLA_API_BASE}/notes${params.toString() ? `?${params}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });

  if (!res.ok) {
    throw new Error(`Granola API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getGranolaNoteWithTranscript(
  noteId: string
): Promise<GranolaNoteDetail> {
  const res = await fetch(
    `${GRANOLA_API_BASE}/notes/${noteId}?include=transcript`,
    { headers: { Authorization: `Bearer ${getApiKey()}` } }
  );

  if (!res.ok) {
    throw new Error(`Granola API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export function granolaTranscriptToText(note: GranolaNoteDetail): string {
  if (!note.transcript || note.transcript.length === 0) {
    return note.summary || "";
  }

  return note.transcript
    .map((entry) => {
      const speaker = entry.speaker.name || entry.speaker.source;
      return `[${speaker}]: ${entry.text}`;
    })
    .join("\n");
}
