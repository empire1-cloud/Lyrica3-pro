"""
Lyria 3 Pro ADK Agent Pipeline
================================
Two-agent sequential pipeline deployed as a Vertex AI Reasoning Engine:

  1. LyricistAgent  (Gemini 3.1 Pro)  → generates lyrics + LML markup
  2. ComposerAgent  (Lyria 3 Pro)     → renders audio to GCS

Wrapped in AdkApp for A2A Gateway deployment.
"""

import os
import json
import logging
from typing import Any, Optional

logger = logging.getLogger("lyrica3.adk_pipeline")

# ── Configuration ──────────────────────────────────────────────────────────────

VERTEX_PROJECT_ID = os.environ.get("VERTEX_PROJECT_ID", "disco-amphora-490606-n8")
VERTEX_LOCATION = os.environ.get("VERTEX_LOCATION", "us-west1")
LYRICA_AGENT_MODEL = os.environ.get("LYRICA_AGENT_MODEL", "gemini-2.5-pro")

# ── Tool: Lyria 3 Pro Music Generation ────────────────────────────────────────

async def compose_music(
    lyrics: str,
    genre: str = "soul",
    bpm: int = 85,
    duration_seconds: int = 30,
    mood: str = "intimate",
    cultural_context: str = "",
) -> dict:
    """Generate a musical instrumental from lyrics and style parameters.

    Calls the Lyria 3 Pro model and returns a GCS URI to the rendered audio.

    Args:
        lyrics: The lyrics text to base the composition on.
        genre: Musical genre (e.g. soul, trap, drill, ballad).
        bpm: Beats per minute.
        duration_seconds: Target audio duration in seconds.
        mood: Emotional mood descriptor.
        cultural_context: Optional cultural or subcultural context.

    Returns:
        dict with 'audio_gcs_uri', 'status', and metadata.
    """
    try:
        from vertex_lyria3 import vertex_lyria3_music

        prompt_parts = [
            f"Genre: {genre}",
            f"BPM: {bpm}",
            f"Mood: {mood}",
            f"Duration: {duration_seconds}s",
        ]
        if cultural_context:
            prompt_parts.append(f"Cultural context: {cultural_context}")
        prompt_parts.append(f"\nLyrics:\n{lyrics[:2000]}")
        prompt = "\n".join(prompt_parts)

        gcs_uri = await vertex_lyria3_music(
            prompt=prompt,
            duration_seconds=duration_seconds,
        )

        if gcs_uri:
            return {
                "status": "success",
                "audio_gcs_uri": gcs_uri,
                "genre": genre,
                "bpm": bpm,
                "duration_seconds": duration_seconds,
            }

        return {"status": "error", "message": "Lyria 3 Pro returned no audio"}

    except Exception as e:
        logger.error(f"compose_music error: {e}")
        return {"status": "error", "message": str(e)}


# ── ADK Agent Definitions ─────────────────────────────────────────────────────

try:
    from google.adk.agents import SequentialAgent, Agent

    lyricist_agent = Agent(
        name="lyricist",
        model=LYRICA_AGENT_MODEL,
        instruction=(
            "You are an expert lyricist for the Soulfire music platform. "
            "Given a user's prompt, genre, and mood, you generate evocative "
            "lyrics with LML (Lyric Markup Language) tags.\n\n"
            "Available LML tags:\n"
            "- <verse>...</verse> for verse sections\n"
            "- <chorus>...</chorus> for chorus sections\n"
            "- <bridge>...</bridge> for bridge sections\n"
            "- <vocal_fry depth='0.0-1.0'/> for vocal fry effects\n"
            "- <adaptive_inhale depth='shallow|deep'/> for breath marks\n"
            "- <emotional_crack intensity='0.0-1.0'/> for vocal cracks\n"
            "- <proximity_effect>...</proximity_effect> for close-mic sections\n"
            "- <tape_hiss level='subtle|prominent'/> for texture\n"
            "- <reverb decay='0.0-1.0'/> for space\n\n"
            "Output JSON: {\"title\": str, \"lyrics\": str (with LML), "
            "\"genre\": str, \"bpm\": int, \"mood\": str, "
            "\"cultural_context\": str}"
        ),
        output_key="lyricist_output",
    )

    composer_agent = Agent(
        name="composer",
        model=LYRICA_AGENT_MODEL,
        instruction=(
            "You are a music composer agent. Your job is to take the lyricist's "
            "output (lyrics with LML, genre, BPM, mood) and call the compose_music "
            "tool to render the audio via Lyria 3 Pro.\n\n"
            "Pass all parameters from the lyricist output to compose_music."
        ),
        tools=[compose_music],
        output_key="composer_output",
    )

    lyria3_pipeline = SequentialAgent(
        name="lyria3_pipeline",
        sub_agents=[lyricist_agent, composer_agent],
    )

    ADK_AVAILABLE = True

except ImportError:
    logger.warning("ADK not available — Lyria 3 Pro ADK pipeline disabled")
    lyria3_pipeline = None
    ADK_AVAILABLE = False


# ── Programmatic interface (non-ADK fallback) ─────────────────────────────────

async def run_lyria3_pipeline(
    prompt: str,
    genre: str = "soul",
    mood: str = "intimate",
    bpm: int = 85,
    cultural_context: str = "",
) -> dict:
    """Run the full Lyria 3 Pro pipeline without ADK.

    Falls back to direct function calls when ADK is not available.
    Returns the composer result dict.
    """
    if ADK_AVAILABLE and lyria3_pipeline is not None:
        try:
            from google.adk.runners import Runner
            from google.adk.sessions import InMemorySessionService
            from google.genai import types

            session_service = InMemorySessionService()
            await session_service.create_session(
                app_name="lyria3_pipeline",
                user_id="default",
                session_id="s1",
            )
            runner = Runner(
                agent=lyria3_pipeline,
                app_name="lyria3_pipeline",
                session_service=session_service,
            )

            user_message = json.dumps({
                "prompt": prompt,
                "genre": genre,
                "mood": mood,
                "bpm": bpm,
                "cultural_context": cultural_context,
            })

            async for event in runner.run_async(
                user_id="default",
                session_id="s1",
                new_message=types.Content(
                    role="user",
                    parts=[types.Part.from_text(user_message)],
                ),
            ):
                if event.is_final_response():
                    return {"status": "success", "response": event.content.parts[0].text}

            return {"status": "error", "message": "No final response from ADK pipeline"}

        except Exception as e:
            logger.warning(f"ADK pipeline failed, falling through: {e}")

    # Non-ADK fallback: call Lyria 3 Pro directly
    from vertex_lyria3 import vertex_lyria3_music

    prompt_parts = [
        f"Genre: {genre}",
        f"BPM: {bpm}",
        f"Mood: {mood}",
    ]
    if cultural_context:
        prompt_parts.append(f"Cultural context: {cultural_context}")
    prompt_parts.append(f"\nUser prompt: {prompt[:2000]}")
    full_prompt = "\n".join(prompt_parts)

    gcs_uri = await vertex_lyria3_music(
        prompt=full_prompt,
        duration_seconds=30,
    )

    if gcs_uri:
        return {
            "status": "success",
            "audio_gcs_uri": gcs_uri,
            "genre": genre,
            "bpm": bpm,
            "mood": mood,
        }

    return {"status": "error", "message": "Lyria 3 Pro generation failed"}


# ── Wrapper for vertexai.preview.reasoning_engines.AdkApp ─────────────────────

try:
    from vertexai.preview.reasoning_engines import AdkApp

    def create_adk_app() -> AdkApp:
        """Create an AdkApp for A2A Gateway deployment."""
        from google.adk.sessions import VertexAiSessionService

        if lyria3_pipeline is None:
            raise RuntimeError("ADK not available")

        return AdkApp(
            agent=lyria3_pipeline,
            session_service_builder=lambda: VertexAiSessionService(),
        )

    ADK_APP_AVAILABLE = True

except ImportError:
    ADK_APP_AVAILABLE = False


if __name__ == "__main__":
    import asyncio

    async def test():
        result = await run_lyria3_pipeline(
            prompt="soulful love ballad about chicano heritage",
            genre="soul",
            mood="romantic",
            bpm=85,
            cultural_context="LA SGV Chicano",
        )
        print(json.dumps(result, indent=2))

    asyncio.run(test())
