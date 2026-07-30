from __future__ import annotations

import copy
from dataclasses import replace
from typing import Any, Sequence

import numpy as np

from .luzaria_voice_math import VoiceEvent, load_voice_profile, render_score


ALLOWED_MODES = {
    "home",
    "testimony_grit",
    "soul_funk_upper_lift",
    "corrido_tumbado_grit",
    "velvet_90s_harmony",
    "freestyle_electro_lift",
    "modern_alt_rnb_pocket",
    "playful_rap_sung_switch",
}


def _mode_settings(profile: dict[str, Any], mode: str) -> dict[str, float]:
    if mode not in ALLOWED_MODES:
        raise ValueError(f"Unknown Luzaria performance mode: {mode}")
    modes = profile.get("performance_modes", {})
    settings = modes.get(mode)
    if not isinstance(settings, dict):
        raise ValueError(f"Luzaria performance mode is not configured: {mode}")
    return {key: float(value) for key, value in settings.items()}


def _normalize(audio: np.ndarray, peak: float = 0.92) -> np.ndarray:
    values = np.asarray(audio, dtype=np.float64)
    if values.size == 0:
        return values
    maximum = float(np.max(np.abs(values)))
    if maximum <= 1e-12:
        return values
    return values * (peak / maximum)


def _timing_shift(audio: np.ndarray, sample_rate: int, offset_ms: float) -> np.ndarray:
    samples = int(round(sample_rate * offset_ms / 1000.0))
    if samples > 0:
        return np.concatenate((np.zeros(samples, dtype=np.float64), audio))
    if samples < 0:
        trim = min(len(audio) - 1, abs(samples)) if len(audio) > 1 else 0
        return audio[trim:]
    return audio


def apply_performance_mode(
    events: Sequence[VoiceEvent],
    *,
    mode: str,
    profile: dict[str, Any] | None = None,
) -> tuple[list[VoiceEvent], dict[str, Any]]:
    base_profile = copy.deepcopy(profile or load_voice_profile())
    settings = _mode_settings(base_profile, mode)

    fundamental = base_profile["fundamental"]
    source = base_profile["source_model"]
    fundamental["vibrato_rate_hz"] *= settings.get("vibrato_rate_multiplier", 1.0)
    fundamental["vibrato_depth_cents"] *= settings.get("vibrato_depth_multiplier", 1.0)
    source["chest_resonance_mix"] *= settings.get("chest_multiplier", 1.0)
    source["soft_saturation_drive"] *= settings.get("grit_multiplier", 1.0)
    source["breath_noise_mix"] *= settings.get("breath_multiplier", 1.0)

    # Lower harmonic rolloff means more high-frequency energy. The adjustment
    # changes brightness without replacing Luzaria's locked formants.
    brightness = max(0.65, settings.get("brightness_multiplier", 1.0))
    source["harmonic_rolloff"] = max(0.85, source["harmonic_rolloff"] / brightness)

    offset = settings.get("pitch_offset_semitones", 0.0)
    melisma_rate = max(0.5, settings.get("melisma_rate", 1.0))
    transformed: list[VoiceEvent] = []
    for event in events:
        divisions = 1
        if melisma_rate >= 1.5 and event.duration_seconds >= 0.32:
            divisions = 2
        if melisma_rate >= 1.85 and event.duration_seconds >= 0.48:
            divisions = 3
        duration = event.duration_seconds / divisions
        melodic_pattern = (0.0, 2.0, -1.0)
        for division in range(divisions):
            melodic_turn = melodic_pattern[division % len(melodic_pattern)] if divisions > 1 else 0.0
            transformed.append(
                replace(
                    event,
                    midi_note=event.midi_note + offset + melodic_turn,
                    duration_seconds=duration,
                    rest_after_seconds=event.rest_after_seconds if division == divisions - 1 else 0.0,
                )
            )

    return transformed, base_profile


def render_performance(
    events: Sequence[VoiceEvent],
    *,
    mode: str = "home",
    genre_weights: dict[str, float] | None = None,
):
    transformed, profile = apply_performance_mode(events, mode=mode)
    audio, metadata = render_score(
        transformed,
        profile=profile,
        genre_weights=genre_weights,
    )
    settings = _mode_settings(profile, mode)
    sample_rate = int(metadata["sample_rate_hz"])
    audio = _timing_shift(audio, sample_rate, settings.get("timing_offset_ms", 0.0))
    audio = _normalize(audio)
    metadata["duration_seconds"] = len(audio) / sample_rate
    metadata["performance_mode"] = mode
    metadata["timing_offset_ms"] = settings.get("timing_offset_ms", 0.0)
    metadata["identity_preserved"] = True
    metadata["celebrity_similarity_targeting"] = False
    metadata["vocal_north_star"] = "Velvet Grit"
    return audio, metadata


def _shift_score(
    events: Sequence[VoiceEvent],
    *,
    semitones: float,
    intensity_multiplier: float,
) -> list[VoiceEvent]:
    return [
        replace(
            event,
            midi_note=event.midi_note + semitones,
            intensity=max(0.05, min(1.0, event.intensity * intensity_multiplier)),
        )
        for event in events
    ]


def render_harmony_stack(
    events: Sequence[VoiceEvent],
    *,
    mode: str = "velvet_90s_harmony",
    intervals: Sequence[float] = (-3.0, 0.0, 4.0),
    gains: Sequence[float] = (0.38, 1.0, 0.34),
    delays_ms: Sequence[float] = (18.0, 0.0, 22.0),
    genre_weights: dict[str, float] | None = None,
) -> tuple[np.ndarray, dict[str, Any]]:
    if not (len(intervals) == len(gains) == len(delays_ms)):
        raise ValueError("Harmony intervals, gains, and delays must have equal lengths.")
    if not intervals:
        raise ValueError("At least one harmony layer is required.")

    rendered_layers: list[np.ndarray] = []
    layer_metadata: list[dict[str, Any]] = []
    sample_rate = int(load_voice_profile()["rendering"]["sample_rate_hz"])

    for index, (interval, gain, delay_ms) in enumerate(zip(intervals, gains, delays_ms)):
        shifted = _shift_score(
            events,
            semitones=float(interval),
            intensity_multiplier=max(0.05, float(gain)),
        )
        layer, metadata = render_performance(
            shifted,
            mode=mode,
            genre_weights=genre_weights,
        )
        layer = _timing_shift(layer, sample_rate, float(delay_ms)) * float(gain)
        rendered_layers.append(layer)
        layer_metadata.append(
            {
                "layer": index,
                "interval_semitones": float(interval),
                "gain": float(gain),
                "delay_ms": float(delay_ms),
                "voice_model_id": metadata["voice_model_id"],
                "artist_id": metadata["artist_id"],
            }
        )

    maximum_length = max(len(layer) for layer in rendered_layers)
    mix = np.zeros(maximum_length, dtype=np.float64)
    for layer in rendered_layers:
        mix[: len(layer)] += layer
    mix = _normalize(mix)
    return mix, {
        "voice_model_id": "LZR-VOICE-MATH-V0",
        "artist_id": "LZR-00000001",
        "vocal_north_star": "Velvet Grit",
        "stack_mode": mode,
        "layer_count": len(rendered_layers),
        "layers": layer_metadata,
        "sample_rate_hz": sample_rate,
        "duration_seconds": len(mix) / sample_rate,
        "identity_preserved": True,
        "single_voice_multiplied": True,
        "celebrity_similarity_targeting": False,
    }
