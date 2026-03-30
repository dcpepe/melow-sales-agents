from app.agents.llm_client import call_claude
from app.prompts.templates import CALL_ANALYSIS_PROMPT
from app.models.schemas import CallAnalysis


def analyze_call(labeled_transcript: str) -> CallAnalysis:
    prompt = CALL_ANALYSIS_PROMPT.format(labeled_transcript=labeled_transcript)
    result = call_claude(prompt)
    return CallAnalysis(**result)
