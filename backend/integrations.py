"""
Empire 1 · Live Audio Integrations
===================================
- audio_synth(prompt) → generated track URL via Replicate (MusicGen)
- auto_split(url)     → 4 stem URLs via HTDemucs v4 worker
- fallback_stems()    → CORS-safe Chicano/G-Funk placeholders for investor demos

All wire-ups are env-gated. Missing keys never crash the server —
/api/generate returns beautiful mock data so the studio always ignites.
"""
from __future__ import annotations
import os
import asyncio
import logging
import tempfile
from pathlib import Path
from typing import Dict, List, Optional

import httpx

logger = logging.getLogger("empire1.integrations")

REPLICATE_API_KEY  = os.environ.get("REPLICATE_API_KEY", "").strip()
REPLICATE_MODEL    = os.environ.get(
    "REPLICATE_MODEL",
    "meta/musicgen:b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38",
)
REPLICATE_DURATION = int(os.environ.get("REPLICATE_DURATION", "20"))
DEMUCS_ENABLED     = os.environ.get("DEMUCS_ENABLED", "false").lower() == "true"
DEMUCS_DEVICE      = os.environ.get("DEMUCS_DEVICE", "cpu")

REPLICATE_URL = "https://api.replicate.com/v1/predictions"


# ============================================================
# 1 · AUDIO SYNTHESIS  (Replicate · MusicGen)
# ============================================================

async def audio_synth(prompt: str, duration: Optional[int] = None) -> Optional[str]:
    """
    Generate a track from a text prompt. Returns a public .wav URL or None if
    the key is missing / the provider errored (caller must handle both cases).
    """
    if not REPLICATE_API_KEY:
        return None
    payload = {
        "version": REPLICATE_MODEL.split(":")[-1] if ":" in REPLICATE_MODEL else REPLICATE_MODEL,
        "input": {
            "prompt": prompt,
            "duration": duration or REPLICATE_DURATION,
            "temperature": 1.0,
            "top_k": 250,
            "top_p": 0.0,
            "classifier_free_guidance": 3,
            "output_format": "mp3",
            "normalization_strategy": "peak",
        },
    }
    headers = {
        "Authorization": f"Bearer {REPLICATE_API_KEY}",
        "Content-Type": "application/json",
        "Prefer": "wait",   # synchronous mode when supported (≤ 60s)
    }
    try:
        async with httpx.AsyncClient(timeout=90.0) as c:
            r = await c.post(REPLICATE_URL, json=payload, headers=headers)
            r.raise_for_status()
            data = r.json()

            # Sync mode may return result directly. Otherwise poll.
            if data.get("status") in (None, "starting", "processing"):
                get_url = data.get("urls", {}).get("get")
                if get_url:
                    for _ in range(45):  # up to ~90s
                        await asyncio.sleep(2)
                        rr = await c.get(get_url, headers={"Authorization": headers["Authorization"]})
                        rr.raise_for_status()
                        data = rr.json()
                        if data.get("status") in ("succeeded", "failed", "canceled"):
                            break

            if data.get("status") != "succeeded":
                logger.warning(f"replicate non-success status: {data.get('status')} err={data.get('error')}")
                return None
            out = data.get("output")
            # MusicGen returns a single URL (string) or list
            if isinstance(out, list) and out:
                return out[0]
            if isinstance(out, str):
                return out
            return None
    except Exception as e:
        logger.warning(f"audio_synth error: {e}")
        return None


# ============================================================
# 2 · AUTO-SPLIT  (HTDemucs v4 worker)
# ============================================================

async def auto_split(
    source_url: str,
    out_dir: str,
    public_base: str = "/static/stems",
) -> List[Dict]:
    """
    Pipe a synthesized track through Demucs. Returns 4 stem dicts in the
    Empire 1 Stem contract. Falls back to 4 levels of the source URL itself
    when demucs isn't available in this environment.
    """
    names = ["Raw Human Pipes", "Late-Pocket Drums",
             "Sub Bass / Acoustic Requinto", "Analog Melody"]

    async def _fallback():
        return [
            {"name": n, "level": lvl, "peak": 0.5, "src": source_url}
            for n, lvl in zip(names, [0.95, 0.55, 0.55, 0.55])
        ]

    if not DEMUCS_ENABLED:
        return await _fallback()

    # lazy import — only pay the cost when the pipeline is actually enabled
    try:
        from demucs_worker import separate_to_stems
    except Exception as e:
        logger.warning(f"demucs import failed → fallback stems: {e}")
        return await _fallback()

    try:
        # pull the generated track to a tmp file
        tmp = Path(tempfile.mkdtemp()) / "ai_track.mp3"
        async with httpx.AsyncClient(timeout=60.0) as c:
            r = await c.get(source_url)
            r.raise_for_status()
            tmp.write_bytes(r.content)

        # run demucs in a thread (blocking subprocess)
        stems = await asyncio.to_thread(
            separate_to_stems,
            str(tmp), out_dir, "htdemucs", DEMUCS_DEVICE, public_base,
        )
        if not stems:
            return await _fallback()
        return stems
    except Exception as e:
        logger.warning(f"auto_split error → fallback: {e}")
        return await _fallback()


# ============================================================
# 3 · FALLBACK STEMS  (investor demo, no keys required)
# ============================================================

# 4 distinct royalty-free tracks that READ as Chicano / G-Funk / late-pocket
# when the user hits play. When Replicate key is configured these are replaced
# with the actual generated audio split by Demucs.
FALLBACK_STEM_URLS = {
    "Raw Human Pipes":               "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
    "Late-Pocket Drums":             "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    "Sub Bass / Acoustic Requinto":  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    "Analog Melody":                 "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
}


def fallback_stems(default_levels=(0.84, 0.77, 0.69, 0.61)) -> List[Dict]:
    names = list(FALLBACK_STEM_URLS.keys())
    return [
        {"name": n, "level": default_levels[i], "peak": round(default_levels[i]*0.85, 2),
         "src": FALLBACK_STEM_URLS[n]}
        for i, n in enumerate(names)
    ]


# ============================================================
# 4 · PROMPT BUILDER  — compose Replicate prompt from internals
# ============================================================

def build_synth_prompt(cultural_matrix: str, mood_recipe: tuple, lml: str) -> str:
    """
    Builds the text prompt fed to MusicGen. Keeps the actual LML biometric
    tags out of the wire response but injects their vibe into the prompt.
    """
    lung, throat, fry, crack = mood_recipe
    vibe_words = []
    if fry >= 0.8:   vibe_words.append("close-mic vocal fry")
    if throat >= 0.8: vibe_words.append("deep throat resonance")
    if crack >= 0.8: vibe_words.append("emotional vocal cracks")
    if lung >= 0.85: vibe_words.append("long held breaths")
    vibe = ", ".join(vibe_words) or "intimate close-mic delivery"

    # extract an evocative line from LML (stripped of tags) to seed MusicGen
    import re
    clean = re.sub(r"<[^>]+>", "", lml or "").strip()
    hook = (clean.splitlines() or [""])[0][:120]

    return (
        f"{cultural_matrix}, analog tape warmth, heavy 808 sub-bass, late-pocket drums dragging behind the beat, "
        f"{vibe}, vinyl crackle, oldies soul sample pitched down, requinto guitar texture. "
        f"Lyrical hook: \"{hook}\". 90 BPM. Cinematic, bruised, culturally authentic."
    )
