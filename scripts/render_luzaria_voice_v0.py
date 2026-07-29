#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

import numpy as np

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

from api.luzaria_voice_math import (  # noqa: E402
    VoiceEvent,
    load_voice_profile,
    voice_profile_digest,
    write_pcm24_wav,
)
from api.luzaria_voice_performance import (  # noqa: E402
    render_harmony_stack,
    render_performance,
)


OUTPUT_DIR = ROOT_DIR / "artifacts" / "luzaria_voice_v0"
WAV_PATH = OUTPUT_DIR / "luzaria_sleep_on_the_floor_voice_v0.wav"
METADATA_PATH = OUTPUT_DIR / "luzaria_sleep_on_the_floor_voice_v0.json"


def _normalize(audio: np.ndarray, peak: float = 0.92) -> np.ndarray:
    values = np.asarray(audio, dtype=np.float64)
    maximum = float(np.max(np.abs(values))) if values.size else 0.0
    return values if maximum <= 1e-12 else values * (peak / maximum)


def _silence(seconds: float, sample_rate: int) -> np.ndarray:
    return np.zeros(max(0, int(sample_rate * seconds)), dtype=np.float64)


def testimony_score() -> list[VoiceEvent]:
    return [
        VoiceEvent(57, 0.58, "a", 0.64, "<adaptive_inhale>", 0.06),
        VoiceEvent(60, 0.48, "o", 0.70, "", 0.04),
        VoiceEvent(62, 0.62, "e", 0.73, "<vocal_fry>", 0.05),
        VoiceEvent(60, 0.52, "a", 0.69, "", 0.04),
        VoiceEvent(57, 0.76, "u", 0.66, "<chest_resonance>", 0.12),
    ]


def harmony_score() -> list[VoiceEvent]:
    return [
        VoiceEvent(57, 0.46, "a", 0.62, "", 0.04),
        VoiceEvent(60, 0.44, "e", 0.68, "", 0.04),
        VoiceEvent(64, 0.62, "i", 0.74, "<emotional_crack>", 0.08),
        VoiceEvent(62, 0.72, "o", 0.71, "<chest_resonance>", 0.10),
    ]


def freestyle_score() -> list[VoiceEvent]:
    return [
        VoiceEvent(60, 0.30, "a", 0.73, "", 0.02),
        VoiceEvent(62, 0.28, "e", 0.76, "", 0.02),
        VoiceEvent(64, 0.30, "i", 0.78, "", 0.02),
        VoiceEvent(67, 0.44, "o", 0.80, "<chest_resonance>", 0.03),
        VoiceEvent(64, 0.28, "e", 0.76, "", 0.02),
        VoiceEvent(69, 0.54, "a", 0.82, "<emotional_crack>", 0.06),
    ]


def modern_pocket_score() -> list[VoiceEvent]:
    return [
        VoiceEvent(57, 0.34, "u", 0.58, "<adaptive_inhale>", 0.08),
        VoiceEvent(60, 0.26, "a", 0.62, "", 0.12),
        VoiceEvent(59, 0.38, "e", 0.66, "<vocal_fry>", 0.04),
        VoiceEvent(62, 0.24, "i", 0.68, "", 0.14),
        VoiceEvent(60, 0.56, "o", 0.72, "<emotional_crack>", 0.10),
    ]


def rap_sung_score() -> list[VoiceEvent]:
    return [
        VoiceEvent(60, 0.50, "a", 0.72, "", 0.03),
        VoiceEvent(62, 0.52, "e", 0.75, "", 0.03),
        VoiceEvent(64, 0.58, "i", 0.78, "<chest_resonance>", 0.05),
    ]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    profile = load_voice_profile()
    sample_rate = int(profile["rendering"]["sample_rate_hz"])
    default_weights = {
        "Chicano_Soul": 0.62,
        "Contemporary_Freestyle": 0.16,
        "Phonk": 0.08,
        "Krautrock": 0.04,
        "Corrido_Tumbado": 0.10,
    }

    testimony, testimony_meta = render_performance(
        testimony_score(),
        mode="testimony_grit",
        genre_weights=default_weights,
    )
    harmony, harmony_meta = render_harmony_stack(
        harmony_score(),
        mode="velvet_90s_harmony",
        intervals=(-3.0, 0.0, 4.0, 7.0),
        gains=(0.32, 1.0, 0.30, 0.16),
        delays_ms=(20.0, 0.0, 24.0, 34.0),
        genre_weights=default_weights,
    )
    freestyle, freestyle_meta = render_performance(
        freestyle_score(),
        mode="freestyle_electro_lift",
        genre_weights=default_weights,
    )
    modern, modern_meta = render_performance(
        modern_pocket_score(),
        mode="modern_alt_rnb_pocket",
        genre_weights=default_weights,
    )
    rap_sung, rap_sung_meta = render_performance(
        rap_sung_score(),
        mode="playful_rap_sung_switch",
        genre_weights=default_weights,
    )

    audio = _normalize(
        np.concatenate(
            [
                _silence(0.30, sample_rate),
                testimony,
                _silence(0.34, sample_rate),
                harmony,
                _silence(0.34, sample_rate),
                freestyle,
                _silence(0.34, sample_rate),
                modern,
                _silence(0.28, sample_rate),
                rap_sung,
                _silence(0.30, sample_rate),
            ]
        )
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    write_pcm24_wav(WAV_PATH, audio, sample_rate=sample_rate)
    metadata = {
        "artifact_type": "Luzaria Velvet Grit mathematical voice prototype",
        "artist_id": "LZR-00000001",
        "voice_model_id": "LZR-VOICE-MATH-V0",
        "vocal_north_star": "Velvet Grit",
        "track_context": "LZR-RC-0001 — Sleep On The Floor",
        "sample_rate_hz": sample_rate,
        "bit_depth": int(profile["rendering"]["bit_depth"]),
        "duration_seconds": len(audio) / sample_rate,
        "sections": [
            {"name": "smoky_testimony", "metadata": testimony_meta},
            {"name": "90s_harmony_bloom", "metadata": harmony_meta},
            {"name": "contemporary_freestyle_lift", "metadata": freestyle_meta},
            {"name": "modern_alt_rnb_pocket", "metadata": modern_meta},
            {"name": "playful_rap_sung_switch", "metadata": rap_sung_meta},
        ],
        "wav_path": str(WAV_PATH.relative_to(ROOT_DIR)),
        "wav_sha256": f"sha256_{sha256_file(WAV_PATH)}",
        "voice_profile_digest": voice_profile_digest(profile),
        "uses_human_voice_recordings": False,
        "uses_licensed_seed_voice": False,
        "celebrity_similarity_targeting": False,
        "full_lyric_intelligibility": "not yet approved",
        "release_master": False,
        "truth_note": "This artifact proves Luzaria's original mathematical timbre, approved expression modes, and one-identity harmony architecture. It is a vowel-vocalise prototype, not the final lyric master.",
    }
    METADATA_PATH.write_text(json.dumps(metadata, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(metadata, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
