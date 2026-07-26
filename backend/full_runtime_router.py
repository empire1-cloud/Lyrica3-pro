"""FastAPI routes for the Lyrica 3 Full Runtime Phase 1."""
from __future__ import annotations

from pathlib import Path
from typing import Any, Callable, Dict

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from contracts.track_runtime_v1 import RuntimeJobState, TrackCreateV1
from services.lyrica_full_runtime import LyricaFullRuntime


def _public_value(value: Any) -> Any:
    """Remove server-local file paths before returning runtime documents."""
    if isinstance(value, dict):
        return {key: _public_value(item) for key, item in value.items() if key != "path"}
    if isinstance(value, list):
        return [_public_value(item) for item in value]
    return value


def build_full_runtime_router(
    *,
    db: Any,
    current_user: Callable[..., Any],
    root_dir: Path,
    logger: Any = None,
) -> APIRouter:
    router = APIRouter(prefix="/api/v2", tags=["Lyrica Full Runtime"])
    runtime = LyricaFullRuntime(db=db, root_dir=root_dir, logger=logger)

    @router.post("/tracks", status_code=status.HTTP_202_ACCEPTED)
    async def create_full_runtime_track(
        body: TrackCreateV1,
        background_tasks: BackgroundTasks,
        user: Dict[str, Any] = Depends(current_user),
    ) -> Dict[str, Any]:
        await runtime.ensure_indexes()
        creator_id = str(user.get("handle") or user.get("id") or "").strip()
        if not creator_id:
            raise HTTPException(401, "Authenticated creator identity is required.")
        job = await runtime.create_job(body, creator_id)
        if job.state not in (RuntimeJobState.COMPLETE, RuntimeJobState.FAILED):
            background_tasks.add_task(runtime.run_job, job.job_id)
        return {
            "job_id": job.job_id,
            "state": job.state.value,
            "status_url": f"/api/v2/jobs/{job.job_id}",
            "idempotency_key": job.idempotency_key,
        }

    @router.get("/jobs/{job_id}")
    async def get_full_runtime_job(
        job_id: str,
        user: Dict[str, Any] = Depends(current_user),
    ) -> Dict[str, Any]:
        job = await runtime.get_job(job_id)
        if not job:
            raise HTTPException(404, "Runtime job not found.")
        creator_id = str(user.get("handle") or user.get("id") or "")
        if creator_id != job.creator_id:
            raise HTTPException(403, "Runtime job belongs to another creator.")
        return _public_value(job.model_dump(mode="json"))

    @router.get("/tracks/{dna_tag}")
    async def get_full_runtime_track(
        dna_tag: str,
        user: Dict[str, Any] = Depends(current_user),
    ) -> Dict[str, Any]:
        track = await runtime.get_track(dna_tag)
        if not track:
            raise HTTPException(404, "DNA tag not found.")
        creator_id = str(user.get("handle") or user.get("id") or "")
        if creator_id != track.get("creator"):
            raise HTTPException(403, "Track belongs to another creator.")
        return _public_value(track)

    @router.get("/tracks/{dna_tag}/proof")
    async def get_full_runtime_proof(
        dna_tag: str,
        user: Dict[str, Any] = Depends(current_user),
    ) -> Dict[str, Any]:
        track = await runtime.get_track(dna_tag)
        if not track:
            raise HTTPException(404, "DNA tag not found.")
        creator_id = str(user.get("handle") or user.get("id") or "")
        if creator_id != track.get("creator"):
            raise HTTPException(403, "Track belongs to another creator.")
        return _public_value(
            {
                "dna_tag": track.get("dna_tag"),
                "runtime_job_id": track.get("runtime_job_id"),
                "proof": track.get("proof", {}),
                "artifacts": track.get("artifacts", {}),
                "soulfire_blueprint": track.get("soulfire_blueprint", {}),
            }
        )

    return router
