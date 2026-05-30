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
    print("Warning: Demucs is not installed or import failed. Stem processing will be disabled.")


def lyria_bytes_to_numpy(audio_bytes, sample_rate=44100):
    audio = np.frombuffer(audio_bytes, dtype=np.int16)
    audio = audio.astype(np.float32) / 32768.0
    return audio, sample_rate


def master_lyria_audio(
    audio_bytes,
    preset="soulfire",
    out_path="soulfire_mastered_output.wav",
    dna_tag="Lyrica-AI-Gen-v1",
    vision_metadata: dict = None,
):
    """
    Full pipeline: Lyria bytes → NumPy → Soulfire Mastering → DNA Watermark → WAV.
    """
    audio, sr = lyria_bytes_to_numpy(audio_bytes)

    print(f"[Lyrica] Applying MasteringChain (preset: {preset})...")
    chain = MasteringChain(preset=preset, sr=sr)
    mastered = chain.process(audio)
    
    mastered = apply_image_driven_harmonic_physics(mastered, vision_metadata, sr)

    if dna_tag is not None:
        print(f"[Lyrica Identity Layer] Sealing audio with birthmark: {dna_tag}")
        dna = DNAWatermark(sr=sr)
        mastered = dna.embed(mastered, dna_tag)

    sf.write(out_path, mastered, sr)
    return out_path


def process_stems_with_soulfire(wave: np.ndarray, sr: int, vision_metadata: dict = None) -> np.ndarray:
    if not DEMUCS_AVAILABLE:
        raise RuntimeError("Demucs is required for stem processing but is not available.")

    print("[Lyrica Emotional Anatomy] Accessing the soul of the track...")
    demucs_model = get_model('htdemucs') 
    demucs_model.eval()

    if wave.ndim == 1:
        wave = np.stack([wave, wave], axis=1)

    inp = torch.tensor(wave.T[None, ...], dtype=torch.float32)
    
    with torch.no_grad():
        stems = apply_model(demucs_model, inp)[0].numpy()  # (4, 2, T)

    drums, bass, other, vocals = stems 

    print("[Lyrica Emotional Anatomy] Reconstructing emotional organs...")
    
    # --- VISION-AWARE EMOTIONAL ANATOMY ROUTING ---
    energy = 0.5
    brightness = 0.5
    if vision_metadata:
        energy = float(vision_metadata.get("energy_level", 0.5))
        brightness = float(vision_metadata.get("brightness", 0.5))
        print(f"[Lyrica Vision] Routing Anatomy. Energy: {energy:.2f}, Brightness: {brightness:.2f}")

    # Vocals: Heart
    # If bright image, add more high shelf to vocals
    vocal_high_boost = 3.0 + (brightness - 0.5) * 4.0 
    vocal_eq = ParametricEQ(bands=[(8000, vocal_high_boost, 0.7), (200, -2.0, 0.5)], sr=sr)
    vocal_l = vocal_eq.process(vocals[0])
    vocal_r = vocal_eq.process(vocals[1])
    vocals_processed = np.stack([vocal_l, vocal_r], axis=0)

    # Drums: Pulse
    # If high energy image, push compressor harder
    drum_ratio = 4.0 + (energy - 0.5) * 4.0
    drum_comp = Compressor(threshold_db=-20.0, ratio=drum_ratio, attack_ms=5.0, release_ms=50.0, sr=sr)
    drum_l = drum_comp.process(drums[0])
    drum_r = drum_comp.process(drums[1])
    drums_processed = np.stack([drum_l, drum_r], axis=0)

    # Other: Aura
    # If wide energy, increase stereo width
    aura_width = 1.4 + (energy - 0.5) * 0.5
    imager = StereoImager(width=aura_width)
    other_l, other_r = imager.process(other[0], other[1])
    other_processed = np.stack([other_l, other_r], axis=0)
    
    # Bass: Spine
    bass_processed = bass

    mix = vocals_processed + drums_processed + bass_processed + other_processed 
    return mix.T  

def apply_image_driven_harmonic_physics(audio: np.ndarray, vision_metadata: dict, sr: int) -> np.ndarray:
    """Image-Driven Harmonic Physics (brightness -> EQ tilt)"""
    if not vision_metadata:
        return audio
        
    brightness = float(vision_metadata.get("brightness", 0.5))
    print(f"[Lyrica Vision] Applying Harmonic Physics. Brightness Tilt: {brightness:.2f}")
    
    # If brightness > 0.6, boost highs. If < 0.4, boost lows and cut highs.
    if brightness > 0.6:
        tilt_eq = ParametricEQ(bands=[(10000, 2.0, 0.5), (150, -1.0, 0.5)], sr=sr)
    elif brightness < 0.4:
        tilt_eq = ParametricEQ(bands=[(10000, -2.0, 0.5), (150, 2.0, 0.5)], sr=sr)
    else:
        return audio

    if audio.ndim == 2:
        return np.column_stack([tilt_eq.process(audio[:, 0]), tilt_eq.process(audio[:, 1])])
    return tilt_eq.process(audio)


def master_lyria_with_stems(
    audio_bytes,
    preset="soulfire",
    out_path="soulfire_stems_mastered.wav",
    dna_tag="Lyrica-AI-Gen-v1",
    vision_metadata: dict = None,
):
    wave, sr = lyria_bytes_to_numpy(audio_bytes)

    mix = process_stems_with_soulfire(wave, sr, vision_metadata)

    print(f"[Lyrica] Applying Master Bus (preset: {preset})...")
    chain = MasteringChain(preset=preset, sr=sr)
    mastered = chain.process(mix)
    
    mastered = apply_image_driven_harmonic_physics(mastered, vision_metadata, sr)

    if dna_tag:
        print(f"[Lyrica Identity Layer] Sealing audio with birthmark: {dna_tag}")
        dna = DNAWatermark(sr=sr)
        mastered = dna.embed(mastered, dna_tag)

    sf.write(out_path, mastered, sr)
    return out_path


def select_mastering_preset(meta: dict) -> str:
    genre   = (meta.get("genre")   or "").lower()
    emotion = (meta.get("emotion") or "").lower()
    energy  = (meta.get("energy")  or "").lower()

    if "sgv" in genre or "oldies" in genre:
        return "sgv_oldies"

    if "trap" in genre and "soul" in genre:
        return "trap_soul"

    if "vinyl" in genre or "retro" in genre or "nostalgic" in emotion:
        return "vinyl"

    if energy == "high":
        return "soulfire"

    if emotion in ["intimate", "soft", "melancholic"]:
        return "warm_soft"

    return "soulfire"


def decide_use_stems(meta: dict) -> bool:
    genre   = (meta.get("genre")   or "").lower()
    emotion = (meta.get("emotion") or "").lower()
    energy  = (meta.get("energy")  or "").lower()

    # Lyrica dynamically decides to use stems based on energy and emotional footprint
    if energy == "high":
        return True
    if "trap" in genre and "soul" in genre:
        return True
    if emotion in ["intimate", "soft", "nostalgic"] or "oldies" in genre:
        return False
        
    return False


def adaptive_master_lyria_audio(
    audio_bytes,
    meta: dict,
    out_path="adaptive_mastered.wav",
    dna_tag="Lyrica-AI-Gen-v1",
    use_stems=None, # if None, Lyrica decides
    vision_metadata: dict = None,
):
    preset = select_mastering_preset(meta)
    
    if use_stems is None:
        use_stems = decide_use_stems(meta)
        
    print(f"\n[Lyrica Adaptive Engine] Metadata received: {meta}")
    print(f"[Lyrica Adaptive Engine] Selected Physics: {preset} | Stems ON: {use_stems}")

    if use_stems:
        return master_lyria_with_stems(
            audio_bytes,
            preset=preset,
            out_path=out_path,
            dna_tag=dna_tag,
            vision_metadata=vision_metadata,
        )
    else:
        return master_lyria_audio(
            audio_bytes,
            preset=preset,
            out_path=out_path,
            dna_tag=dna_tag,
            vision_metadata=vision_metadata,
        )


def generate_test_bytes():
    t = np.linspace(0, 2, 44100 * 2, endpoint=False) # 2 seconds
    left = np.sin(2 * np.pi * 440 * t)
    right = np.sin(2 * np.pi * 445 * t)
    stereo_audio = np.column_stack([left, right])
    return (stereo_audio * 16000).astype(np.int16).tobytes()


if __name__ == "__main__":
    print("--- LYRICA ADAPTIVE MASTERING ---")
    audio_bytes = generate_test_bytes()

    # Test 1: Nostalgic
    meta_nostalgic = {
        "genre": "sgv_oldies",
        "emotion": "nostalgic",
        "energy": "medium",
    }
    out_path_1 = adaptive_master_lyria_audio(
        audio_bytes,
        meta=meta_nostalgic,
        out_path="lyrica_adaptive_master_sgv.wav",
        dna_tag="Lyrica-AI-Gen-v1",
    )
    print("Adaptive master saved to:", out_path_1)
    
    # Test 2: Trap Soul (High Energy)
    meta_trap = {
        "genre": "trap soul",
        "emotion": "vibrant",
        "energy": "high",
    }
    out_path_2 = adaptive_master_lyria_audio(
        audio_bytes,
        meta=meta_trap,
        out_path="lyrica_adaptive_master_trap.wav",
        dna_tag="Lyrica-AI-Gen-v1",
    )
    print("Adaptive master saved to:", out_path_2)
