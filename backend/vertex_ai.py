"""
Empire 1 · Vertex AI integrations  (optional upgrade path)
===========================================================
Native Google Cloud AI — auth'd via the Cloud Run service account's IAM
(no API keys), billed to your GCP project.

Provides three optional engines that swap in when VERTEX_AI_ENABLED=true:

  • vertex_gemini_lml()    → Gemini 2.5 Pro LML generation
                              (alternative to Claude Sonnet 4.5)
  • vertex_lyria_music()   → Lyria 2 instrumental music generation
                              (the missing music pillar — no Replicate needed)
  • vertex_chirp_tts()     → Chirp 3 HD vocal performance
                              (alternative to OpenAI TTS-1-HD)

Why this matters
----------------
- Lyria 2 produces an actual instrumental that MATCHES the genre+mood prompt.
  That kills the "same SoundHelix beat on every track" problem without
  requiring a Suno/Udio/Replicate key.
- All three share the same IAM credentials — one `roles/aiplatform.user`
  grant on the Cloud Run runtime SA lights them all up.
- Failure is fail-safe: any error → caller falls back to the existing
  OpenAI TTS + SoundHelix fallback pipeline.

Access caveats
--------------
- Lyria 2 may require Google allowlist approval for your GCP project.
  Request access at https://cloud.google.com/vertex-ai/generative-ai/docs/music-generation
  Until approved, vertex_lyria_music() returns None and the pipeline
  falls back to Replicate (if REPLICATE_API_KEY set) → SoundHelix placeholders.
- Gemini 2.5 Pro is GA in most regions as of 2026-01.
- Chirp 3 HD is GA.
"""
from __future__ import annotations
import os
import base64
import math
import uuid
import logging
import asyncio
from pathlib import Path
from typing import Optional, Dict

logger = logging.getLogger("empire1.vertex")

VERTEX_AI_ENABLED = os.environ.get("VERTEX_AI_ENABLED", "false").lower() == "true"
VERTEX_PROJECT_ID = os.environ.get("VERTEX_PROJECT_ID", "").strip()
VERTEX_LOCATION   = os.environ.get("VERTEX_LOCATION",   "us-central1").strip()

# Model IDs — override in env to pin a specific version
VERTEX_GEMINI_MODEL = os.environ.get("VERTEX_GEMINI_MODEL", "gemini-2.5-pro")
VERTEX_LYRIA_MODEL  = os.environ.get("VERTEX_LYRIA_MODEL",  "lyria-002")
VERTEX_CHIRP_VOICE  = os.environ.get("VERTEX_CHIRP_VOICE",  "en-US-Chirp3-HD-Orus")


# Full-song composition knobs
LYRIA_SEGMENT_SECONDS = int(os.environ.get("LYRIA_SEGMENT_SECONDS", "30"))  # per-call max
# Default 9×30s segments with crossfades ≈ >4 min wall-clock — override via LYRIA_SEGMENTS or target_duration on generate
LYRIA_SEGMENTS        = int(os.environ.get("LYRIA_SEGMENTS", "9"))
LYRIA_CROSSFADE_MS    = int(os.environ.get("LYRIA_CROSSFADE_MS", "1500"))
LYRIA_SEGMENTS_MAX    = int(os.environ.get("LYRIA_SEGMENTS_MAX", "24"))  # safety cap (~12+ min raw audio)


def _available() -> bool:
    return VERTEX_AI_ENABLED and bool(VERTEX_PROJECT_ID)


def lyria_segments_for_target_seconds(total_seconds: int) -> int:
    """How many Lyria segments to stitch to reach ~total_seconds (accounting for crossfades)."""
    if total_seconds <= 0:
        return LYRIA_SEGMENTS
    seg = max(1, LYRIA_SEGMENT_SECONDS)
    cf_s = max(0.0, LYRIA_CROSSFADE_MS / 1000.0)
    if total_seconds <= seg:
        return 1
    denom = seg - cf_s
    if denom <= 0:
        n = int(math.ceil(total_seconds / seg))
    else:
        n = int(math.ceil((total_seconds + cf_s) / denom))
    return max(1, min(n, LYRIA_SEGMENTS_MAX))


# ============================================================
# 1 · GEMINI 2.5 — LML generation (drop-in alt to Claude)
# ============================================================

async def vertex_gemini_lml(system_prompt: str, user_prompt: str) -> Optional[Dict]:
    """Returns {title, cultural_subtext, lml} or None on failure."""
    if not _available():
        return None
    try:
        from google import genai
        from google.genai import types as gtypes
        import json, re
        client = genai.Client(vertexai=True, project=VERTEX_PROJECT_ID, location=VERTEX_LOCATION)

        def _call():
            resp = client.models.generate_content(
                model=VERTEX_GEMINI_MODEL,
                contents=user_prompt,
                config=gtypes.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    temperature=0.9,
                    top_p=0.95,
                    max_output_tokens=2048,
                ),
            )
            return resp.text or ""

        txt = await asyncio.to_thread(_call)
        m = re.search(r"\{[\s\S]*\}", txt)
        if m: txt = m.group(0)
        data = json.loads(txt)
        for k in ("title", "cultural_subtext", "lml"):
            if k not in data: return None
        return data
    except Exception as e:
        logger.warning("vertex_gemini_lml error: %s", e)
        return None


# ============================================================
# 2 · LYRIA 2 — Text-to-music instrumental generation
# ============================================================

async def vertex_lyria_music(prompt: str, duration_seconds: int = 20,
                              out_dir: str = "/tmp") -> Optional[str]:
    """
    Generates a single instrumental clip (≤30s).
    Use vertex_lyria_full_song() for multi-minute tracks.
    Returns a local .wav path, or None if unavailable / error.
    """
    if not _available():
        return None
    try:
        import vertexai
        from google.cloud import aiplatform
        from google.protobuf import json_format
        from google.protobuf.struct_pb2 import Value

        vertexai.init(project=VERTEX_PROJECT_ID, location=VERTEX_LOCATION)

        endpoint_path = (
            f"projects/{VERTEX_PROJECT_ID}/locations/{VERTEX_LOCATION}"
            f"/publishers/google/models/{VERTEX_LYRIA_MODEL}"
        )

        def _call():
            api_client = aiplatform.gapic.PredictionServiceClient(
                client_options={"api_endpoint": f"{VERTEX_LOCATION}-aiplatform.googleapis.com"}
            )
            instance = {"prompt": prompt, "negative_prompt": "", "seed": 0}
            parameters = {"sample_count": 1, "duration_seconds": int(min(duration_seconds, 30))}
            resp = api_client.predict(
                endpoint=endpoint_path,
                instances=[json_format.ParseDict(instance, Value())],
                parameters=json_format.ParseDict(parameters, Value()),
            )
            preds = [json_format.MessageToDict(p) for p in resp.predictions]
            if not preds: return None
            b64 = preds[0].get("bytesBase64Encoded") or preds[0].get("audio") or ""
            return base64.b64decode(b64) if b64 else None

        audio_bytes = await asyncio.to_thread(_call)
        if not audio_bytes: return None

        Path(out_dir).mkdir(parents=True, exist_ok=True)
        path = Path(out_dir) / f"lyria_seg_{uuid.uuid4().hex[:10]}.wav"
        path.write_bytes(audio_bytes)
        return str(path)
    except Exception as e:
        logger.warning("vertex_lyria_music error: %s", e)
        return None


async def vertex_lyria_full_song(base_prompt: str, matrix: str, mood_recipe: tuple,
                                  out_dir: str = "/tmp",
                                  segments: Optional[int] = None) -> Optional[str]:
    """
    Compose a full-length track by firing N parallel Lyria calls with
    section-specific prompt variants, then crossfading the results into
    a single MP3.

    Returns the local .mp3 path or None on failure.
    Segment count × 30s with crossfades scales past 4+ minutes when `segments` is increased
    (see `lyria_segments_for_target_seconds`).
    """
    if not _available():
        return None
    n = segments or LYRIA_SEGMENTS
    lung, throat, fry, crack = mood_recipe

    # section-aware prompt variants — cycle for long songs (4+ min need >6 segments)
    section_cycle = [
        ("intro",   "tape hiss intro, ambient room tone, soft arrival"),
        ("verse",   "full arrangement, steady groove, late-pocket drums"),
        ("prechorus","building tension, ride cymbal, rising bass"),
        ("chorus",  "climactic hook, layered vocals, wide stereo"),
        ("verse2",  "stripped verse, minimal, intimate close-mic"),
        ("bridge",  "harmonic contrast, space, return energy building"),
        ("outro",   "fade out, tape slow, final vinyl crackle"),
    ]
    sections: list = []
    for i in range(n):
        label, flavor = section_cycle[i % len(section_cycle)]
        if i >= len(section_cycle):
            label = f"{label}_cont"
            flavor = f"{flavor}; part {i // len(section_cycle) + 1}, evolve arrangement subtly"
        sections.append((label, flavor))

    prompts = [
        f"{base_prompt}. Section: {label}. {flavor}."
        for label, flavor in sections
    ]

    # fire all segments concurrently
    tasks = [
        vertex_lyria_music(p, duration_seconds=LYRIA_SEGMENT_SECONDS, out_dir=out_dir)
        for p in prompts
    ]
    paths = await asyncio.gather(*tasks, return_exceptions=True)
    good = [p for p in paths if isinstance(p, str) and p]
    if not good:
        return None
    if len(good) == 1:
        # single segment came back — promote directly to mp3
        return good[0]

    # stitch with pydub + crossfade
    try:
        from pydub import AudioSegment
        def _stitch():
            combined: Optional[AudioSegment] = None
            for p in good:
                seg = AudioSegment.from_file(p)
                combined = seg if combined is None else combined.append(seg, crossfade=LYRIA_CROSSFADE_MS)
            out = Path(out_dir) / f"lyria_song_{uuid.uuid4().hex[:10]}.mp3"
            combined.export(out, format="mp3", bitrate="192k")
            # cleanup segment files — they served their purpose
            for p in good:
                try: Path(p).unlink()
                except Exception: pass
            return str(out)
        return await asyncio.to_thread(_stitch)
    except Exception as e:
        logger.warning("lyria stitch error: %s", e)
        return good[0]  # at least return the first clip


# ============================================================
# 3 · CHIRP 3 HD — TTS vocal performance (drop-in alt to OpenAI TTS)
# ============================================================

async def vertex_chirp_tts(text: str, voice_name: Optional[str] = None,
                            out_dir: str = "/tmp",
                            public_base: str = "/api/static/voices") -> Optional[Dict]:
    """Returns {url, voice, model, chars} or None on failure."""
    if not _available() or not text.strip():
        return None
    try:
        from google.cloud import texttospeech
        client = texttospeech.TextToSpeechClient()

        voice = voice_name or VERTEX_CHIRP_VOICE
        lang = "-".join(voice.split("-")[:2]) if voice.count("-") >= 2 else "en-US"

        def _call():
            resp = client.synthesize_speech(
                input=texttospeech.SynthesisInput(text=text[:4500]),
                voice=texttospeech.VoiceSelectionParams(
                    language_code=lang,
                    name=voice,
                ),
                audio_config=texttospeech.AudioConfig(
                    audio_encoding=texttospeech.AudioEncoding.MP3,
                    speaking_rate=0.95,
                ),
            )
            return resp.audio_content

        audio_bytes = await asyncio.to_thread(_call)
        if not audio_bytes: return None

        Path(out_dir).mkdir(parents=True, exist_ok=True)
        filename = f"chirp_{uuid.uuid4().hex[:10]}.mp3"
        dest = Path(out_dir) / filename
        dest.write_bytes(audio_bytes)
        return {"url": f"{public_base}/{filename}", "voice": voice,
                "model": "chirp-3-hd", "chars": len(text)}
    except Exception as e:
        logger.warning("vertex_chirp_tts error: %s", e)
        return None
