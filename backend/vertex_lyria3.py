"""
Empire 1 · Lyria 3 Pro (Preview) integration
=============================================
Uses the GenerativeModel SDK or direct REST API to generate full-length
instrumentals via `lyria-3-pro-preview`.

Unlike Lyria 2 (base64 audio in HTTP response), Lyria 3 Pro writes audio
directly to a GCS bucket. We read from GCS and serve via FastAPI static.

Requires:
  - GCS bucket `lyrica3-audio-output` in us-central1
  - Vertex AI API enabled on the project
  - Cloud Run runtime SA with roles/aiplatform.user + roles/storage.objectViewer
"""
from __future__ import annotations
import os
import uuid
import logging
import asyncio
import json
from pathlib import Path
from typing import Optional

logger = logging.getLogger("empire1.lyria3")

VERTEX_LOCATION = os.environ.get("VERTEX_LOCATION", "us-central1").strip()
VERTEX_PROJECT_ID = os.environ.get("VERTEX_PROJECT_ID", "").strip()
VERTEX_AI_ENABLED = os.environ.get("VERTEX_AI_ENABLED", "false").lower() == "true"

# Lyria 3 Pro model ID
LYRIA3_MODEL_ID = os.environ.get("LYRIA3_MODEL_ID", "lyria-3-pro-preview")

# GCS bucket for Lyria 3 Pro audio output
LYRIA3_AUDIO_BUCKET = os.environ.get("LYRIA3_AUDIO_BUCKET", "lyrica3-audio-output")
LYRIA3_AUDIO_PREFIX = os.environ.get("LYRIA3_AUDIO_PREFIX", "tracks/")

# Generation knobs
LYRIA3_DURATION_SECONDS = int(os.environ.get("LYRIA3_DURATION_SECONDS", "30"))
LYRIA3_SEGMENTS = int(os.environ.get("LYRIA3_SEGMENTS", "10"))
LYRIA3_CROSSFADE_MS = int(os.environ.get("LYRIA3_CROSSFADE_MS", "1500"))


def _available() -> bool:
    return VERTEX_AI_ENABLED and bool(VERTEX_PROJECT_ID) and bool(LYRIA3_AUDIO_BUCKET)


async def _generate_segment_sdk(
    prompt: str,
    duration_seconds: int = 30,
) -> Optional[str]:
    """Generate a single audio segment via the GenerativeModel SDK.

    Returns the GCS URI (gs://bucket/path) or None on failure.

    This path is preferred on Cloud Run where ADC is available.
    """
    try:
        import vertexai
        from vertexai.preview import generative_models

        vertexai.init(project=VERTEX_PROJECT_ID, location=VERTEX_LOCATION)

        audio_key = f"{LYRIA3_AUDIO_PREFIX}{uuid.uuid4().hex[:16]}.wav"
        gcs_uri = f"gs://{LYRIA3_AUDIO_BUCKET}/{audio_key}"

        model = generative_models.GenerativeModel(LYRIA3_MODEL_ID)

        generation_config = generative_models.GenerationConfig(
            temperature=0.8,
            max_output_tokens=8192,
        )

        def _sync_call():
            return model.generate_content(
                [f"{prompt}\n\nStore the generated audio at {gcs_uri}."],
                generation_config=generation_config,
            )

        response = await asyncio.to_thread(_sync_call)

        if not response or not response.candidates:
            logger.warning("Lyria 3 Pro SDK returned empty response")
            return None

        return gcs_uri

    except ImportError as e:
        logger.warning(f"Lyria 3 Pro SDK not available: {e}")
        return None
    except Exception as e:
        logger.warning(f"Lyria 3 Pro SDK error: {e}")
        return None


async def _generate_segment_rest(
    prompt: str,
    duration_seconds: int = 30,
) -> Optional[str]:
    """Generate a single audio segment via direct REST API.

    Fallback path when the SDK is not available.
    Uses the same endpoint as Gemini generateContent.
    """
    try:
        import httpx
        from google.auth import default as gauth_default
        from google.auth.transport.requests import Request as AuthRequest

        creds, _ = gauth_default()
        creds.refresh(AuthRequest())
        token = creds.token

        audio_key = f"{LYRIA3_AUDIO_PREFIX}{uuid.uuid4().hex[:16]}.wav"
        gcs_uri = f"gs://{LYRIA3_AUDIO_BUCKET}/{audio_key}"

        endpoint = (
            f"https://{VERTEX_LOCATION}-aiplatform.googleapis.com/v1/"
            f"projects/{VERTEX_PROJECT_ID}/locations/{VERTEX_LOCATION}/"
            f"publishers/google/models/{LYRIA3_MODEL_ID}:generateContent"
        )

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": prompt},
                        {"text": f"\nOutput audio to: {gcs_uri}"},
                    ],
                }
            ],
            "generation_config": {
                "temperature": 0.8,
                "maxOutputTokens": 8192,
            },
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                endpoint,
                json=payload,
                headers={"Authorization": f"Bearer {token}"},
                timeout=180,
            )
            resp.raise_for_status()
            data = resp.json()

        candidates = data.get("candidates", [])
        if not candidates:
            logger.warning("Lyria 3 Pro REST returned no candidates")
            return None

        return gcs_uri

    except Exception as e:
        logger.warning(f"Lyria 3 Pro REST error: {e}")
        return None


async def vertex_lyria3_music(
    prompt: str,
    duration_seconds: int = 30,
) -> Optional[str]:
    """Generate a single instrumental segment via Lyria 3 Pro.

    Returns GCS URI (gs://bucket/path) or None on failure.
    Tries SDK first, falls back to REST API.
    """
    if not _available():
        return None

    result = await _generate_segment_sdk(prompt, duration_seconds)
    if result:
        return result

    result = await _generate_segment_rest(prompt, duration_seconds)
    if result:
        return result

    return None


async def _gcs_to_local(gcs_uri: str, out_dir: str = "/tmp") -> Optional[str]:
    """Download a GCS URI to a local file. Returns local path or None."""
    try:
        from google.cloud import storage

        if not gcs_uri.startswith("gs://"):
            return None

        bucket_name, blob_path = gcs_uri[5:].split("/", 1)

        def _download():
            client = storage.Client()
            bucket = client.bucket(bucket_name)
            blob = bucket.blob(blob_path)
            Path(out_dir).mkdir(parents=True, exist_ok=True)
            local_path = str(Path(out_dir) / f"lyria3_{uuid.uuid4().hex[:10]}.wav")
            blob.download_to_filename(local_path)
            return local_path

        return await asyncio.to_thread(_download)

    except Exception as e:
        logger.warning(f"GCS download error: {e}")
        return None


async def vertex_lyria3_full_song(
    base_prompt: str,
    matrix: str,
    mood_recipe: tuple,
    out_dir: str = "/tmp",
    segments: Optional[int] = None,
) -> Optional[str]:
    """Compose a full-length track via Lyria 3 Pro segment stitching.

    Each segment is generated with a section-specific prompt variant,
    then crossfaded into a single MP3.

    Returns local MP3 path or None on failure.
    """
    if not _available():
        return None

    n = segments or LYRIA3_SEGMENTS
    lung, throat, fry, crack = mood_recipe

    sections = [
        ("intro", "tape hiss intro, ambient room tone, soft arrival"),
        ("verse1", "full arrangement, steady groove, late-pocket drums"),
        ("prechorus1", "building tension, ride cymbal, rising bass"),
        ("chorus1", "climactic hook, layered instrumentation, wide stereo"),
        ("verse2", "stripped verse, minimal, intimate close-mic"),
        ("prechorus2", "rebuilding energy, snare rolls, harmonic lift"),
        ("chorus2", "full power hook, doubled layers, maximum width"),
        ("bridge", "key change or breakdown, sparse then swelling"),
        ("solo", "melodic lead, emotional peak, analog warmth"),
        ("chorus3", "final chorus, all elements, gospel energy"),
        ("outro", "fade out, tape slow, final vinyl crackle"),
    ][:n]

    prompts = [
        f"{base_prompt}. Section: {label}. {flavor}."
        for label, flavor in sections
    ]

    tasks = [
        vertex_lyria3_music(p, duration_seconds=LYRIA3_DURATION_SECONDS)
        for p in prompts
    ]
    gcs_uris = await asyncio.gather(*tasks, return_exceptions=True)
    good_uris = [u for u in gcs_uris if isinstance(u, str) and u]

    if not good_uris:
        logger.warning("Lyria 3 Pro: no segments generated")
        return None

    download_tasks = [_gcs_to_local(uri, out_dir=out_dir) for uri in good_uris]
    local_paths = await asyncio.gather(*download_tasks, return_exceptions=True)
    local_good = [p for p in local_paths if isinstance(p, str) and p]

    if not local_good:
        return None

    if len(local_good) == 1:
        return local_good[0]

    try:
        from pydub import AudioSegment

        def _stitch():
            combined: Optional[AudioSegment] = None
            for p in local_good:
                seg = AudioSegment.from_file(p)
                combined = seg if combined is None else combined.append(seg, crossfade=LYRIA3_CROSSFADE_MS)
            out = Path(out_dir) / f"lyria3_song_{uuid.uuid4().hex[:10]}.mp3"
            combined.export(out, format="mp3", bitrate="192k")
            for p in local_good:
                try:
                    Path(p).unlink()
                except Exception:
                    pass
            return str(out)

        return await asyncio.to_thread(_stitch)
    except Exception as e:
        logger.warning(f"Lyria 3 Pro stitch error: {e}")
        return local_good[0]


if __name__ == "__main__":
    print(f"Lyria 3 Pro integration module")
    print(f"  Project: {VERTEX_PROJECT_ID}")
    print(f"  Location: {VERTEX_LOCATION}")
    print(f"  Bucket: {LYRIA3_AUDIO_BUCKET}")
    print(f"  Model: {LYRIA3_MODEL_ID}")
    print(f"  Available: {_available()}")
