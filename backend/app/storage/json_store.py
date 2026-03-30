import json
import os
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent.parent / "data"
ANALYSES_DIR = DATA_DIR / "analyses"
DEAL_ROOMS_DIR = DATA_DIR / "deal_rooms"


def _ensure_dirs():
    ANALYSES_DIR.mkdir(parents=True, exist_ok=True)
    DEAL_ROOMS_DIR.mkdir(parents=True, exist_ok=True)


def save_analysis(analysis_id: str, data: dict):
    _ensure_dirs()
    path = ANALYSES_DIR / f"{analysis_id}.json"
    path.write_text(json.dumps(data, indent=2))


def load_analysis(analysis_id: str) -> dict | None:
    path = ANALYSES_DIR / f"{analysis_id}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text())


def save_deal_room(deal_room_id: str, data: dict):
    _ensure_dirs()
    path = DEAL_ROOMS_DIR / f"{deal_room_id}.json"
    path.write_text(json.dumps(data, indent=2))


def load_deal_room(deal_room_id: str) -> dict | None:
    path = DEAL_ROOMS_DIR / f"{deal_room_id}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text())
