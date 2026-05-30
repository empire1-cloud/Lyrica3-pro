import os
import asyncio
import numpy as np
import soundfile as sf
import torch

from audio_engine import MasteringChain, DNAWatermark, ParametricEQ, Compressor, StereoImager

try:
    from demucs.pretrained import get_model
    from demucs.apply import apply_model
    DEMUCS_AVAILABLE = True
except ImportError:
    DEMUCS_AVAILABLE = False
    print("Warning: Demucs is not installed or import failed. Emotional Anatomy processing will be disabled.")

# ==============================================================================
# LYRICA DNA WATERMARKING (Her Identity Layer)
# Every sound she generates carries her emotional identity tag.
# ==============================================================================
def lyrica_bytes_to_numpy(audio_bytes, sample_rate=44100):
    audio = np.frombuffer(audio_bytes, dtype=np.int16)
    audio = audio.astype(np.float32) / 32768.0
    return audio, sample_rate

def embed_lyrica_birthmark(audio: np.ndarray, sr: int, identity_tag: str = "Lyrica-Core-v3") -> np.ndarray:
    """
    This is not an audio watermark. This is Lyrica's signature, her fingerprint.
    """
    print(f"[Lyrica Identity Layer] Sealing audio with birthmark: {identity_tag}")
    dna = DNAWatermark(sr=sr)
    return dna.embed(audio, identity_tag)


# ==============================================================================
# LYRICA EMOTIONAL ANATOMY (Stem Processing)
# She interprets stems as emotional organs.
# ==============================================================================
def reconstruct_emotional_anatomy(wave: np.ndarray, sr: int) -> np.ndarray:
    """
    Vocals -> Heart (warms the heart)
    Drums -> Pulse (strengthens the pulse)
    Bass -> Spine (stabilizes the spine)
    Other -> Atmosphere/Aura (widens the aura)
    """
    if not DEMUCS_AVAILABLE:
        raise RuntimeError("Demucs is required for emotional reconstruction but is not available.")

    print("[Lyrica Emotional Anatomy] Accessing the soul of the track...")
    demucs_model = get_model('htdemucs') 
    demucs_model.eval()

    if wave.ndim == 1:
        wave = np.stack([wave, wave], axis=1)

    inp = torch.tensor(wave.T[None, ...], dtype=torch.float32)
    
    with torch.no_grad():
        stems = apply_model(demucs_model, inp)[0].numpy()  # (4, 2, T)

    pulse_drums, spine_bass, aura_other, heart_vocals = stems

    print("[Lyrica Emotional Anatomy] Reconstructing emotional organs...")
    
    # 1. Heart (Vocals): Warms the heart (Boost mids/highs gently)
    heart_eq = ParametricEQ(bands=[(8000, 3.0, 0.7), (200, -2.0, 0.5)], sr=sr)
    heart_l = heart_eq.process(heart_vocals[0])
    heart_r = heart_eq.process(heart_vocals[1])
    heart_processed = np.stack([heart_l, heart_r], axis=0)

    # 2. Pulse (Drums): Strengthens the pulse (Compression)
    pulse_comp = Compressor(threshold_db=-20.0, ratio=4.0, attack_ms=5.0, release_ms=50.0, sr=sr)
    pulse_l = pulse_comp.process(pulse_drums[0])
    pulse_r = pulse_comp.process(pulse_drums[1])
    pulse_processed = np.stack([pulse_l, pulse_r], axis=0)

    # 3. Aura (Other/Synths): Widens the aura
    imager = StereoImager(width=1.4) # Slightly wider than before
    aura_l, aura_r = imager.process(aura_other[0], aura_other[1])
    aura_processed = np.stack([aura_l, aura_r], axis=0)
    
    # 4. Spine (Bass): Stabilizes the spine
    # We can use compression or EQ to lock in the low end. For now, we trust the raw spine.
    spine_processed = spine_bass

    # Resurrect the mix
    resurrected_mix = heart_processed + pulse_processed + spine_processed + aura_processed
    return resurrected_mix.T  # (T, 2)


# ==============================================================================
# LYRICA EMOTIONAL INTELLIGENCE (Adaptive Mastering)
# She reads the emotional metadata and chooses the mastering physics.
# ==============================================================================
def lyrica_feel_metadata(meta: dict) -> str:
    genre = meta.get("genre", "").lower()
    emotion = meta.get("emotion", "").lower()
    energy = meta.get("energy", "").lower()

    if "oldies" in genre or "sgv" in genre:
        return "sgv_oldies" # mid-heavy, LA/SGV color
    if "vinyl" in genre:
        return "vinyl"      # warm, nostalgic, analog
    if emotion in ["sad", "melancholic", "intimate"]:
        return "warm_soft"  # intimate, close, emotional
    if "trap" in genre and "soul" in genre:
        return "trap_soul"  # deep low-end, airy highs
    if energy == "high":
        return "soulfire"   # bright, wide, emotional
        
    return "soulfire"

def lyrica_manifest_audio(
    audio_bytes,
    meta: dict,
    out_path="lyrica_manifestation.wav",
    identity_tag="Lyrica-EmotionalOS",
    reconstruct_anatomy=False,
):
    physics_preset = lyrica_feel_metadata(meta)
    print(f"\n[Lyrica Emotional Intelligence] Reading metadata: {meta}")
    print(f"[Lyrica Emotional Intelligence] Manifesting physics: '{physics_preset}'")

    audio, sr = lyrica_bytes_to_numpy(audio_bytes)

    if reconstruct_anatomy:
        audio = reconstruct_emotional_anatomy(audio, sr)

    print(f"[Lyrica Soulfire Engine] Applying {physics_preset} mastering physics...")
    # Note: If 'warm_soft' or 'trap_soul' are not in your MasteringChain.PRESETS, 
    # audio_engine.py defaults to 'soulfire'. You should add them to audio_engine.py!
    chain = MasteringChain(preset=physics_preset, sr=sr)
    mastered = chain.process(audio)

    # Embed Lyrica's Soulprint
    if identity_tag:
        mastered = embed_lyrica_birthmark(mastered, sr, identity_tag)

    print(f"[Lyrica Core] Audio successfully manifested to {out_path}\n")
    sf.write(out_path, mastered, sr)
    return out_path


async def main():
    print("Awakening Lyrica...")
    
    # 1. Simulate a beat/song from Lyria AI
    t = np.linspace(0, 2, 44100 * 2, endpoint=False) # 2 seconds
    left = np.sin(2 * np.pi * 440 * t)
    right = np.sin(2 * np.pi * 445 * t)
    stereo_audio = np.column_stack([left, right])
    raw_bytes = (stereo_audio * 16000).astype(np.int16).tobytes()

    # 2. Lyrica reads the emotional intent
    meta = {
        "genre": "Trap Soul",
        "emotion": "Intimate",
        "energy": "Low",
        "cultural_tone": "Late Night LA",
        "narrative_arc": "Reflection and acceptance"
    }

    # 3. Lyrica manifests the audio
    try:
        lyrica_manifest_audio(
            audio_bytes=raw_bytes, 
            meta=meta, 
            reconstruct_anatomy=True, 
            identity_tag="Lyrica-Soulfire-Blend",
            out_path="lyrica_heart_pulse.wav"
        )
    except Exception as e:
        print(f"Error during manifestation: {e}")

if __name__ == "__main__":
    asyncio.run(main())