from __future__ import annotations

import hashlib
import hmac
import json
import math
import os
import re
import wave
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

import numpy as np
from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, model_validator
from scipy.signal import iirpeak, lfilter

from .cultura_pronunciation import CulturaPronunciationPlan, evaluate_pronunciation_plan


ROOT_DIR = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT_DIR / "canon" / "vocal_forge" / "engine_registry_v1.json"
ARTIFACT_RE = re.compile(r"^aev_[0-9a-f]{24}$")
Mode = Literal["singing", "speech", "spoken_hook", "chant"]
ReleaseIntent = Literal["research", "demo", "release"]


class AetherNote(BaseModel):
    midi_note: float = Field(ge=24, le=108)
    start_beat: float = Field(ge=0)
    duration_beats: float = Field(gt=0, le=32)
    syllable: str = Field(min_length=1, max_length=120)
    intensity: float = Field(default=0.72, ge=0.05, le=1.0)
    pronunciation_token_index: int | None = Field(default=None, ge=0)


class EmotionControls(BaseModel):
    intensity: float = Field(default=0.65, ge=0, le=1)
    breathiness: float = Field(default=0.25, ge=0, le=1)
    grit: float = Field(default=0.18, ge=0, le=1)
    vulnerability: float = Field(default=0.5, ge=0, le=1)
    vibrato: float = Field(default=0.45, ge=0, le=1)
    hesitation: float = Field(default=0.0, ge=0, le=1)
    vocal_cracks: float = Field(default=0.12, ge=0, le=1)
    melodic_runs: float = Field(default=0.0, ge=0, le=1)


class VoiceIdentityProof(BaseModel):
    profile_id: str = Field(min_length=1, max_length=160)
    owner_id: str = Field(min_length=1, max_length=200)
    authorized: bool = True
    consent_id: str | None = Field(default=None, max_length=200)
    permission_reference: str | None = Field(default=None, max_length=1000)


class AetherVoiceRequest(BaseModel):
    project_id: str = Field(min_length=1, max_length=200)
    creator_id: str = Field(min_length=1, max_length=200)
    title: str = Field(min_length=1, max_length=300)
    mode: Mode = "singing"
    release_intent: ReleaseIntent = "research"
    voice_profile_id: str = "aether_warm_alto"
    performance_style: str = "neutral_studio"
    text: str | None = Field(default=None, max_length=12000)
    bpm: float = Field(default=100, ge=30, le=240)
    notes: list[AetherNote] = Field(default_factory=list, max_length=2000)
    emotion: EmotionControls = Field(default_factory=EmotionControls)
    pronunciation_plan: CulturaPronunciationPlan | None = None
    voice_identity: VoiceIdentityProof | None = None
    language_hint: str = Field(default="en", max_length=80)
    sample_rate: Literal[24000, 48000] = 24000
    receipt_context: dict[str, str] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_mode_inputs(self) -> "AetherVoiceRequest":
        if self.mode == "singing" and not self.notes:
            raise ValueError("singing mode requires melody notes")
        if self.mode in {"speech", "spoken_hook", "chant"} and not (self.text or "").strip():
            raise ValueError(f"{self.mode} mode requires text")
        return self


@dataclass(frozen=True)
class RenderEvent:
    midi_note: float
    start_seconds: float
    duration_seconds: float
    syllable: str
    intensity: float


def _canonical_json(payload: Any) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _sha256(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def _load_registry() -> dict[str, Any]:
    try:
        payload = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError("Aether-Voice engine registry is unavailable.") from exc
    if not isinstance(payload, dict):
        raise RuntimeError("Aether-Voice engine registry is invalid.")
    return payload


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


def _profile(registry: dict[str, Any], profile_id: str) -> dict[str, Any]:
    profile = registry["voice_profiles"].get(profile_id)
    if not isinstance(profile, dict):
        raise ValueError(f"unknown voice profile: {profile_id}")
    if profile.get("source_profile"):
        source_path = ROOT_DIR / profile["source_profile"]
        source = json.loads(source_path.read_text(encoding="utf-8"))
        return {
            **profile,
            "home_midi": 57,
            "range": [52, 77],
            "formants_hz": source["formants_hz"],
            "harmonic_rolloff": source["source_model"]["harmonic_rolloff"],
            "odd_bias": source["source_model"]["odd_harmonic_bias"],
            "breath": source["source_model"]["breath_noise_mix"],
            "chest": source["source_model"]["chest_resonance_mix"],
            "grit": source["source_model"]["vocal_fry_mix"],
        }
    return profile


def _style(registry: dict[str, Any], style_id: str) -> dict[str, Any]:
    style = registry["performance_styles"].get(style_id)
    if not isinstance(style, dict):
        raise ValueError(f"unknown performance style: {style_id}")
    return style


def _profile_digest(profile: dict[str, Any]) -> str:
    return f"aether_profile_sha256_{_sha256(_canonical_json(profile))}"


def _split_words(text: str) -> list[str]:
    return [token for token in re.findall(r"[\wÀ-ÿ'’-]+|[,.!?;:]", text, flags=re.UNICODE) if token.strip()]


def _dominant_vowel(text: str, language_hint: str = "en") -> str:
    lowered = text.casefold()
    aliases = {"á": "a", "à": "a", "ä": "a", "é": "e", "è": "e", "ë": "e",
               "í": "i", "ì": "i", "ï": "i", "ó": "o", "ò": "o", "ö": "o",
               "ú": "u", "ù": "u", "ü": "u"}
    normalized = "".join(aliases.get(ch, ch) for ch in lowered)
    for char in reversed(normalized):
        if char in "aeiou":
            return char
    return "a" if language_hint.startswith("es") else "e"


def _speech_events(request: AetherVoiceRequest, profile: dict[str, Any]) -> list[RenderEvent]:
    tokens = _split_words(request.text or "")
    cursor = 0.0
    events: list[RenderEvent] = []
    home = float(profile["home_midi"])
    word_index = 0
    for token in tokens:
        if token in ",.!?;:":
            cursor += 0.12 if token in ",;:" else 0.22
            continue
        letters = max(1, len(token))
        duration = min(0.52, 0.12 + letters * 0.028)
        contour = ((word_index % 5) - 2) * 0.45
        if request.mode == "chant":
            contour = 0.0
        elif request.mode == "spoken_hook":
            contour = (0, 2, 0, -1)[word_index % 4]
        pitch = home + contour
        events.append(RenderEvent(pitch, cursor, duration, token, 0.55 + request.emotion.intensity * 0.35))
        cursor += duration + 0.045
        word_index += 1
    return events


def _singing_events(request: AetherVoiceRequest) -> list[RenderEvent]:
    beat_seconds = 60.0 / request.bpm
    return [
        RenderEvent(
            midi_note=note.midi_note,
            start_seconds=note.start_beat * beat_seconds,
            duration_seconds=note.duration_beats * beat_seconds,
            syllable=note.syllable,
            intensity=note.intensity,
        )
        for note in sorted(request.notes, key=lambda item: (item.start_beat, item.midi_note))
    ]


def _validate_events(events: list[RenderEvent]) -> list[str]:
    blocks: list[str] = []
    previous_end = 0.0
    for index, event in enumerate(events):
        if index and event.start_seconds < previous_end - 1e-9:
            blocks.append(f"event_{index}_overlaps_previous")
        previous_end = max(previous_end, event.start_seconds + event.duration_seconds)
    if previous_end > 180:
        blocks.append("render_duration_exceeds_180_seconds")
    return blocks


def _validate_identity(request: AetherVoiceRequest, profile: dict[str, Any]) -> list[str]:
    kind = profile.get("kind")
    proof = request.voice_identity
    if kind == "platform_voice":
        return []
    blocks: list[str] = []
    if proof is None:
        return ["registered_artist_voice_identity_proof_required"]
    if proof.profile_id != request.voice_profile_id:
        blocks.append("voice_identity_profile_mismatch")
    if not proof.authorized:
        blocks.append("voice_identity_not_authorized")
    if not (proof.consent_id or "").strip():
        blocks.append("voice_identity_consent_id_required")
    if not (proof.permission_reference or "").strip():
        blocks.append("voice_identity_permission_reference_required")
    return blocks


def preflight_aether_voice(request: AetherVoiceRequest) -> dict[str, Any]:
    registry = _load_registry()
    try:
        profile = _profile(registry, request.voice_profile_id)
        _style(registry, request.performance_style)
    except ValueError as exc:
        return {"eligible": False, "blocks": [str(exc)], "review_items": []}

    events = _singing_events(request) if request.mode == "singing" else _speech_events(request, profile)
    blocks = _validate_events(events)
    blocks.extend(_validate_identity(request, profile))
    review_items: list[str] = []
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
        key = os.environ.get("VOCAL_FORGE_RECEIPT_SIGNING_KEY", "")
        if len(key) < 32:
            blocks.append("release_receipt_signing_key_missing_or_short")

    if request.voice_profile_id == "luzaria_velvet_grit":
        review_items.append("luzaria_is_one_registered_profile_not_the_platform_default")

    return {
        "eligible": not blocks,
        "blocks": sorted(set(blocks)),
        "review_items": sorted(set(review_items)),
        "mode": request.mode,
        "voice_profile_id": request.voice_profile_id,
        "performance_style": request.performance_style,
        "event_count": len(events),
        "duration_seconds": round(max((e.start_seconds + e.duration_seconds for e in events), default=0.0), 6),
        "profile_digest": _profile_digest(profile),
        "cultura": cultura_result,
        "public_summary": "Your words and melody are ready to become an expressive vocal.",
        "truth_boundary": {
            "multi_artist_engine": True,
            "luzaria_is_one_optional_profile": True,
            "celebrity_imitation": False,
            "external_models_executed": False,
        },
    }


def _bandpass(signal: np.ndarray, sample_rate: int, center_hz: float, bandwidth_hz: float) -> np.ndarray:
    nyquist = sample_rate / 2.0
    center = min(max(40.0, center_hz), nyquist * 0.94)
    q = max(0.5, center / max(1.0, bandwidth_hz))
    b, a = iirpeak(center / nyquist, q)
    return lfilter(b, a, signal)


def _soft_envelope(length: int, sample_rate: int, attack_ms: float, release_ms: float) -> np.ndarray:
    attack = min(length, max(1, int(sample_rate * attack_ms / 1000)))
    release = min(length, max(1, int(sample_rate * release_ms / 1000)))
    env = np.ones(length, dtype=np.float64)
    env[:attack] *= np.sin(np.linspace(0, math.pi / 2, attack)) ** 2
    env[-release:] *= np.cos(np.linspace(0, math.pi / 2, release)) ** 2
    return env


def _normalize(audio: np.ndarray, peak: float = 0.92) -> np.ndarray:
    maximum = float(np.max(np.abs(audio))) if audio.size else 0.0
    return audio if maximum <= 1e-12 else audio * (peak / maximum)


def _consonant_onset(syllable: str, length: int, sample_rate: int, rng: np.random.Generator) -> np.ndarray:
    output = np.zeros(length, dtype=np.float64)
    first = syllable.casefold()[:1]
    onset = min(length, max(1, int(sample_rate * 0.045)))
    noise = rng.normal(0.0, 1.0, onset)
    if first in "ptkbdg":
        output[:onset] += noise * np.linspace(0.24, 0.0, onset)
    elif first in "sfshczjx":
        output[:onset] += noise * np.linspace(0.16, 0.03, onset)
    elif first in "mn":
        output[:onset] += 0.08 * np.sin(2 * math.pi * 180 * np.arange(onset) / sample_rate)
    elif first in "rl":
        output[:onset] += 0.05 * np.sin(2 * math.pi * 240 * np.arange(onset) / sample_rate)
    return output


def _synthesize_event(
    event: RenderEvent,
    *,
    request: AetherVoiceRequest,
    profile: dict[str, Any],
    style: dict[str, Any],
    rng: np.random.Generator,
) -> np.ndarray:
    sample_rate = request.sample_rate
    length = max(1, int(round(event.duration_seconds * sample_rate)))
    t = np.arange(length, dtype=np.float64) / sample_rate
    pitch = event.midi_note + float(style.get("pitch_offset_semitones", 0.0))
    frequency = 440.0 * (2.0 ** ((pitch - 69.0) / 12.0))

    vibrato_depth = float(style["vibrato_depth_cents"]) * (0.35 + request.emotion.vibrato)
    vibrato_rate = float(style["vibrato_rate_hz"])
    vibrato = vibrato_depth * np.sin(2 * math.pi * vibrato_rate * t)

    jitter = rng.normal(0.0, 1.6 + 2.4 * request.emotion.vulnerability, size=length)
    jitter = np.convolve(jitter, np.ones(21) / 21.0, mode="same")
    frequency_curve = frequency * (2.0 ** ((vibrato + jitter) / 1200.0))

    if request.mode == "singing" and request.emotion.melodic_runs > 0.35 and length > sample_rate * 0.35:
        run = np.sin(2 * math.pi * 7.0 * t) * (request.emotion.melodic_runs * 55.0)
        frequency_curve *= 2.0 ** (run / 1200.0)

    phase = 2 * math.pi * np.cumsum(frequency_curve) / sample_rate
    excitation = np.zeros(length, dtype=np.float64)
    rolloff = float(profile.get("harmonic_rolloff", 1.34))
    odd_bias = float(profile.get("odd_bias", 1.08))
    for harmonic in range(1, 34):
        amp = 1.0 / (harmonic ** rolloff)
        if harmonic % 2:
            amp *= odd_bias
        excitation += amp * np.sin(harmonic * phase)

    grit = min(1.0, float(profile.get("grit", 0.08)) + float(style.get("grit", 0.0)) + request.emotion.grit * 0.35)
    excitation += grit * 0.11 * np.sign(np.sin(phase * 0.5))
    excitation = _normalize(excitation, 0.72)

    vowel = _dominant_vowel(event.syllable, request.language_hint)
    formants = profile["formants_hz"].get(vowel, profile["formants_hz"]["a"])
    voiced = np.zeros(length, dtype=np.float64)
    for center, bandwidth, weight in zip(formants[:3], (100, 145, 190), (1.0, 0.68, 0.38)):
        voiced += weight * _bandpass(excitation, sample_rate, float(center), float(bandwidth))

    breath = float(profile.get("breath", 0.1)) + float(style.get("breathiness", 0.1)) + request.emotion.breathiness * 0.3
    voiced += breath * rng.normal(0.0, 0.04, size=length)
    voiced += _consonant_onset(event.syllable, length, sample_rate, rng)

    chest = float(profile.get("chest", 0.2)) + float(style.get("chest", 0.15))
    voiced += chest * 0.12 * np.sin(phase * 0.5)

    envelope = _soft_envelope(
        length,
        sample_rate,
        18.0 + request.emotion.vulnerability * 24.0,
        70.0 + request.emotion.vulnerability * 90.0,
    )
    voiced *= envelope * event.intensity * (0.72 + request.emotion.intensity * 0.35)

    crack_threshold = int(hashlib.sha256(event.syllable.encode("utf-8")).hexdigest()[:8], 16) / 0xFFFFFFFF
    if crack_threshold < request.emotion.vocal_cracks * 0.18 and length > int(sample_rate * 0.18):
        start = int(length * 0.62)
        end = min(length, start + int(sample_rate * 0.045))
        voiced[start:end] *= np.linspace(1.0, 0.42, end - start)

    drive = 1.0 + grit * 1.2
    voiced = np.tanh(voiced * drive) / max(1e-9, math.tanh(drive))
    return _normalize(voiced, 0.9)


def _write_wav(path: Path, audio: np.ndarray, sample_rate: int) -> None:
    pcm = np.clip(audio, -1.0, 1.0)
    pcm16 = np.asarray(np.round(pcm * 32767.0), dtype="<i2")
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(sample_rate)
        output.writeframes(pcm16.tobytes())


def _receipt_signature(payload: dict[str, Any]) -> dict[str, str | None]:
    key = os.environ.get("VOCAL_FORGE_RECEIPT_SIGNING_KEY", "")
    if len(key) < 32:
        return {"algorithm": None, "signature": None, "status": "unsigned_research"}
    signature = hmac.new(key.encode("utf-8"), _canonical_json(payload), hashlib.sha256).hexdigest()
    return {"algorithm": "hmac-sha256", "signature": signature, "status": "signed"}


def render_aether_voice(request: AetherVoiceRequest) -> dict[str, Any]:
    preflight = preflight_aether_voice(request)
    if not preflight["eligible"]:
        raise ValueError("Aether-Voice preflight failed: " + ", ".join(preflight["blocks"]))

    registry = _load_registry()
    profile = _profile(registry, request.voice_profile_id)
    style = _style(registry, request.performance_style)
    events = _singing_events(request) if request.mode == "singing" else _speech_events(request, profile)

    duration = max((event.start_seconds + event.duration_seconds for event in events), default=0.0)
    timing_offset = max(-0.05, min(0.05, float(style.get("timing_offset_ms", 0.0)) / 1000.0))
    total_samples = max(1, int(math.ceil((duration + max(0.0, timing_offset)) * request.sample_rate)))
    mix = np.zeros(total_samples, dtype=np.float64)
    seed = int(_sha256(_canonical_json(request.model_dump(mode="json")))[:16], 16)
    rng = np.random.default_rng(seed)

    for event in events:
        rendered = _synthesize_event(event, request=request, profile=profile, style=style, rng=rng)
        start = int(round(max(0.0, event.start_seconds + timing_offset) * request.sample_rate))
        end = min(len(mix), start + len(rendered))
        if end > start:
            mix[start:end] += rendered[: end - start]

    mix = _normalize(mix, 0.92)
    request_digest = _sha256(_canonical_json(request.model_dump(mode="json")))
    artifact_id = f"aev_{request_digest[:24]}"
    wav_path = _artifact_dir() / f"{artifact_id}.wav"
    receipt_path = _artifact_dir() / f"{artifact_id}.receipt.json"
    _write_wav(wav_path, mix, request.sample_rate)
    audio_sha256 = _sha256(wav_path.read_bytes())

    receipt_payload = {
        "schema_version": "lyrica.aether-voice.receipt.v1",
        "receipt_id": f"aer_{audio_sha256[:24]}",
        "artifact_id": artifact_id,
        "project_id": request.project_id,
        "creator_id": request.creator_id,
        "title": request.title,
        "mode": request.mode,
        "release_intent": request.release_intent,
        "voice_profile_id": request.voice_profile_id,
        "voice_profile_digest": _profile_digest(profile),
        "performance_style": request.performance_style,
        "emotion": request.emotion.model_dump(mode="json"),
        "audio_sha256": audio_sha256,
        "sample_rate": request.sample_rate,
        "duration_seconds": round(len(mix) / request.sample_rate, 6),
        "event_count": len(events),
        "pronunciation_plan_digest": (
            preflight["cultura"]["plan_digest"] if preflight.get("cultura") else None
        ),
        "receipt_context": dict(sorted(request.receipt_context.items())),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "public_result": "Expressive vocal created.",
        "truth_boundary": preflight["truth_boundary"],
    }
    receipt = {**receipt_payload, "signature": _receipt_signature(receipt_payload)}
    receipt_path.write_text(json.dumps(receipt, indent=2, sort_keys=True, ensure_ascii=False), encoding="utf-8")
    return {
        "status": "rendered",
        "artifact_id": artifact_id,
        "audio_sha256": audio_sha256,
        "download_route": f"/vocal-forge/voice/artifacts/{artifact_id}",
        "public_result": "Expressive vocal created.",
        "preflight": preflight,
        "receipt": receipt,
    }


def engine_status() -> dict[str, Any]:
    registry = _load_registry()
    return {
        "name": registry["engine"]["name"],
        "role": registry["engine"]["role"],
        "modes": registry["engine"]["modes"],
        "public_promise": registry["engine"]["public_promise"],
        "voice_profiles": [
            {
                "id": profile_id,
                "label": profile["label"],
                "kind": profile["kind"],
                "is_platform_default": profile_id != "luzaria_velvet_grit",
            }
            for profile_id, profile in registry["voice_profiles"].items()
        ],
        "performance_styles": [
            {"id": style_id, "label": style["label"], "status": style["status"]}
            for style_id, style in registry["performance_styles"].items()
        ],
        "thematic_models": registry["thematic_models"],
        "vernacular_models": registry["vernacular_models"],
        "emotion_traits": registry["emotion_traits"],
        "truth_boundary": {
            "lyrica_is_multi_artist": True,
            "luzaria_is_one_registered_artist_profile": True,
            "tts_and_singing_share_the_engine": True,
        },
    }


def create_aether_voice_router() -> APIRouter:
    router = APIRouter(tags=["aether-voice"])

    @router.get("/vocal-forge/engine")
    async def get_engine():
        return engine_status()

    @router.post("/vocal-forge/voice/preflight")
    async def preflight(request: AetherVoiceRequest):
        return preflight_aether_voice(request)

    @router.post("/vocal-forge/voice/render")
    async def render(
        request: AetherVoiceRequest,
        authorization: str | None = Header(default=None),
    ):
        _require_internal_token(authorization)
        try:
            return render_aether_voice(request)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

    @router.post("/vocal-forge/tts/render")
    async def render_tts(
        request: AetherVoiceRequest,
        authorization: str | None = Header(default=None),
    ):
        _require_internal_token(authorization)
        if request.mode == "singing":
            raise HTTPException(status_code=422, detail="TTS route requires speech, spoken_hook, or chant mode")
        try:
            return render_aether_voice(request)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

    @router.get("/vocal-forge/voice/artifacts/{artifact_id}")
    async def download(
        artifact_id: str,
        authorization: str | None = Header(default=None),
    ):
        _require_internal_token(authorization)
        if not ARTIFACT_RE.fullmatch(artifact_id):
            raise HTTPException(status_code=404, detail="Artifact not found")
        path = _artifact_dir() / f"{artifact_id}.wav"
        if not path.exists():
            raise HTTPException(status_code=404, detail="Artifact not found")
        return FileResponse(path, media_type="audio/wav", filename=f"{artifact_id}.wav")

    return router
