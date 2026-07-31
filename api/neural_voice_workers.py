from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import os
import re
import shutil
import tempfile
import urllib.error
import urllib.request
from urllib.parse import urlparse
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, model_validator

from .cultura_pronunciation import CulturaPronunciationPlan, evaluate_pronunciation_plan


ProviderId = Literal["seed_vc_singing", "openvoice_v2_tts"]
ReleaseIntent = Literal["research", "demo", "release"]
ASSET_RE = re.compile(r"^(?:nva|aev|vfg)_[0-9a-f]{24}$")
RESULT_RE = re.compile(r"^nvr_[0-9a-f]{24}$")
ALLOWED_UPLOAD_SUFFIXES = {".wav", ".flac", ".mp3", ".m4a", ".ogg"}


class CloneConsent(BaseModel):
    subject_id: str = Field(min_length=1, max_length=200)
    consent_id: str = Field(min_length=1, max_length=200)
    authorized: bool
    scopes: list[str] = Field(default_factory=list, max_length=20)
    permission_reference: str = Field(min_length=1, max_length=1000)
    reference_audio_sha256: str = Field(pattern=r"^[0-9a-fA-F]{64}$")


class NeuralVoiceRenderRequest(BaseModel):
    project_id: str = Field(min_length=1, max_length=200)
    creator_id: str = Field(min_length=1, max_length=200)
    title: str = Field(min_length=1, max_length=300)
    provider_id: ProviderId
    release_intent: ReleaseIntent = "research"
    reference_asset_id: str = Field(pattern=r"^nva_[0-9a-f]{24}$")
    source_asset_id: str | None = Field(default=None, pattern=r"^(?:nva|aev|vfg)_[0-9a-f]{24}$")
    text: str | None = Field(default=None, min_length=1, max_length=12000)
    language: Literal["EN_NEWEST", "EN", "ES", "FR", "ZH", "JP", "KR"] = "EN_NEWEST"
    speaker: str | None = Field(default=None, max_length=80)
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    diffusion_steps: int = Field(default=35, ge=10, le=50)
    semitone_shift: int = Field(default=0, ge=-24, le=24)
    consent: CloneConsent
    pronunciation_plan: CulturaPronunciationPlan | None = None
    receipt_context: dict[str, str] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_provider_inputs(self) -> "NeuralVoiceRenderRequest":
        if self.provider_id == "seed_vc_singing" and not self.source_asset_id:
            raise ValueError("seed_vc_singing requires a source singing asset")
        if self.provider_id == "openvoice_v2_tts" and not (self.text or "").strip():
            raise ValueError("openvoice_v2_tts requires text")
        return self


class WorkerResponse(BaseModel):
    status: Literal["rendered"]
    output_path: str
    audio_sha256: str = Field(pattern=r"^[0-9a-fA-F]{64}$")
    provider_id: ProviderId
    model: dict[str, Any] = Field(default_factory=dict)


def _canonical_json(payload: Any) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _artifact_root() -> Path:
    root = Path(os.environ.get("VOCAL_FORGE_ARTIFACT_DIR", "/tmp/lyrica3-vocal-forge")).expanduser().resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def _asset_dir() -> Path:
    target = _artifact_root() / "neural-assets"
    target.mkdir(parents=True, exist_ok=True)
    return target


def _result_dir() -> Path:
    target = _artifact_root() / "neural-results"
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


def _resolve_asset(asset_id: str) -> Path:
    if not ASSET_RE.fullmatch(asset_id):
        raise ValueError("invalid asset id")
    root = _artifact_root()
    if asset_id.startswith(("aev_", "vfg_")):
        candidate = (root / f"{asset_id}.wav").resolve()
    else:
        matches = list(_asset_dir().glob(f"{asset_id}.*"))
        matches = [item for item in matches if item.suffix != ".json"]
        if len(matches) != 1:
            raise ValueError("neural voice asset not found")
        candidate = matches[0].resolve()
    if not candidate.is_file() or root not in candidate.parents:
        raise ValueError("neural voice asset not found")
    return candidate


def _asset_metadata(asset_id: str) -> dict[str, Any] | None:
    if not asset_id.startswith("nva_"):
        return None
    path = _asset_dir() / f"{asset_id}.json"
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return payload if isinstance(payload, dict) else None


def _validate_worker_url(worker_url: str) -> bool:
    try:
        parsed = urlparse(worker_url)
    except ValueError:
        return False
    if parsed.scheme == "https" and parsed.hostname:
        return True
    return parsed.scheme == "http" and parsed.hostname in {"127.0.0.1", "localhost", "::1"}


def _validate_consent(request: NeuralVoiceRenderRequest, reference_path: Path) -> list[str]:
    blocks: list[str] = []
    consent = request.consent
    if not consent.authorized:
        blocks.append("voice_clone_consent_not_authorized")
    required_scope = "singing_voice_clone" if request.provider_id == "seed_vc_singing" else "tts_voice_clone"
    if required_scope not in consent.scopes and "voice_clone" not in consent.scopes:
        blocks.append(f"{required_scope}_scope_missing")
    actual_hash = _sha256_file(reference_path)
    if not hmac.compare_digest(actual_hash.lower(), consent.reference_audio_sha256.lower()):
        blocks.append("reference_audio_hash_mismatch")
    return blocks


def preflight_neural_voice(request: NeuralVoiceRenderRequest) -> dict[str, Any]:
    blocks: list[str] = []
    review_items: list[str] = []
    try:
        reference_path = _resolve_asset(request.reference_asset_id)
    except ValueError as exc:
        return {"eligible": False, "blocks": [str(exc)], "review_items": []}

    source_path: Path | None = None
    if request.source_asset_id:
        try:
            source_path = _resolve_asset(request.source_asset_id)
        except ValueError as exc:
            blocks.append(str(exc))

    blocks.extend(_validate_consent(request, reference_path))
    reference_metadata = _asset_metadata(request.reference_asset_id)
    if reference_metadata is None or reference_metadata.get("kind") != "reference_voice":
        blocks.append("reference_asset_must_be_uploaded_as_reference_voice")

    if request.provider_id == "seed_vc_singing" and request.source_asset_id:
        if request.source_asset_id.startswith("nva_"):
            source_metadata = _asset_metadata(request.source_asset_id)
            if source_metadata is None or source_metadata.get("kind") != "source_singing":
                blocks.append("source_asset_must_be_uploaded_as_source_singing")
        if request.source_asset_id.startswith(("aev_", "vfg_")):
            review_items.append("synthetic_guide_source_may_not_contain_intelligible_lyrics")
            if request.release_intent == "release":
                blocks.append("release_requires_real_dry_singing_source")

    cultura_result: dict[str, Any] | None = None
    if request.pronunciation_plan is not None:
        cultura_result = evaluate_pronunciation_plan(request.pronunciation_plan)
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

    worker_url = os.environ.get("LYRICA_AUDIO_WORKER_URL", "http://127.0.0.1:8787").rstrip("/")
    worker_token = os.environ.get("LYRICA_AUDIO_WORKER_TOKEN", "")
    if not _validate_worker_url(worker_url):
        blocks.append("audio_worker_url_must_be_loopback_or_https")
    if len(worker_token) < 24:
        blocks.append("audio_worker_token_missing_or_short")

    return {
        "eligible": not blocks,
        "blocks": sorted(set(blocks)),
        "review_items": sorted(set(review_items)),
        "provider_id": request.provider_id,
        "reference_asset_id": request.reference_asset_id,
        "source_asset_id": request.source_asset_id,
        "cultura": cultura_result,
        "worker_url": worker_url,
        "truth_boundary": {
            "real_neural_worker_required": True,
            "voice_clone_requires_explicit_consent": True,
            "seed_vc_is_voice_conversion_not_text_to_singing": True,
            "openvoice_v2_is_tts_not_singing": True,
        },
    }


def _worker_post(endpoint: str, payload: dict[str, Any]) -> WorkerResponse:
    base_url = os.environ.get("LYRICA_AUDIO_WORKER_URL", "http://127.0.0.1:8787").rstrip("/")
    if not _validate_worker_url(base_url):
        raise RuntimeError("audio worker URL violates loopback/HTTPS policy")
    token = os.environ.get("LYRICA_AUDIO_WORKER_TOKEN", "")
    request = urllib.request.Request(
        f"{base_url}{endpoint}",
        data=_canonical_json(payload),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    timeout = float(os.environ.get("LYRICA_AUDIO_WORKER_TIMEOUT_SECONDS", "900"))
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:  # noqa: S310 - URL is policy-validated
            body = response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:1000]
        raise RuntimeError(f"audio worker rejected request ({exc.code}): {detail}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"audio worker unavailable: {exc.reason}") from exc
    try:
        return WorkerResponse.model_validate_json(body)
    except Exception as exc:  # noqa: BLE001 - convert remote schema failures to a stable boundary
        raise RuntimeError("audio worker returned an invalid response") from exc


def _signature(payload: dict[str, Any]) -> dict[str, str | None]:
    key = os.environ.get("VOCAL_FORGE_RECEIPT_SIGNING_KEY", "")
    if len(key) < 32:
        return {"status": "unsigned_research", "algorithm": None, "signature": None}
    signature = hmac.new(key.encode("utf-8"), _canonical_json(payload), hashlib.sha256).hexdigest()
    return {"status": "signed", "algorithm": "hmac-sha256", "signature": signature}


def render_neural_voice(request: NeuralVoiceRenderRequest) -> dict[str, Any]:
    preflight = preflight_neural_voice(request)
    if not preflight["eligible"]:
        raise ValueError("neural voice preflight failed: " + ", ".join(preflight["blocks"]))

    reference_path = _resolve_asset(request.reference_asset_id)
    source_path = _resolve_asset(request.source_asset_id) if request.source_asset_id else None
    request_payload = request.model_dump(mode="json")
    request_digest = _sha256_bytes(_canonical_json(request_payload))
    artifact_id = f"nvr_{request_digest[:24]}"
    output_path = (_result_dir() / f"{artifact_id}.wav").resolve()

    if request.provider_id == "seed_vc_singing":
        endpoint = "/v1/seed-vc/singing"
        worker_payload = {
            "source_path": str(source_path),
            "reference_path": str(reference_path),
            "output_path": str(output_path),
            "diffusion_steps": request.diffusion_steps,
            "semitone_shift": request.semitone_shift,
        }
    else:
        endpoint = "/v1/openvoice-v2/tts"
        worker_payload = {
            "text": request.text,
            "reference_path": str(reference_path),
            "output_path": str(output_path),
            "language": request.language,
            "speaker": request.speaker,
            "speed": request.speed,
        }

    result = _worker_post(endpoint, worker_payload)
    returned = Path(result.output_path).expanduser().resolve()
    if returned != output_path or not output_path.is_file():
        raise RuntimeError("audio worker did not produce the requested artifact")
    actual_hash = _sha256_file(output_path)
    if not hmac.compare_digest(actual_hash.lower(), result.audio_sha256.lower()):
        raise RuntimeError("audio worker result hash mismatch")

    receipt_payload = {
        "schema_version": "lyrica.neural-voice.receipt.v1",
        "receipt_id": f"nvr_receipt_{actual_hash[:24]}",
        "artifact_id": artifact_id,
        "project_id": request.project_id,
        "creator_id": request.creator_id,
        "title": request.title,
        "provider_id": request.provider_id,
        "provider_model": result.model,
        "release_intent": request.release_intent,
        "source_asset_id": request.source_asset_id,
        "reference_asset_id": request.reference_asset_id,
        "consent_id": request.consent.consent_id,
        "consent_subject_id": request.consent.subject_id,
        "audio_sha256": actual_hash,
        "request_digest": request_digest,
        "pronunciation_plan_digest": (
            preflight["cultura"]["plan_digest"] if preflight.get("cultura") else None
        ),
        "receipt_context": dict(sorted(request.receipt_context.items())),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "truth_boundary": preflight["truth_boundary"],
    }
    receipt = {**receipt_payload, "signature": _signature(receipt_payload)}
    (_result_dir() / f"{artifact_id}.receipt.json").write_text(
        json.dumps(receipt, indent=2, sort_keys=True, ensure_ascii=False),
        encoding="utf-8",
    )
    return {
        "status": "rendered",
        "artifact_id": artifact_id,
        "audio_sha256": actual_hash,
        "download_route": f"/vocal-forge/neural/artifacts/{artifact_id}",
        "public_result": "Voice created.",
        "preflight": preflight,
        "receipt": receipt,
    }


async def _store_upload(upload: UploadFile, kind: str) -> dict[str, Any]:
    suffix = Path(upload.filename or "audio.wav").suffix.casefold()
    if suffix not in ALLOWED_UPLOAD_SUFFIXES:
        raise HTTPException(status_code=415, detail="Unsupported audio type")
    max_bytes = int(os.environ.get("LYRICA_NEURAL_ASSET_MAX_BYTES", str(100 * 1024 * 1024)))
    digest = hashlib.sha256()
    size = 0
    with tempfile.NamedTemporaryFile(delete=False, dir=_asset_dir(), suffix=suffix) as temp:
        temp_path = Path(temp.name)
        try:
            while True:
                chunk = await upload.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > max_bytes:
                    raise HTTPException(status_code=413, detail="Audio asset is too large")
                digest.update(chunk)
                temp.write(chunk)
        except Exception:
            temp_path.unlink(missing_ok=True)
            raise
    sha = digest.hexdigest()
    asset_id = f"nva_{sha[:24]}"
    existing = [item for item in _asset_dir().glob(f"{asset_id}.*") if item.suffix != ".json"]
    if len(existing) > 1:
        temp_path.unlink(missing_ok=True)
        raise HTTPException(status_code=409, detail="Conflicting copies of this audio asset exist")
    if existing:
        final_path = existing[0]
        temp_path.unlink(missing_ok=True)
    else:
        final_path = _asset_dir() / f"{asset_id}{suffix}"
        shutil.move(str(temp_path), str(final_path))
    metadata = {
        "schema_version": "lyrica.neural-asset.v1",
        "asset_id": asset_id,
        "kind": kind,
        "sha256": sha,
        "size_bytes": size,
        "content_type": upload.content_type,
        "stored_filename": final_path.name,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    (_asset_dir() / f"{asset_id}.json").write_text(
        json.dumps(metadata, indent=2, sort_keys=True), encoding="utf-8"
    )
    return metadata


def worker_status() -> dict[str, Any]:
    url = os.environ.get("LYRICA_AUDIO_WORKER_URL", "http://127.0.0.1:8787").rstrip("/")
    token_configured = len(os.environ.get("LYRICA_AUDIO_WORKER_TOKEN", "")) >= 24
    return {
        "name": "Lyrica Ubuntu Studio Neural Workers",
        "worker_url": url,
        "token_configured": token_configured,
        "providers": {
            "seed_vc_singing": {
                "purpose": "authorized singing voice conversion",
                "requires_source_singing": True,
            },
            "openvoice_v2_tts": {
                "purpose": "authorized multilingual TTS voice cloning",
                "requires_source_singing": False,
            },
        },
    }


def create_neural_voice_worker_router() -> APIRouter:
    router = APIRouter(tags=["neural-voice-workers"])

    @router.get("/vocal-forge/neural/status")
    async def status():
        return worker_status()

    @router.post("/vocal-forge/neural/assets")
    async def upload_asset(
        kind: str = Form(..., pattern=r"^(reference_voice|source_singing)$"),
        file: UploadFile = File(...),
        authorization: str | None = Header(default=None),
    ):
        _require_internal_token(authorization)
        return await _store_upload(file, kind)

    @router.post("/vocal-forge/neural/preflight")
    async def preflight(request: NeuralVoiceRenderRequest):
        return preflight_neural_voice(request)

    @router.post("/vocal-forge/neural/render")
    async def render(
        request: NeuralVoiceRenderRequest,
        authorization: str | None = Header(default=None),
    ):
        _require_internal_token(authorization)
        try:
            return await asyncio.to_thread(render_neural_voice, request)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        except RuntimeError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

    @router.get("/vocal-forge/neural/artifacts/{artifact_id}")
    async def download(
        artifact_id: str,
        authorization: str | None = Header(default=None),
    ):
        _require_internal_token(authorization)
        if not RESULT_RE.fullmatch(artifact_id):
            raise HTTPException(status_code=404, detail="Artifact not found")
        path = _result_dir() / f"{artifact_id}.wav"
        if not path.is_file():
            raise HTTPException(status_code=404, detail="Artifact not found")
        return FileResponse(path, media_type="audio/wav", filename=f"{artifact_id}.wav")

    return router
