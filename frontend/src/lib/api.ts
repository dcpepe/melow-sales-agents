const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

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
  if (!res.ok) throw new Error(`Analysis failed: ${res.statusText}`);
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
