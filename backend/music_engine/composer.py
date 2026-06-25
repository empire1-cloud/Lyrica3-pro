"""
Lyrica Music Engine — Composer.
Orchestrates the full pipeline: genre template → MIDI → rendered WAV → encoded MP3.
"""
import os
import uuid
import subprocess
from pathlib import Path
from typing import Optional

from . import midi_writer
from .harmony import get_template, get_chord_notes, generate_bass_line
from .melody import generate_melody, generate_arpeggio, generate_pad
from .drums import generate_drum_track
from .renderer import render_midi_to_wav, encode_audio, cleanup_temp_files

TICKS_PER_BEAT = 480
BEATS_PER_BAR = 4
DEFAULT_BARS = 24  # ~95+ sec of audio at 90bpm, enough for soulprint watermarking

# Output directories
OUTPUT_DIR = Path(__file__).parent.parent / "generated_audio"


def _setup_dirs():
    OUTPUT_DIR.mkdir(exist_ok=True)


def compose(lyrics: str, genre: str, mood: str, title: str = "Untitled",
            output_dir: Optional[str] = None) -> dict:
    """
    Compose a full track from lyrics/genre/mood.

    Returns:
        dict with keys:
            - midi_path: path to generated MIDI file
            - wav_path: path to rendered WAV file
            - mp3_path: path to encoded MP3 file
            - bpm: tempo used
            - duration_sec: approximate duration
            - lyrics: the lyrics used
            - genre: the genre
            - mood: the mood
    """
    _setup_dirs()
    track_id = title.lower().replace(" ", "_") + "_" + uuid.uuid4().hex[:8]
    out_dir = Path(output_dir) if output_dir else OUTPUT_DIR
    out_dir.mkdir(exist_ok=True)

    midi_path = str(out_dir / f"{track_id}.mid")
    wav_path = str(out_dir / f"{track_id}.wav")
    mp3_path = str(out_dir / f"{track_id}.mp3")

    # Get genre template
    template = get_template(genre, mood)
    bpm = sum(template["bpm_range"]) // 2
    key_center = template["key_center"]
    scale_type = template["scale"]
    instr = template["instruments"]
    drum_pattern = template["drum_pattern"]

    # Number of bars from lyrics (minimum 24 for soulprint watermark)
    total_bars = DEFAULT_BARS
    lyric_lines = lyrics.strip().split("\n")
    if len(lyric_lines) > 4:
        total_bars = min(max(len(lyric_lines) // 2, 24), 48)

    ticks_per_bar = TICKS_PER_BEAT * BEATS_PER_BAR

    # Chord progression
    progression_idx = hash(genre + mood) % len(template["chord_progressions"])
    progression = template["chord_progressions"][progression_idx]
    chords = get_chord_notes(progression, key_center, total_bars)

    # Generate each track part
    melody_events = generate_melody(chords, total_bars, TICKS_PER_BEAT, bpm, key_center, scale_type)
    arp_events = generate_arpeggio(chords, total_bars, TICKS_PER_BEAT, key_center)

    # Bass (channel 4) — notes kept in MIDI range 28-60
    bass_events = []
    for i, chord in enumerate(chords):
        root = max(28, min(60, chord[0] - 12))
        fifth = max(28, min(60, root + 7))
        beat_type = i % 4
        ch = 4
        if beat_type == 0:
            bass_events.append((0, root + 12, 90, TICKS_PER_BEAT, ch))
            bass_events.append((TICKS_PER_BEAT, root, 85, TICKS_PER_BEAT, ch))
        elif beat_type == 1:
            bass_events.append((0, fifth, 80, TICKS_PER_BEAT * 2, ch))
        elif beat_type == 2:
            bass_events.append((0, root, 85, TICKS_PER_BEAT, ch))
            bass_events.append((TICKS_PER_BEAT, root + 5, 80, TICKS_PER_BEAT, ch))
        else:
            bass_events.append((0, fifth, 80, TICKS_PER_BEAT * 2, ch))

    # Drums (channel 9 = General MIDI drums)
    drum_events = []
    for bar in range(total_bars):
        bar_events = generate_drum_track(drum_pattern, 1, bpm, TICKS_PER_BEAT)
        if bar == 0:
            drum_events.extend(bar_events)
        else:
            for delta, note, vel, dur, ch in bar_events:
                drum_events.append((delta, note, vel, dur, ch))

    # Build tracks: (program, events) for write_midi_program_change
    tracks_programs = [
        (instr["chords"], melody_events),
        (instr["arp"], arp_events),
        (instr["bass"], bass_events),
        (0, drum_events),  # Program doesn't matter for channel 10 (drums)
    ]

    # Write MIDI
    midi_writer.write_midi_program_change(midi_path, tracks_programs, bpm=bpm)

    # Render audio
    try:
        wav_path = render_midi_to_wav(midi_path, wav_path, gain=1.2)
        mp3_path = encode_audio(wav_path, mp3_path, format="mp3", bitrate="192k")

        # Get duration
        duration_cmd = [
            "ffprobe", "-v", "error", "-show_entries",
            "format=duration", "-of", "default=noprint_wrappers=1:nokey=1",
            mp3_path,
        ]
        result = subprocess.run(duration_cmd, capture_output=True, text=True)
        duration_sec = float(result.stdout.strip()) if result.stdout else 0.0

        return {
            "midi_path": midi_path,
            "wav_path": wav_path,
            "mp3_path": mp3_path,
            "bpm": bpm,
            "duration_sec": duration_sec,
            "lyrics": lyrics,
            "genre": genre,
            "mood": mood,
            "template": template,
        }
    except Exception as e:
        # Clean up on failure
        cleanup_temp_files(midi_path, wav_path, mp3_path)
        raise RuntimeError(f"Composition failed: {e}")


def get_supported_genres() -> list:
    """Return list of supported genre templates."""
    from .harmony import GENRE_TEMPLATES
    return list(GENRE_TEMPLATES.keys())
