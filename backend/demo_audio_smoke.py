#!/usr/bin/env python3
"""
TechCrunch demo preflight — verify Lyrica can produce real audio without Vertex/GCP.

Usage:
  cd backend
  python demo_audio_smoke.py              # procedural only (fast, no keys)
  python demo_audio_smoke.py --with-vocals  # also test OpenAI TTS (needs EMERGENT_LLM_KEY)
  python demo_audio_smoke.py --musicgen     # test local MusicGen (needs audiocraft + GPU)
"""
from __future__ import annotations

import argparse
import asyncio
import os
import sys
from pathlib import Path

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT))

OUT_DIR = ROOT / "static" / "stems"
VOICE_DIR = ROOT / "static" / "voices"


def test_procedural() -> bool:
    from procedural_instrumental import generate_instrumental_stems

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    stems, url = generate_instrumental_stems(
        bpm=92,
        key="C",
        cultural_matrix="LA SGV Chicano Heritage, doo-wop strings, lowrider soul",
        mood_recipe=(0.78, 0.66, 0.82, 0.71),
        out_dir=str(OUT_DIR),
        duration_beats=32,
    )
    if not stems or not url:
        print("FAIL procedural: no stems returned")
        return False
    fname = url.split("/")[-1]
    path = OUT_DIR / fname
    if not path.exists() or path.stat().st_size < 1000:
        print(f"FAIL procedural: missing or tiny file {path}")
        return False
    print(f"OK  procedural: {path} ({path.stat().st_size:,} bytes)")
    return True


async def test_musicgen() -> bool:
    from local_musicgen import AUDIOCRAFT_AVAILABLE, generate_music_local

    if not AUDIOCRAFT_AVAILABLE:
        print("SKIP musicgen: audiocraft not installed (pip install audiocraft torch)")
        return False
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = await generate_music_local(
        prompt=(
            "LA SGV Chicano Heritage, analog tape warmth, heavy 808 sub-bass, "
            "late-pocket drums, 90 BPM, cinematic lowrider soul"
        ),
        duration=10,
        output_dir=str(OUT_DIR),
    )
    if not path or not Path(path).exists():
        print("FAIL musicgen: no output file")
        return False
    size = Path(path).stat().st_size
    print(f"OK  musicgen: {path} ({size:,} bytes)")
    return True


async def test_vocals() -> bool:
    from integrations import vocal_performance, EMERGENT_LLM_KEY

    if not EMERGENT_LLM_KEY:
        print("SKIP vocals: set EMERGENT_LLM_KEY in backend/.env")
        return False
    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    lml = (
        "<verse><vocal_fry depth='0.8'>"
        "wildflowers in the cracks of the boulevard, we still ride"
        "</vocal_fry></verse>"
    )
    result = await vocal_performance(lml=lml, mood="Late-Night Honesty", out_dir=str(VOICE_DIR))
    if not result or not result.get("url"):
        print("FAIL vocals: vocal_performance returned nothing")
        return False
    print(f"OK  vocals: {result['url']} (voice={result.get('voice')})")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Lyrica local audio smoke test")
    parser.add_argument("--musicgen", action="store_true", help="Also test local MusicGen")
    parser.add_argument("--with-vocals", action="store_true", help="Also test OpenAI TTS vocals")
    args = parser.parse_args()

    print("=== Lyrica Audio Smoke Test ===")
    print(f"LOCAL_AUDIO_MODE={os.environ.get('LOCAL_AUDIO_MODE', 'false')}")
    print()

    ok = test_procedural()
    if args.musicgen:
        ok = asyncio.run(test_musicgen()) and ok
    if args.with_vocals:
        ok = asyncio.run(test_vocals()) and ok

    print()
    if ok:
        print("PASS — demo-ready with procedural instrumental.")
        print("For full track (beats + voice): set EMERGENT_LLM_KEY and LOCAL_AUDIO_MODE=true in .env")
        return 0
    print("FAIL — fix errors above before TechCrunch demo.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
