from __future__ import annotations

import hashlib
import hmac
import json
import math
import re
import wave
from array import array
from pathlib import Path
from sys import byteorder
from typing import Any

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from .vocal_expression import (
    PerformanceDirection,
    capabilities as expression_capabilities,
    resolve_performance_plan,
)
from .vocal_forge import (
    VocalGuideRequest,
    _artifact_dir,
    _canonical_json,
    _receipt_signature,
    _require_internal_token,
    _sha256,
    _validate_score,
    preflight_vocal_guide,
)

PERFORMANCE_ARTIFACT_ID_RE = re.compile(r"^vfp_[0-9a-f]{24}$")


class PerformanceRenderRequest(BaseModel):
    guide: VocalGuideRequest
    performance: PerformanceDirection = Field(default_factory=PerformanceDirection)


class PerformancePlanRequest(BaseModel):
    note_count: int = Field(ge=1, le=2000)
    performance: PerformanceDirection = Field(default_factory=PerformanceDirection)


def preflight_performance_render(request: PerformanceRenderRequest) -> dict[str, Any]:
    base = preflight_vocal_guide(request.guide)
    performance = resolve_performance_plan(request.performance, len(request.guide.notes))
    blocks = list(base["blocks"]) + list(performance["findings"])
    return {
        "eligible": not blocks,
        "blocks": sorted(set(blocks)),
        "review_items": list(base["review_items"]),
        "guide": base,
        "performance": performance,
        "public_summary": {
            "style": performance["public_name"],
            "description": performance["public_description"],
            "moment_count": len(request.performance.moments),
        },
        "truth_boundary": {
            "performance_controls_change_the_guide_audio": True,
            "performance_controls_do_not_create_a_real_persons_voice": True,
            "release_still_requires_the_base_cultura_and_receipt_gates": True,
        },
    }


def _triangle_window(progress: float, center: float, width: float) -> float:
    distance = abs(progress - center)
    if distance >= width:
        return 0.0
    return 1.0 - distance / width


def _render_performance_wave(
    path: Path,
    request: PerformanceRenderRequest,
    ordered_notes: list,
    note_controls: list[dict[str, Any]],
) -> None:
    guide = request.guide
    sample_rate = guide.sample_rate
    beat_seconds = 60.0 / guide.bpm
    current_sample = 0

    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(sample_rate)

        for note_index, note in enumerate(ordered_notes):
            controls = note_controls[note_index]
            start = int(round(note.start_beat * beat_seconds * sample_rate))
            length = max(1, int(round(note.duration_beats * beat_seconds * sample_rate)))
            if start > current_sample:
                output.writeframes(b"\x00\x00" * (start - current_sample))
                current_sample = start

            base_frequency = 440.0 * (2.0 ** ((note.midi_note - 69) / 12.0))
            attack = max(1, int(0.025 * sample_rate))
            release = max(1, int(0.045 * sample_rate))
            amplitude = 0.25 * note.velocity * float(controls["gain_multiplier"])
            note_samples = array("h")
            phase = 0.0
            fry_phase = 0.0

            for offset in range(length):
                local_t = offset / sample_rate
                progress = offset / max(1, length - 1)
                envelope = min(1.0, offset / attack, (length - offset) / release)
                envelope = max(0.0, envelope)

                vibrato_cents = (
                    note.vibrato_cents
                    * float(controls["vibrato_depth_multiplier"])
                    * math.sin(2.0 * math.pi * float(controls["vibrato_rate_hz"]) * local_t)
                )
                scoop_window = max(0.0, 1.0 - progress / 0.22) if progress < 0.22 else 0.0
                pitch_cents = vibrato_cents + float(controls["onset_scoop_cents"]) * scoop_window
                pitch_cents -= float(controls["crack_cents"]) * _triangle_window(progress, 0.64, 0.075)
                if float(controls["run_cents"]) > 0 and progress >= 0.45:
                    run_progress = (progress - 0.45) / 0.55
                    pitch_cents += float(controls["run_cents"]) * math.sin(5.0 * math.pi * run_progress)

                frequency = base_frequency * (2.0 ** (pitch_cents / 1200.0))
                phase += 2.0 * math.pi * frequency / sample_rate
                fry_phase += 2.0 * math.pi * max(32.0, frequency * 0.49) / sample_rate

                value = (
                    math.sin(phase)
                    + 0.32 * math.sin(2.0 * phase)
                    + 0.14 * math.sin(3.0 * phase)
                    + 0.06 * math.sin(4.0 * phase)
                )
                fry_mix = float(controls["fry_mix"])
                if fry_mix:
                    value += fry_mix * (1.0 if math.sin(fry_phase) >= 0 else -1.0)

                grit = float(controls["grit_mix"])
                if grit:
                    drive = 1.0 + 5.0 * grit
                    value = math.tanh(value * drive) / math.tanh(drive)

                breath_mix = float(controls["breath_mix"])
                if breath_mix:
                    breath = (
                        math.sin(2.0 * math.pi * 3127.0 * local_t)
                        + 0.61 * math.sin(2.0 * math.pi * 4219.0 * local_t + 0.37)
                        + 0.37 * math.sin(2.0 * math.pi * 5471.0 * local_t + 1.13)
                    ) / 1.98
                    value = value * (1.0 - 0.28 * breath_mix) + breath * breath_mix

                hesitation = float(controls["hesitation_amount"])
                if hesitation and progress < 0.28:
                    pulse = 0.52 + 0.48 * max(0.0, math.sin(6.0 * math.pi * progress / 0.28))
                    envelope *= 1.0 - hesitation * (1.0 - pulse)

                value *= amplitude * envelope * (0.96 + 0.04 * math.cos(math.pi * progress))
                note_samples.append(max(-32767, min(32767, int(value * 32767))))

            if byteorder != "little":
                note_samples.byteswap()
            output.writeframes(note_samples.tobytes())
            current_sample += length


def render_performance(request: PerformanceRenderRequest) -> dict[str, Any]:
    preflight = preflight_performance_render(request)
    if not preflight["eligible"]:
        raise ValueError("performance render preflight failed: " + ", ".join(preflight["blocks"]))

    score = _validate_score(request.guide.notes, request.guide.bpm)
    performance = preflight["performance"]
    canonical_request = request.model_dump(mode="json")
    request_digest = _sha256(_canonical_json(canonical_request))
    artifact_id = f"vfp_{request_digest[:24]}"
    artifact_dir = _artifact_dir()
    wav_path = artifact_dir / f"{artifact_id}.wav"
    receipt_path = artifact_dir / f"{artifact_id}.receipt.json"

    _render_performance_wave(
        wav_path,
        request,
        score["ordered_notes"],
        performance["note_controls"],
    )
    audio_sha256 = _sha256(wav_path.read_bytes())

    receipt_payload: dict[str, Any] = {
        "schema_version": "lyrica.vocal-forge.performance-receipt.v1",
        "receipt_id": f"vfpr_{audio_sha256[:24]}",
        "artifact_id": artifact_id,
        "project_id": request.guide.project_id,
        "creator_id": request.guide.creator_id,
        "title": request.guide.title,
        "release_intent": request.guide.release_intent,
        "provider": request.guide.provider.model_dump(mode="json"),
        "voice_identity_mode": request.guide.voice_identity_mode,
        "consent_id": request.guide.consent.consent_id if request.guide.consent else None,
        "score_digest": request_digest,
        "audio_sha256": audio_sha256,
        "content_type": "audio/wav",
        "sample_rate": request.guide.sample_rate,
        "duration_seconds": round(score["duration_seconds"], 6),
        "note_count": len(score["ordered_notes"]),
        "performance_style": performance["style"],
        "performance_public_name": performance["public_name"],
        "performance_plan_digest": performance["plan_digest"],
        "performance_moments": [moment.model_dump(mode="json") for moment in request.performance.moments],
        "pronunciation_plan_digest": (
            preflight["guide"]["cultura"]["plan_digest"]
            if preflight["guide"]["cultura"] is not None
            else None
        ),
        "receipt_context": dict(sorted(request.guide.receipt_context.items())),
        "truth_boundary": preflight["truth_boundary"],
    }
    signature = _receipt_signature(receipt_payload)
    receipt = {**receipt_payload, "signature": signature}
    receipt_path.write_text(json.dumps(receipt, indent=2, sort_keys=True, ensure_ascii=False), encoding="utf-8")

    return {
        "status": "rendered",
        "artifact_id": artifact_id,
        "audio_sha256": audio_sha256,
        "download_route": f"/vocal-forge/performance/artifacts/{artifact_id}",
        "public_summary": preflight["public_summary"],
        "preflight": preflight,
        "receipt": receipt,
    }


def capabilities() -> dict[str, Any]:
    return {
        **expression_capabilities(),
        "runtime_version": "performance-v1",
        "enabled_renderer": "lyrica_deterministic_performance_guide",
        "receipt_schema": "lyrica.vocal-forge.performance-receipt.v1",
    }


def create_vocal_performance_router() -> APIRouter:
    router = APIRouter(tags=["vocal-performance"])

    @router.get("/vocal-forge/performance/styles")
    async def get_styles():
        return capabilities()

    @router.post("/vocal-forge/performance/plan")
    async def plan_performance(request: PerformancePlanRequest):
        return resolve_performance_plan(request.performance, request.note_count)

    @router.post("/vocal-forge/performance/preflight")
    async def preflight(request: PerformanceRenderRequest):
        return preflight_performance_render(request)

    @router.post("/vocal-forge/performance/render")
    async def render(
        request: PerformanceRenderRequest,
        authorization: str | None = Header(default=None),
    ):
        _require_internal_token(authorization)
        try:
            return render_performance(request)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

    @router.get("/vocal-forge/performance/artifacts/{artifact_id}")
    async def download(
        artifact_id: str,
        authorization: str | None = Header(default=None),
    ):
        _require_internal_token(authorization)
        if not PERFORMANCE_ARTIFACT_ID_RE.fullmatch(artifact_id):
            raise HTTPException(status_code=404, detail="Artifact not found")
        path = _artifact_dir() / f"{artifact_id}.wav"
        if not path.exists():
            raise HTTPException(status_code=404, detail="Artifact not found")
        return FileResponse(path, media_type="audio/wav", filename=f"{artifact_id}.wav")

    return router
