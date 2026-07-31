from __future__ import annotations

import hmac
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from .adapters import (
    DemucsAdapter,
    OpenVoiceV2Adapter,
    SeedVcAdapter,
    WorkerConfig,
    WorkerConfigurationError,
    WorkerExecutionError,
    require_inside_audio_root,
    sha256_file,
)


class SeedVcRequest(BaseModel):
    source_path: str = Field(min_length=1, max_length=2000)
    reference_path: str = Field(min_length=1, max_length=2000)
    output_path: str = Field(min_length=1, max_length=2000)
    diffusion_steps: int = Field(default=35, ge=10, le=50)
    semitone_shift: int = Field(default=0, ge=-24, le=24)


class OpenVoiceRequest(BaseModel):
    text: str = Field(min_length=1, max_length=12000)
    reference_path: str = Field(min_length=1, max_length=2000)
    output_path: str = Field(min_length=1, max_length=2000)
    language: str = Field(default="EN_NEWEST", pattern=r"^(EN_NEWEST|EN|ES|FR|ZH|JP|KR)$")
    speaker: str | None = Field(default=None, max_length=80)
    speed: float = Field(default=1.0, ge=0.5, le=2.0)


class DemucsRequest(BaseModel):
    source_path: str = Field(min_length=1, max_length=2000)
    output_dir: str = Field(min_length=1, max_length=2000)
    model: str = Field(default="htdemucs", pattern=r"^[A-Za-z0-9_.-]{1,80}$")


def _require_token(authorization: str | None) -> None:
    expected = os.environ.get("LYRICA_AUDIO_WORKER_TOKEN", "")
    if len(expected) < 24:
        raise HTTPException(status_code=503, detail="Audio worker token is not configured")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer token required")
    supplied = authorization.removeprefix("Bearer ").strip()
    if not hmac.compare_digest(supplied, expected):
        raise HTTPException(status_code=403, detail="Invalid audio worker token")


def create_app(config: WorkerConfig | None = None) -> FastAPI:
    cfg = config or WorkerConfig.from_env()
    cfg.audio_root.mkdir(parents=True, exist_ok=True)
    wrapper = Path(__file__).with_name("openvoice_v2_cli.py")
    seed = SeedVcAdapter(cfg)
    openvoice = OpenVoiceV2Adapter(cfg, wrapper)
    demucs = DemucsAdapter(cfg)

    app = FastAPI(title="Lyrica Ubuntu Studio Audio Worker", version="1.0.0")

    @app.get("/health")
    async def health() -> dict[str, Any]:
        providers = {
            "seed_vc_singing": seed.health(),
            "openvoice_v2_tts": openvoice.health(),
            "demucs_v4": demucs.health(),
        }
        return {
            "status": "ready" if all(item["ready"] for item in providers.values()) else "degraded",
            "audio_root": str(cfg.audio_root),
            "device": cfg.device,
            "providers": providers,
        }

    @app.post("/v1/seed-vc/singing")
    async def seed_vc_singing(
        request: SeedVcRequest,
        authorization: str | None = Header(default=None),
    ) -> dict[str, Any]:
        _require_token(authorization)
        try:
            source = require_inside_audio_root(request.source_path, cfg, must_exist=True)
            reference = require_inside_audio_root(request.reference_path, cfg, must_exist=True)
            output = require_inside_audio_root(request.output_path, cfg, must_exist=False)
            details = seed.render(
                source_path=source,
                reference_path=reference,
                output_path=output,
                diffusion_steps=request.diffusion_steps,
                semitone_shift=request.semitone_shift,
            )
        except (WorkerConfigurationError, WorkerExecutionError) as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        return {
            "status": "rendered",
            "output_path": str(output),
            "audio_sha256": sha256_file(output),
            **details,
        }

    @app.post("/v1/openvoice-v2/tts")
    async def openvoice_v2_tts(
        request: OpenVoiceRequest,
        authorization: str | None = Header(default=None),
    ) -> dict[str, Any]:
        _require_token(authorization)
        try:
            reference = require_inside_audio_root(request.reference_path, cfg, must_exist=True)
            output = require_inside_audio_root(request.output_path, cfg, must_exist=False)
            details = openvoice.render(
                text=request.text,
                reference_path=reference,
                output_path=output,
                language=request.language,
                speaker=request.speaker,
                speed=request.speed,
            )
        except (WorkerConfigurationError, WorkerExecutionError, ValueError) as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        return {
            "status": "rendered",
            "output_path": str(output),
            "audio_sha256": sha256_file(output),
            **details,
        }

    @app.post("/v1/demucs/separate")
    async def demucs_separate(
        request: DemucsRequest,
        authorization: str | None = Header(default=None),
    ) -> dict[str, Any]:
        _require_token(authorization)
        try:
            source = require_inside_audio_root(request.source_path, cfg, must_exist=True)
            output_dir = require_inside_audio_root(request.output_dir, cfg, must_exist=False)
            output_dir.mkdir(parents=True, exist_ok=True)
            return {
                "status": "rendered",
                **demucs.separate(source_path=source, output_dir=output_dir, model=request.model),
            }
        except (WorkerConfigurationError, WorkerExecutionError) as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

    return app


app = create_app()
