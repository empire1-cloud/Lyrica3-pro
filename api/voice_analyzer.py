import librosa
import numpy as np
from scipy.signal import find_peaks

def _norm(x, lo, hi):
    x = float(np.clip(x, lo, hi))
    return (x - lo) / (hi - lo + 1e-8)

def analyze_voice(file_path: str) -> dict:
    y, sr = librosa.load(file_path, sr=22050, duration=10)

    f0, voiced_flag, _ = librosa.pyin(
        y,
        fmin=librosa.note_to_hz('C2'),
        fmax=librosa.note_to_hz('C6')
    )
    f0_clean = f0[voiced_flag]
    if len(f0_clean) == 0:
        raise ValueError("No voiced segments found.")

    pitch_mean = float(np.mean(f0_clean))
    pitch_std = float(np.std(f0_clean))
    pitch_range = 4 * pitch_std

    S = np.abs(librosa.stft(y))
    freqs = librosa.fft_frequencies(sr=sr)
    centroid = float(np.mean(librosa.feature.spectral_centroid(S=S, sr=sr)))
    bandwidth = float(np.mean(librosa.feature.spectral_bandwidth(S=S, sr=sr)))
    rolloff = float(np.mean(librosa.feature.spectral_rolloff(S=S, sr=sr)))

    split = 4000
    low = np.mean(S[freqs < split])
    high = np.mean(S[freqs >= split])
    breathiness = high / (low + high + 1e-8)

    f0_interp = np.interp(
        np.arange(len(f0)),
        np.where(voiced_flag)[0],
        f0_clean
    )
    f0_interp = np.nan_to_num(f0_interp, nan=pitch_mean)
    detrended = f0_interp - librosa.decompose.nn_filter(
        f0_interp[None, :],
        aggregate=np.median
    )[0]
    peaks, _ = find_peaks(detrended, distance=sr * 0.08)
    if len(peaks) > 1:
        vibrato_rate = sr / np.mean(np.diff(peaks))
        vibrato_depth = float(np.std(detrended))
    else:
        vibrato_rate = 0.0
        vibrato_depth = 0.0

    jitter = float(np.std(np.diff(f0_clean)) / (np.mean(f0_clean) + 1e-8))

    return {
        "vulnerability": _norm(pitch_range, 40, 260),
        "raspiness": _norm(jitter, 0.001, 0.04),
        "warmth": 1 - _norm(centroid, 1500, 5500),
        "breathiness": _norm(breathiness, 0.05, 0.45),
        "clarity": 1 - _norm(bandwidth, 800, 4200),
        "resonance": _norm(rolloff, 2000, 9000),
        "pitch_mean_hz": pitch_mean,
        "pitch_range_hz": pitch_range,
        "vibrato_rate_hz": vibrato_rate,
        "vibrato_depth_hz": vibrato_depth
    }
