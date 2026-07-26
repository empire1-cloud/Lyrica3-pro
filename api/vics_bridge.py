"""Authenticated Lyrica VICS proof bridge for Archisynapse v2.

This module deliberately separates proof issuance from proof verification:

- issuance binds a persisted track to the actual local audio bytes, creator,
  creative DNA tag, and a stable VICS proof id;
- verification is read-only and fails closed on missing, revoked, expired,
  malformed, mismatched, or incorrectly signed proof records.

Archisynapse receives only an authenticated yes/no verification response. The
Lyrica proof-signing secret never leaves this service.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict


SERVICE_NAME = "archisynapse-v2"
PROOF_SCHEMA_VERSION = "1.0"


class VicsProofRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    track_id: str
    dna_tag: str
    soulprint_hash: str
    vics_proof_id: str
    creator_id: str


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _canonical_bytes(payload: dict[str, Any]) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")


def _proof_signing_key() -> bytes:
    value = os.getenv("LYRICA_VICS_PROOF_SIGNING_KEY", "").strip()
    if len(value) < 32:
        raise HTTPException(
            status_code=503,
            detail="VICS proof signing is not configured.",
        )
    return value.encode("utf-8")


def _service_token() -> str:
    value = os.getenv("LYRICA_VICS_SERVICE_TOKEN", "").strip()
    if not value:
        raise HTTPException(
            status_code=503,
            detail="VICS service authentication is not configured.",
        )
    return value


def _sign_proof(proof_without_signature: dict[str, Any]) -> str:
    digest = hmac.new(
        _proof_signing_key(),
        _canonical_bytes(proof_without_signature),
        hashlib.sha256,
    ).hexdigest()
    return f"vics_hmac_sha256_{digest}"


def _verify_proof_signature(proof: dict[str, Any]) -> bool:
    signature = proof.get("signature")
    if not isinstance(signature, str) or not signature.startswith("vics_hmac_sha256_"):
        return False
    unsigned = {key: value for key, value in proof.items() if key != "signature"}
    try:
        expected = _sign_proof(unsigned)
    except HTTPException:
        return False
    return hmac.compare_digest(signature, expected)


def _stable_creator_id(handle: str) -> str:
    digest = hashlib.sha256(handle.strip().lower().encode("utf-8")).hexdigest()
    return f"cre_{digest[:20]}"


def _stable_track_id(source_id: str, dna_tag: str) -> str:
    """Return the canonical trk_ identity without rewriting the legacy id."""
    if source_id.startswith("trk_"):
        return source_id
    digest = hashlib.sha256(f"{source_id}|{dna_tag}".encode("utf-8")).hexdigest()
    return f"trk_{digest[:20]}"


def _stable_proof_id(track_id: str, dna_tag: str, soulprint_hash: str, creator_id: str) -> str:
    seed = f"{track_id}|{dna_tag}|{soulprint_hash}|{creator_id}".encode("utf-8")
    return f"vics_{hashlib.sha256(seed).hexdigest()[:24]}"


def _hash_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as audio_file:
        for chunk in iter(lambda: audio_file.read(1024 * 1024), b""):
            digest.update(chunk)
    return f"sp_sha256_{digest.hexdigest()}"


def _candidate_audio_paths(track: dict[str, Any], root_dir: Path, music_output_dir: Path) -> list[Path]:
    candidates: list[Path] = []
    source_id = str(track.get("id") or "")
    if source_id:
        track_dir = music_output_dir / source_id
        candidates.extend(sorted(track_dir.glob("*.mp3")))
        candidates.extend(sorted(track_dir.glob("*.wav")))

    for value in (
        track.get("synth_source_url"),
        track.get("audio_url"),
        *[stem.get("src") for stem in track.get("stems", []) if isinstance(stem, dict)],
    ):
        if not isinstance(value, str) or not value.startswith("/api/static/"):
            continue
        relative = value.removeprefix("/api/static/")
        candidates.append(root_dir / "static" / relative)

    seen: set[str] = set()
    unique: list[Path] = []
    for candidate in candidates:
        key = str(candidate)
        if key not in seen:
            seen.add(key)
            unique.append(candidate)
    return unique


def _resolve_audio_path(track: dict[str, Any], root_dir: Path, music_output_dir: Path) -> Path:
    for candidate in _candidate_audio_paths(track, root_dir, music_output_dir):
        if candidate.is_file():
            return candidate
    raise HTTPException(
        status_code=422,
        detail="Track audio is unavailable; ownership proof cannot be issued.",
    )


def _not_expired(expires_at: object) -> bool:
    if expires_at in (None, ""):
        return True
    if not isinstance(expires_at, str):
        return False
    try:
        expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
    except ValueError:
        return False
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    return expiry > datetime.now(timezone.utc)


def _proof_is_valid(proof: object) -> bool:
    if not isinstance(proof, dict):
        return False
    if proof.get("schema_version") != PROOF_SCHEMA_VERSION:
        return False
    if proof.get("revoked") is True or proof.get("revoked_at"):
        return False
    if not _not_expired(proof.get("expires_at")):
        return False
    required = ("proof_id", "track_id", "dna_tag", "soulprint_hash", "creator_id", "issued_at")
    if any(not isinstance(proof.get(field), str) or not proof.get(field) for field in required):
        return False
    return _verify_proof_signature(proof)


async def issue_track_proof(
    *,
    db: Any,
    track_id: str,
    root_dir: Path,
    music_output_dir: Path,
) -> dict[str, Any]:
    track = await db.tracks.find_one(
        {
            "$or": [
                {"id": track_id},
                {"canonical_track_id": track_id},
                {"dna_tag": track_id},
            ]
        },
        {"_id": 0},
    )
    if not track:
        raise HTTPException(status_code=404, detail="Track not found.")

    existing = track.get("vics_proof")
    if _proof_is_valid(existing):
        return existing

    audio_path = _resolve_audio_path(track, root_dir, music_output_dir)
    soulprint_hash = _hash_file(audio_path)
    source_record_id = str(track.get("id") or "")
    dna_tag = str(track.get("dna_tag") or "")
    creator_handle = str(track.get("creator") or "")
    if not source_record_id or not dna_tag or not creator_handle:
        raise HTTPException(status_code=422, detail="Track identity is incomplete.")

    canonical_track_id = str(
        track.get("canonical_track_id") or _stable_track_id(source_record_id, dna_tag)
    )
    creator_id = str(track.get("creator_id") or _stable_creator_id(creator_handle))
    proof_id = _stable_proof_id(canonical_track_id, dna_tag, soulprint_hash, creator_id)
    proof: dict[str, Any] = {
        "schema_version": PROOF_SCHEMA_VERSION,
        "proof_id": proof_id,
        "track_id": canonical_track_id,
        "source_record_id": source_record_id,
        "dna_tag": dna_tag,
        "soulprint_hash": soulprint_hash,
        "creator_id": creator_id,
        "identity_ref": f"sla113://identity/{creator_id}",
        "issued_at": _utc_now(),
        "expires_at": None,
        "revoked": False,
    }
    proof["signature"] = _sign_proof(proof)

    await db.tracks.update_one(
        {"id": source_record_id},
        {
            "$set": {
                "canonical_track_id": canonical_track_id,
                "creator_id": creator_id,
                "soulprint_hash": soulprint_hash,
                "vics_proof": proof,
                "proof_status": "verified",
                "proof_updated_at": proof["issued_at"],
            }
        },
    )
    return proof


async def verify_track_proof(*, db: Any, request: VicsProofRequest) -> dict[str, Any]:
    track = await db.tracks.find_one(
        {
            "$or": [
                {"id": request.track_id},
                {"canonical_track_id": request.track_id},
                {"dna_tag": request.dna_tag},
            ]
        },
        {"_id": 0},
    )
    if not track:
        raise HTTPException(status_code=404, detail="Track proof not found.")

    proof = track.get("vics_proof")
    if not _proof_is_valid(proof):
        raise HTTPException(status_code=422, detail="Track proof is invalid.")

    expected = {
        "track_id": request.track_id,
        "dna_tag": request.dna_tag,
        "soulprint_hash": request.soulprint_hash,
        "proof_id": request.vics_proof_id,
        "creator_id": request.creator_id,
    }
    if any(proof.get(field) != value for field, value in expected.items()):
        raise HTTPException(status_code=422, detail="Track proof binding mismatch.")

    return {
        "verified": True,
        "revoked": False,
        "track_id": proof["track_id"],
        "dna_tag": proof["dna_tag"],
        "soulprint_hash": proof["soulprint_hash"],
        "vics_proof_id": proof["proof_id"],
        "creator_id": proof["creator_id"],
        "issued_at": proof["issued_at"],
        "expires_at": proof.get("expires_at"),
    }


def _default_context() -> tuple[Any, Path, Path]:
    # Imported lazily to avoid a circular import while backend/server.py mounts
    # api.main as a sub-application near the end of module initialization.
    import server  # type: ignore

    return server.db, Path(server.ROOT_DIR), Path(server.MUSIC_OUTPUT_DIR)


def _require_archisynapse(request: Request) -> None:
    if request.headers.get("x-empire1-service") != SERVICE_NAME:
        raise HTTPException(status_code=403, detail="Unknown Empire-1 service.")
    authorization = request.headers.get("authorization", "")
    supplied = authorization.removeprefix("Bearer ").strip() if authorization.startswith("Bearer ") else ""
    if not supplied or not hmac.compare_digest(supplied, _service_token()):
        raise HTTPException(status_code=401, detail="Invalid service credentials.")


def create_vics_router(
    context_provider: Optional[Callable[[], tuple[Any, Path, Path]]] = None,
) -> APIRouter:
    router = APIRouter(prefix="/internal/v1/vics", tags=["internal-vics"])
    context_provider = context_provider or _default_context

    @router.post("/issue/{track_id}")
    async def issue(track_id: str, http_request: Request):
        _require_archisynapse(http_request)
        db, root_dir, music_output_dir = context_provider()
        proof = await issue_track_proof(
            db=db,
            track_id=track_id,
            root_dir=root_dir,
            music_output_dir=music_output_dir,
        )
        return {"issued": True, "proof": proof}

    @router.post("/verify")
    async def verify(payload: VicsProofRequest, http_request: Request):
        _require_archisynapse(http_request)
        db, _, _ = context_provider()
        return await verify_track_proof(db=db, request=payload)

    return router
