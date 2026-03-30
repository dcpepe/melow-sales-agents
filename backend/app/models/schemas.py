from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class AnalyzeRequest(BaseModel):
    transcript: str = Field(..., min_length=50, description="Raw transcript text")
    deal_name: Optional[str] = None
    company: Optional[str] = None
    participants: Optional[str] = None


class SpeakerTurn(BaseModel):
    speaker: str  # "Melow" or "Prospect"
    text: str


class CallBreakdown(BaseModel):
    discovery_quality: int = Field(..., ge=0, le=100)
    pain_identification: int = Field(..., ge=0, le=100)
    business_impact_clarity: int = Field(..., ge=0, le=100)
    stakeholder_mapping: int = Field(..., ge=0, le=100)
    urgency_creation: int = Field(..., ge=0, le=100)
    demo_clarity: int = Field(..., ge=0, le=100)
    next_steps_strength: int = Field(..., ge=0, le=100)


class CallAnalysis(BaseModel):
    call_score: int = Field(..., ge=0, le=100)
    breakdown: CallBreakdown
    key_mistakes: list[str]
    missed_opportunities: list[str]
    open_questions: list[str]
    coaching: list[str]


class RiskLevel(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class MEDPICCCategory(BaseModel):
    score: int = Field(..., ge=0, le=5)
    summary: str
    missing_info: list[str]


class MEDPICCScoring(BaseModel):
    metrics: MEDPICCCategory
    economic_buyer: MEDPICCCategory
    decision_criteria: MEDPICCCategory
    decision_process: MEDPICCCategory
    paper_process: MEDPICCCategory
    identify_pain: MEDPICCCategory
    champion: MEDPICCCategory
    competition: MEDPICCCategory
    overall_score: float = Field(..., ge=0, le=100)
    risk_assessment: RiskLevel
    deal_probability: float = Field(..., ge=0, le=100)
    recommended_actions: list[str]


class DealRoom(BaseModel):
    id: str
    company_name: str
    meeting_summary: str
    participants: list[str]
    call_summary: str
    key_takeaways: list[str]
    pain_points: list[str]
    objectives: list[str]
    opportunities: list[str]
    next_steps: list[str]
    value_proposition: str


class AnalysisResponse(BaseModel):
    id: str
    speaker_turns: list[SpeakerTurn]
    call_analysis: CallAnalysis
    medpicc: MEDPICCScoring


class DealRoomRequest(BaseModel):
    analysis_id: str


class DealRoomResponse(BaseModel):
    deal_room: DealRoom
    shareable_url: str
