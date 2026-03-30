from app.agents.llm_client import call_claude
from app.prompts.templates import SPEAKER_INFERENCE_PROMPT
from app.models.schemas import SpeakerTurn


def infer_speakers(transcript: str) -> list[SpeakerTurn]:
    prompt = SPEAKER_INFERENCE_PROMPT.format(transcript=transcript)
    result = call_claude(prompt)
    return [SpeakerTurn(**turn) for turn in result]


def format_labeled_transcript(turns: list[SpeakerTurn]) -> str:
    return "\n\n".join(f"[{t.speaker}]: {t.text}" for t in turns)
