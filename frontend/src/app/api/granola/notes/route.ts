import { NextRequest, NextResponse } from "next/server";
import { listGranolaNotes, GranolaNoteListItem } from "@/lib/server/granola";
import { kv } from "@vercel/kv";

const CACHE_KEY = "granola:all_notes";
const CACHE_TTL = 60 * 60; // 1 hour

// GET /api/granola/notes
// ?all=true — fetch ALL pages and return complete list (cached)
// ?cursor=X — fetch single page (passthrough, backward compat)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fetchAll = searchParams.get("all") === "true";
    const createdAfter = searchParams.get("created_after") || undefined;
    const cursor = searchParams.get("cursor") || undefined;

    if (!fetchAll) {
      // Single page — backward compat
      const result = await listGranolaNotes(createdAfter, cursor);
      return NextResponse.json(result);
    }

    // Check cache first
    const cached = await kv.get<GranolaNoteListItem[]>(CACHE_KEY);
    if (cached) {
      return NextResponse.json({ notes: cached, hasMore: false, total: cached.length, cached: true });
    }

    // Fetch all pages
    const allNotes: GranolaNoteListItem[] = [];
    let nextCursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const page = await listGranolaNotes(undefined, nextCursor);
      allNotes.push(...page.notes);
      hasMore = page.hasMore;
      nextCursor = page.cursor;

      // Safety: max 500 notes
      if (allNotes.length >= 500) break;
    }

    // Cache the full list
    if (allNotes.length > 0) {
      await kv.set(CACHE_KEY, allNotes, { ex: CACHE_TTL });
    }

    return NextResponse.json({ notes: allNotes, hasMore: false, total: allNotes.length, cached: false });
  } catch (error) {
    console.error("Granola list notes error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch notes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
