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
  deal_id: string;
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

export async function analyzeTranscript(opts: {
  transcript: string;
  deal_id?: string;
  new_deal?: { deal_name: string; company: string };
  participants?: string;
  owner?: string;
}): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Analysis failed: ${res.statusText}`);
  }
  return res.json();
}

export async function createDealRoom(opts: { analysisId?: string; dealId?: string }): Promise<DealRoomResponse> {
  const res = await fetch(`${API_BASE}/deal-room`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(opts.dealId ? { deal_id: opts.dealId } : { analysis_id: opts.analysisId }),
    }),
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

export async function getActionPlan(opts: { analysisId?: string; dealId?: string }): Promise<ActionPlan> {
  const res = await fetch(`${API_BASE}/action-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(opts.dealId ? { deal_id: opts.dealId } : { analysis_id: opts.analysisId }),
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || "Action plan failed");
  }
  return res.json();
}

// Deals

export interface Deal {
  id: string;
  deal_name: string;
  company: string;
  stage?: string;
  notes?: string;
  owner?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  latest_call_score: number | null;
  latest_medpicc_score: number | null;
  latest_risk_assessment: string | null;
  latest_deal_probability: number | null;
  latest_medpicc_categories: Record<string, number>;
  call_count: number;
  analysis_ids: string[];
}

export interface CallAnalysisDetail {
  id: string;
  deal_id: string;
  transcript: string;
  labeled_transcript: string;
  speaker_turns: SpeakerTurn[];
  call_analysis: CallAnalysis;
  medpicc: MEDPICCScoring;
  participants: string | null;
  created_at: string;
}

export async function listDeals(): Promise<Deal[]> {
  const res = await fetch(`${API_BASE}/deals`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.deals || [];
}

export async function createDeal(deal_name: string, company: string): Promise<Deal> {
  const res = await fetch(`${API_BASE}/deals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deal_name, company }),
  });
  if (!res.ok) throw new Error("Failed to create deal");
  return res.json();
}

export async function getDeal(id: string): Promise<Deal> {
  const res = await fetch(`${API_BASE}/deals/${id}`);
  if (!res.ok) throw new Error("Deal not found");
  return res.json();
}

export async function updateDeal(id: string, data: Partial<Pick<Deal, "deal_name" | "company" | "stage" | "notes" | "owner" | "assigned_to">>): Promise<Deal> {
  const res = await fetch(`${API_BASE}/deals/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update deal");
  return res.json();
}

export async function deleteDeal(id: string): Promise<void> {
  await fetch(`${API_BASE}/deals/${id}`, { method: "DELETE" });
}

export async function getDealAnalyses(dealId: string): Promise<CallAnalysisDetail[]> {
  const res = await fetch(`${API_BASE}/deals/${dealId}/analyses`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.analyses || [];
}

export async function deleteCallAnalysis(id: string): Promise<void> {
  await fetch(`${API_BASE}/analysis/${id}`, { method: "DELETE" });
}

export async function getCallAnalysis(id: string): Promise<CallAnalysisDetail> {
  const res = await fetch(`${API_BASE}/analysis/${id}`);
  if (!res.ok) throw new Error("Analysis not found");
  return res.json();
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
