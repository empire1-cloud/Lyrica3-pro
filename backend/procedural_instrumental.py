"""
Procedural instrumental generator — real audio, no API keys.
Generates genre-appropriate drums, 808 bass, chord pads, and melody
using pure numpy/scipy. Falls back to SoundHelix only as last resort.
"""

import io
import logging
import random
import struct
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np

logger = logging.getLogger("procedural_instrumental")

# ── SCALES (just intonation-ish, close enough) ──
SCALES = {
    "minor_pentatonic": [0, 3, 5, 7, 10],
    "major_pentatonic": [0, 2, 4, 7, 9],
    "blues":           [0, 3, 5, 6, 7, 10],
    "natural_minor":   [0, 2, 3, 5, 7, 8, 10],
    "major":           [0, 2, 4, 5, 7, 9, 11],
    "dorian":          [0, 2, 3, 5, 7, 9, 10],
    "mixolydian":      [0, 2, 4, 5, 7, 9, 10],
}

# Map genres to musical characteristics
GENRE_PROFILES = {
    "chicano": {
        "scale": "minor_pentatonic",
        "bass_pattern": [0, 0, -5, 0, 3, 3, -5, 3],
        "tempo_range": (85, 100),
        "swing": 0.15,
        "drums_style": "oldies",
        "chord_intervals": [0, 7, 10],
    },
    "g_funk": {
        "scale": "minor_pentatonic",
        "bass_pattern": [0, 0, 0, -3, 0, 0, 0, -5],
        "tempo_range": (88, 98),
        "swing": 0.20,
        "drums_style": "g_funk",
        "chord_intervals": [0, 5, 7],
    },
    "lowrider_soul": {
        "scale": "major",
        "bass_pattern": [0, -2, 0, -5, 0, -2, 0, -7],
        "tempo_range": (75, 90),
        "swing": 0.10,
        "drums_style": "oldies",
        "chord_intervals": [0, 7, 11],
    },
    "oldies": {
        "scale": "major",
        "bass_pattern": [0, 0, 3, 3, 5, 5, 3, 0],
        "tempo_range": (80, 110),
        "swing": 0.08,
        "drums_style": "oldies",
        "chord_intervals": [0, 7, 10],
    },
    "default": {
        "scale": "minor_pentatonic",
        "bass_pattern": [0, 0, -3, -3, 5, 5, 3, 0],
        "tempo_range": (85, 95),
        "swing": 0.12,
        "drums_style": "trap",
        "chord_intervals": [0, 5, 7],
    },
}


def _resolve_profile(cultural_matrix: str) -> dict:
    cm = cultural_matrix.lower()
    if "chicano" in cm or "sgv" in cm:
        return GENRE_PROFILES["chicano"]
    if "g-funk" in cm or "g funk" in cm:
        return GENRE_PROFILES["g_funk"]
    if "lowrider" in cm or "requinto" in cm:
        return GENRE_PROFILES["lowrider_soul"]
    if "oldies" in cm or "doo-wop" in cm:
        return GENRE_PROFILES["oldies"]
    return GENRE_PROFILES["default"]


def _key_to_root(key: str) -> float:
    notes = {"C": 16.35, "C#": 17.32, "Db": 17.32, "D": 18.35,
             "D#": 19.45, "Eb": 19.45, "E": 20.60, "F": 21.83,
             "F#": 23.12, "Gb": 23.12, "G": 24.50, "G#": 25.96,
             "Ab": 25.96, "A": 27.50, "A#": 29.14, "Bb": 29.14,
             "B": 30.87}
    return notes.get(key.upper().strip()[:2], 24.50)


def _db_to_gain(db: float) -> float:
    return 10.0 ** (db / 20.0)


# ── SOUND GENERATORS ──

def _sine(freq: float, duration: float, sr: int = 44100) -> np.ndarray:
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    return np.sin(2 * np.pi * freq * t)


def _noise(duration: float, sr: int = 44100) -> np.ndarray:
    return np.random.uniform(-1, 1, int(sr * duration))


def _adsr(n: int, attack: float = 0.01, decay: float = 0.1,
          sustain: float = 0.7, release: float = 0.2) -> np.ndarray:
    env = np.ones(n)
    a = int(n * attack)
    d = int(n * decay)
    r = int(n * release)
    if a > 0:
        env[:a] = np.linspace(0, 1, a)
    if d > a:
        env[a:d] = np.linspace(1, sustain, d - a)
    if r > 0:
        env[-r:] = np.linspace(sustain, 0, r)
    return env


# ── KICK ──
def _make_kick(duration: float = 0.3, sr: int = 44100,
               pitch_start: float = 150, pitch_end: float = 45) -> np.ndarray:
    n = int(sr * duration)
    t = np.linspace(0, duration, n)
    freq = pitch_start * (pitch_end / pitch_start) ** (t / duration)
    sig = np.sin(2 * np.pi * freq * t)
    sig *= np.exp(-t * 8)
    sig *= _adsr(n, 0.001, 0.05, 0.0, 0.15)
    return sig * 0.8


# ── SNARE ──
def _make_snare(duration: float = 0.25, sr: int = 44100) -> np.ndarray:
    n = int(sr * duration)
    noise = _noise(duration, sr)
    tone = _sine(200, duration, sr)
    sig = noise * 0.7 + tone * 0.3
    sig *= np.exp(-np.linspace(0, 1, n) * 10)
    sig *= _adsr(n, 0.001, 0.05, 0.0, 0.15)
    return sig * 0.6


# ── HI-HAT ──
def _make_hat(duration: float = 0.08, sr: int = 44100) -> np.ndarray:
    n = int(sr * duration)
    noise = _noise(duration, sr)
    sig = np.clip(noise * 2, -1, 1)
    sig *= np.exp(-np.linspace(0, 1, n) * 20)
    return sig * 0.3


# ── 808 BASS ──
def _make_808(freq: float, duration: float, sr: int = 44100,
              slide: Optional[float] = None) -> np.ndarray:
    n = int(sr * duration)
    t = np.linspace(0, duration, n)
    if slide:
        freq = freq * (slide / freq) ** (t / duration)
    sig = _sine(freq, duration, sr)
    sig += np.sin(2 * np.pi * freq * 2 * t) * 0.3
    sig *= np.exp(-t * 3)
    sig *= _adsr(n, 0.005, 0.3, 0.0, 0.1)
    return sig * 0.7


# ── CHORD PAD ──
def _make_pad(freqs: List[float], duration: float, sr: int = 44100) -> np.ndarray:
    n = int(sr * duration)
    sig = np.zeros(n)
    for f in freqs:
        tone = _sine(f, duration, sr)
        tone += _sine(f * 2, duration, sr) * 0.5
        tone += _sine(f * 3, duration, sr) * 0.25
        sig += tone
    sig /= max(len(freqs), 1)
    sig *= _adsr(n, 0.1, 0.2, 0.6, 0.3)
    sig *= 0.15
    return sig


# ── LEAD MELODY ──
def _make_lead(freqs: List[float], duration: float, sr: int = 44100) -> np.ndarray:
    n = int(sr * duration)
    sig = np.zeros(n)
    if not freqs:
        return sig
    note_len = len(freqs)
    samples_per_note = n // max(note_len, 1)
    for i, f in enumerate(freqs):
        start = i * samples_per_note
        end = min(start + samples_per_note, n)
        note_len_s = (end - start) / sr
        t = np.linspace(0, note_len_s, end - start)
        tone = np.sin(2 * np.pi * f * t)
        tone += np.sin(2 * np.pi * f * 2 * t) * 0.3
        sig[start:end] = tone
    sig *= _adsr(n, 0.01, 0.05, 0.7, 0.15)
    return sig * 0.12


# ── MAIN GENERATOR ──

def generate_instrumental(
    bpm: float = 90,
    key: str = "C",
    cultural_matrix: str = "LA SGV Chicano Heritage",
    mood_recipe: Tuple[float, float, float, float] = (0.78, 0.66, 0.82, 0.71),
    duration_beats: int = 32,
    sr: int = 44100,
) -> np.ndarray:
    profile = _resolve_profile(cultural_matrix)
    root_hz = _key_to_root(key)
    scale = SCALES.get(profile["scale"], SCALES["minor_pentatonic"])

    beats_per_sec = bpm / 60.0
    total_seconds = (duration_beats / beats_per_sec)
    total_samples = int(sr * total_seconds)
    beat_samples = int(sr / beats_per_sec)

    # mood modifiers
    lung, throat, fry, crack = mood_recipe
    energy = min(1.0, (lung + throat) / 1.6)

    # ── BUILD DRUM TRACK ──
    drum_track = np.zeros(total_samples)

    # Determine pattern based on drums_style
    if profile["drums_style"] == "g_funk":
        kick_pattern = [0, 0, 1, 0, 0, 1, 0, 0]  # lazy G-Funk kick
        snare_pattern = [0, 0, 0, 0, 1, 0, 0, 0]  # snare on 4
    elif profile["drums_style"] == "oldies":
        kick_pattern = [0, 0, 1, 0, 0, 0, 1, 0]  # classic doo-wop
        snare_pattern = [0, 0, 0, 0, 1, 0, 0, 0]
    else:
        kick_pattern = [0, 0, 1, 0, 0, 0, 1, 0]
        snare_pattern = [0, 0, 0, 0, 1, 0, 0, 0]

    swing = profile.get("swing", 0.1)

    for beat in range(duration_beats):
        beat_start = int(beat * beat_samples)
        sub_pos = beat % len(kick_pattern)

        # Kick
        if kick_pattern[sub_pos]:
            k = _make_kick(sr=sr)
            end = min(beat_start + len(k), total_samples)
            drum_track[beat_start:end] += k[:end - beat_start]

        # Snare
        if snare_pattern[sub_pos]:
            s = _make_snare(sr=sr)
            end = min(beat_start + len(s), total_samples)
            drum_track[beat_start:end] += s[:end - beat_start]

        # Hi-hat (8th notes with swing)
        for eighth in range(2):
            offset = int(eighth * beat_samples / 2)
            if eighth == 1 and swing > 0:
                offset += int(beat_samples * swing * (random.random() * 0.5 + 0.75))
            start = beat_start + offset
            if start >= total_samples:
                continue
            h = _make_hat(sr=sr)
            end = min(start + len(h), total_samples)
            drum_track[start:end] += h[:end - start]

    # ── BUILD 808 BASS ──
    bass_track = np.zeros(total_samples)
    bass_pattern = profile["bass_pattern"]
    pattern_len = len(bass_pattern)

    for beat in range(duration_beats):
        beat_start = int(beat * beat_samples)
        degree = bass_pattern[beat % pattern_len]
        octave = 2
        semitones = degree + scale[beat % len(scale)]
        freq = root_hz * (2 ** (semitones / 12.0)) * (2 ** octave)
        next_degree = bass_pattern[(beat + 1) % pattern_len]
        next_semitones = next_degree + scale[(beat + 1) % len(scale)]
        slide_freq = root_hz * (2 ** (next_semitones / 12.0)) * (2 ** octave)
        b = _make_808(freq, 1.0 / beats_per_sec, sr, slide=slide_freq)
        end = min(beat_start + len(b), total_samples)
        bass_track[beat_start:end] += b[:end - beat_start]

    # ── BUILD CHORD PAD ──
    pad_track = np.zeros(total_samples)
    pad_chord_size = 4
    for chunk in range(duration_beats // pad_chord_size + 1):
        start_beat = chunk * pad_chord_size
        if start_beat >= duration_beats:
            break
        start_sample = int(start_beat * beat_samples)
        chord_duration = pad_chord_size / beats_per_sec
        chord_root_idx = scale[start_beat % len(scale)]
        freqs = [root_hz * (2 ** ((chord_root_idx + i) / 12.0))
                 for i in profile["chord_intervals"]]
        pad = _make_pad([f * 0.5 for f in freqs], chord_duration, sr)
        end = min(start_sample + len(pad), total_samples)
        pad_track[start_sample:end] += pad[:end - start_sample]

    # ── BUILD LEAD MELODY ──
    lead_track = np.zeros(total_samples)
    if energy > 0.55:
        melody_notes = []
        for beat in range(duration_beats):
            note_idx = scale[(beat * 3) % len(scale)]
            if random.random() < 0.4:
                note_idx += random.choice([0, 3, 5, 7])
            octave = 3
            freq = root_hz * (2 ** (note_idx / 12.0)) * (2 ** octave)
            melody_notes.append(freq)
        lead_track[:len(_make_lead(melody_notes, total_seconds, sr))] = \
            _make_lead(melody_notes, total_seconds, sr)

    # ── MIX ──
    # Normalize each track
    def _normalize(x: np.ndarray, target_peak: float = 0.8) -> np.ndarray:
        peak = np.max(np.abs(x))
        if peak > 0:
            return x * (target_peak / peak)
        return x

    drum_track = _normalize(drum_track, 0.5)
    bass_track = _normalize(bass_track, 0.7)
    pad_track = _normalize(pad_track, 0.35)
    lead_track = _normalize(lead_track, 0.25)

    mix = drum_track + bass_track + pad_track + lead_track
    mix = _normalize(mix, 0.95)
    return mix


def _float32_to_pcm16(sig: np.ndarray) -> bytes:
    sig = np.clip(sig, -1.0, 1.0)
    sig = (sig * 32767).astype(np.int16)
    return sig.tobytes()


def write_wav_bytes(sig: np.ndarray, sr: int = 44100) -> bytes:
    data = _float32_to_pcm16(sig)
    buf = io.BytesIO()
    # WAV header
    buf.write(b"RIFF")
    buf.write(struct.pack("<I", 36 + len(data)))
    buf.write(b"WAVE")
    buf.write(b"fmt ")
    buf.write(struct.pack("<I", 16))
    buf.write(struct.pack("<HH", 1, 1))  # mono, PCM
    buf.write(struct.pack("<I", sr))
    buf.write(struct.pack("<I", sr * 2))
    buf.write(struct.pack("<HH", 2, 16))
    buf.write(b"data")
    buf.write(struct.pack("<I", len(data)))
    buf.write(data)
    buf.seek(0)
    return buf.getvalue()


def generate_instrumental_stems(
    bpm: float = 90,
    key: str = "C",
    cultural_matrix: str = "LA SGV Chicano Heritage",
    mood_recipe: Tuple[float, float, float, float] = (0.78, 0.66, 0.82, 0.71),
    out_dir: str = "static/stems",
    duration_beats: int = 32,
) -> Tuple[List[Dict], str]:
    Path(out_dir).mkdir(parents=True, exist_ok=True)

    mix = generate_instrumental(
        bpm=bpm,
        key=key,
        cultural_matrix=cultural_matrix,
        mood_recipe=mood_recipe,
        duration_beats=duration_beats,
    )

    tag = uuid.uuid4().hex[:10]
    fname = f"instrumental_{tag}.wav"
    out_path = Path(out_dir) / fname
    wav_bytes = write_wav_bytes(mix)
    out_path.write_bytes(wav_bytes)
    logger.info(f"Procedural instrumental written: {out_path} ({len(wav_bytes)} bytes)")

    public_url = f"/api/static/stems/{fname}"
    stems = [
        {"name": "Raw Human Pipes", "src": None, "level": 0.0, "peak": 0.0},
        {"name": "Late-Pocket Drums", "src": public_url, "level": 0.77, "peak": 0.55},
        {"name": "Sub Bass / Acoustic Requinto", "src": public_url, "level": 0.77, "peak": 0.55},
        {"name": "Analog Melody", "src": public_url, "level": 0.77, "peak": 0.55},
    ]
    return stems, public_url
