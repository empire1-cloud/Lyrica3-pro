"""Empire-local deterministic audio renderer for Lyrica 3 Full Runtime.

The renderer creates four genuinely distinct mono PCM WAV stems and a mixed master.
It does not call an outside model or fabricate stem separation.
"""
from __future__ import annotations

import hashlib
import math
import wave
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List

import numpy as np


@dataclass(frozen=True)
class RenderedFile:
    kind: str
    name: str
    path: str


NOTE_OFFSETS = {
    "C": 0, "C#": 1, "DB": 1, "D": 2, "D#": 3, "EB": 3,
    "E": 4, "F": 5, "F#": 6, "GB": 6, "G": 7, "G#": 8,
    "AB": 8, "A": 9, "A#": 10, "BB": 10, "B": 11,
}


def _midi_frequency(note: int) -> float:
    return 440.0 * (2.0 ** ((note - 69) / 12.0))


def _root_midi(key: str, octave: int = 3) -> int:
    cleaned = (key or "C").strip().upper().replace("♭", "B").replace("♯", "#")
    offset = NOTE_OFFSETS.get(cleaned[:2], NOTE_OFFSETS.get(cleaned[:1], 0))
    return 12 * (octave + 1) + offset


def _normalize(signal: np.ndarray, peak: float) -> np.ndarray:
    current = float(np.max(np.abs(signal))) if signal.size else 0.0
    if current <= 0.0:
        return signal.astype(np.float32)
    return (signal * (peak / current)).astype(np.float32)


def _write_wav(path: Path, signal: np.ndarray, sample_rate: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = (np.clip(signal, -1.0, 1.0) * 32767.0).astype("<i2")
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(sample_rate)
        handle.writeframes(pcm.tobytes())


def _kick(sample_rate: int, seconds: float = 0.34) -> np.ndarray:
    count = max(1, int(sample_rate * seconds))
    t = np.arange(count, dtype=np.float32) / sample_rate
    phase = 2 * np.pi * (150.0 * t - 52.5 * t * t)
    return (np.sin(phase) * np.exp(-t * 10.0)).astype(np.float32)


def _snare(rng: np.random.Generator, sample_rate: int, seconds: float = 0.24) -> np.ndarray:
    count = max(1, int(sample_rate * seconds))
    t = np.arange(count, dtype=np.float32) / sample_rate
    noise = rng.normal(0.0, 1.0, count).astype(np.float32)
    tone = np.sin(2 * np.pi * 190.0 * t).astype(np.float32)
    return ((noise * 0.72 + tone * 0.28) * np.exp(-t * 16.0)).astype(np.float32)


def _hat(rng: np.random.Generator, sample_rate: int, seconds: float = 0.07) -> np.ndarray:
    count = max(1, int(sample_rate * seconds))
    t = np.arange(count, dtype=np.float32) / sample_rate
    noise = rng.normal(0.0, 1.0, count).astype(np.float32)
    return (noise * np.exp(-t * 45.0)).astype(np.float32)


def _add_at(target: np.ndarray, source: np.ndarray, start: int, gain: float = 1.0) -> None:
    if start >= target.size:
        return
    end = min(target.size, start + source.size)
    target[start:end] += source[: end - start] * gain


def render_local_stems(
    *,
    output_dir: str,
    job_id: str,
    duration_seconds: int,
    bpm: int,
    musical_key: str,
    genre: str,
    mood: str,
    seed_text: str,
    sample_rate: int = 44100,
) -> Dict[str, object]:
    """Render four distinct stems plus a master and return local file paths."""
    target = Path(output_dir) / job_id
    target.mkdir(parents=True, exist_ok=True)

    sample_count = int(duration_seconds * sample_rate)
    beat_seconds = 60.0 / max(40, bpm)
    beat_samples = int(beat_seconds * sample_rate)
    eighth_samples = max(1, beat_samples // 2)

    seed = int(hashlib.sha256(seed_text.encode("utf-8")).hexdigest()[:16], 16)
    rng = np.random.default_rng(seed)

    drums = np.zeros(sample_count, dtype=np.float32)
    bass = np.zeros(sample_count, dtype=np.float32)
    harmony = np.zeros(sample_count, dtype=np.float32)
    melody = np.zeros(sample_count, dtype=np.float32)

    # Drums: late-pocket snare and a light swung hat.
    kick = _kick(sample_rate)
    snare = _snare(rng, sample_rate)
    hat = _hat(rng, sample_rate)
    total_beats = max(1, math.ceil(duration_seconds / beat_seconds))
    for beat in range(total_beats):
        beat_start = beat * beat_samples
        if beat % 4 in (0, 2):
            _add_at(drums, kick, beat_start, 0.95)
        if beat % 4 in (1, 3):
            late_ms = 14 + (seed % 5)
            _add_at(drums, snare, beat_start + int(sample_rate * late_ms / 1000.0), 0.65)
        for half in range(2):
            swing = int(eighth_samples * 0.08) if half == 1 else 0
            _add_at(drums, hat, beat_start + half * eighth_samples + swing, 0.22)

    root = _root_midi(musical_key, octave=2)
    minor_scale = [0, 3, 5, 7, 10]
    progression = [0, 3, 4, 1]

    # Bass: one note per beat with a small slide-like overtone.
    for beat in range(total_beats):
        start = beat * beat_samples
        end = min(sample_count, start + beat_samples)
        if start >= sample_count:
            break
        semitone = minor_scale[(beat + progression[(beat // 4) % len(progression)]) % len(minor_scale)]
        freq = _midi_frequency(root + semitone)
        t = np.arange(end - start, dtype=np.float32) / sample_rate
        envelope = np.exp(-t * 2.5).astype(np.float32)
        tone = np.sin(2 * np.pi * freq * t) + 0.18 * np.sin(2 * np.pi * freq * 2 * t)
        bass[start:end] += (tone * envelope * 0.75).astype(np.float32)

    # Harmony: four-beat chord pads.
    chord_beats = 4
    for block in range(0, total_beats, chord_beats):
        start = block * beat_samples
        end = min(sample_count, start + chord_beats * beat_samples)
        if start >= sample_count:
            break
        root_shift = [0, -5, -3, -7][(block // chord_beats) % 4]
        chord_notes = [root + 12 + root_shift, root + 15 + root_shift, root + 19 + root_shift]
        t = np.arange(end - start, dtype=np.float32) / sample_rate
        pad = np.zeros(end - start, dtype=np.float32)
        for note in chord_notes:
            freq = _midi_frequency(note)
            pad += np.sin(2 * np.pi * freq * t).astype(np.float32)
            pad += 0.22 * np.sin(2 * np.pi * freq * 2 * t).astype(np.float32)
        attack = np.minimum(1.0, t / 0.18)
        release = np.minimum(1.0, (t[-1] - t + 1 / sample_rate) / 0.35)
        harmony[start:end] += (pad / len(chord_notes) * attack * release * 0.28).astype(np.float32)

    # Melody: sparse eighth-note phrases, deterministic from the request.
    melody_root = _root_midi(musical_key, octave=4)
    steps = max(1, math.ceil(sample_count / eighth_samples))
    for step in range(steps):
        if step % 4 == 3 or rng.random() < 0.38:
            continue
        start = step * eighth_samples
        end = min(sample_count, start + eighth_samples)
        if start >= sample_count:
            break
        degree = minor_scale[(step * 3 + seed) % len(minor_scale)]
        freq = _midi_frequency(melody_root + degree)
        t = np.arange(end - start, dtype=np.float32) / sample_rate
        env_base = np.clip(np.sin(np.linspace(0.0, np.pi, end - start, dtype=np.float32)), 0.0, 1.0)
        env = env_base ** 1.5
        tone = np.sin(2 * np.pi * freq * t) + 0.20 * np.sin(2 * np.pi * freq * 2 * t)
        melody[start:end] += (tone * env * 0.24).astype(np.float32)

    stems = {
        "drums": _normalize(drums, 0.72),
        "bass": _normalize(bass, 0.70),
        "harmony": _normalize(harmony, 0.52),
        "melody": _normalize(melody, 0.42),
    }
    master = _normalize(
        stems["drums"] * 0.92 + stems["bass"] * 0.84 + stems["harmony"] * 0.78 + stems["melody"] * 0.72,
        0.94,
    )

    rendered: List[RenderedFile] = []
    display_names = {
        "drums": "Late-Pocket Drums",
        "bass": "Sub Bass / Requinto Bed",
        "harmony": "Analog Harmony",
        "melody": "Lead Melody",
    }
    for key, signal in stems.items():
        path = target / f"{key}.wav"
        _write_wav(path, signal, sample_rate)
        rendered.append(RenderedFile(kind="stem", name=display_names[key], path=str(path)))

    master_path = target / "master.wav"
    _write_wav(master_path, master, sample_rate)

    return {
        "provider": "empire_local",
        "master": RenderedFile(kind="master", name="Master", path=str(master_path)),
        "stems": rendered,
        "sample_rate": sample_rate,
        "duration_seconds": duration_seconds,
        "genre": genre,
        "mood": mood,
    }
