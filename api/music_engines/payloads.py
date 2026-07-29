from __future__ import annotations

import math
from typing import Any

from .models import MusicEngineRequest


def _base_identity(request: MusicEngineRequest) -> dict[str, Any]:
    return {
        "title": request.title,
        "artist_id": request.artist_id,
        "artist_name": request.artist_name,
        "voice_identity_ref": request.voice_identity_ref,
        "consent_assertion_id": request.consent_assertion_id,
        "lyrica_metadata": request.metadata,
    }


def ace_step_payload(request: MusicEngineRequest) -> dict[str, Any]:
    return {
        **_base_identity(request),
        "task": request.task.value,
        "caption": request.prompt,
        "lyrics": request.lyrics,
        "duration": request.duration_seconds,
        "bpm": request.bpm,
        "key_scale": request.musical_key,
        "time_signature": request.time_signature,
        "language_tags": request.language_tags,
        "genre_tags": request.genre_tags,
        "negative_tags": request.negative_tags,
        "reference_audio_url": request.reference_audio_url,
        "quality_mode": request.quality_mode.value,
        "candidate_count": request.candidate_count,
    }


def yue_payload(request: MusicEngineRequest) -> dict[str, Any]:
    genre_components = [
        *request.genre_tags,
        *request.language_tags,
        request.artist_name or "original singer",
        request.prompt,
    ]
    genre_prompt = " ".join(value.strip() for value in genre_components if value and value.strip())
    segments = max(1, min(20, math.ceil(request.duration_seconds / 30)))
    return {
        **_base_identity(request),
        "task": request.task.value,
        "genre_prompt": genre_prompt,
        "lyrics": request.lyrics,
        "run_n_segments": segments,
        "max_new_tokens": 3000,
        "repetition_penalty": 1.1,
        "reference_audio_url": request.reference_audio_url,
        "use_audio_prompt": bool(request.reference_audio_url),
        "candidate_count": min(request.candidate_count, 4),
    }


def heartmula_payload(request: MusicEngineRequest) -> dict[str, Any]:
    tags = [*request.genre_tags, *request.language_tags]
    if request.prompt.strip():
        tags.append(request.prompt.strip())
    return {
        **_base_identity(request),
        "task": request.task.value,
        "lyrics": request.lyrics,
        "tags": tags,
        "max_audio_length_ms": request.duration_seconds * 1000,
        "topk": 50,
        "temperature": 1.0,
        "cfg_scale": 1.5,
        "candidate_count": request.candidate_count,
    }


def diffsinger_payload(request: MusicEngineRequest) -> dict[str, Any]:
    return {
        **_base_identity(request),
        "task": request.task.value,
        "lyrics": request.lyrics,
        "midi_url": request.midi_url,
        "melody_url": request.melody_url,
        "language_tags": request.language_tags,
        "phoneme_control": True,
        "exact_lyrics": request.needs_exact_lyrics,
        "output": {
            "sample_rate_hz": 48000,
            "bit_depth": 24,
            "stems": ["vocals"],
        },
    }


def vevo2_payload(request: MusicEngineRequest) -> dict[str, Any]:
    return {
        **_base_identity(request),
        "task": request.task.value,
        "lyrics": request.lyrics,
        "prompt": request.prompt,
        "reference_audio_url": request.reference_audio_url,
        "melody_url": request.melody_url,
        "midi_url": request.midi_url,
        "preserve_locked_identity": bool(request.voice_identity_ref),
        "style_conversion": request.task.value == "singing_style_conversion",
        "voice_conversion": request.task.value == "voice_conversion",
        "melody_control": request.needs_melody_control,
        "output": {
            "sample_rate_hz": 48000,
            "bit_depth": 24,
            "stems": ["vocals"],
        },
    }


_PAYLOAD_BUILDERS = {
    "ace_step_1_5": ace_step_payload,
    "yue": yue_payload,
    "heartmula": heartmula_payload,
    "openvpi_diffsinger": diffsinger_payload,
    "amphion_vevo2": vevo2_payload,
}


def build_provider_payload(provider_id: str, request: MusicEngineRequest) -> dict[str, Any]:
    try:
        builder = _PAYLOAD_BUILDERS[provider_id]
    except KeyError as exc:
        raise ValueError(f"No payload translator exists for provider {provider_id}.") from exc
    return builder(request)
