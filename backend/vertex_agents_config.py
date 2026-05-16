"""
Vertex AI Multi-Agent Configuration
Project: disco-amphora-490606-n8

Agent 1: agent_1775606766952 (Gemini 3.0)
Agent 2: agent_1776939216148 (The Beast - Music Generation)
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


async def generate_music_with_beast(
    lyrics: str,
    genre: str,
    mood: str,
    title: Optional[str] = None,
    cultural_matrix: Optional[str] = None,
    mood_recipe: Optional[tuple] = None,
) -> Optional[Dict]:
    """
    High-level music generation using The Beast agent
    
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
    print("VERTEX AI AGENTS CONFIGURATION")
    print("=" * 80)
    print(f"\nProject: {VERTEX_PROJECT_ID}")
    print(f"Location: {VERTEX_LOCATION}")
    print(f"\nAgents:")
    print(f"  1. Gemini 3.0 Agent: {GEMINI3_AGENT_ID}")
    print(f"  2. The Beast:        {BEAST_AGENT_ID}")
    print(f"\nEnabled: {VERTEX_AGENTS_ENABLED}")
    
    if not VERTEX_AGENTS_ENABLED:
        print("\n⚠️  Agents are DISABLED. To enable, set:")
        print("\n📋 ADD TO RAILWAY ENV VARS:")
        print("-" * 80)
        print(f"VERTEX_PROJECT_ID={VERTEX_PROJECT_ID}")
        print(f"VERTEX_LOCATION={VERTEX_LOCATION}")
        print(f"GEMINI3_AGENT_ID={GEMINI3_AGENT_ID}")
        print(f"BEAST_AGENT_ID={BEAST_AGENT_ID}")
        print("VERTEX_AGENTS_ENABLED=true")
        print("-" * 80)
    else:
        print("\n✅ Agents are ENABLED and ready to invoke")
    
    print("\n" + "=" * 80 + "\n")


# Testing
async def test_agents():
    """Test both agents"""
    print_config()
    
    if not _available():
        print("❌ Agents not enabled. Set VERTEX_AGENTS_ENABLED=true")
        return
    
    print("\n🧪 Testing agents...\n")
    
    # Test Gemini 3.0
    print("1. Testing Gemini 3.0 agent...")
    gemini_result = await invoke_gemini3_agent({"test": "ping"})
    if gemini_result:
        print(f"   ✅ Success: {gemini_result}")
    else:
        print("   ❌ Failed")
    
    print()
    
    # Test The Beast
    print("2. Testing The Beast agent...")
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


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_agents())
