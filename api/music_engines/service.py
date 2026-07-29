from __future__ import annotations

import asyncio
import copy
import json
import os
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Optional

from fastapi import HTTPException

from .models import EngineExecutionPlan, EngineJobRecord, MusicEngineRequest
from .registry import provider_registry
from .routing import build_execution_plan


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _provider_endpoint(provider_id: str) -> tuple[str, str]:
    spec = provider_registry()[provider_id]
    endpoint = os.getenv(spec["endpoint_env"], "").strip().rstrip("/")
    token = os.getenv(spec["token_env"], "").strip()
    return endpoint, token


def configured_provider_status() -> dict[str, dict[str, Any]]:
    status: dict[str, dict[str, Any]] = {}
    for provider_id, spec in provider_registry().items():
        endpoint, token = _provider_endpoint(provider_id)
        status[provider_id] = {
            "configured": bool(endpoint),
            "authenticated": bool(token),
            "endpoint_env": spec["endpoint_env"],
            "token_env": spec["token_env"],
            "role": spec["role"],
        }
    return status


def _post_json(url: str, payload: dict[str, Any], token: str, timeout_seconds: int = 30) -> dict[str, Any]:
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    headers = {
        "content-type": "application/json",
        "accept": "application/json",
        "x-empire1-service": "lyrica3",
    }
    if token:
        headers["authorization"] = f"Bearer {token}"
    request = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            raw = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:2000]
        raise RuntimeError(f"provider returned HTTP {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"provider connection failed: {exc.reason}") from exc
    try:
        value = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError("provider returned invalid JSON") from exc
    if not isinstance(value, dict):
        raise RuntimeError("provider response must be a JSON object")
    return value


async def dispatch_provider_job(provider_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    endpoint, token = _provider_endpoint(provider_id)
    if not endpoint:
        return {
            "provider_id": provider_id,
            "status": "blocked_configuration",
            "reason": f"{provider_registry()[provider_id]['endpoint_env']} is not configured",
        }
    try:
        response = await asyncio.to_thread(
            _post_json,
            f"{endpoint}/v1/jobs",
            payload,
            token,
        )
    except RuntimeError as exc:
        return {
            "provider_id": provider_id,
            "status": "dispatch_failed",
            "reason": str(exc),
        }
    return {
        "provider_id": provider_id,
        "status": "dispatched",
        "provider_response": response,
    }


def _candidate_stage(plan: EngineExecutionPlan):
    for stage in plan.stages:
        if stage.stage_id in {"candidate_generation", "voice_precision"}:
            return stage
    return None


async def create_engine_job(
    db: Any,
    request: MusicEngineRequest,
    *,
    now_factory: Callable[[], str] = _utc_now,
    dispatch: bool = True,
) -> EngineJobRecord:
    plan = build_execution_plan(request)
    created_at = now_factory()
    job_id = f"mej_{uuid.uuid4().hex}"
    record = EngineJobRecord(
        job_id=job_id,
        status="planned",
        created_at=created_at,
        updated_at=created_at,
        request=request.model_dump(mode="json"),
        plan=plan.model_dump(mode="json"),
        dispatches=[],
    )
    document = record.model_dump(mode="json")
    await db.music_engine_jobs.insert_one(copy.deepcopy(document))

    stage = _candidate_stage(plan)
    if not dispatch or stage is None:
        return record

    dispatches = await asyncio.gather(
        *[
            dispatch_provider_job(provider_id, stage.payloads[provider_id])
            for provider_id in stage.providers
            if provider_id in stage.payloads
        ]
    )
    configured_dispatches = [item for item in dispatches if item["status"] == "dispatched"]
    failed_dispatches = [item for item in dispatches if item["status"] == "dispatch_failed"]
    if configured_dispatches:
        status = "dispatched"
    elif failed_dispatches:
        status = "dispatch_failed"
    else:
        status = "blocked_configuration"

    updated_at = now_factory()
    await db.music_engine_jobs.update_one(
        {"job_id": job_id},
        {
            "$set": {
                "status": status,
                "dispatches": copy.deepcopy(dispatches),
                "updated_at": updated_at,
            }
        },
    )
    document.update({"status": status, "dispatches": dispatches, "updated_at": updated_at})
    return EngineJobRecord(**document)


async def get_engine_job(db: Any, job_id: str) -> dict[str, Any]:
    document = await db.music_engine_jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not document:
        raise HTTPException(status_code=404, detail="Music-engine job not found.")
    return document


async def record_provider_result(
    db: Any,
    *,
    job_id: str,
    provider_id: str,
    result: dict[str, Any],
    now_factory: Callable[[], str] = _utc_now,
) -> dict[str, Any]:
    job = await get_engine_job(db, job_id)
    planned_providers = {
        provider_id_value
        for stage in job.get("plan", {}).get("stages", [])
        for provider_id_value in stage.get("providers", [])
    }
    if provider_id not in planned_providers:
        raise HTTPException(status_code=409, detail="Provider was not part of the approved execution plan.")

    output_url = result.get("output_url")
    output_sha256 = result.get("output_sha256")
    if not isinstance(output_url, str) or not output_url:
        raise HTTPException(status_code=422, detail="Provider result requires an output URL.")
    if not isinstance(output_sha256, str) or not output_sha256.startswith("sha256_"):
        raise HTTPException(status_code=422, detail="Provider result requires a SHA-256 content binding.")

    provider_result = {
        "provider_id": provider_id,
        "received_at": now_factory(),
        "output_url": output_url,
        "output_sha256": output_sha256,
        "duration_seconds": result.get("duration_seconds"),
        "metadata": result.get("metadata", {}),
        "status": "candidate_received",
    }
    await db.music_engine_jobs.update_one(
        {"job_id": job_id},
        {
            "$push": {"provider_results": copy.deepcopy(provider_result)},
            "$set": {"status": "candidate_received", "updated_at": provider_result["received_at"]},
        },
    )
    return provider_result
