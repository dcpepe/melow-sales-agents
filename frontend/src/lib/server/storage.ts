import { kv } from "@vercel/kv";

const ANALYSIS_PREFIX = "analysis:";
const DEAL_ROOM_PREFIX = "dealroom:";
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function saveAnalysis(id: string, data: Record<string, unknown>) {
  await kv.set(`${ANALYSIS_PREFIX}${id}`, data, { ex: TTL_SECONDS });
}

export async function loadAnalysis(id: string): Promise<Record<string, unknown> | null> {
  return kv.get(`${ANALYSIS_PREFIX}${id}`);
}

export async function deleteAnalysis(id: string): Promise<void> {
  await kv.del(`${ANALYSIS_PREFIX}${id}`);
}

export async function saveDealRoom(id: string, data: Record<string, unknown>) {
  await kv.set(`${DEAL_ROOM_PREFIX}${id}`, data, { ex: TTL_SECONDS });
}

export async function loadDealRoom(id: string): Promise<Record<string, unknown> | null> {
  return kv.get(`${DEAL_ROOM_PREFIX}${id}`);
}
