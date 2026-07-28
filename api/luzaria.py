from __future__ import annotations

import copy
import hashlib
import hmac
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field


CANON_PATH = Path(__file__).resolve().parents[1] / "canon" / "luzaria" / "identity_v1.json"


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat()


def load_luzaria_canon() -> dict[str, Any]:
    try:
        payload = json.loads(CANON_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError("Luzaria identity canon is unavailable or invalid.") from exc

    required = {
        "schema_version",
        "artist_id",
        "name",
        "digital_birthdate",
        "created_by",
        "version",
        "identity_lock",
        "voice_identity",
        "rights",
        "launch_gates",
    }
    missing = sorted(required.difference(payload))
    if missing:
        raise RuntimeError(f"Luzaria identity canon is missing: {', '.join(missing)}")
    return payload


def canonical_identity() -> dict[str, Any]:
    return copy.deepcopy(load_luzaria_canon())


def identity_digest(identity: Optional[dict[str, Any]] = None) -> str:
    canonical = identity or load_luzaria_canon()
    body = json.dumps(canonical, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return f"lzr_sha256_{hashlib.sha256(body).hexdigest()}"


def digital_birth_certificate(identity: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    canonical = identity or load_luzaria_canon()
    return {
        "certificate_type": "Empire-1 Digital Artist Birth Certificate",
        "artist_id": canonical["artist_id"],
        "name": canonical["name"],
        "pronunciation": canonical.get("pronunciation"),
        "digital_birthdate": canonical["digital_birthdate"],
        "created_by": canonical["created_by"],
        "version": canonical["version"],
        "identity_digest": identity_digest(canonical),
        "identity_lock": copy.deepcopy(canonical["identity_lock"]),
        "rights": copy.deepcopy(canonical["rights"]),
    }


class LuzariaIdentityCheck(BaseModel):
    artist_id: Optional[str] = None
    name: Optional[str] = None
    home: Optional[str] = None
    voice_register: Optional[str] = None
    languages: list[str] = Field(default_factory=list)
    multi_persona_enabled: Optional[bool] = None


class LuzariaTrackRegistration(BaseModel):
    track_id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    dna_tag: str = Field(min_length=1)
    soulprint_hash: str = Field(min_length=1)
    vics_proof_id: str = Field(min_length=1)
    archisynapse_receipt_id: Optional[str] = None
    audio_url: Optional[str] = None
    release_status: str = "registered"
    created_at: Optional[str] = None


def evaluate_identity_drift(proposal: LuzariaIdentityCheck) -> dict[str, Any]:
    canon = load_luzaria_canon()
    violations: list[dict[str, str]] = []

    checks = (
        ("artist_id", proposal.artist_id, canon["artist_id"]),
        ("name", proposal.name, canon["name"]),
        ("home", proposal.home, canon["origin"]["home"]),
        ("voice_register", proposal.voice_register, canon["voice_identity"]["register"]),
    )
    for field, supplied, expected in checks:
        if supplied is not None and supplied.strip().casefold() != str(expected).strip().casefold():
            violations.append({"field": field, "code": "identity_drift", "expected": str(expected)})

    if proposal.multi_persona_enabled is True:
        violations.append(
            {
                "field": "multi_persona_enabled",
                "code": "multi_persona_forbidden",
                "expected": "false",
            }
        )

    if proposal.languages:
        expected_languages = {value.casefold() for value in canon["music_identity"]["languages"]}
        supplied_languages = {value.casefold() for value in proposal.languages}
        if not expected_languages.issubset(supplied_languages):
            violations.append(
                {
                    "field": "languages",
                    "code": "language_identity_incomplete",
                    "expected": ", ".join(canon["music_identity"]["languages"]),
                }
            )

    return {
        "artist_id": canon["artist_id"],
        "accepted": not violations,
        "violations": violations,
        "identity_digest": identity_digest(canon),
    }


def _proof_complete(payload: LuzariaTrackRegistration) -> bool:
    return bool(payload.track_id and payload.dna_tag and payload.soulprint_hash and payload.vics_proof_id)


async def bootstrap_luzaria_identity(db: Any, now_factory: Callable[[], datetime] = _utc_now) -> dict[str, Any]:
    canon = load_luzaria_canon()
    document = {
        **copy.deepcopy(canon),
        "identity_digest": identity_digest(canon),
        "birth_certificate": digital_birth_certificate(canon),
        "bootstrapped_at": _iso(now_factory()),
        "updated_at": _iso(now_factory()),
    }
    await db.artist_identities.update_one(
        {"artist_id": canon["artist_id"]},
        {"$setOnInsert": document, "$set": {"updated_at": document["updated_at"]}},
        upsert=True,
    )
    stored = await db.artist_identities.find_one({"artist_id": canon["artist_id"]}, {"_id": 0})
    return stored or document


async def register_catalog_track(
    db: Any,
    payload: LuzariaTrackRegistration,
    now_factory: Callable[[], datetime] = _utc_now,
) -> dict[str, Any]:
    canon = load_luzaria_canon()
    existing = await db.artist_catalog.find_one(
        {"artist_id": canon["artist_id"], "track_id": payload.track_id},
        {"_id": 0},
    )
    proposed = payload.model_dump()
    proof_fields = {
        "dna_tag": proposed["dna_tag"],
        "soulprint_hash": proposed["soulprint_hash"],
        "vics_proof_id": proposed["vics_proof_id"],
    }
    if existing:
        existing_proof = {key: existing.get(key) for key in proof_fields}
        if existing_proof != proof_fields:
            raise HTTPException(status_code=409, detail="Track proof conflicts with the registered Luzaria catalog record.")
        return existing

    registered_at = _iso(now_factory())
    document = {
        **proposed,
        "artist_id": canon["artist_id"],
        "artist_name": canon["name"],
        "identity_digest": identity_digest(canon),
        "proof_complete": _proof_complete(payload),
        "royalty_closed": bool(payload.archisynapse_receipt_id),
        "created_at": payload.created_at or registered_at,
        "registered_at": registered_at,
    }
    await db.artist_catalog.insert_one(copy.deepcopy(document))
    return document


def launch_readiness_from_counts(*, total_tracks: int, verified_tracks: int, receipted_tracks: int) -> dict[str, Any]:
    canon = load_luzaria_canon()
    gates = copy.deepcopy(canon["launch_gates"])
    if verified_tracks > 0:
        gates["first_vics_signed_track"] = "complete"
    if receipted_tracks > 0:
        gates["first_archisynapse_receipt"] = "complete"
    if total_tracks > 0:
        gates["public_catalog"] = "complete"

    required = (
        "identity_kernel",
        "digital_birth_certificate",
        "voice_canon",
        "visual_canon",
        "story_canon",
        "first_vics_signed_track",
        "first_archisynapse_receipt",
        "public_catalog",
    )
    launch_ready = all(gates.get(name) == "complete" for name in required)
    return {
        "artist_id": canon["artist_id"],
        "launch_ready": launch_ready,
        "gates": gates,
        "catalog": {
            "total_tracks": total_tracks,
            "verified_tracks": verified_tracks,
            "receipted_tracks": receipted_tracks,
        },
    }


def _default_db() -> Any:
    import server  # type: ignore

    return server.db


def _require_internal_operator(request: Request) -> None:
    allowed = {
        value.strip()
        for value in os.getenv(
            "LUZARIA_ALLOWED_SERVICES",
            "empire1-cofounder,lyrica3-backend",
        ).split(",")
        if value.strip()
    }
    service = request.headers.get("x-empire1-service", "")
    if service not in allowed:
        raise HTTPException(status_code=403, detail="Service is not allowed to modify Luzaria records.")

    expected = os.getenv("LUZARIA_INTERNAL_TOKEN", "").strip()
    if not expected:
        raise HTTPException(status_code=503, detail="Luzaria internal authentication is not configured.")
    authorization = request.headers.get("authorization", "")
    supplied = authorization.removeprefix("Bearer ").strip() if authorization.startswith("Bearer ") else ""
    if not supplied or not hmac.compare_digest(supplied, expected):
        raise HTTPException(status_code=401, detail="Invalid Luzaria operator credentials.")


async def _catalog_counts(db: Any) -> tuple[int, int, int]:
    artist_id = load_luzaria_canon()["artist_id"]
    total = await db.artist_catalog.count_documents({"artist_id": artist_id})
    verified = await db.artist_catalog.count_documents({"artist_id": artist_id, "proof_complete": True})
    receipted = await db.artist_catalog.count_documents({"artist_id": artist_id, "royalty_closed": True})
    return total, verified, receipted


def create_luzaria_router(db_provider: Optional[Callable[[], Any]] = None) -> APIRouter:
    router = APIRouter(tags=["luzaria"])
    db_provider = db_provider or _default_db

    @router.get("/artist/luzaria")
    async def get_artist():
        db = db_provider()
        total, verified, receipted = await _catalog_counts(db)
        return {
            "artist": canonical_identity(),
            "identity_digest": identity_digest(),
            "birth_certificate": digital_birth_certificate(),
            "launch_readiness": launch_readiness_from_counts(
                total_tracks=total,
                verified_tracks=verified,
                receipted_tracks=receipted,
            ),
        }

    @router.get("/artist/luzaria/birth-certificate")
    async def get_birth_certificate():
        return digital_birth_certificate()

    @router.post("/artist/luzaria/validate-identity")
    async def validate_identity(payload: LuzariaIdentityCheck):
        return evaluate_identity_drift(payload)

    @router.get("/artist/luzaria/catalog")
    async def get_catalog():
        db = db_provider()
        artist_id = load_luzaria_canon()["artist_id"]
        cursor = db.artist_catalog.find({"artist_id": artist_id}, {"_id": 0}).sort("registered_at", -1)
        tracks = await cursor.to_list(length=100)
        return {"artist_id": artist_id, "tracks": tracks, "count": len(tracks)}

    @router.get("/artist/luzaria/launch-readiness")
    async def get_launch_readiness():
        db = db_provider()
        total, verified, receipted = await _catalog_counts(db)
        return launch_readiness_from_counts(
            total_tracks=total,
            verified_tracks=verified,
            receipted_tracks=receipted,
        )

    @router.post("/internal/v1/artist/luzaria/bootstrap")
    async def bootstrap(request: Request):
        _require_internal_operator(request)
        return await bootstrap_luzaria_identity(db_provider())

    @router.post("/internal/v1/artist/luzaria/catalog")
    async def register_track(payload: LuzariaTrackRegistration, request: Request):
        _require_internal_operator(request)
        return await register_catalog_track(db_provider(), payload)

    return router
