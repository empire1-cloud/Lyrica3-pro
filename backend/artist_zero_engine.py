"""API for Lyrica's Artist Zero program and evidence-backed strategy engine."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field

from artist_zero_core import (
    REQUIRED_DISCLOSURE,
    artist_zero_kpis,
    build_artist_zero_launch_plan,
    rank_strategy_moves,
    release_readiness,
    validate_artist_blueprint,
    validate_track_splits,
)
from server import current_user, db

router = APIRouter(prefix="/api/artist-zero", tags=["artist-zero", "strategy"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


class ArtistZeroBlueprintCreate(BaseModel):
    public_name: str = Field(min_length=2, max_length=120)
    identity_mode: Literal["original_synthetic_artist"] = "original_synthetic_artist"
    biography: str = Field(min_length=20, max_length=4000)
    brand_pillars: List[str] = Field(min_length=3, max_length=8)
    musical_world: List[str] = Field(min_length=2, max_length=20)
    visual_world: List[str] = Field(min_length=2, max_length=20)
    audience_thesis: str = Field(min_length=20, max_length=2000)
    synthetic_disclosure_enabled: bool = True
    voice_rights_verified: bool = False
    visual_rights_verified: bool = False
    cultural_review_required: bool = True
    persona_status: Literal["concept", "development", "release_candidate", "active", "retired"] = "concept"
    notes: Optional[str] = None


class StrategyCandidate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    description: str = Field(min_length=10, max_length=2000)
    brand_fit: float = Field(ge=0, le=5)
    proof_value: float = Field(ge=0, le=5)
    audience_demand: float = Field(ge=0, le=5)
    conversion_path: float = Field(ge=0, le=5)
    repeatability: float = Field(ge=0, le=5)
    revenue_potential: float = Field(ge=0, le=5)
    evidence_quality: float = Field(ge=0, le=5)
    risk: float = Field(default=0, ge=0, le=5)
    has_measurement_plan: bool = False
    has_owner: bool = False


class StrategyRankRequest(BaseModel):
    mission: str = Field(min_length=10, max_length=1000)
    candidates: List[StrategyCandidate] = Field(min_length=1, max_length=50)


class SplitRow(BaseModel):
    payee: str = Field(min_length=1, max_length=160)
    role: str = Field(min_length=1, max_length=100)
    share_bps: int = Field(ge=0, le=10000)


class ArtistZeroReleaseCandidate(BaseModel):
    blueprint_id: str
    title: str = Field(min_length=1, max_length=160)
    track_dna_tag: str
    vics_receipt_id: Optional[str] = None
    split_agreement_id: Optional[str] = None
    contributors: List[SplitRow] = Field(min_length=1, max_length=100)
    identity_mode: Literal["original_synthetic_artist"] = "original_synthetic_artist"
    synthetic_disclosure_enabled: bool = True
    voice_rights_verified: bool = False
    visual_rights_verified: bool = False
    cultural_review_status: Literal["pending", "approved", "rejected"] = "pending"
    content_approval_status: Literal["pending", "approved", "rejected"] = "pending"
    smart_link_id: Optional[str] = None
    conversion_tracking_ready: bool = False


class LaunchPlanRequest(BaseModel):
    public_name: str = Field(min_length=2, max_length=120)
    debut_track_title: str = Field(min_length=1, max_length=160)
    primary_goal: str = Field(
        default="prove creator-owned AI music can build real fans and verified revenue",
        min_length=10,
        max_length=500,
    )


@router.post("/blueprints", status_code=201)
async def create_artist_zero_blueprint(
    body: ArtistZeroBlueprintCreate,
    user: Dict = Depends(current_user),
):
    data = jsonable_encoder(body)
    try:
        validate_artist_blueprint(data)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc

    blueprint = {
        **data,
        "id": _id("azbp"),
        "owner": user["handle"],
        "program": "LYRICA_ARTIST_ZERO",
        "mandatory_disclosure": REQUIRED_DISCLOSURE,
        "created_at": _now(),
        "updated_at": _now(),
        "world_first_claim_allowed": False,
    }
    await db.artist_zero_blueprints.insert_one(blueprint)
    blueprint.pop("_id", None)
    return blueprint


@router.get("/blueprints")
async def list_artist_zero_blueprints(user: Dict = Depends(current_user)):
    rows = await db.artist_zero_blueprints.find(
        {"owner": user["handle"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return {"blueprints": rows, "count": len(rows)}


@router.post("/strategy/rank")
async def rank_artist_zero_strategy(
    body: StrategyRankRequest,
    user: Dict = Depends(current_user),
):
    ranked = rank_strategy_moves([jsonable_encoder(row) for row in body.candidates])
    result = {
        "id": _id("strat"),
        "owner": user["handle"],
        "mission": body.mission,
        "ranked_candidates": ranked,
        "recommended_next_move": ranked[0] if ranked else None,
        "created_at": _now(),
    }
    await db.artist_zero_strategy_runs.insert_one(result)
    result.pop("_id", None)
    return result


@router.post("/launch-plan")
async def build_launch_plan(body: LaunchPlanRequest, user: Dict = Depends(current_user)):
    plan = build_artist_zero_launch_plan(
        public_name=body.public_name,
        debut_track_title=body.debut_track_title,
        primary_goal=body.primary_goal,
    )
    record = {
        "id": _id("azplan"),
        "owner": user["handle"],
        "created_at": _now(),
        **plan,
    }
    await db.artist_zero_launch_plans.insert_one(record)
    record.pop("_id", None)
    return record


@router.post("/release-readiness")
async def check_artist_zero_release(
    body: ArtistZeroReleaseCandidate,
    user: Dict = Depends(current_user),
):
    blueprint = await db.artist_zero_blueprints.find_one(
        {"id": body.blueprint_id, "owner": user["handle"]}, {"_id": 0}
    )
    if not blueprint:
        raise HTTPException(404, "Artist Zero blueprint not found.")

    participants = [jsonable_encoder(row) for row in body.contributors]
    try:
        validate_track_splits(participants)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc

    payload = jsonable_encoder(body)
    payload["voice_rights_verified"] = bool(
        body.voice_rights_verified and blueprint.get("voice_rights_verified")
    )
    payload["visual_rights_verified"] = bool(
        body.visual_rights_verified and blueprint.get("visual_rights_verified")
    )
    readiness = release_readiness(payload)
    record = {
        "id": _id("azrel"),
        "owner": user["handle"],
        "blueprint_id": body.blueprint_id,
        "title": body.title,
        "readiness": readiness,
        "contributors": participants,
        "checked_at": _now(),
    }
    await db.artist_zero_release_checks.insert_one(record)
    record.pop("_id", None)
    return record


@router.get("/kpis")
async def get_artist_zero_kpis(user: Dict = Depends(current_user)):
    return {
        "program": "LYRICA_ARTIST_ZERO",
        "owner": user["handle"],
        "north_star": "verified_fans_who_complete_a_creator_or_revenue_action",
        "kpis": artist_zero_kpis(),
    }
