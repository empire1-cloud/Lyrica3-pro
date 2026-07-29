from __future__ import annotations

import hmac
import os
from typing import Any, Callable, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field

from .models import MusicEngineRequest
from .registry import load_registry
from .routing import build_execution_plan
from .service import (
    configured_provider_status,
    create_engine_job,
    get_engine_job,
    record_provider_result,
)


class ProviderResultRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    output_url: str = Field(min_length=1, max_length=2000)
    output_sha256: str = Field(min_length=8, max_length=200)
    duration_seconds: Optional[float] = Field(default=None, gt=0, le=3600)
    metadata: dict[str, Any] = Field(default_factory=dict)


def _default_db() -> Any:
    import server  # type: ignore

    return server.db


def _require_engine_operator(request: Request) -> None:
    allowed_services = {
        value.strip()
        for value in os.getenv(
            "LYRICA_MUSIC_ENGINE_ALLOWED_SERVICES",
            "empire1-cofounder,lyrica3-backend,music-engine-worker",
        ).split(",")
        if value.strip()
    }
    service = request.headers.get("x-empire1-service", "")
    if service not in allowed_services:
        raise HTTPException(status_code=403, detail="Service is not allowed to operate music engines.")

    expected = os.getenv("LYRICA_MUSIC_ENGINE_TOKEN", "").strip()
    if not expected:
        raise HTTPException(status_code=503, detail="Music-engine authentication is not configured.")
    authorization = request.headers.get("authorization", "")
    supplied = authorization.removeprefix("Bearer ").strip() if authorization.startswith("Bearer ") else ""
    if not supplied or not hmac.compare_digest(supplied, expected):
        raise HTTPException(status_code=401, detail="Invalid music-engine credentials.")


def _public_registry() -> dict[str, Any]:
    registry = load_registry()
    providers: dict[str, Any] = {}
    for provider_id, spec in registry["providers"].items():
        providers[provider_id] = {
            "display_name": spec["display_name"],
            "role": spec["role"],
            "license": spec["license"],
            "source_repository": spec["source_repository"],
            "capabilities": spec["capabilities"],
            "constraints": spec["constraints"],
        }
    return {
        "registry_id": registry["registry_id"],
        "ownership_rule": registry["ownership_rule"],
        "providers": providers,
        "default_pipeline": registry["default_pipeline"],
    }


def create_music_engine_router(db_provider: Optional[Callable[[], Any]] = None) -> APIRouter:
    router = APIRouter(tags=["music-engines"])
    db_provider = db_provider or _default_db

    @router.get("/music-engines")
    async def get_music_engines():
        return _public_registry()

    @router.post("/music-engines/plan")
    async def plan_music_engines(payload: MusicEngineRequest):
        return build_execution_plan(payload)

    @router.get("/internal/v1/music-engines/configuration")
    async def get_music_engine_configuration(request: Request):
        _require_engine_operator(request)
        return configured_provider_status()

    @router.post("/internal/v1/music-engines/jobs")
    async def create_job(payload: MusicEngineRequest, request: Request, dispatch: bool = True):
        _require_engine_operator(request)
        return await create_engine_job(db_provider(), payload, dispatch=dispatch)

    @router.get("/internal/v1/music-engines/jobs/{job_id}")
    async def get_job(job_id: str, request: Request):
        _require_engine_operator(request)
        return await get_engine_job(db_provider(), job_id)

    @router.post("/internal/v1/music-engines/jobs/{job_id}/providers/{provider_id}/result")
    async def provider_result(
        job_id: str,
        provider_id: str,
        payload: ProviderResultRequest,
        request: Request,
    ):
        _require_engine_operator(request)
        return await record_provider_result(
            db_provider(),
            job_id=job_id,
            provider_id=provider_id,
            result=payload.model_dump(mode="json"),
        )

    return router
