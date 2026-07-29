from __future__ import annotations

import copy
from dataclasses import replace
from typing import Any, Sequence

from .luzaria_voice_math import VoiceEvent, load_voice_profile, render_score


ALLOWED_MODES = {
    "home",
    "testimony_grit",
    "soul_funk_upper_lift",
    "corrido_tumbado_grit",
}


def _mode_settings(profile: dict[str, Any], mode: str) -> dict[str, float]:
    if mode not in ALLOWED_MODES:
        raise ValueError(f"Unknown Luzaria performance mode: {mode}")
    modes = profile.get("performance_modes", {})
    settings = modes.get(mode)
    if not isinstance(settings, dict):
        raise ValueError(f"Luzaria performance mode is not configured: {mode}")
    return {key: float(value) for key, value in settings.items()}


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
        duration = event.duration_seconds / divisions
        for division in range(divisions):
            melodic_turn = 0.0
            if divisions > 1:
                melodic_turn = 2.0 if division == 1 else 0.0
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
    metadata["performance_mode"] = mode
    metadata["identity_preserved"] = True
    metadata["celebrity_similarity_targeting"] = False
    return audio, metadata
