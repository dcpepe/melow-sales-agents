import uuid
from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    AnalyzeRequest,
    AnalysisResponse,
    DealRoomRequest,
    DealRoomResponse,
)
from app.agents.speaker_inference import infer_speakers, format_labeled_transcript
from app.agents.call_intelligence import analyze_call
from app.agents.medpicc import score_medpicc
from app.agents.deal_room import generate_deal_room
from app.storage.json_store import save_analysis, load_analysis, save_deal_room, load_deal_room
from app.config import BASE_URL

router = APIRouter()


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_transcript(req: AnalyzeRequest):
    # Step 1: Speaker inference
    speaker_turns = infer_speakers(req.transcript)
    labeled_transcript = format_labeled_transcript(speaker_turns)

    # Step 2: Run call analysis and MEDPICC scoring
    call_analysis = analyze_call(labeled_transcript)
    medpicc_scoring = score_medpicc(labeled_transcript)

    # Step 3: Store results
    analysis_id = str(uuid.uuid4())
    analysis_data = {
        "id": analysis_id,
        "transcript": req.transcript,
        "deal_name": req.deal_name,
        "company": req.company,
        "participants": req.participants,
        "speaker_turns": [t.model_dump() for t in speaker_turns],
        "labeled_transcript": labeled_transcript,
        "call_analysis": call_analysis.model_dump(),
        "medpicc": medpicc_scoring.model_dump(),
    }
    save_analysis(analysis_id, analysis_data)

    return AnalysisResponse(
        id=analysis_id,
        speaker_turns=speaker_turns,
        call_analysis=call_analysis,
        medpicc=medpicc_scoring,
    )


@router.post("/deal-room", response_model=DealRoomResponse)
async def create_deal_room(req: DealRoomRequest):
    analysis = load_analysis(req.analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    deal_room_id = str(uuid.uuid4())
    company = analysis.get("company") or "Unknown Company"
    participants = analysis.get("participants") or "Not specified"

    deal_room = generate_deal_room(
        deal_room_id=deal_room_id,
        labeled_transcript=analysis["labeled_transcript"],
        company_name=company,
        participants=participants,
    )

    save_deal_room(deal_room_id, deal_room.model_dump())

    return DealRoomResponse(
        deal_room=deal_room,
        shareable_url=f"{BASE_URL}/deal-room/{deal_room_id}",
    )


@router.get("/deal-room/{deal_room_id}")
async def get_deal_room(deal_room_id: str):
    data = load_deal_room(deal_room_id)
    if not data:
        raise HTTPException(status_code=404, detail="Deal room not found")
    return data


@router.get("/analysis/{analysis_id}")
async def get_analysis(analysis_id: str):
    data = load_analysis(analysis_id)
    if not data:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return data
