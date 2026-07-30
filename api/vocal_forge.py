from __future__ import annotations

import hashlib
import hmac
import json
import math
import os
import re
import wave
from array import array
from datetime import datetime, timezone
from pathlib import Path
from sys import byteorder
from typing import Any, Literal

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, model_validator

from .cultura_pronunciation import CulturaPronunciationPlan, evaluate_pronunciation_plan


ReleaseIntent = Literal["research", "demo", "release"]
VoiceIdentityMode = Literal["synthetic_neutral", "creator_authorized_reference"]
ProviderId = Literal[
    "lyrica_deterministic_guide",
    "fish_speech",
    "so_vits_svc_external",
    "stable_audio_tools",
    "vocos_mel_24khz",
]
ExecutionMode = Literal["local", "external_worker"]

ARTIFACT_ID_RE = re.compile(r"^vfg_[0-9a-f]{24}$")
SHA256_RE = re.compile(r"^(?:sha256:)?[0-9a-fA-F]{64}$")


class ScoreNote(BaseModel):
    midi_note: int = Field(ge=24, le=108)
    start_beat: float = Field(ge=0)
    duration_beats: float = Field(gt=0, le=32)
    syllable: str = Field(min_length=1, max_length=120)
    velocity: float = Field(default=0.82, gt=0, le=1)
    vibrato_cents: float = Field(default=12.0, ge=0, le=80)
    pronunciation_token_index: int | None = Field(default=None, ge=0)


class VoiceConsent(BaseModel):
    subject_id: str = Field(min_length=1, max_length=200)
    consent_id: str = Field(min_length=1, max_length=200)
    authorized: bool
    scopes: list[str] = Field(default_factory=list, max_length=20)
    reference_audio_sha256: str | None = Field(default=None, max_length=80)
    permission_reference: str | None = Field(default=None, max_length=1000)


class ProviderSelection(BaseModel):
    provider_id: ProviderId = "lyrica_deterministic_guide"
    model_id: str = Field(default="lyrica-guide-synth-v1", min_length=1, max_length=240)
    execution_mode: ExecutionMode = "local"
    commercial_license_reference: str | None = Field(default=None, max_length=1000)
    model_license: str | None = Field(default=None, max_length=200)
    data_retention_policy: str | None = Field(default=None, max_length=1000)


class VocalGuideRequest(BaseModel):
    project_id: str = Field(min_length=1, max_length=200)
    creator_id: str = Field(min_length=1, max_length=200)
    title: str = Field(min_length=1, max_length=300)
    bpm: float = Field(ge=30, le=240)
    sample_rate: Literal[16000, 22050, 24000, 44100, 48000] = 24000
    release_intent: ReleaseIntent = "research"
    voice_identity_mode: VoiceIdentityMode = "synthetic_neutral"
    consent: VoiceConsent | None = None
    provider: ProviderSelection = Field(default_factory=ProviderSelection)
    notes: list[ScoreNote] = Field(min_length=1, max_length=2000)
    pronunciation_plan: CulturaPronunciationPlan | None = None
    receipt_context: dict[str, str] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_reference_consent(self) -> "VocalGuideRequest":
        if self.voice_identity_mode == "creator_authorized_reference" and self.consent is None:
            raise ValueError("creator_authorized_reference requires a consent record")
        return self


class ProviderPreflightRequest(BaseModel):
    provider: ProviderSelection
    release_intent: ReleaseIntent = "research"


def _canonical_json(payload: Any) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _artifact_dir() -> Path:
    target = Path(os.environ.get("VOCAL_FORGE_ARTIFACT_DIR", "/tmp/lyrica3-vocal-forge"))
    target.mkdir(parents=True, exist_ok=True)
    return target


def _require_internal_token(authorization: str | None) -> None:
    expected = os.environ.get("VOCAL_FORGE_INTERNAL_TOKEN", "")
    if len(expected) < 24:
        raise HTTPException(status_code=503, detail="Vocal Forge internal access is not configured")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer token required")
    supplied = authorization.removeprefix("Bearer ").strip()
    if not hmac.compare_digest(supplied, expected):
        raise HTTPException(status_code=403, detail="Invalid Vocal Forge token")


def _provider_rules() -> dict[str, dict[str, Any]]:
    return {
        "lyrica_deterministic_guide": {
            "runtime_status": "enabled",
            "commercial_policy": "empire_owned_runtime",
            "allowed_execution_modes": ["local"],
            "purpose": "score-locked guide vocal only",
        },
        "fish_speech": {
            "runtime_status": "adapter_not_connected",
            "commercial_policy": "written_commercial_license_required",
            "allowed_execution_modes": ["external_worker"],
            "purpose": "optional authorized vocal renderer",
        },
        "so_vits_svc_external": {
            "runtime_status": "adapter_not_connected",
            "commercial_policy": "external_worker_only_review_agpl_obligations",
            "allowed_execution_modes": ["external_worker"],
            "purpose": "optional singing voice conversion worker",
        },
        "stable_audio_tools": {
            "runtime_status": "adapter_not_connected",
            "commercial_policy": "model_specific_license_review_required",
            "allowed_execution_modes": ["local", "external_worker"],
            "purpose": "optional instrumental generation worker",
        },
        "vocos_mel_24khz": {
            "runtime_status": "adapter_not_connected",
            "commercial_policy": "model_card_and_checkpoint_license_must_match",
            "allowed_execution_modes": ["local", "external_worker"],
            "purpose": "optional mel decoder",
        },
    }


def provider_preflight(provider: ProviderSelection, release_intent: ReleaseIntent) -> dict[str, Any]:
    rules = _provider_rules()[provider.provider_id]
    blocks: list[str] = []
    warnings: list[str] = []

    if provider.execution_mode not in rules["allowed_execution_modes"]:
        blocks.append("execution_mode_not_allowed")

    if provider.provider_id == "fish_speech" and release_intent == "release":
        if not (provider.commercial_license_reference or "").strip():
            blocks.append("fish_commercial_license_required")

    if provider.provider_id == "so_vits_svc_external" and provider.execution_mode != "external_worker":
        blocks.append("agpl_worker_must_remain_external")

    if provider.provider_id in {"stable_audio_tools", "vocos_mel_24khz"} and release_intent == "release":
        if not (provider.model_license or "").strip():
            blocks.append("model_specific_license_required")

    if provider.provider_id != "lyrica_deterministic_guide":
        warnings.append("provider_adapter_not_connected")

    if provider.execution_mode == "external_worker" and not (provider.data_retention_policy or "").strip():
        warnings.append("external_worker_data_retention_policy_missing")

    return {
        "provider_id": provider.provider_id,
        "model_id": provider.model_id,
        "release_intent": release_intent,
        "rules": rules,
        "blocks": sorted(set(blocks)),
        "warnings": sorted(set(warnings)),
        "eligible": not blocks,
        "runtime_connected": rules["runtime_status"] == "enabled",
    }


def _validate_score(notes: list[ScoreNote], bpm: float) -> dict[str, Any]:
    ordered = sorted(notes, key=lambda item: (item.start_beat, item.midi_note))
    findings: list[str] = []
    previous_end = 0.0
    for index, note in enumerate(ordered):
        if index and note.start_beat < previous_end - 1e-9:
            findings.append(f"note_{index}_overlaps_previous_note")
        previous_end = max(previous_end, note.start_beat + note.duration_beats)

    duration_seconds = previous_end * 60.0 / bpm
    if duration_seconds > 180:
        findings.append("guide_duration_exceeds_180_seconds")

    return {
        "ordered_notes": ordered,
        "duration_seconds": duration_seconds,
        "monophonic": not any("overlaps" in finding for finding in findings),
        "findings": findings,
    }


def _validate_consent(request: VocalGuideRequest) -> list[str]:
    if request.voice_identity_mode == "synthetic_neutral":
        return []

    consent = request.consent
    if consent is None:
        return ["voice_consent_missing"]

    blocks: list[str] = []
    if not consent.authorized:
        blocks.append("voice_consent_not_authorized")
    if "singing_voice_render" not in consent.scopes:
        blocks.append("singing_voice_render_scope_missing")
    if not consent.permission_reference:
        blocks.append("voice_permission_reference_missing")
    if not consent.reference_audio_sha256 or not SHA256_RE.fullmatch(consent.reference_audio_sha256):
        blocks.append("valid_reference_audio_sha256_required")
    return blocks


def preflight_vocal_guide(request: VocalGuideRequest) -> dict[str, Any]:
    score = _validate_score(request.notes, request.bpm)
    provider = provider_preflight(request.provider, request.release_intent)
    consent_blocks = _validate_consent(request)
    blocks = list(score["findings"]) + list(provider["blocks"]) + consent_blocks
    review_items = list(provider["warnings"])
    cultura_result: dict[str, Any] | None = None

    if request.pronunciation_plan is not None:
        cultura_result = evaluate_pronunciation_plan(request.pronunciation_plan)
        invalid_mappings = [
            index
            for index, note in enumerate(score["ordered_notes"])
            if note.pronunciation_token_index is not None
            and note.pronunciation_token_index >= len(request.pronunciation_plan.tokens)
        ]
        if invalid_mappings:
            blocks.extend(f"note_{index}_pronunciation_token_out_of_range" for index in invalid_mappings)
        if request.release_intent == "release":
            unmapped = [
                index
                for index, note in enumerate(score["ordered_notes"])
                if note.pronunciation_token_index is None
            ]
            if unmapped:
                blocks.extend(f"note_{index}_pronunciation_token_required" for index in unmapped)
        if cultura_result["hard_blocks"]:
            blocks.extend(f"cultura:{item}" for item in cultura_result["hard_blocks"])
        if request.release_intent == "release" and not cultura_result["release_eligible"]:
            blocks.append("cultura_release_gate_not_clear")
        elif not cultura_result["release_eligible"]:
            review_items.append("cultura_review_pending")
    elif request.release_intent == "release":
        blocks.append("release_pronunciation_plan_required")

    if request.release_intent == "release":
        signing_key = os.environ.get("VOCAL_FORGE_RECEIPT_SIGNING_KEY", "")
        if len(signing_key) < 32:
            blocks.append("release_receipt_signing_key_missing_or_short")

    if request.provider.provider_id != "lyrica_deterministic_guide":
        blocks.append("selected_provider_worker_not_connected")

    return {
        "eligible": not blocks,
        "blocks": sorted(set(blocks)),
        "review_items": sorted(set(review_items)),
        "score": {
            "duration_seconds": score["duration_seconds"],
            "monophonic": score["monophonic"],
            "note_count": len(score["ordered_notes"]),
            "syllable_count": len([note for note in score["ordered_notes"] if note.syllable.strip()]),
        },
        "provider": provider,
        "cultura": cultura_result,
        "truth_boundary": {
            "artifact_type": "deterministic_guide_vocal",
            "not_a_natural_singer_model": True,
            "not_a_final_master": True,
            "external_models_not_executed": True,
        },
    }


def _midi_frequency(note: int) -> float:
    return 440.0 * (2.0 ** ((note - 69) / 12.0))


def _render_wave(path: Path, request: VocalGuideRequest, ordered_notes: list[ScoreNote]) -> None:
    sample_rate = request.sample_rate
    beat_seconds = 60.0 / request.bpm
    current_sample = 0

    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(sample_rate)

        for note in ordered_notes:
            start = int(round(note.start_beat * beat_seconds * sample_rate))
            length = max(1, int(round(note.duration_beats * beat_seconds * sample_rate)))
            if start > current_sample:
                output.writeframes(b"\x00\x00" * (start - current_sample))
                current_sample = start

            frequency = _midi_frequency(note.midi_note)
            attack = max(1, int(0.025 * sample_rate))
            release = max(1, int(0.045 * sample_rate))
            vibrato_rate = 5.4
            amplitude = 0.28 * note.velocity
            note_samples = array("h")

            for offset in range(length):
                local_t = offset / sample_rate
                progress = offset / max(1, length - 1)
                envelope = min(1.0, offset / attack, (length - offset) / release)
                envelope = max(0.0, envelope)
                vibrato_depth = note.vibrato_cents / 1200.0
                vibrato_multiplier = 2.0 ** (
                    vibrato_depth * math.sin(2.0 * math.pi * vibrato_rate * local_t)
                )
                phase = 2.0 * math.pi * frequency * vibrato_multiplier * local_t
                # A deterministic, vowel-like guide timbre. This is intentionally not a cloned voice.
                value = (
                    math.sin(phase)
                    + 0.32 * math.sin(2.0 * phase)
                    + 0.14 * math.sin(3.0 * phase)
                    + 0.06 * math.sin(4.0 * phase)
                )
                value *= amplitude * envelope * (0.96 + 0.04 * math.cos(math.pi * progress))
                note_samples.append(max(-32767, min(32767, int(value * 32767))))

            if byteorder != "little":
                note_samples.byteswap()
            output.writeframes(note_samples.tobytes())
            current_sample += length


def _receipt_signature(receipt_payload: dict[str, Any]) -> dict[str, str | None]:
    key = os.environ.get("VOCAL_FORGE_RECEIPT_SIGNING_KEY", "")
    if len(key) < 32:
        return {"algorithm": None, "signature": None, "status": "unsigned_research"}
    signature = hmac.new(key.encode("utf-8"), _canonical_json(receipt_payload), hashlib.sha256).hexdigest()
    return {"algorithm": "hmac-sha256", "signature": signature, "status": "signed"}


def render_vocal_guide(request: VocalGuideRequest) -> dict[str, Any]:
    preflight = preflight_vocal_guide(request)
    if not preflight["eligible"]:
        raise ValueError("vocal guide preflight failed: " + ", ".join(preflight["blocks"]))

    score = _validate_score(request.notes, request.bpm)
    request_payload = request.model_dump(mode="json")
    request_digest = _sha256(_canonical_json(request_payload))
    artifact_id = f"vfg_{request_digest[:24]}"
    artifact_dir = _artifact_dir()
    wav_path = artifact_dir / f"{artifact_id}.wav"
    receipt_path = artifact_dir / f"{artifact_id}.receipt.json"

    _render_wave(wav_path, request, score["ordered_notes"])
    audio_bytes = wav_path.read_bytes()
    audio_sha256 = _sha256(audio_bytes)

    receipt_payload: dict[str, Any] = {
        "schema_version": "lyrica.vocal-forge.guide-receipt.v1",
        "receipt_id": f"vfr_{audio_sha256[:24]}",
        "artifact_id": artifact_id,
        "project_id": request.project_id,
        "creator_id": request.creator_id,
        "title": request.title,
        "release_intent": request.release_intent,
        "provider": request.provider.model_dump(mode="json"),
        "voice_identity_mode": request.voice_identity_mode,
        "consent_id": request.consent.consent_id if request.consent else None,
        "score_digest": request_digest,
        "audio_sha256": audio_sha256,
        "content_type": "audio/wav",
        "sample_rate": request.sample_rate,
        "duration_seconds": round(score["duration_seconds"], 6),
        "note_count": len(score["ordered_notes"]),
        "pronunciation_plan_digest": (
            preflight["cultura"]["plan_digest"] if preflight["cultura"] is not None else None
        ),
        "receipt_context": dict(sorted(request.receipt_context.items())),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "truth_boundary": preflight["truth_boundary"],
    }
    signature = _receipt_signature(receipt_payload)
    receipt = {**receipt_payload, "signature": signature}
    receipt_path.write_text(json.dumps(receipt, indent=2, sort_keys=True, ensure_ascii=False), encoding="utf-8")

    return {
        "status": "rendered",
        "artifact_id": artifact_id,
        "audio_sha256": audio_sha256,
        "download_route": f"/vocal-forge/artifacts/{artifact_id}",
        "preflight": preflight,
        "receipt": receipt,
    }


def capabilities() -> dict[str, Any]:
    return {
        "name": "Lyrica 3 Vocal Forge",
        "runtime_version": "guide-v1",
        "enabled_renderer": "lyrica_deterministic_guide",
        "supported_sample_rates": [16000, 22050, 24000, 44100, 48000],
        "score_constraints": {
            "monophonic": True,
            "max_duration_seconds": 180,
            "max_notes": 2000,
            "midi_note_range": [24, 108],
        },
        "providers": _provider_rules(),
        "receipt_signing": {
            "environment_key": "VOCAL_FORGE_RECEIPT_SIGNING_KEY",
            "release_requires_minimum_characters": 32,
        },
        "internal_access": {
            "environment_key": "VOCAL_FORGE_INTERNAL_TOKEN",
            "minimum_characters": 24,
            "render_and_download_fail_closed": True,
        },
        "truth_boundary": {
            "guide_renderer_is_not_final_singing_model": True,
            "fish_and_other_external_workers_are_not_connected": True,
            "cultura_gate_is_required_for_release": True,
        },
    }


def create_vocal_forge_router() -> APIRouter:
    router = APIRouter(tags=["vocal-forge"])

    @router.get("/vocal-forge/capabilities")
    async def get_capabilities():
        return capabilities()

    @router.post("/vocal-forge/provider-preflight")
    async def run_provider_preflight(request: ProviderPreflightRequest):
        return provider_preflight(request.provider, request.release_intent)

    @router.post("/vocal-forge/guide/preflight")
    async def run_guide_preflight(request: VocalGuideRequest):
        return preflight_vocal_guide(request)

    @router.post("/vocal-forge/guide/render")
    async def render_guide(
        request: VocalGuideRequest,
        authorization: str | None = Header(default=None),
    ):
        _require_internal_token(authorization)
        try:
            return render_vocal_guide(request)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

    @router.get("/vocal-forge/artifacts/{artifact_id}")
    async def download_artifact(
        artifact_id: str,
        authorization: str | None = Header(default=None),
    ):
        _require_internal_token(authorization)
        if not ARTIFACT_ID_RE.fullmatch(artifact_id):
            raise HTTPException(status_code=404, detail="Artifact not found")
        path = _artifact_dir() / f"{artifact_id}.wav"
        if not path.exists():
            raise HTTPException(status_code=404, detail="Artifact not found")
        return FileResponse(path, media_type="audio/wav", filename=f"{artifact_id}.wav")

    return router
