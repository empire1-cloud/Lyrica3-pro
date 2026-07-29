from __future__ import annotations

import hashlib
import json
import math
import wave
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable, Sequence

import numpy as np
from scipy.signal import butter, iirpeak, lfilter


ROOT_DIR = Path(__file__).resolve().parents[1]
VOICE_PROFILE_PATH = ROOT_DIR / "canon" / "luzaria" / "voice_model_v0.json"
GENRE_MATRIX_PATH = ROOT_DIR / "canon" / "luzaria" / "genre_matrix_v1.json"


@dataclass(frozen=True)
class VoiceEvent:
    midi_note: float
    duration_seconds: float
    vowel: str = "a"
    intensity: float = 0.72
    artifact: str = ""
    rest_after_seconds: float = 0.035


def load_voice_profile() -> dict[str, Any]:
    return json.loads(VOICE_PROFILE_PATH.read_text(encoding="utf-8"))


def load_genre_matrix() -> dict[str, Any]:
    return json.loads(GENRE_MATRIX_PATH.read_text(encoding="utf-8"))


def voice_profile_digest(profile: dict[str, Any] | None = None) -> str:
    payload = profile or load_voice_profile()
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return f"lzr_voice_sha256_{hashlib.sha256(canonical).hexdigest()}"


def midi_to_hz(note: float) -> float:
    return 440.0 * (2.0 ** ((float(note) - 69.0) / 12.0))


def _cents_ratio(cents: np.ndarray | float) -> np.ndarray | float:
    return 2.0 ** (np.asarray(cents) / 1200.0)


def _smooth_envelope(length: int, sample_rate: int, attack_ms: float, release_ms: float) -> np.ndarray:
    if length <= 0:
        return np.zeros(0, dtype=np.float64)
    attack = min(length, max(1, int(sample_rate * attack_ms / 1000.0)))
    release = min(length, max(1, int(sample_rate * release_ms / 1000.0)))
    env = np.ones(length, dtype=np.float64)
    env[:attack] = np.sin(np.linspace(0.0, math.pi / 2.0, attack, endpoint=True)) ** 2
    env[-release:] *= np.cos(np.linspace(0.0, math.pi / 2.0, release, endpoint=True)) ** 2
    return env


def _normalize(signal: np.ndarray, peak: float = 0.92) -> np.ndarray:
    if signal.size == 0:
        return signal.astype(np.float64)
    maximum = float(np.max(np.abs(signal)))
    if maximum <= 1e-12:
        return signal.astype(np.float64)
    return np.asarray(signal, dtype=np.float64) * (peak / maximum)


def _soft_saturate(signal: np.ndarray, drive: float) -> np.ndarray:
    drive = max(0.1, float(drive))
    return np.tanh(signal * drive) / np.tanh(drive)


def _bandpass(signal: np.ndarray, sample_rate: int, center_hz: float, bandwidth_hz: float) -> np.ndarray:
    nyquist = sample_rate / 2.0
    center = min(max(20.0, center_hz), nyquist * 0.94)
    q = max(0.5, center / max(1.0, bandwidth_hz))
    b, a = iirpeak(center / nyquist, q)
    return lfilter(b, a, signal)


def _highpass(signal: np.ndarray, sample_rate: int, cutoff_hz: float) -> np.ndarray:
    nyquist = sample_rate / 2.0
    cutoff = min(max(20.0, cutoff_hz), nyquist * 0.9)
    b, a = butter(2, cutoff / nyquist, btype="highpass")
    return lfilter(b, a, signal)


def _genre_voice_modifiers(matrix: dict[str, Any], weights: dict[str, float] | None = None) -> dict[str, float]:
    selected = weights or matrix.get("default_weights", {})
    total = sum(max(0.0, float(value)) for value in selected.values()) or 1.0
    normalized = {key: max(0.0, float(value)) / total for key, value in selected.items()}

    # These coefficients only alter performance texture. They never replace the
    # locked formant identity or register.
    return {
        "warmth": 0.88 * normalized.get("Chicano_Soul", 0.0)
        + 0.42 * normalized.get("Phonk", 0.0)
        + 0.62 * normalized.get("Krautrock", 0.0),
        "grit": 0.16 * normalized.get("Chicano_Soul", 0.0)
        + 0.72 * normalized.get("Phonk", 0.0)
        + 0.28 * normalized.get("Krautrock", 0.0),
        "steadiness": 0.44 * normalized.get("Chicano_Soul", 0.0)
        + 0.34 * normalized.get("Phonk", 0.0)
        + 0.90 * normalized.get("Krautrock", 0.0),
    }


def synthesize_event(
    event: VoiceEvent,
    *,
    profile: dict[str, Any] | None = None,
    matrix: dict[str, Any] | None = None,
    genre_weights: dict[str, float] | None = None,
    rng: np.random.Generator | None = None,
) -> np.ndarray:
    profile = profile or load_voice_profile()
    matrix = matrix or load_genre_matrix()
    sample_rate = int(profile["rendering"]["sample_rate_hz"])
    rng = rng or np.random.default_rng(int(profile["rendering"]["deterministic_seed"]))
    length = max(1, int(sample_rate * max(0.03, float(event.duration_seconds))))
    t = np.arange(length, dtype=np.float64) / sample_rate

    fundamental = midi_to_hz(event.midi_note)
    base = profile["fundamental"]
    source = profile["source_model"]
    performance = profile["performance"]
    modifiers = _genre_voice_modifiers(matrix, genre_weights)

    vibrato_rate = float(base["vibrato_rate_hz"])
    vibrato_depth = float(base["vibrato_depth_cents"])
    steadiness = modifiers["steadiness"]
    vibrato_depth *= 1.08 - 0.22 * steadiness
    vibrato_cents = vibrato_depth * np.sin(2.0 * math.pi * vibrato_rate * t)

    jitter_scale = float(base["micro_jitter_cents"]) * (1.15 - 0.35 * steadiness)
    jitter = rng.normal(0.0, jitter_scale, size=length)
    jitter = np.convolve(jitter, np.ones(31) / 31.0, mode="same")
    frequency = fundamental * _cents_ratio(vibrato_cents + jitter)

    if event.artifact == "<emotional_crack>":
        crack_center = int(length * 0.64)
        crack_width = max(1, int(sample_rate * 0.055))
        start = max(0, crack_center - crack_width // 2)
        end = min(length, start + crack_width)
        frequency[start:end] *= np.linspace(1.0, 0.965, end - start)

    phase = 2.0 * math.pi * np.cumsum(frequency) / sample_rate
    harmonic_count = int(source["harmonic_count"])
    rolloff = float(source["harmonic_rolloff"])
    odd_bias = float(source["odd_harmonic_bias"])
    excitation = np.zeros(length, dtype=np.float64)
    for harmonic in range(1, harmonic_count + 1):
        amplitude = 1.0 / (harmonic**rolloff)
        if harmonic % 2:
            amplitude *= odd_bias
        excitation += amplitude * np.sin(harmonic * phase + harmonic * 0.017)

    fry_mix = float(source["vocal_fry_mix"])
    if event.artifact == "<vocal_fry>":
        fry_mix *= 2.3
    fry_frequency = np.maximum(35.0, frequency * 0.49)
    fry_phase = 2.0 * math.pi * np.cumsum(fry_frequency) / sample_rate
    excitation += fry_mix * np.sign(np.sin(fry_phase))

    sub_mix = float(source["subharmonic_mix"])
    if event.artifact == "<chest_resonance>":
        sub_mix *= 2.0
    excitation += sub_mix * np.sin(phase * 0.5)
    excitation = _normalize(excitation, 0.75)

    vowel = event.vowel.lower() if event.vowel.lower() in profile["formants_hz"] else "a"
    formants = profile["formants_hz"][vowel]
    bandwidths = profile["formant_bandwidth_hz"]
    weights = (1.0, 0.72, 0.42, 0.24)
    voiced = np.zeros(length, dtype=np.float64)
    for formant, bandwidth, weight in zip(formants, bandwidths, weights):
        voiced += weight * _bandpass(excitation, sample_rate, float(formant), float(bandwidth))

    chest_center = 185.0 if fundamental < 260.0 else 220.0
    chest = _bandpass(excitation, sample_rate, chest_center, 120.0)
    chest_mix = float(source["chest_resonance_mix"]) * (0.8 + 0.45 * modifiers["warmth"])
    if event.artifact == "<chest_resonance>":
        chest_mix *= 1.55
    voiced += chest_mix * chest

    breath_mix = float(source["breath_noise_mix"])
    if event.artifact == "<adaptive_inhale>":
        breath_mix *= 1.55
    breath = _highpass(rng.normal(0.0, 1.0, size=length), sample_rate, 1900.0)
    breath *= _smooth_envelope(length, sample_rate, 8.0, 45.0)
    voiced += breath_mix * breath

    envelope = _smooth_envelope(
        length,
        sample_rate,
        float(performance["attack_ms"]),
        float(performance["release_ms"]),
    )
    if event.artifact == "<emotional_crack>":
        center = int(length * 0.64)
        width = max(1, int(sample_rate * 0.045))
        start = max(0, center - width // 2)
        end = min(length, start + width)
        envelope[start:end] *= np.linspace(1.0, 0.48, end - start)

    voiced *= envelope * float(np.clip(event.intensity, 0.05, 1.0))
    voiced = _soft_saturate(voiced, float(source["soft_saturation_drive"]) + 0.35 * modifiers["grit"])
    return _normalize(voiced, 0.9)


def render_score(
    events: Sequence[VoiceEvent],
    *,
    profile: dict[str, Any] | None = None,
    matrix: dict[str, Any] | None = None,
    genre_weights: dict[str, float] | None = None,
) -> tuple[np.ndarray, dict[str, Any]]:
    profile = profile or load_voice_profile()
    matrix = matrix or load_genre_matrix()
    sample_rate = int(profile["rendering"]["sample_rate_hz"])
    rng = np.random.default_rng(int(profile["rendering"]["deterministic_seed"]))
    chunks: list[np.ndarray] = []
    for event in events:
        chunks.append(
            synthesize_event(
                event,
                profile=profile,
                matrix=matrix,
                genre_weights=genre_weights,
                rng=rng,
            )
        )
        rest_length = max(0, int(sample_rate * max(0.0, event.rest_after_seconds)))
        if rest_length:
            chunks.append(np.zeros(rest_length, dtype=np.float64))
    audio = _normalize(np.concatenate(chunks) if chunks else np.zeros(1), 0.92)
    pcm_sha = hashlib.sha256(np.asarray(audio, dtype="<f8").tobytes()).hexdigest()
    metadata = {
        "voice_model_id": profile["voice_model_id"],
        "artist_id": profile["artist_id"],
        "sample_rate_hz": sample_rate,
        "bit_depth": int(profile["rendering"]["bit_depth"]),
        "voice_profile_digest": voice_profile_digest(profile),
        "genre_weights": genre_weights or matrix.get("default_weights", {}),
        "event_count": len(events),
        "duration_seconds": len(audio) / sample_rate,
        "render_float_sha256": f"sha256_{pcm_sha}",
    }
    return audio, metadata


def write_pcm24_wav(path: str | Path, audio: np.ndarray, sample_rate: int = 48000) -> Path:
    destination = Path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    samples = np.clip(np.asarray(audio, dtype=np.float64), -1.0, 1.0)
    integers = np.round(samples * ((1 << 23) - 1)).astype(np.int32)
    packed = bytearray()
    for value in integers:
        unsigned = int(value) & 0xFFFFFF
        packed.extend((unsigned & 0xFF, (unsigned >> 8) & 0xFF, (unsigned >> 16) & 0xFF))
    with wave.open(str(destination), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(3)
        handle.setframerate(int(sample_rate))
        handle.writeframes(bytes(packed))
    return destination


def vowel_sequence_from_text(text: str) -> list[str]:
    vowels = [character.lower() for character in text if character.lower() in "aeiou"]
    return vowels or ["a"]


def events_from_phrase(
    text: str,
    midi_notes: Iterable[float],
    *,
    duration_seconds: float = 0.24,
    artifacts: Sequence[str] | None = None,
) -> list[VoiceEvent]:
    notes = list(midi_notes)
    if not notes:
        raise ValueError("At least one MIDI note is required.")
    vowels = vowel_sequence_from_text(text)
    artifact_values = list(artifacts or ())
    events: list[VoiceEvent] = []
    for index, vowel in enumerate(vowels):
        events.append(
            VoiceEvent(
                midi_note=notes[index % len(notes)],
                duration_seconds=duration_seconds,
                vowel=vowel,
                intensity=0.68 + 0.12 * math.sin(index * 0.7),
                artifact=artifact_values[index % len(artifact_values)] if artifact_values else "",
                rest_after_seconds=0.025,
            )
        )
    return events
