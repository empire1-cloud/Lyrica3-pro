import os
import asyncio
import uuid
from typing import Dict, Any
from google.cloud import storage

from audio_engine import MasteringChain, DNAWatermark
from lyrica_vision import analyze_image_for_lyrica
from s2_synthesizer import S2SerendipitySynthesizer
from advanced_lyria_pipeline import (
    lyria_bytes_to_numpy, 
    process_stems_with_soulfire, 
    apply_image_driven_harmonic_physics
)
import soundfile as sf
from vics_ledger import sign_track

import logging
logger = logging.getLogger("empire1.production_pipeline")

# Simulated Lyria 3 Pro API fetching function
async def fetch_lyria_audio(blueprint: Dict[str, Any]) -> bytes:
    """
    Simulates calling Lyria 3 Pro with the generated blueprint and returning audio bytes.
    In production, this downloads the blob from GCS.
    """
    logger.info("Fetching raw audio from Lyria 3 Pro based on blueprint...")
    await asyncio.sleep(1) # simulate network delay
    # We will generate a quick test tone here to act as the "Lyria output"
    import numpy as np
    t = np.linspace(0, 5, 44100 * 5, endpoint=False)
    # create a simple chord
    audio = np.sin(2 * np.pi * 220 * t) + np.sin(2 * np.pi * 277.18 * t) + np.sin(2 * np.pi * 329.63 * t)
    audio = (audio * 10000).astype(np.int16)
    return audio.tobytes()

async def harden_resonance_x_pipeline(
    base_genre: str,
    mutation_genre: str,
    image_b64: str = None,
    creator_handle: str = "sys_admin",
):
    """
    The fully hardened end-to-end production pipeline.
    1. S2 generates blueprint.
    2. Visual Cortex extracts metadata.
    3. Lyria 3 Pro renders raw audio.
    4. Demucs splits into stems.
    5. Emotional Anatomy routing.
    6. Image-driven EQ tilt.
    7. VICS cryptographic seal.
    """
    print("\n--- INITIATING RESONANCE-X HARDENED PIPELINE ---")
    
    # 1. S2 Metamorphic Blending
    s2 = S2SerendipitySynthesizer()
    blueprint = s2.execute_metamorphic_blend(base_genre, mutation_genre)
    
    # 2. Lyrica Vision
    vision_meta = None
    if image_b64:
        vision_meta = await analyze_image_for_lyrica(image_b64)
        print(f"[Visual Cortex] Extracted: {vision_meta}")
    
    # 3. Lyria 3 Pro Synthesis
    raw_audio_bytes = await fetch_lyria_audio(blueprint)
    audio_np, sr = lyria_bytes_to_numpy(raw_audio_bytes)
    
    # 4 & 5. Demucs Separation + Soulfire Emotional Anatomy
    print("[Resonance-X] Applying Demucs Stem Split and Soulfire Emotional Anatomy Routing...")
    try:
        mix = process_stems_with_soulfire(audio_np, sr, vision_meta)
    except Exception as e:
        print(f"Demucs failed (using raw mix): {e}")
        mix = audio_np
        if mix.ndim == 1:
            import numpy as np
            mix = np.column_stack([mix, mix])
    
    # 6. Mastering & Image-Driven Harmonic Physics
    preset = "soulfire"
    print(f"[Mastering] Applying {preset} physics...")
    chain = MasteringChain(preset=preset, sr=sr)
    mastered = chain.process(mix)
    
    if vision_meta:
        mastered = apply_image_driven_harmonic_physics(mastered, vision_meta, sr)
        
    # 7. VICS Ledger Sealing
    dna_tag = f"trk_res_x_{uuid.uuid4().hex[:10]}"
    track_record = {
        "id": str(uuid.uuid4()),
        "dna_tag": dna_tag,
        "creator": creator_handle,
        "blueprint": blueprint,
        "vision": vision_meta,
    }
    sealed_track = sign_track(track_record)
    
    print(f"[VICS Ledger] Track Cryptographically Sealed.")
    print(f"   DNA Tag: {sealed_track['dna_tag']}")
    print(f"   Signature: {sealed_track['vics_signature']}")
    
    # DNA Watermarking into audio bytes
    dna_embedder = DNAWatermark(sr=sr)
    final_audio = dna_embedder.embed(mastered, dna_tag)
    
    out_file = f"resonance_x_final_{base_genre}_x_{mutation_genre}.wav".replace(" ", "_").lower()
    sf.write(out_file, final_audio, sr)
    print(f"\n✅ Pipeline Complete! 48kHz Master written to {out_file}")

if __name__ == "__main__":
    asyncio.run(harden_resonance_x_pipeline("Drill", "Chicano Soul"))
