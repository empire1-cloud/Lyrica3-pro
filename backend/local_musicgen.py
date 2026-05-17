"""
Local MusicGen Integration — No Replicate API needed
Uses Meta's AudioCraft library to generate music locally
Run on CPU or GPU (auto-detects)
"""
import os
import logging
from pathlib import Path
from typing import Optional
import torch

logger = logging.getLogger("lyrica3.local_musicgen")

# Check if audiocraft is available
try:
    from audiocraft.models import MusicGen
    AUDIOCRAFT_AVAILABLE = True
except ImportError:
    AUDIOCRAFT_AVAILABLE = False
    logger.warning("audiocraft not installed - run: pip install audiocraft")

# Model cache directory
MODEL_CACHE = Path(os.environ.get("MUSICGEN_MODEL_CACHE", str(Path.home() / ".cache" / "musicgen")))
MODEL_CACHE.mkdir(parents=True, exist_ok=True)

# Default model - options: small (300M), medium (1.5B), large (3.3B)
DEFAULT_MODEL = os.environ.get("MUSICGEN_MODEL", "facebook/musicgen-small")

# Global model cache
_model = None


def load_model(model_name: str = DEFAULT_MODEL):
    """Load MusicGen model (cached after first load)"""
    global _model
    if _model is not None:
        return _model
    
    if not AUDIOCRAFT_AVAILABLE:
        logger.error("audiocraft not installed - cannot load MusicGen")
        return None
    
    try:
        logger.info(f"Loading MusicGen model: {model_name}")
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {device}")
        
        # Load model
        _model = MusicGen.get_pretrained(model_name, device=device)
        
        logger.info(f"MusicGen model loaded successfully on {device}")
        return _model
    except Exception as e:
        logger.error(f"Failed to load MusicGen model: {e}")
        return None


async def generate_music_local(
    prompt: str,
    duration: int = 20,
    output_dir: str = "./static/generated",
    temperature: float = 1.0,
    top_k: int = 250,
    top_p: float = 0.0,
) -> Optional[str]:
    """
    Generate music locally using MusicGen
    
    Args:
        prompt: Text description of desired music
        duration: Duration in seconds (default 20s)
        output_dir: Where to save generated audio
        temperature: Sampling temperature (higher = more random)
        top_k: Top-k sampling (lower = more focused)
        top_p: Top-p/nucleus sampling (0 = disabled)
    
    Returns:
        Path to generated audio file, or None if failed
    """
    if not AUDIOCRAFT_AVAILABLE:
        logger.error("audiocraft not installed")
        return None
    
    model = load_model()
    if model is None:
        return None
    
    try:
        # Set generation params
        model.set_generation_params(
            duration=duration,
            temperature=temperature,
            top_k=top_k,
            top_p=top_p,
        )
        
        logger.info(f"Generating music: '{prompt}' ({duration}s)")
        
        # Generate (returns tensor)
        wav = model.generate([prompt], progress=True)
        
        # Save to file
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        import uuid
        filename = f"musicgen_{uuid.uuid4().hex[:10]}.wav"
        filepath = output_path / filename
        
        # Convert tensor to audio file
        from audiocraft.data.audio import audio_write
        audio_write(
            str(filepath.with_suffix('')),  # audiocraft adds .wav automatically
            wav[0].cpu(),
            model.sample_rate,
            strategy="loudness",
            loudness_compressor=True
        )
        
        logger.info(f"Generated music saved to: {filepath}")
        return str(filepath)
        
    except Exception as e:
        logger.error(f"MusicGen generation failed: {e}")
        return None


async def generate_music_with_fallback(
    prompt: str,
    duration: int = 20,
    output_dir: str = "./static/generated",
) -> tuple[Optional[str], str]:
    """
    Try local generation first, fall back to placeholder if failed
    
    Returns:
        (filepath, provider) tuple
        provider = "local:musicgen" or "fallback"
    """
    filepath = await generate_music_local(prompt, duration, output_dir)
    
    if filepath:
        return filepath, "local:musicgen"
    else:
        logger.warning("Local MusicGen failed, returning None (will use fallback stems)")
        return None, "fallback"


# Installation helper
def install_audiocraft():
    """Helper to install audiocraft"""
    import subprocess
    import sys
    
    print("Installing audiocraft (Meta's MusicGen library)...")
    subprocess.check_call([
        sys.executable, "-m", "pip", "install",
        "audiocraft",
        "--extra-index-url", "https://download.pytorch.org/whl/cpu"
    ])
    print("✓ audiocraft installed")


if __name__ == "__main__":
    # Test/install mode
    import asyncio
    import sys
    
    if not AUDIOCRAFT_AVAILABLE:
        print("audiocraft not found")
        response = input("Install audiocraft now? (y/n): ")
        if response.lower() == 'y':
            install_audiocraft()
            print("\nRestart the script to test generation")
            sys.exit(0)
        else:
            print("Skipping installation")
            sys.exit(1)
    
    # Test generation
    async def test():
        print("Testing local MusicGen...")
        result = await generate_music_local(
            prompt="upbeat electronic dance music with heavy bass",
            duration=10,  # short test
            output_dir="./test_output"
        )
        if result:
            print(f"✓ Success! Generated: {result}")
        else:
            print("✗ Generation failed")
    
    asyncio.run(test())
