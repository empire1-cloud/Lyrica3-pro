"""
The Beast - Vertex AI Reasoning Engine Agent Integration
=========================================================
Connects to "The Beast" agent deployed in Vertex AI Studio
with 6 sub-agents for music generation.

GCP Project: 339698334666
Service Account: service-339698334666@gcp-sa-aiplatform-re.iam.gserviceaccount.com
"""
import os
import logging
from typing import Optional, Dict, Any
import asyncio

logger = logging.getLogger("lyrica3.beast_agent")

# Configuration
VERTEX_PROJECT_ID = os.environ.get("VERTEX_PROJECT_ID", "339698334666")
VERTEX_LOCATION = os.environ.get("VERTEX_LOCATION", "us-central1")
BEAST_AGENT_ID = os.environ.get("BEAST_AGENT_ID", "")  # Set this in env vars
BEAST_ENABLED = os.environ.get("BEAST_ENABLED", "false").lower() == "true"


def _available() -> bool:
    """Check if Beast agent is available"""
    return BEAST_ENABLED and bool(BEAST_AGENT_ID) and bool(VERTEX_PROJECT_ID)


async def invoke_beast(
    prompt: str,
    genre: str,
    mood: str,
    duration: int = 180,
    **kwargs
) -> Optional[Dict[str, Any]]:
    """
    Invoke The Beast agent for music generation
    
    Args:
        prompt: Lyric seed or description
        genre: Musical genre (SGV Oldies, etc.)
        mood: Emotional mood (Late-Night Honesty, etc.)
        duration: Target duration in seconds
        **kwargs: Additional parameters
    
    Returns:
        Dict with generated music assets or None on failure
    """
    if not _available():
        logger.warning("Beast agent not available - check BEAST_ENABLED and BEAST_AGENT_ID")
        return None
    
    try:
        from google.cloud import aiplatform
        from vertexai.preview import reasoning_engines
        
        # Initialize Vertex AI
        aiplatform.init(project=VERTEX_PROJECT_ID, location=VERTEX_LOCATION)
        
        # Get the reasoning engine client
        agent_resource_name = (
            f"projects/{VERTEX_PROJECT_ID}/locations/{VERTEX_LOCATION}/"
            f"reasoningEngines/{BEAST_AGENT_ID}"
        )
        
        logger.info(f"Invoking The Beast: {agent_resource_name}")
        
        # Build the query payload
        query_payload = {
            "prompt": prompt,
            "genre": genre,
            "mood": mood,
            "duration_seconds": duration,
            **kwargs
        }
        
        def _sync_invoke():
            """Synchronous invocation for threading"""
            client = reasoning_engines.ReasoningEngine(agent_resource_name)
            response = client.query(input=query_payload)
            return response
        
        # Run in thread pool since SDK is synchronous
        response = await asyncio.to_thread(_sync_invoke)
        
        logger.info(f"Beast response received: {type(response)}")
        
        # Parse response structure
        # Adjust based on your actual agent output format
        if isinstance(response, dict):
            return response
        else:
            # Try to extract structured data from response
            result = {
                "raw_response": str(response),
                "success": True,
                "agent": "the_beast",
            }
            return result
            
    except Exception as e:
        logger.error(f"Beast agent invocation failed: {e}", exc_info=True)
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
    High-level music generation using The Beast
    
    Returns:
        {
            "instrumental_url": str,  # Generated instrumental
            "stems": [...],           # Individual stems if available
            "lml": str,               # Generated LML
            "metadata": {...},        # Additional metadata
        }
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
        result = await invoke_beast(
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


# Testing helper
async def test_beast():
    """Test The Beast agent connection"""
    if not _available():
        print("❌ Beast agent not configured")
        print(f"   BEAST_ENABLED: {BEAST_ENABLED}")
        print(f"   BEAST_AGENT_ID: {BEAST_AGENT_ID or '(not set)'}")
        print(f"   VERTEX_PROJECT_ID: {VERTEX_PROJECT_ID}")
        return
    
    print("✓ Beast agent configured")
    print(f"  Agent ID: {BEAST_AGENT_ID}")
    print(f"  Project: {VERTEX_PROJECT_ID}")
    print(f"  Location: {VERTEX_LOCATION}")
    print("\nTesting invocation...")
    
    result = await invoke_beast(
        prompt="Generate upbeat SGV oldies music with late-night honesty mood",
        genre="SGV Oldies",
        mood="Late-Night Honesty",
        duration=30,
    )
    
    if result:
        print("✓ Success!")
        print(f"  Response: {result}")
    else:
        print("❌ Invocation failed")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_beast())
