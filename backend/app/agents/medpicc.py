from app.agents.llm_client import call_claude
from app.prompts.templates import MEDPICC_PROMPT
from app.models.schemas import MEDPICCScoring


def score_medpicc(labeled_transcript: str) -> MEDPICCScoring:
    prompt = MEDPICC_PROMPT.format(labeled_transcript=labeled_transcript)
    result = call_claude(prompt)
    return MEDPICCScoring(**result)
