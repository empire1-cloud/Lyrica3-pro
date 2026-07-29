#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

from api.luzaria_voice_math import (  # noqa: E402
    VoiceEvent,
    load_voice_profile,
    render_score,
    voice_profile_digest,
    write_pcm24_wav,
)


OUTPUT_DIR = ROOT_DIR / "artifacts" / "luzaria_voice_v0"
WAV_PATH = OUTPUT_DIR / "luzaria_sleep_on_the_floor_voice_v0.wav"
METADATA_PATH = OUTPUT_DIR / "luzaria_sleep_on_the_floor_voice_v0.json"


def build_score() -> list[VoiceEvent]:
    # Original deterministic vocalise. It demonstrates Luzaria's mathematical
    # timbre and performance artifacts without pretending full lyric
    # intelligibility is complete.
    return [
        VoiceEvent(57, 0.58, "a", 0.64, "<adaptive_inhale>", 0.06),
        VoiceEvent(60, 0.48, "o", 0.70, "", 0.04),
        VoiceEvent(62, 0.62, "e", 0.73, "<vocal_fry>", 0.05),
        VoiceEvent(60, 0.52, "a", 0.69, "", 0.04),
        VoiceEvent(57, 0.76, "u", 0.66, "<chest_resonance>", 0.12),
        VoiceEvent(57, 0.44, "a", 0.62, "<adaptive_inhale>", 0.04),
        VoiceEvent(60, 0.42, "e", 0.68, "", 0.04),
        VoiceEvent(64, 0.56, "i", 0.75, "<emotional_crack>", 0.06),
        VoiceEvent(62, 0.48, "o", 0.72, "", 0.04),
        VoiceEvent(60, 0.74, "a", 0.78, "<chest_resonance>", 0.14),
        VoiceEvent(55, 0.48, "u", 0.60, "<vocal_fry>", 0.05),
        VoiceEvent(57, 0.48, "a", 0.65, "", 0.04),
        VoiceEvent(60, 0.62, "e", 0.74, "<emotional_crack>", 0.06),
        VoiceEvent(57, 0.82, "o", 0.70, "<chest_resonance>", 0.10),
    ]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    profile = load_voice_profile()
    audio, metadata = render_score(
        build_score(),
        genre_weights={"Chicano_Soul": 0.72, "Phonk": 0.18, "Krautrock": 0.10},
    )
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    write_pcm24_wav(WAV_PATH, audio, sample_rate=int(profile["rendering"]["sample_rate_hz"]))
    metadata.update(
        {
            "artifact_type": "Luzaria mathematical voice prototype",
            "track_context": "LZR-RC-0001 — Sleep On The Floor",
            "wav_path": str(WAV_PATH.relative_to(ROOT_DIR)),
            "wav_sha256": f"sha256_{sha256_file(WAV_PATH)}",
            "voice_profile_digest": voice_profile_digest(profile),
            "uses_human_voice_recordings": False,
            "uses_licensed_seed_voice": False,
            "full_lyric_intelligibility": "not yet approved",
            "release_master": False,
            "truth_note": "This artifact proves the original mathematical timbre engine. It is not labeled as Luzaria's final release master until lyric intelligibility, mix, and release proof gates pass.",
        }
    )
    METADATA_PATH.write_text(json.dumps(metadata, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(metadata, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
