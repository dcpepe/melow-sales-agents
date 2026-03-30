from app.agents.llm_client import call_claude
from app.prompts.templates import DEAL_ROOM_PROMPT
from app.models.schemas import DealRoom


def generate_deal_room(
    deal_room_id: str,
    labeled_transcript: str,
    company_name: str,
    participants: str,
) -> DealRoom:
    prompt = DEAL_ROOM_PROMPT.format(
        labeled_transcript=labeled_transcript,
        company_name=company_name,
        participants=participants,
    )
    result = call_claude(prompt)
    result["id"] = deal_room_id
    return DealRoom(**result)
