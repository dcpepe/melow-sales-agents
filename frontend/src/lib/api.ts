const API_BASE = "/api";

export interface SpeakerTurn {
  speaker: string;
  text: string;
}

export interface CallBreakdown {
  discovery_quality: number;
  pain_identification: number;
  business_impact_clarity: number;
  stakeholder_mapping: number;
  urgency_creation: number;
  demo_clarity: number;
  next_steps_strength: number;
}

export interface CallAnalysis {
  call_score: number;
  breakdown: CallBreakdown;
  key_mistakes: string[];
  missed_opportunities: string[];
  open_questions: string[];
  coaching: string[];
}

export interface MEDPICCCategory {
  score: number;
  summary: string;
  missing_info: string[];
}

export interface MEDPICCScoring {
  metrics: MEDPICCCategory;
  economic_buyer: MEDPICCCategory;
  decision_criteria: MEDPICCCategory;
  decision_process: MEDPICCCategory;
  paper_process: MEDPICCCategory;
  identify_pain: MEDPICCCategory;
  champion: MEDPICCCategory;
  competition: MEDPICCCategory;
  overall_score: number;
  risk_assessment: "High" | "Medium" | "Low";
  deal_probability: number;
  recommended_actions: string[];
}

export interface AnalysisResponse {
  id: string;
  speaker_turns: SpeakerTurn[];
  call_analysis: CallAnalysis;
  medpicc: MEDPICCScoring;
}

export interface DealRoom {
  id: string;
  company_name: string;
  meeting_summary: string;
  participants: string[];
  call_summary: string;
  key_takeaways: string[];
  pain_points: string[];
  objectives: string[];
  opportunities: string[];
  next_steps: string[];
  value_proposition: string;
}

export interface DealRoomResponse {
  deal_room: DealRoom;
  shareable_url: string;
}

export async function analyzeTranscript(
  transcript: string,
  dealName?: string,
  company?: string,
  participants?: string
): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript,
      deal_name: dealName || null,
      company: company || null,
      participants: participants || null,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Analysis failed: ${res.statusText}`);
  }
  return res.json();
}

export async function createDealRoom(analysisId: string): Promise<DealRoomResponse> {
  const res = await fetch(`${API_BASE}/deal-room`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ analysis_id: analysisId }),
  });
  if (!res.ok) throw new Error(`Deal room creation failed: ${res.statusText}`);
  return res.json();
}

export async function getDealRoom(id: string): Promise<DealRoom> {
  const res = await fetch(`${API_BASE}/deal-room/${id}`);
  if (!res.ok) throw new Error(`Deal room not found`);
  return res.json();
}

// Action Plan

export interface ActionPlanAction {
  action: string;
  script: string;
  target: string;
  timing: string;
}

export interface ActionPlanGap {
  category: string;
  category_name: string;
  score: number;
  gap: string;
  urgency: string;
  actions: ActionPlanAction[];
}

export interface ActionPlan {
  gaps: ActionPlanGap[];
  deal_killer: string;
  power_move: string;
  email_draft: string;
}

export async function getActionPlan(analysisId: string): Promise<ActionPlan> {
  const res = await fetch(`${API_BASE}/action-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ analysis_id: analysisId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || "Action plan failed");
  }
  return res.json();
}

// Deals

export interface DealListItem {
  id: string;
  deal_name: string | null;
  company: string | null;
  participants: string | null;
  call_score: number | null;
  medpicc_score: number | null;
  risk_assessment: string | null;
  deal_probability: number | null;
  recommended_actions: string[] | null;
  medpicc_categories: Record<string, number> | null;
  open_questions: string[] | null;
  key_mistakes: string[] | null;
  created_at: string | null;
}

export async function listDeals(): Promise<{ deals: DealListItem[] }> {
  const res = await fetch(`${API_BASE}/analyses`);
  if (!res.ok) return { deals: [] };
  const data = await res.json();
  return { deals: data.analyses || [] };
}

export async function getDeal(id: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/analysis/${id}`);
  if (!res.ok) throw new Error("Deal not found");
  return res.json();
}

export async function deleteDeal(id: string): Promise<void> {
  await fetch(`${API_BASE}/analysis/${id}`, { method: "DELETE" });
}

// Granola

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
  transcript?: { speaker: { source: string; name?: string }; text: string }[];
  participants?: { name: string; email?: string }[];
  created_at?: string;
}

export async function listGranolaNotes(createdAfter?: string, cursor?: string): Promise<{
  notes: GranolaNoteListItem[];
  hasMore: boolean;
  cursor?: string;
}> {
  const params = new URLSearchParams();
  if (createdAfter) params.set("created_after", createdAfter);
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`${API_BASE}/granola/notes?${params}`);
  if (!res.ok) throw new Error("Failed to fetch Granola notes");
  return res.json();
}

export async function getGranolaNoteDetail(id: string): Promise<GranolaNoteDetail> {
  const res = await fetch(`${API_BASE}/granola/notes/${id}`);
  if (!res.ok) throw new Error("Failed to fetch note");
  return res.json();
}
