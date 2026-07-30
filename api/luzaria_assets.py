from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter


CANON_ROOT = Path(__file__).resolve().parents[1] / "canon" / "luzaria"
ASSET_PATHS = {
    "identity": CANON_ROOT / "identity_v1.json",
    "voice_model": CANON_ROOT / "voice_model_v0.json",
    "voice_influence_guardrails": CANON_ROOT / "voice_influence_guardrails_v1.json",
    "vocal_stack": CANON_ROOT / "vocal_stack_v1.json",
    "genre_matrix": CANON_ROOT / "genre_matrix_v1.json",
    "wardrobe": CANON_ROOT / "wardrobe_v1.json",
    "track_payload_template": CANON_ROOT / "track_payload_template_v1.json",
    "first_release": CANON_ROOT / "releases" / "sleep_on_the_floor_v1.json",
    "first_release_arrangement": CANON_ROOT / "releases" / "sleep_on_the_floor_arrangement_v1.json",
    "corrido_voice_calibration": CANON_ROOT / "voice_calibration_corrido_v1.json",
}


def _load_json(path: Path, label: str) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"{label} is unavailable or invalid.") from exc
    if not isinstance(payload, dict):
        raise RuntimeError(f"{label} must be a JSON object.")
    return payload


def _digest(prefix: str, payload: dict[str, Any]) -> str:
    body = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return f"{prefix}{hashlib.sha256(body).hexdigest()}"


def load_luzaria_asset(name: str) -> dict[str, Any]:
    if name not in ASSET_PATHS:
        raise KeyError(f"Unknown Luzaria asset: {name}")
    payload = _load_json(ASSET_PATHS[name], f"Luzaria {name.replace('_', ' ')} canon")
    identity = _load_json(ASSET_PATHS["identity"], "Luzaria identity canon")
    expected_artist_id = identity["artist_id"]
    supplied_artist_id = payload.get("artist_id")
    if supplied_artist_id is not None and supplied_artist_id != expected_artist_id:
        raise RuntimeError(f"Luzaria {name.replace('_', ' ')} is not bound to the locked artist identity.")
    return payload


def voice_system_snapshot() -> dict[str, Any]:
    model = load_luzaria_asset("voice_model")
    guardrails = load_luzaria_asset("voice_influence_guardrails")
    stack = load_luzaria_asset("vocal_stack")
    matrix = load_luzaria_asset("genre_matrix")
    return {
        "artist_id": model["artist_id"],
        "voice_model_id": model["voice_model_id"],
        "vocal_north_star": model["identity_constraints"].get("vocal_north_star", "Velvet Grit"),
        "voice_model_digest": _digest("lzr_voice_sha256_", model),
        "voice_model": copy.deepcopy(model),
        "influence_guardrails": copy.deepcopy(guardrails),
        "vocal_stack": copy.deepcopy(stack),
        "genre_matrix": copy.deepcopy(matrix),
        "truth_boundary": {
            "original_mathematical_synthesis": model["ownership"]["source"] == "original mathematical synthesis",
            "uses_human_voice_recordings": model["ownership"]["uses_human_voice_recordings"],
            "uses_licensed_seed_voice": model["ownership"]["uses_licensed_seed_voice"],
            "celebrity_similarity_targeting": model["ownership"]["celebrity_similarity_targeting"],
            "full_lyric_intelligibility": model["status"]["full_lyric_intelligibility"],
            "release_master_approved": model["status"]["release_master_approved"],
        },
    }


def first_release_creative_snapshot() -> dict[str, Any]:
    release = load_luzaria_asset("first_release")
    arrangement = load_luzaria_asset("first_release_arrangement")
    wardrobe = load_luzaria_asset("wardrobe")
    return {
        "artist_id": release["artist_id"],
        "release_id": release["release_id"],
        "title": release["title"],
        "release_digest": _digest("lzr_release_sha256_", release),
        "arrangement_digest": _digest("lzr_arrangement_sha256_", arrangement),
        "release": copy.deepcopy(release),
        "arrangement": copy.deepcopy(arrangement),
        "wardrobe": copy.deepcopy(wardrobe["eras"]["sleep_on_the_floor"]),
    }


def create_luzaria_assets_router() -> APIRouter:
    router = APIRouter(tags=["luzaria-assets"])

    @router.get("/artist/luzaria/voice-system")
    async def get_voice_system():
        return voice_system_snapshot()

    @router.get("/artist/luzaria/wardrobe")
    async def get_wardrobe():
        wardrobe = load_luzaria_asset("wardrobe")
        return {
            "artist_id": wardrobe["artist_id"],
            "wardrobe_digest": _digest("lzr_wardrobe_sha256_", wardrobe),
            "wardrobe": wardrobe,
        }

    @router.get("/artist/luzaria/genre-matrix")
    async def get_genre_matrix():
        matrix = load_luzaria_asset("genre_matrix")
        return {
            "artist_id": matrix["artist_id"],
            "matrix_digest": _digest("lzr_genre_sha256_", matrix),
            "genre_matrix": matrix,
        }

    @router.get("/artist/luzaria/releases/first/creative-system")
    async def get_first_release_creative_system():
        return first_release_creative_snapshot()

    @router.get("/artist/luzaria/track-payload-template")
    async def get_track_payload_template():
        payload = load_luzaria_asset("track_payload_template")
        return {
            "artist_id": payload["artist_id"],
            "template_digest": _digest("lzr_payload_sha256_", payload),
            "template": payload,
        }

    return router
