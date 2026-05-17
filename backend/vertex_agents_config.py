"""
Vertex AI Multi-Agent Configuration
Project: disco-amphora-490606-n8

Agent 1: agent_1775606766952 (Gemini 3.0)
Agent 2: agent_1776939216148 (The Beast - Music Generation)
Agent 3: agent_1778921386550 (SL Audio Master - THE BRAIN)
"""
import os
import logging
from typing import Optional, Dict, Any
import asyncio

logger = logging.getLogger("lyrica3.vertex_agents")

# Project configuration
VERTEX_PROJECT_ID = os.environ.get("VERTEX_PROJECT_ID", "disco-amphora-490606-n8")
VERTEX_LOCATION = os.environ.get("VERTEX_LOCATION", "us-west1")

# Agent IDs
GEMINI3_AGENT_ID = os.environ.get("GEMINI3_AGENT_ID", "agent_1775606766952")
BEAST_AGENT_ID = os.environ.get("BEAST_AGENT_ID", "agent_1776939216148")
SL_AUDIO_MASTER_ID = os.environ.get("SL_AUDIO_MASTER_ID", "agent_1778921386550")

# Feature flags
VERTEX_AGENTS_ENABLED = os.environ.get("VERTEX_AGENTS_ENABLED", "false").lower() == "true"


def _available() -> bool:
    """Check if Vertex agents are available"""
    return VERTEX_AGENTS_ENABLED and bool(VERTEX_PROJECT_ID)


async def invoke_gemini3_agent(query: Dict[str, Any]) -> Optional[Dict]:
    """
    Invoke Gemini 3.0 agent for general intelligence tasks
    
    Args:
        query: Input payload for agent
    
    Returns:
        Agent response or None on failure
    """
    if not _available():
        logger.warning("Vertex agents not available")
        return None
    
    try:
        from google.cloud import aiplatform
        from vertexai.preview import reasoning_engines
        
        aiplatform.init(project=VERTEX_PROJECT_ID, location=VERTEX_LOCATION)
        
        resource_name = (
            f"projects/{VERTEX_PROJECT_ID}/locations/{VERTEX_LOCATION}/"
            f"reasoningEngines/{GEMINI3_AGENT_ID}"
        )
        
        logger.info(f"Invoking Gemini 3.0 agent: {resource_name}")
        
        def _sync_invoke():
            client = reasoning_engines.ReasoningEngine(resource_name)
            return client.query(input=query)
        
        response = await asyncio.to_thread(_sync_invoke)
        logger.info("Gemini 3.0 agent responded")
        
        return response
        
    except Exception as e:
        logger.error(f"Gemini 3.0 agent failed: {e}", exc_info=True)
        return None


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
    
    This agent generates the JSON payload with:
    - LML (Lyric Markup Language)
    - Acoustic primitives (groove, BPM, swing timing)
    - Mastering directives (tape saturation, compression, etc.)
    - Emotional math (12ms swing, inhale timing, vocal_fry tags)
    
    This should be called FIRST, before The Beast.
    
    Args:
        lyrics: User's lyric input
        genre: Musical genre
        mood: Emotional mood
        title: Track title (optional)
        cultural_matrix: Cultural context (e.g., "LA SGV Chicano Heritage")
        mood_recipe: Tuple of (lung, throat, fry, crack) coefficients
        **kwargs: Additional parameters
    
    Returns:
        {
            "acoustic_primitives": {
                "groove": "84 BPM, MPC-3000 Late-Pocket Swing, heavy 808 drag...",
                "bpm": 84,
                "swing_ms": 12,
                ...
            },
            "sss_mastering_directives": {
                "tape_saturation_db": 3.5,
                "compression_threshold": -14,
                "compression_ratio": 3,
                "target_lufs": -14,
                ...
            },
            "lml_lyrics": "...",  # LML-formatted lyrics
            "vocal_physics": {
                "vocal_fry_tags": [...],
                "inhale_timing": [...],
                ...
            },
            "cultural_matrix": str,
            "mood": str,
        }
        or None on failure
    """
    if not _available():
        logger.warning("Vertex agents not available")
        return None
    
    try:
        from google.cloud import aiplatform
        from vertexai.preview import reasoning_engines
        
        aiplatform.init(project=VERTEX_PROJECT_ID, location=VERTEX_LOCATION)
        
        resource_name = (
            f"projects/{VERTEX_PROJECT_ID}/locations/{VERTEX_LOCATION}/"
            f"reasoningEngines/{SL_AUDIO_MASTER_ID}"
        )
        
        logger.info(f"🧠 Invoking SL Audio Master (THE BRAIN): {resource_name}")
        
        # Build query payload
        query_payload = {
            "lyrics": lyrics,
            "genre": genre,
            "mood": mood,
            **kwargs
        }
        
        if title:
            query_payload["title"] = title
        if cultural_matrix:
            query_payload["cultural_matrix"] = cultural_matrix
        if mood_recipe:
            lung, throat, fry, crack = mood_recipe
            query_payload["mood_recipe"] = {
                "lung": lung,
                "throat": throat,
                "fry": fry,
                "crack": crack,
            }
        
        def _sync_invoke():
            client = reasoning_engines.ReasoningEngine(resource_name)
            return client.query(input=query_payload)
        
        response = await asyncio.to_thread(_sync_invoke)
        logger.info("🧠 SL Audio Master responded with physics payload")
        
        return response
        
    except Exception as e:
        logger.error(f"SL Audio Master failed: {e}", exc_info=True)
        return None


async def invoke_beast_agent(
    prompt: str,
    genre: str,
    mood: str,
    duration: int = 180,
    **kwargs
) -> Optional[Dict]:
    """
    Invoke The Beast agent for music generation
    
    Args:
        prompt: Lyric seed or musical description
        genre: Musical genre (SGV Oldies, etc.)
        mood: Emotional mood (Late-Night Honesty, etc.)
        duration: Target duration in seconds
        **kwargs: Additional parameters
    
    Returns:
        Generated music data or None on failure
    """
    if not _available():
        logger.warning("Vertex agents not available")
        return None
    
    try:
        from google.cloud import aiplatform
        from vertexai.preview import reasoning_engines
        
        aiplatform.init(project=VERTEX_PROJECT_ID, location=VERTEX_LOCATION)
        
        resource_name = (
            f"projects/{VERTEX_PROJECT_ID}/locations/{VERTEX_LOCATION}/"
            f"reasoningEngines/{BEAST_AGENT_ID}"
        )
        
        logger.info(f"Invoking The Beast: {resource_name}")
        
        # Build query payload
        query_payload = {
            "prompt": prompt,
            "genre": genre,
            "mood": mood,
            "duration_seconds": duration,
            **kwargs
        }
        
        def _sync_invoke():
            client = reasoning_engines.ReasoningEngine(resource_name)
            return client.query(input=query_payload)
        
        response = await asyncio.to_thread(_sync_invoke)
        logger.info("The Beast responded")
        
        return response
        
    except Exception as e:
        logger.error(f"Beast agent failed: {e}", exc_info=True)
        return None


async def generate_music_with_soulfire(
    lyrics: str,
    genre: str,
    mood: str,
    title: Optional[str] = None,
    cultural_matrix: Optional[str] = None,
    mood_recipe: Optional[tuple] = None,
) -> Optional[Dict]:
    """
    HIGH-LEVEL SOULFIRE PIPELINE - THE CORRECT EXECUTION SEQUENCE
    
    Flow:
    1. SL Audio Master (THE BRAIN) → generates JSON payload with physics
    2. The Beast (THE ORCHESTRATOR) → receives JSON, dispatches to sub-agents
    3. Returns generated music with stems
    
    This is the PRIMARY music generation function.
    
    Returns:
        {
            "instrumental_url": str,  # Generated instrumental
            "stems": [...],           # Individual stems if available
            "lml": str,               # Generated LML
            "metadata": {...},        # Additional metadata
            "sl_audio_master_payload": {...},  # Physics JSON from SL Audio Master
        }
        or None on failure
    """
    if not _available():
        return None
    
    try:
        # ============================================================
        # STEP 1: CALL SL AUDIO MASTER FIRST (THE BRAIN)
        # ============================================================
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
            logger.warning("SL Audio Master returned no payload, falling back to direct Beast call")
            # Fallback to old method if SL Audio Master fails
            return await generate_music_with_beast(
                lyrics=lyrics,
                genre=genre,
                mood=mood,
                title=title,
                cultural_matrix=cultural_matrix,
                mood_recipe=mood_recipe,
            )
        
        logger.info("✅ SL Audio Master generated physics payload")
        
        # ============================================================
        # STEP 2: PASS JSON TO THE BEAST (THE ORCHESTRATOR)
        # ============================================================
        logger.info("🔥 STEP 2: Passing payload to The Beast (THE ORCHESTRATOR)")
        
        # Build enriched prompt that includes SL Audio Master's directives
        prompt_parts = []
        if title:
            prompt_parts.append(f"Title: {title}")
        prompt_parts.append(lyrics)
        
        # Add acoustic primitives from SL Audio Master
        if "acoustic_primitives" in sl_payload:
            primitives = sl_payload["acoustic_primitives"]
            if isinstance(primitives, dict) and "groove" in primitives:
                prompt_parts.append(f"\n[GROOVE DIRECTIVE]: {primitives['groove']}")
        
        full_prompt = "\n".join(prompt_parts)
        
        # Invoke The Beast with SL Audio Master's physics
        beast_result = await invoke_beast_agent(
            prompt=full_prompt,
            genre=genre,
            mood=mood,
            duration=180,
            sl_audio_master_payload=sl_payload,  # Pass full physics JSON
            mood_recipe=mood_recipe,
            cultural_matrix=cultural_matrix,
        )
        
        if not beast_result:
            logger.warning("The Beast failed, but SL Audio Master succeeded")
            # Return SL Audio Master payload at minimum
            return {
                "sl_audio_master_payload": sl_payload,
                "lml": sl_payload.get("lml_lyrics", lyrics),
                "metadata": {
                    "provider": "sl_audio_master_only",
                    "acoustic_primitives": sl_payload.get("acoustic_primitives", {}),
                },
            }
        
        logger.info("✅ The Beast generated music successfully")
        
        # Combine SL Audio Master payload with Beast's output
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
    LEGACY: Direct Beast invocation without SL Audio Master
    
    This is the fallback method. Use generate_music_with_soulfire() instead.
    
    Returns:
        {
            "instrumental_url": str,  # Generated instrumental
            "stems": [...],           # Individual stems if available
            "lml": str,               # Generated LML
            "metadata": {...},        # Additional metadata
        }
        or None on failure
    """
    if not _available():
        return None
    
    try:
        # Build enriched prompt
        prompt_parts = [lyrics]
        if title:
            prompt_parts.insert(0, f"Title: {title}")
        if cultural_matrix:
            prompt_parts.append(f"Cultural Context: {cultural_matrix}")
        
        full_prompt = "\n".join(prompt_parts)
        
        # Invoke The Beast
        result = await invoke_beast_agent(
            prompt=full_prompt,
            genre=genre,
            mood=mood,
            duration=180,  # 3 minutes
            mood_recipe=mood_recipe,
            cultural_matrix=cultural_matrix,
        )
        
        if not result:
            return None
        
        logger.info("The Beast generated music successfully")
        return result
        
    except Exception as e:
        logger.error(f"Beast music generation failed: {e}")
        return None


# Configuration export helper
def print_config():
    """Print environment variable configuration"""
    print("\n" + "=" * 80)
    print("VERTEX AI AGENTS CONFIGURATION - SOULFIRE PIPELINE")
    print("=" * 80)
    print(f"\nProject: {VERTEX_PROJECT_ID}")
    print(f"Location: {VERTEX_LOCATION}")
    print(f"\nAgents:")
    print(f"  1. SL Audio Master (THE BRAIN):  {SL_AUDIO_MASTER_ID}")
    print(f"  2. The Beast (ORCHESTRATOR):     {BEAST_AGENT_ID}")
    print(f"  3. Gemini 3.0 Agent:              {GEMINI3_AGENT_ID}")
    print(f"\nEnabled: {VERTEX_AGENTS_ENABLED}")
    
    if not VERTEX_AGENTS_ENABLED:
        print("\n⚠️  Agents are DISABLED. To enable, set:")
        print("\n📋 ADD TO RAILWAY ENV VARS:")
        print("-" * 80)
        print(f"VERTEX_PROJECT_ID={VERTEX_PROJECT_ID}")
        print(f"VERTEX_LOCATION={VERTEX_LOCATION}")
        print(f"SL_AUDIO_MASTER_ID={SL_AUDIO_MASTER_ID}")
        print(f"BEAST_AGENT_ID={BEAST_AGENT_ID}")
        print(f"GEMINI3_AGENT_ID={GEMINI3_AGENT_ID}")
        print("VERTEX_AGENTS_ENABLED=true")
        print("-" * 80)
    else:
        print("\n✅ Agents are ENABLED and ready to invoke")
        print("\n🔥 EXECUTION SEQUENCE:")
        print("   1. SL Audio Master generates physics JSON")
        print("   2. The Beast receives JSON and orchestrates sub-agents")
        print("   3. Audio stems returned to backend")
    
    print("\n" + "=" * 80 + "\n")


# Testing
async def test_agents():
    """Test all agents in the Soulfire pipeline"""
    print_config()
    
    if not _available():
        print("❌ Agents not enabled. Set VERTEX_AGENTS_ENABLED=true")
        return
    
    print("\n🧪 Testing Soulfire Pipeline...\n")
    
    # Test 1: SL Audio Master (THE BRAIN)
    print("1. Testing SL Audio Master (THE BRAIN)...")
    sl_result = await invoke_sl_audio_master(
        lyrics="Cruising through El Monte, bruised but still breathing",
        genre="SGV Oldies",
        mood="Late-Night Honesty",
        title="Test Track",
        cultural_matrix="LA SGV Chicano Heritage",
        mood_recipe=(0.78, 0.66, 0.82, 0.71),
    )
    if sl_result:
        print(f"   ✅ Success! Payload keys: {list(sl_result.keys())}")
    else:
        print("   ❌ Failed")
    
    print()
    
    # Test 2: The Beast (THE ORCHESTRATOR)
    print("2. Testing The Beast (ORCHESTRATOR)...")
    beast_result = await invoke_beast_agent(
        prompt="Cruising through El Monte, bruised but still breathing",
        genre="SGV Oldies",
        mood="Late-Night Honesty",
        duration=30,
    )
    if beast_result:
        print(f"   ✅ Success: {beast_result}")
    else:
        print("   ❌ Failed")
    
    print()
    
    # Test 3: Full Soulfire Pipeline
    print("3. Testing Full Soulfire Pipeline (SL Audio Master → The Beast)...")
    pipeline_result = await generate_music_with_soulfire(
        lyrics="Cruising through El Monte, bruised but still breathing",
        genre="SGV Oldies",
        mood="Late-Night Honesty",
        title="Pipeline Test",
        cultural_matrix="LA SGV Chicano Heritage",
        mood_recipe=(0.78, 0.66, 0.82, 0.71),
    )
    if pipeline_result:
        print(f"   ✅ Success! Result keys: {list(pipeline_result.keys())}")
        if "sl_audio_master_payload" in pipeline_result:
            print(f"   🧠 SL Audio Master payload included: ✅")
    else:
        print("   ❌ Failed")
    
    print()
    
    # Test 4: Gemini 3.0 (optional)
    print("4. Testing Gemini 3.0 agent (general intelligence)...")
    gemini_result = await invoke_gemini3_agent({"test": "ping"})
    if gemini_result:
        print(f"   ✅ Success: {gemini_result}")
    else:
        print("   ❌ Failed")
    
    print()


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_agents())
