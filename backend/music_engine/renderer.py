"""
Audio rendering via FluidSynth and FFmpeg.
Converts MIDI → WAV → MP3/OGG with genre-appropriate SoundFont selection.
"""
import subprocess
import os
from pathlib import Path
from typing import Optional, List

DEFAULT_SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
FALLBACK_SF2 = "/usr/share/sounds/sf2/FluidR3_GS.sf2"

# Alternative SoundFonts available on Ubuntu Studio
SF2_DIR = Path("/usr/share/sounds/sf2")
ALTERNATIVE_SF2 = {
    "piano": "FluidR3_GM.sf2",
    "full": "FluidR3_GM.sf2",
    "bright": "Black_Pearl_4_LV2.sf2",
}


def find_sf2(name: Optional[str] = None) -> str:
    """Find a SoundFont file."""
    if name and name in ALTERNATIVE_SF2:
        sf2_path = SF2_DIR / ALTERNATIVE_SF2[name]
        if sf2_path.exists():
            return str(sf2_path)

    # Try GM first, then GS fallback, then any SF2
    for candidate in ["FluidR3_GM.sf2", "FluidR3_GS.sf2", "TimGM6mb.sf2", "sf_GMbank.sf2"]:
        p = SF2_DIR / candidate
        if p.exists():
            return str(p)

    # Any SF2 file
    for f in SF2_DIR.glob("*.sf2"):
        return str(f)

    raise FileNotFoundError("No SoundFont file found. Install FluidR3_GM.sf2 or similar.")


def render_midi_to_wav(midi_path: str, wav_path: str,
                        sf2_path: Optional[str] = None,
                        gain: float = 1.0,
                        sample_rate: int = 44100) -> str:
    """
    Render a MIDI file to WAV using FluidSynth.

    Args:
        midi_path: Input .mid file path
        wav_path: Output .wav file path
        sf2_path: SoundFont file path (None = auto-detect)
        gain: Volume gain (0.0 - 10.0)
        sample_rate: Output sample rate

    Returns: Path to rendered WAV file
    """
    if sf2_path is None:
        sf2_path = find_sf2("full")

    cmd = [
        "fluidsynth",
        "-F", wav_path,
        "-T", "wav",
        "-g", str(gain),
        "-r", str(sample_rate),
        sf2_path,
        midi_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FluidSynth failed: {result.stderr}")

    if not os.path.exists(wav_path):
        raise RuntimeError("FluidSynth did not produce output file")

    return wav_path


def encode_audio(input_path: str, output_path: str,
                 format: str = "mp3", bitrate: str = "192k",
                 normalize: bool = True) -> str:
    """
    Encode audio using FFmpeg, optionally with normalization.

    Args:
        input_path: Input audio file path
        output_path: Output file path
        format: Output format ('mp3', 'ogg', 'wav')
        bitrate: Audio bitrate
        normalize: Apply loudnorm filter

    Returns: Path to encoded file
    """
    cmd = ["ffmpeg", "-y", "-i", input_path]

    if normalize and format != "wav":
        # EBU R128 normalization
        cmd.extend(["-af", "loudnorm=I=-16:LRA=11:TP=-1.5"])

    if format == "mp3":
        cmd.extend(["-c:a", "libmp3lame", "-b:a", bitrate])
    elif format == "ogg":
        cmd.extend(["-c:a", "libvorbis", "-b:a", bitrate])
    elif format == "wav":
        cmd.extend(["-c:a", "pcm_s16le"])

    cmd.append(output_path)

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg encoding failed: {result.stderr}")

    return output_path


def get_audio_duration(file_path: str) -> float:
    """Get audio duration in seconds using FFprobe."""
    cmd = [
        "ffprobe", "-v", "error", "-show_entries",
        "format=duration", "-of", "default=noprint_wrappers=1:nokey=1",
        file_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return float(result.stdout.strip())
    except (ValueError, TypeError):
        return 0.0


def cleanup_temp_files(*paths: str) -> None:
    """Remove temporary files if they exist."""
    for p in paths:
        try:
            if os.path.exists(p):
                os.remove(p)
        except OSError:
            pass
