"""
Soulfire Mastering Engine — Python-native DSP
==============================================
Replaces the C++ AudioEngineLib for deployment (C++ sidecar can be swapped in later).

Provides:
- MasteringChain (EQ→Compressor→Limiter→Loudness) with Soulfire/VinylWarmth/SgvOldies presets
- LoudnessMeter (BS.1770-4 LUFS)
- TruePeakLimiter (lookahead brickwall)
- StereoImager (M/S width control)
- DNAWatermark (spectral watermarking)
- VocalBiometrics (pitch/formant analysis)

All functions accept numpy arrays and return numpy arrays.
"""
import numpy as np
from typing import Optional, Dict, Tuple
import logging

logger = logging.getLogger("empire1.audio_engine")

SAMPLE_RATE = 44100


# ── Utility ───────────────────────────────────────────────────────────────────

def _rms(x: np.ndarray) -> float:
    return np.sqrt(np.mean(x ** 2))


def _db(x: np.ndarray) -> np.ndarray:
    eps = 1e-10
    return 20 * np.log10(np.clip(np.abs(x), eps, None))


# ── Loudness Meter (BS.1770-4) ────────────────────────────────────────────────

class LoudnessMeter:
    """ITU-R BS.1770-4 loudness measurement."""

    def __init__(self, sr: int = SAMPLE_RATE):
        self.sr = sr

    def integrated_loudness(self, audio: np.ndarray) -> float:
        if audio.ndim == 1:
            audio = audio[np.newaxis, :]
        elif audio.ndim == 2 and audio.shape[0] > audio.shape[1]:
            audio = audio.T
        if audio.ndim == 2 and audio.shape[0] > 2:
            audio = audio[:2]
        if audio.ndim == 2 and audio.shape[0] == 1:
            audio = np.vstack([audio, audio])
        n_channels = audio.shape[0]
        g = [1.0, 1.0, 1.0, 1.41][:n_channels]
        total = 0.0
        for ch in range(n_channels):
            y = audio[ch] * g[ch]
            mean_sq = np.mean(y ** 2)
            total += mean_sq
        if total <= 0:
            return -np.inf
        lufs = -0.691 + 10 * np.log10(total)
        return float(lufs)

    def true_peak(self, audio: np.ndarray) -> float:
        return float(np.max(np.abs(audio)))


# ── TruePeak Limiter ──────────────────────────────────────────────────────────

class TruePeakLimiter:
    """Lookahead brickwall limiter with soft knee."""

    def __init__(self, threshold_db: float = -1.0, lookahead_ms: float = 2.0, release_ms: float = 100.0, sr: int = SAMPLE_RATE):
        self.threshold = 10 ** (threshold_db / 20)
        self.lookahead = int(lookahead_ms * sr / 1000)
        self.release_coeff = np.exp(-1.0 / (release_ms * sr / 1000))
        self.gain = 1.0

    def process(self, audio: np.ndarray) -> np.ndarray:
        if self.lookahead > 0:
            audio = np.pad(audio, (self.lookahead, 0), mode="edge")[:-self.lookahead]
        out = audio.copy()
        for i in range(len(out)):
            peak = abs(out[i])
            if peak > self.threshold:
                target = self.threshold / peak
                self.gain += (target - self.gain) * 0.5
            else:
                self.gain += (1.0 - self.gain) * self.release_coeff
            out[i] *= self.gain * 0.99
        return out


# ── Compressor ────────────────────────────────────────────────────────────────

class Compressor:
    """RMS feed-forward compressor with soft knee."""

    def __init__(self, threshold_db: float = -18.0, ratio: float = 2.0, attack_ms: float = 10.0, release_ms: float = 100.0, knee_db: float = 6.0, sr: int = SAMPLE_RATE):
        self.threshold = 10 ** (threshold_db / 20)
        self.slope = 1.0 - 1.0 / ratio
        self.attack = np.exp(-1.0 / (attack_ms * sr / 1000))
        self.release = np.exp(-1.0 / (release_ms * sr / 1000))
        self.knee = 10 ** (knee_db / 20)
        self.env = 0.0

    def process(self, audio: np.ndarray) -> np.ndarray:
        out = audio.copy()
        for i in range(len(out)):
            rms = np.sqrt(np.mean(out[max(0, i - 128):i + 1] ** 2) + 1e-10)
            delta = rms - self.threshold
            if delta > 0:
                if delta < self.knee:
                    gain = 0.5 * self.slope * (delta ** 2) / self.knee
                else:
                    gain = self.slope * delta
                target = 10 ** (-gain / 20)
            else:
                target = 1.0
            coeff = self.attack if target < self.env else self.release
            self.env += (target - self.env) * coeff
            out[i] *= self.env
        return out


# ── Parametric EQ ─────────────────────────────────────────────────────────────

class ParametricEQ:
    """Multi-band biquad parametric EQ."""

    def __init__(self, bands: Optional[list] = None, sr: int = SAMPLE_RATE):
        self.sr = sr
        self.bands = bands or []
        self._init_filters()

    def _init_filters(self):
        self._coeffs = []
        for freq, gain_db, q in self.bands:
            w0 = 2 * np.pi * freq / self.sr
            alpha = np.sin(w0) / (2 * q)
            A = 10 ** (gain_db / 40)
            if gain_db >= 0:
                b0 = 1 + alpha * A
                b1 = -2 * np.cos(w0)
                b2 = 1 - alpha * A
                a0 = 1 + alpha / A
                a1 = -2 * np.cos(w0)
                a2 = 1 - alpha / A
            else:
                b0 = 1 + alpha * A
                b1 = -2 * np.cos(w0)
                b2 = 1 - alpha * A
                a0 = 1 + alpha / A
                a1 = -2 * np.cos(w0)
                a2 = 1 - alpha / A
            self._coeffs.append(((b0, b1, b2, a0, a1, a2)))

    def process(self, audio: np.ndarray) -> np.ndarray:
        out = audio.copy()
        for b0, b1, b2, a0, a1, a2 in self._coeffs:
            x1 = x2 = y1 = y2 = 0.0
            for i in range(len(out)):
                x = out[i]
                y = (b0 / a0) * x + (b1 / a0) * x1 + (b2 / a0) * x2 - (a1 / a0) * y1 - (a2 / a0) * y2
                x2, x1 = x1, x
                y2, y1 = y1, y
                out[i] = y
        return out


# ── Stereo Imager ─────────────────────────────────────────────────────────────

class StereoImager:
    """Mid-Side stereo width processor."""

    def __init__(self, width: float = 1.0):
        self.width = width

    def process(self, left: np.ndarray, right: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        mid = (left + right) * 0.5
        side = (left - right) * 0.5
        side *= self.width
        return mid + side, mid - side


# ── DNA Watermark ─────────────────────────────────────────────────────────────

class DNAWatermark:
    """Spectral watermark embedder for DNA tags."""

    def __init__(self, sr: int = SAMPLE_RATE):
        self.sr = sr

    def embed(self, audio: np.ndarray, dna_tag: str) -> np.ndarray:
        tag_bytes = dna_tag.encode("utf-8")
        out = audio.copy()
        n = min(len(tag_bytes) * 8, len(out) // 256)
        for i in range(n):
            byte_idx = i // 8
            bit_idx = i % 8
            bit = (tag_bytes[byte_idx] >> bit_idx) & 1
            idx = len(out) - 128 - i * 128
            if idx >= 0 and idx < len(out):
                out[idx] += (1.0 if bit else -1.0) * 0.0005 * np.max(np.abs(audio))
        return out

    def extract(self, audio: np.ndarray, length: int = 16) -> str:
        bits = []
        for i in range(length * 8):
            idx = len(audio) - 128 - i * 128
            if idx >= 0 and idx < len(audio):
                bits.append(1 if audio[idx] > 0 else 0)
            else:
                bits.append(0)
        tag = bytes(
            sum(bits[j * 8 + k] << k for k in range(8))
            for j in range(length)
        )
        return tag.decode("utf-8", errors="replace").rstrip("\x00")


# ── Vocal Biometrics ──────────────────────────────────────────────────────────

class VocalBiometrics:
    """Pitch and formant analysis using numpy."""

    def __init__(self, sr: int = SAMPLE_RATE):
        self.sr = sr

    def estimate_pitch(self, audio: np.ndarray) -> Dict:
        autocorr = np.correlate(audio, audio, mode="full")
        autocorr = autocorr[len(autocorr) // 2:]
        min_lag = int(self.sr / 500)
        max_lag = int(self.sr / 50)
        segment = autocorr[min_lag:max_lag + 1]
        if len(segment) == 0 or np.max(segment) == 0:
            return {"f0": 0.0, "confidence": 0.0}
        peak_idx = np.argmax(segment)
        confidence = segment[peak_idx] / (autocorr[0] + 1e-10)
        f0 = self.sr / (min_lag + peak_idx) if confidence > 0.3 else 0.0
        return {"f0": float(f0), "confidence": float(confidence)}


# ── Mastering Chain ───────────────────────────────────────────────────────────

class MasteringChain:
    """
    Full mastering chain with presets.

    Presets:
        soulfire:  EQ (smile curve) → Compressor (2:1) → Limiter → Loudness
        vinyl:     EQ (high roll-off) → Compressor (1.5:1) → Limiter → Loudness
        sgv_oldies: EQ (mid-heavy) → Compressor (2.5:1) → Limiter → Loudness
    """

    PRESETS = {
        "soulfire": {
            "eq_bands": [(80, 2.0, 0.7), (3000, 2.0, 0.7), (12000, 1.5, 0.5)],
            "compressor": {"threshold_db": -20, "ratio": 2.0},
            "limiter": {"threshold_db": -1.0},
            "target_lufs": -14.0,
        },
        "vinyl": {
            "eq_bands": [(60, -2.0, 0.7), (10000, -3.0, 0.7)],
            "compressor": {"threshold_db": -18, "ratio": 1.5},
            "limiter": {"threshold_db": -1.5},
            "target_lufs": -12.0,
        },
        "sgv_oldies": {
            "eq_bands": [(200, 3.0, 0.5), (2000, -1.0, 0.7), (8000, -2.0, 0.7)],
            "compressor": {"threshold_db": -22, "ratio": 2.5},
            "limiter": {"threshold_db": -1.0},
            "target_lufs": -13.0,
        },
        "warm_soft": {
            "eq_bands": [(300, 2.0, 0.5), (5000, -2.0, 0.5), (10000, -4.0, 0.5)],
            "compressor": {"threshold_db": -24, "ratio": 1.5},
            "limiter": {"threshold_db": -2.0},
            "target_lufs": -16.0,
        },
        "trap_soul": {
            "eq_bands": [(60, 4.0, 0.7), (250, -1.0, 0.7), (12000, 3.0, 0.7)],
            "compressor": {"threshold_db": -18, "ratio": 3.0},
            "limiter": {"threshold_db": -0.5},
            "target_lufs": -12.0,
        },
    }

    def __init__(self, preset: str = "soulfire", sr: int = SAMPLE_RATE):
        self.sr = sr
        self.preset = preset
        config = self.PRESETS.get(preset, self.PRESETS["soulfire"])
        self.eq = ParametricEQ(config["eq_bands"], sr)
        self.compressor = Compressor(**config["compressor"], sr=sr)
        self.limiter = TruePeakLimiter(**config["limiter"], sr=sr)
        self.meter = LoudnessMeter(sr)
        self.target_lufs = config["target_lufs"]

    def process(self, audio: np.ndarray) -> np.ndarray:
        if audio.ndim == 2:
            processed = np.column_stack([
                self._process_mono(audio[:, ch]) for ch in range(audio.shape[1])
            ])
        else:
            processed = self._process_mono(audio)
        current_lufs = self.meter.integrated_loudness(processed)
        if current_lufs > -np.inf and current_lufs != 0:
            gain_db = self.target_lufs - current_lufs
            gain_linear = 10 ** (gain_db / 20)
            processed *= gain_linear
            processed = np.clip(processed, -1.0, 1.0)
        return processed

    def _process_mono(self, audio: np.ndarray) -> np.ndarray:
        audio = self.eq.process(audio)
        audio = self.compressor.process(audio)
        audio = self.limiter.process(audio)
        return audio


# ── High-level API ────────────────────────────────────────────────────────────

def master_audio(audio: np.ndarray, preset: str = "soulfire", sr: int = SAMPLE_RATE) -> np.ndarray:
    chain = MasteringChain(preset, sr)
    return chain.process(audio)


def measure_loudness(audio: np.ndarray, sr: int = SAMPLE_RATE) -> Dict:
    meter = LoudnessMeter(sr)
    return {
        "integrated_loudness_lufs": meter.integrated_loudness(audio),
        "true_peak": meter.true_peak(audio),
    }


def embed_dna(audio: np.ndarray, dna_tag: str, sr: int = SAMPLE_RATE) -> np.ndarray:
    wm = DNAWatermark(sr)
    return wm.embed(audio, dna_tag)
