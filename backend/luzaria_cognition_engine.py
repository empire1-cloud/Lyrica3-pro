"""API for LUZARIA identity continuity, consented memory, RAG, and responses."""

from __future__ import annotations

from datetime import datetime, timezone
from hashlib import sha256
import json
import uuid
from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field

from luzaria_cognition_core import (
    build_context_packet,
    build_model_messages,
    memory_should_persist,
    retrieve_memories,
    validate_identity_kernel,
)
from luzaria_model_gateway import (
    generate_model_response,
    load_model_gateway_config,
    model_gateway_status,
)
from server import current_user, db


router = APIRouter(prefix="/api/artist-zero/cognition", tags=["artist-zero", "cognition", "rag"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


def _digest(payload: Any) -> str:
    raw = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
    return sha256(raw.encode("utf-8")).hexdigest()


MemoryType = Literal[
    "identity_canon",
    "relationship",
    "creative_memory",
    "music_canon",
    "factual_proof",
    "emotional_context",
    "fan_feedback",
    "strategy_learning",
]
TrustLabel = Literal[
    "signed_receipt",
    "approved_canon",
    "creator_confirmed",
    "system_observed",
    "public_primary_source",
    "external_unverified",
]


class IdentityKernelUpsert(BaseModel):
    blueprint_id: str = Field(min_length=3, max_length=200)
    public_name: Literal["LUZARIA"] = "LUZARIA"
    identity_mode: Literal["original_digital_artist"] = "original_digital_artist"
    core_values: List[str] = Field(min_length=3, max_length=12)
    creative_mission: str = Field(min_length=20, max_length=1500)
    emotional_principle: str = Field(min_length=10, max_length=800)
    protected_boundaries: List[str] = Field(min_length=1, max_length=30)
    synthetic_origin_disclosed: bool = True


class MemoryCreate(BaseModel):
    memory_type: MemoryType
    title: Optional[str] = Field(default=None, max_length=300)
    content: str = Field(min_length=1, max_length=8000)
    trust_label: TrustLabel
    source_reference: Optional[str] = Field(default=None, max_length=500)
    tags: List[str] = Field(default_factory=list, max_length=30)
    importance: float = Field(default=0.5, ge=0, le=1)
    explicit_consent: bool = False
    sensitivity_tags: List[str] = Field(default_factory=list, max_length=20)
    contains_secret: bool = False
    ttl_days: Optional[int] = Field(default=None, ge=1, le=3650)


class MemoryRetrieveRequest(BaseModel):
    query: str = Field(min_length=1, max_length=8000)
    top_k: int = Field(default=8, ge=1, le=20)
    minimum_score: float = Field(default=0.18, ge=0, le=1)


class ContextBuildRequest(MemoryRetrieveRequest):
    current_goal: Optional[str] = Field(default=None, max_length=1000)


class RespondRequest(ContextBuildRequest):
    temperature: float = Field(default=0.65, ge=0, le=1.5)
    max_tokens: int = Field(default=900, ge=64, le=4096)


async def _active_kernel(owner: str) -> dict[str, Any]:
    kernel = await db.luzaria_identity_kernels.find_one(
        {"owner": owner, "status": "active"}, {"_id": 0}
    )
    if not kernel:
        raise HTTPException(409, "LUZARIA identity kernel has not been activated.")
    return kernel


async def _owned_memories(owner: str) -> list[dict[str, Any]]:
    return await db.luzaria_memories.find(
        {"owner": owner, "status": "active"}, {"_id": 0, "owner": 0}
    ).sort("created_at", -1).to_list(5000)


@router.get("/status")
async def cognition_status(user: Dict = Depends(current_user)):
    kernel = await db.luzaria_identity_kernels.find_one(
        {"owner": user["handle"], "status": "active"}, {"_id": 0, "owner": 0}
    )
    memory_count = await db.luzaria_memories.count_documents(
        {"owner": user["handle"], "status": "active"}
    )
    return {
        "artist": "LUZARIA",
        "architecture": "identity_kernel_plus_consent_rag_plus_provider_independent_llm",
        "identity_kernel_active": bool(kernel),
        "memory_count": memory_count,
        "retrieval_mode": "deterministic_lexical_trust_recency_v1",
        "vector_index_configured": False,
        "model_gateway": model_gateway_status(),
        "autonomous_actions_enabled": False,
        "automatic_personal_memory_enabled": False,
    }


@router.put("/identity-kernel")
async def upsert_identity_kernel(body: IdentityKernelUpsert, user: Dict = Depends(current_user)):
    blueprint = await db.artist_zero_blueprints.find_one(
        {"id": body.blueprint_id, "owner": user["handle"]}, {"_id": 0}
    )
    if not blueprint:
        raise HTTPException(404, "Artist Zero blueprint not found.")
    if str(blueprint.get("public_name", "")).upper() != "LUZARIA":
        raise HTTPException(400, "The cognition kernel must match the LUZARIA blueprint.")

    payload = jsonable_encoder(body)
    try:
        validate_identity_kernel(payload)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc

    previous = await db.luzaria_identity_kernels.find_one(
        {"owner": user["handle"], "status": "active"}, {"_id": 0}
    )
    version = int(previous.get("version", 0)) + 1 if previous else 1
    if previous:
        await db.luzaria_identity_kernels.update_many(
            {"owner": user["handle"], "status": "active"},
            {"$set": {"status": "superseded", "superseded_at": _now()}},
        )

    kernel = {
        **payload,
        "id": _id("lzk"),
        "owner": user["handle"],
        "version": version,
        "status": "active",
        "created_at": _now(),
        "integrity_hash": _digest(payload),
    }
    await db.luzaria_identity_kernels.insert_one(kernel)
    kernel.pop("_id", None)
    kernel.pop("owner", None)
    return kernel


@router.post("/memories", status_code=201)
async def create_memory(body: MemoryCreate, user: Dict = Depends(current_user)):
    await _active_kernel(user["handle"])
    payload = jsonable_encoder(body)
    decision = memory_should_persist(payload)
    if not decision["persist"]:
        raise HTTPException(400, decision["reason"])
    if body.trust_label in {"signed_receipt", "approved_canon", "public_primary_source"} and not body.source_reference:
        raise HTTPException(400, "High-trust memory requires a source_reference.")

    memory = {
        **payload,
        "id": _id("lzm"),
        "owner": user["handle"],
        "status": "active",
        "created_at": _now(),
        "updated_at": _now(),
        "content_hash": _digest({"content": body.content, "source": body.source_reference}),
    }
    await db.luzaria_memories.insert_one(memory)
    memory.pop("_id", None)
    memory.pop("owner", None)
    return {"memory": memory, "persistence_decision": decision}


@router.post("/memories/{memory_id}/supersede")
async def supersede_memory(memory_id: str, user: Dict = Depends(current_user)):
    result = await db.luzaria_memories.update_one(
        {"id": memory_id, "owner": user["handle"], "status": "active"},
        {"$set": {"status": "superseded", "superseded": True, "superseded_at": _now()}},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Active LUZARIA memory not found.")
    return {"memory_id": memory_id, "status": "superseded"}


@router.post("/retrieve")
async def retrieve_memory(body: MemoryRetrieveRequest, user: Dict = Depends(current_user)):
    await _active_kernel(user["handle"])
    rows = await _owned_memories(user["handle"])
    retrieved = retrieve_memories(
        body.query,
        rows,
        top_k=body.top_k,
        minimum_score=body.minimum_score,
    )
    return {
        "query": body.query,
        "retrieval_mode": "deterministic_lexical_trust_recency_v1",
        "memories": retrieved,
        "count": len(retrieved),
    }


async def _build_context(body: ContextBuildRequest, owner: str) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    kernel = await _active_kernel(owner)
    rows = await _owned_memories(owner)
    retrieved = retrieve_memories(
        body.query,
        rows,
        top_k=body.top_k,
        minimum_score=body.minimum_score,
    )
    packet = build_context_packet(
        identity_kernel=kernel,
        user_message=body.query,
        retrieved_memories=retrieved,
        current_goal=body.current_goal,
    )
    return packet, retrieved


@router.post("/context")
async def build_grounded_context(body: ContextBuildRequest, user: Dict = Depends(current_user)):
    packet, _ = await _build_context(body, user["handle"])
    return packet


@router.post("/respond")
async def generate_grounded_response(body: RespondRequest, user: Dict = Depends(current_user)):
    packet, retrieved = await _build_context(body, user["handle"])
    messages = build_model_messages(packet)
    config = load_model_gateway_config()
    try:
        generation = generate_model_response(
            messages,
            config=config,
            temperature=body.temperature,
            max_tokens=body.max_tokens,
        )
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(503, str(exc)) from exc

    receipt = {
        "id": _id("lzresp"),
        "owner": user["handle"],
        "created_at": _now(),
        "input_hash": _digest(body.query),
        "response_hash": _digest(generation["text"]),
        "identity_kernel_hash": _digest(packet["identity_kernel"]),
        "memory_ids": [row.get("id") for row in retrieved],
        "model": generation["model"],
        "mode": generation["mode"],
        "autonomous_action": False,
    }
    await db.luzaria_response_receipts.insert_one(receipt)
    receipt.pop("_id", None)
    receipt.pop("owner", None)
    return {
        "artist": "LUZARIA",
        "response": generation["text"],
        "emotional_hypothesis": packet["emotional_hypothesis"],
        "grounding": {
            "memory_ids": receipt["memory_ids"],
            "identity_kernel_hash": receipt["identity_kernel_hash"],
            "uncertainty_required": True,
        },
        "receipt": receipt,
    }
