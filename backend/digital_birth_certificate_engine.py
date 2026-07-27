"""Public issuance and verification API for Lyrica digital birth certificates."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from digital_birth_certificate_core import (
    PUBLIC_NOTICE,
    build_digital_birth_certificate,
    verify_digital_birth_certificate,
)
from server import current_user, db


router = APIRouter(prefix="/api/artist-zero/birth-certificates", tags=["artist-zero", "birth-certificate"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class DigitalBirthCertificateCreate(BaseModel):
    blueprint_id: str = Field(min_length=3, max_length=200)
    public_name: str = Field(min_length=2, max_length=120)
    pronouns: str = Field(default="she/her", min_length=2, max_length=40)
    identity_mode: Literal["original_synthetic_artist"] = "original_synthetic_artist"
    artist_program: str = Field(default="LYRICA_ARTIST_ZERO", min_length=3, max_length=120)
    born_at: Optional[datetime] = None
    born_in: str = Field(default="Lyrica 3", min_length=2, max_length=160)
    origin_statement: str = Field(min_length=20, max_length=2000)
    creator_organization: str = Field(default="Lyrica 3", min_length=2, max_length=160)
    identity_stewards: List[str] = Field(min_length=1, max_length=20)
    core_values: List[str] = Field(min_length=3, max_length=12)
    emotional_principle: str = Field(min_length=10, max_length=500)
    creative_mission: str = Field(min_length=20, max_length=1000)
    protected_boundaries: List[str] = Field(default_factory=list, max_length=20)
    continuity_enabled: bool = True
    dignity_commitment: bool = True
    synthetic_disclosure_enabled: bool = True
    voice_rights_verified: bool = False
    visual_rights_verified: bool = False
    human_contributors_credited: bool = True
    public_disclosure: str = Field(
        default="LUZARIA is an original digital artist born in Lyrica 3. Her identity, voice, visuals, music, collaborators, and economic records are transparently documented.",
        min_length=20,
        max_length=500,
    )
    first_track_title: Optional[str] = Field(default=None, max_length=160)
    first_track_dna_tag: Optional[str] = Field(default=None, max_length=200)
    vics_receipt_id: Optional[str] = Field(default=None, max_length=200)
    split_agreement_id: Optional[str] = Field(default=None, max_length=200)


@router.post("", status_code=201)
async def issue_digital_birth_certificate(
    body: DigitalBirthCertificateCreate,
    user: Dict = Depends(current_user),
):
    blueprint = await db.artist_zero_blueprints.find_one(
        {"id": body.blueprint_id, "owner": user["handle"]}, {"_id": 0}
    )
    if not blueprint:
        raise HTTPException(404, "Artist Zero blueprint not found.")
    if blueprint.get("public_name", "").strip().lower() != body.public_name.strip().lower():
        raise HTTPException(400, "Certificate name must match the approved Artist Zero blueprint.")

    existing = await db.artist_zero_birth_certificates.find_one(
        {"blueprint_id": body.blueprint_id, "status": "active"}, {"_id": 0}
    )
    if existing:
        raise HTTPException(409, "An active birth certificate already exists for this blueprint.")

    claims = body.model_dump(mode="json")
    claims["born_at"] = body.born_at.isoformat() if body.born_at else _now()
    claims["voice_rights_verified"] = bool(
        body.voice_rights_verified and blueprint.get("voice_rights_verified")
    )
    claims["visual_rights_verified"] = bool(
        body.visual_rights_verified and blueprint.get("visual_rights_verified")
    )

    try:
        certificate = build_digital_birth_certificate(claims, issued_at=_now())
    except (ValueError, TypeError) as exc:
        raise HTTPException(400, str(exc)) from exc

    record = {
        **certificate,
        "blueprint_id": body.blueprint_id,
        "owner": user["handle"],
        "status": "active",
        "created_at": _now(),
    }
    await db.artist_zero_birth_certificates.insert_one(record)
    record.pop("_id", None)
    record.pop("owner", None)
    return record


@router.get("/{certificate_id}")
async def get_digital_birth_certificate(certificate_id: str):
    record = await db.artist_zero_birth_certificates.find_one(
        {"certificate_id": certificate_id, "status": "active"},
        {"_id": 0, "owner": 0, "blueprint_id": 0},
    )
    if not record:
        raise HTTPException(404, "Digital birth certificate not found.")
    return record


@router.get("/{certificate_id}/verify")
async def verify_public_digital_birth_certificate(certificate_id: str):
    record = await db.artist_zero_birth_certificates.find_one(
        {"certificate_id": certificate_id, "status": "active"},
        {"_id": 0, "owner": 0, "blueprint_id": 0, "status": 0, "created_at": 0},
    )
    if not record:
        raise HTTPException(404, "Digital birth certificate not found.")
    result = verify_digital_birth_certificate(record)
    return {**result, "public_notice": PUBLIC_NOTICE}
