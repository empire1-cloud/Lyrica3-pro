"""
Vertex AI Multi-Agent Configuration
Project: disco-amphora-490606-n8

Agent 1: agent_1775606766952 (Gemini 3.0)
Agent 2: agent_1776939216148 (The Beast - Music Generation)
Agent 3: agent_1778921386550 (SL Audio Master - THE BRAIN)

NOTE: These agents are invoked via Gemini generative models on Vertex AI.
      The agent IDs are logical identifiers; each role maps to a Gemini
      model with a specialized system prompt.
"""
import os
import json
import logging
from typing import Optional, Dict, Any
import asyncio

logger = logging.getLogger("lyrica3.vertex_agents")

# Project configuration
VERTEX_PROJECT_ID = os.environ.get("VERTEX_PROJECT_ID", "disco-amphora-490606-n8")
VERTEX_LOCATION = os.environ.get("VERTEX_LOCATION", "us-west1")

# Agent IDs (logical, used for logging/tracing)
GEMINI3_AGENT_ID = os.environ.get("GEMINI3_AGENT_ID", "agent_1775606766952")
BEAST_AGENT_ID = os.environ.get("BEAST_AGENT_ID", "agent_1776939216148")
SL_AUDIO_MASTER_ID = os.environ.get("SL_AUDIO_MASTER_ID", "agent_1778921386550")

# Model to use for all agent roles
VERTEX_AGENT_MODEL = os.environ.get("VERTEX_AGENT_MODEL", "gemini-1.5-pro")

# Feature flags
VERTEX_AGENTS_ENABLED = os.environ.get("VERTEX_AGENTS_ENABLED", "false").lower() == "true"


def _available() -> bool:
    """Check if Vertex agents are available"""
    return VERTEX_AGENTS_ENABLED and bool(VERTEX_PROJECT_ID)


def _init_vertexai():
    """Initialize Vertex AI — call once per invocation."""
    import vertexai
    vertexai.init(project=VERTEX_PROJECT_ID, location=VERTEX_LOCATION)


async def _gemini_generate(system_instruction: str, prompt: str) -> Optional[str]:
    """
    Call Gemini via Vertex AI with a system instruction and user prompt.
    Returns the text response or None on failure.
    """
    try:
        _init_vertexai()
        from vertexai.generative_models import GenerativeModel, SafetySetting, HarmCategory, HarmBlockThreshold

        safety = [
            SafetySetting(category=HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                          threshold=HarmBlockThreshold.BLOCK_ONLY_HIGH),
            SafetySetting(category=HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                          threshold=HarmBlockThreshold.BLOCK_ONLY_HIGH),
        ]

        def _sync():
            model = GenerativeModel(
                VERTEX_AGENT_MODEL,
                system_instruction=system_instruction,
            )
            response = model.generate_content(prompt, safety_settings=safety)
            return response.text

        return await asyncio.to_thread(_sync)
    except Exception as e:
        logger.error(f"Gemini generation failed: {e}", exc_info=True)
        return None


async def invoke_gemini3_agent(query: Dict[str, Any]) -> Optional[Dict]:
    """
    Invoke Gemini 3.0 agent for general intelligence tasks.
    """
    if not _available():
        logger.warning("Vertex agents not available")
        return None

    system = (
        "You are Gemini 3.0, a general-purpose intelligence agent for the Lyrica 3 "
        "Soulfire platform. Answer concisely and return valid JSON when asked."
    )
    prompt = json.dumps(query)

    logger.info(f"Invoking Gemini 3.0 agent [{GEMINI3_AGENT_ID}]")
    raw = await _gemini_generate(system, prompt)
    if not raw:
        return None

    try:
        clean = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        return json.loads(clean)
    except Exception:
        return {"response": raw}


async def invoke_sl_audio_master(
    lyrics: str,
    genre: str,
    mood: str,
    title: Optional[str] = None,
    cultural_matrix: Optional[str] = None,
    mood_recipe: Optional[tuple] = None,
    **kwargs
) -> Optional[Dict]:
    """
    Invoke SL Audio Master agent - THE BRAIN

    Generates the JSON payload with:
    - LML (Lyric Markup Language)
    - Acoustic primitives (groove, BPM, swing timing)
    - Mastering directives (tape saturation, compression, etc.)
    - Emotional math (12ms swing, inhale timing, vocal_fry tags)

    Called FIRST, before The Beast.
    """
    if not _available():
        logger.warning("Vertex agents not available")
        return None

    system = (
        "You are SL Audio Master — THE BRAIN of the Soulfire music pipeline. "
        "Given lyrics, genre, mood and optional cultural context, you produce a "
        "detailed production JSON payload with:\n"
        "- acoustic_primitives: {groove, bpm, swing_ms, key, time_signature}\n"
        "- sss_mastering_directives: {tape_saturation_db, compression_threshold, "
        "  compression_ratio, target_lufs, reverb_room_size, reverb_wet}\n"
        "- lml_lyrics: the lyrics with LML markup (<verse>, <chorus>, <bridge>, "
        "  <fry intensity=0.0-1.0/>, <crack/>, <breath/>)\n"
        "- vocal_physics: {vocal_fry_tags, inhale_timing, crack_points}\n"
        "- cultural_matrix: str\n"
        "- mood: str\n"
        "Output ONLY valid JSON. No commentary."
    )

    parts = [f"Genre: {genre}", f"Mood: {mood}"]
    if title:
        parts.append(f"Title: {title}")
    if cultural_matrix:
        parts.append(f"Cultural Context: {cultural_matrix}")
    if mood_recipe:
        lung, throat, fry, crack = mood_recipe
        parts.append(f"Mood Recipe — lung:{lung} throat:{throat} fry:{fry} crack:{crack}")
    parts.append(f"\nLyrics:\n{lyrics[:3000]}")

    prompt = "\n".join(parts)

    logger.info(f"Invoking SL Audio Master (THE BRAIN) [{SL_AUDIO_MASTER_ID}]")
    raw = await _gemini_generate(system, prompt)
    if not raw:
        return None

    try:
        clean = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        return json.loads(clean)
    except Exception as e:
        logger.warning(f"SL Audio Master JSON parse failed: {e} — returning raw")
        return {"lml_lyrics": lyrics, "raw_response": raw, "mood": mood}


async def invoke_beast_agent(
    prompt: str,
    genre: str,
    mood: str,
    duration: int = 180,
    **kwargs
) -> Optional[Dict]:
    """
    Invoke The Beast agent for music generation orchestration.
    """
    if not _available():
        logger.warning("Vertex agents not available")
        return None

    system = (
        "You are The Beast — the music generation orchestrator in the Soulfire pipeline. "
        "Given a lyric prompt, genre, mood, and optional SL Audio Master physics payload, "
        "you produce a music generation directive JSON with:\n"
        "- instrumental_prompt: detailed text prompt for Lyria music generation\n"
        "- vocal_style: description for TTS/Chirp vocal synthesis\n"
        "- stems: list of stem names to generate\n"
        "- bpm: beats per minute\n"
        "- key: musical key\n"
        "- metadata: any additional production notes\n"
        "Output ONLY valid JSON. No commentary."
    )

    sl_payload = kwargs.get("sl_audio_master_payload", {})
    user_parts = [
        f"Genre: {genre}",
        f"Mood: {mood}",
        f"Duration: {duration} seconds",
        f"Prompt:\n{prompt[:2000]}",
    ]
    if sl_payload:
        user_parts.append(f"\nSL Audio Master Payload:\n{json.dumps(sl_payload)[:1000]}")

    user_prompt = "\n".join(user_parts)

    logger.info(f"Invoking The Beast [{BEAST_AGENT_ID}]")
    raw = await _gemini_generate(system, user_prompt)
    if not raw:
        return None

    try:
        clean = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        return json.loads(clean)
    except Exception as e:
        logger.warning(f"The Beast JSON parse failed: {e} — returning raw")
        return {"instrumental_prompt": prompt, "raw_response": raw}


async def generate_music_with_soulfire(
    lyrics: str,
    genre: str,
    mood: str,
    title: Optional[str] = None,
    cultural_matrix: Optional[str] = None,
    mood_recipe: Optional[tuple] = None,
) -> Optional[Dict]:
    """
    HIGH-LEVEL SOULFIRE PIPELINE — THE CORRECT EXECUTION SEQUENCE

    Flow:
    1. SL Audio Master (THE BRAIN) → generates JSON payload with physics
    2. The Beast (THE ORCHESTRATOR) → receives JSON, dispatches to sub-agents
    3. Returns generated music directives

    Returns:
        {
            "instrumental_url": str,        # placeholder until Lyria fires
            "stems": [...],
            "lml": str,
            "metadata": {...},
            "sl_audio_master_payload": {...},
        }
        or None on failure
    """
    if not _available():
        return None

    try:
        # ── STEP 1: SL Audio Master (THE BRAIN) ──────────────────────────
        logger.info("🔥 STEP 1: Invoking SL Audio Master (THE BRAIN)")

        sl_payload = await invoke_sl_audio_master(
            lyrics=lyrics,
            genre=genre,
            mood=mood,
            title=title,
            cultural_matrix=cultural_matrix,
            mood_recipe=mood_recipe,
        )

        if not sl_payload:
            logger.warning("SL Audio Master returned nothing — falling back to direct Beast")
            return await generate_music_with_beast(
                lyrics=lyrics, genre=genre, mood=mood,
                title=title, cultural_matrix=cultural_matrix, mood_recipe=mood_recipe,
            )

        logger.info("✅ SL Audio Master generated physics payload")

        # ── STEP 2: The Beast (THE ORCHESTRATOR) ─────────────────────────
        logger.info("🔥 STEP 2: Passing payload to The Beast (THE ORCHESTRATOR)")

        prompt_parts = []
        if title:
            prompt_parts.append(f"Title: {title}")
        prompt_parts.append(lyrics)
        if isinstance(sl_payload.get("acoustic_primitives"), dict):
            groove = sl_payload["acoustic_primitives"].get("groove", "")
            if groove:
                prompt_parts.append(f"\n[GROOVE DIRECTIVE]: {groove}")
        full_prompt = "\n".join(prompt_parts)

        beast_result = await invoke_beast_agent(
            prompt=full_prompt,
            genre=genre,
            mood=mood,
            duration=180,
            sl_audio_master_payload=sl_payload,
            mood_recipe=mood_recipe,
            cultural_matrix=cultural_matrix,
        )

        if not beast_result:
            logger.warning("The Beast failed — returning SL Audio Master payload only")
            return {
                "sl_audio_master_payload": sl_payload,
                "lml": sl_payload.get("lml_lyrics", lyrics),
                "metadata": {
                    "provider": "sl_audio_master_only",
                    "acoustic_primitives": sl_payload.get("acoustic_primitives", {}),
                },
            }

        logger.info("✅ The Beast generated music directive successfully")
        beast_result["sl_audio_master_payload"] = sl_payload
        return beast_result

    except Exception as e:
        logger.error(f"Soulfire pipeline failed: {e}", exc_info=True)
        return None


async def generate_music_with_beast(
    lyrics: str,
    genre: str,
    mood: str,
    title: Optional[str] = None,
    cultural_matrix: Optional[str] = None,
    mood_recipe: Optional[tuple] = None,
) -> Optional[Dict]:
    """
    LEGACY: Direct Beast invocation without SL Audio Master.
    Fallback only — use generate_music_with_soulfire() instead.
    """
    if not _available():
        return None

    try:
        prompt_parts = [lyrics]
        if title:
            prompt_parts.insert(0, f"Title: {title}")
        if cultural_matrix:
            prompt_parts.append(f"Cultural Context: {cultural_matrix}")

        result = await invoke_beast_agent(
            prompt="\n".join(prompt_parts),
            genre=genre,
            mood=mood,
            duration=180,
            mood_recipe=mood_recipe,
            cultural_matrix=cultural_matrix,
        )

        if not result:
            return None

        logger.info("The Beast generated music directive successfully")
        return result

    except Exception as e:
        logger.error(f"Beast music generation failed: {e}")
        return None


# ── Config helper ─────────────────────────────────────────────────────────────

def print_config():
    """Print environment variable configuration"""
    print("\n" + "=" * 80)
    print("VERTEX AI AGENTS CONFIGURATION - SOULFIRE PIPELINE")
    print("=" * 80)
    print(f"\nProject:  {VERTEX_PROJECT_ID}")
    print(f"Location: {VERTEX_LOCATION}")
    print(f"Model:    {VERTEX_AGENT_MODEL}")
    print(f"\nAgents:")
    print(f"  1. SL Audio Master (THE BRAIN):  {SL_AUDIO_MASTER_ID}")
    print(f"  2. The Beast (ORCHESTRATOR):     {BEAST_AGENT_ID}")
    print(f"  3. Gemini 3.0 Agent:             {GEMINI3_AGENT_ID}")
    print(f"\nEnabled: {VERTEX_AGENTS_ENABLED}")
    if not VERTEX_AGENTS_ENABLED:
        print("\n⚠️  Agents DISABLED. Set VERTEX_AGENTS_ENABLED=true to enable.")
    else:
        print("\n✅ Agents ENABLED — Gemini-backed Soulfire pipeline ready")
        print("\n🔥 EXECUTION SEQUENCE:")
        print("   1. SL Audio Master generates physics JSON via Gemini")
        print("   2. The Beast receives JSON and produces generation directives")
        print("   3. Directives feed into Lyria/Chirp audio synthesis")
    print("\n" + "=" * 80 + "\n")


# ── Smoke test ────────────────────────────────────────────────────────────────

async def test_agents():
    """Test all agents in the Soulfire pipeline"""
    print_config()
    if not _available():
        print("❌ Agents not enabled. Set VERTEX_AGENTS_ENABLED=true")
        return

    print("\n🧪 Testing Soulfire Pipeline...\n")

    print("1. Testing SL Audio Master (THE BRAIN)...")
    sl = await invoke_sl_audio_master(
        lyrics="Cruising through El Monte, bruised but still breathing",
        genre="SGV Oldies", mood="Late-Night Honesty",
        title="Test Track", cultural_matrix="LA SGV Chicano Heritage",
        mood_recipe=(0.78, 0.66, 0.82, 0.71),
    )
    print(f"   {'✅ Keys: ' + str(list(sl.keys())) if sl else '❌ Failed'}")

    print("\n2. Testing The Beast (ORCHESTRATOR)...")
    beast = await invoke_beast_agent(
        prompt="Cruising through El Monte, bruised but still breathing",
        genre="SGV Oldies", mood="Late-Night Honesty", duration=30,
    )
    print(f"   {'✅ Keys: ' + str(list(beast.keys())) if beast else '❌ Failed'}")

    print("\n3. Testing Full Soulfire Pipeline...")
    pipeline = await generate_music_with_soulfire(
        lyrics="Cruising through El Monte, bruised but still breathing",
        genre="SGV Oldies", mood="Late-Night Honesty",
        title="Pipeline Test", cultural_matrix="LA SGV Chicano Heritage",
        mood_recipe=(0.78, 0.66, 0.82, 0.71),
    )
    print(f"   {'✅ Keys: ' + str(list(pipeline.keys())) if pipeline else '❌ Failed'}")

    print("\n4. Testing Gemini 3.0 agent...")
    g = await invoke_gemini3_agent({"test": "ping"})
    print(f"   {'✅ ' + str(g) if g else '❌ Failed'}")


if __name__ == "__main__":
    asyncio.run(test_agents())
