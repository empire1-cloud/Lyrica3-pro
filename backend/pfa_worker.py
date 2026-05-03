"""
PFA: Phonation & Fry DSP — hardened.

- Stereo/multi-channel safe (frames x channels).
- NaN/Inf sanitization; headroom normalization.
- Optional lightweight 2x oversample → process → decimate.
- Mild first-order high-pass after nonlinearity (per channel).
- Polynomial + Chebyshev T3 term on clamped axis (odd harmonics).
"""

from __future__ import annotations

import math
import os
from pathlib import Path

import numpy as np

try:
    import soundfile as sf
except ImportError as e:  # pragma: no cover
    raise ImportError("pfa_worker requires soundfile: pip install soundfile") from e


def _chebyshev_t3(x: np.ndarray) -> np.ndarray:
    """T3 on [-1, 1]: 4x^3 - 3x."""
    return 4.0 * np.power(x, 3) - 3.0 * x


def _first_order_highpass(x: np.ndarray, sr: int, fc_hz: float = 80.0) -> np.ndarray:
    """Single-pole high-pass (per channel), x shape (n,) or (n, c)."""
    if fc_hz <= 0 or sr <= 0:
        return x
    x = np.asarray(x, dtype=np.float64)
    squeeze_1d = x.ndim == 1
    if squeeze_1d:
        x = x[:, np.newaxis]
    n, c = x.shape
    R = math.exp(-2.0 * math.pi * fc_hz / float(sr))
    y = np.zeros_like(x)
    xm1 = np.zeros((1, c), dtype=np.float64)
    ym1 = np.zeros((1, c), dtype=np.float64)
    for i in range(n):
        xi = x[i : i + 1, :]
        yi = (xi - xm1) + R * ym1
        y[i : i + 1, :] = yi
        xm1, ym1 = xi, yi
    y = y.squeeze(axis=1) if squeeze_1d and c == 1 else y
    return y


def _linear_upsample_2x(x: np.ndarray) -> np.ndarray:
    """(n, c) or (n,) -> (2n-1, c) or (2n-1,) linear interpolation."""
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        t_old = np.arange(x.shape[0], dtype=np.float64)
        if x.shape[0] < 2:
            return np.repeat(x, 2)[: max(1, 2 * x.shape[0] - 1)]
        t_new = np.linspace(0.0, x.shape[0] - 1.0, 2 * x.shape[0] - 1)
        return np.interp(t_new, t_old, x)

    n, c = x.shape
    if n < 2:
        return np.repeat(x, 2, axis=0)[: max(1, 2 * n - 1), :]
    t_old = np.arange(n, dtype=np.float64)
    t_new = np.linspace(0.0, n - 1.0, 2 * n - 1)
    out = np.empty((len(t_new), c), dtype=np.float64)
    for ch in range(c):
        out[:, ch] = np.interp(t_new, t_old, x[:, ch])
    return out


def _linear_downsample_2x(x: np.ndarray) -> np.ndarray:
    """Decimate by 2 after mild box pre-filter (time axis)."""
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = x[:, np.newaxis]
        single = True
    else:
        single = False
    if x.shape[0] < 3:
        out = x[::2, :]
        return out[:, 0] if single and out.shape[1] == 1 else (out[:, 0] if single else out)

    kernel = np.ones(3, dtype=np.float64) / 3.0
    n, c = x.shape
    pad = np.vstack([x[0:1, :], x, x[-1:, :]])
    smoothed = np.zeros_like(x)
    for ch in range(c):
        conv = np.convolve(pad[:, ch], kernel, mode="valid")
        smoothed[:, ch] = conv[:n]
    out = smoothed[::2, :]
    if single:
        return out[:, 0]
    return out


class PhonationFryAgent:
    """Applies controlled nonlinear shaping + HP for 'vocal fry' character."""

    def __init__(
        self,
        vulnerability_level: float,
        *,
        fry_mix: float = 0.65,
        hp_fc_hz: float = 80.0,
        oversample: bool = True,
    ) -> None:
        v = float(vulnerability_level)
        if not (0.0 <= v <= 1.0):
            raise ValueError("vulnerability_level must be in [0, 1]")
        self.vulnerability = v
        self.fry_mix = float(np.clip(fry_mix, 0.0, 1.0))
        self.hp_fc_hz = float(hp_fc_hz)
        self.oversample = bool(oversample)

    def _fry_stage(self, x: np.ndarray, sr: int) -> np.ndarray:
        """x: (n, c) float64 in roughly [-1, 1]."""
        x = np.clip(x, -1.0, 1.0)
        drive = 1.0 + (self.vulnerability * 4.0)
        driven = np.clip(x * drive, -1.0, 1.0)
        poly = driven - (np.power(driven, 3) / 3.0)
        t3_in = np.clip(driven * 0.85, -1.0, 1.0)
        t3 = _chebyshev_t3(t3_in) * 0.12 * self.vulnerability
        mixed = (1.0 - self.fry_mix) * x + self.fry_mix * (poly + t3)
        mixed = np.nan_to_num(mixed, nan=0.0, posinf=0.0, neginf=0.0)
        mixed = np.clip(mixed, -1.0, 1.0)
        mixed = _first_order_highpass(mixed, sr, self.hp_fc_hz)
        mixed = np.clip(mixed, -1.0, 1.0)
        peak = float(np.max(np.abs(mixed))) if mixed.size else 0.0
        if peak > 0:
            mixed = mixed / peak * 0.9
        return mixed

    def apply_vocal_fry(self, input_path: str, output_path: str) -> str:
        input_path = str(Path(input_path).resolve())
        output_path = str(Path(output_path).resolve())
        if not os.path.isfile(input_path):
            raise FileNotFoundError(f"Input not found: {input_path}")
        out_dir = os.path.dirname(output_path)
        if out_dir:
            os.makedirs(out_dir, exist_ok=True)

        data, samplerate = sf.read(input_path, always_2d=False, dtype="float64")
        data = np.asarray(data, dtype=np.float64)
        if data.size == 0:
            raise ValueError("Empty audio")
        if data.ndim == 1:
            work = data[:, np.newaxis]
            orig_1d = True
        else:
            work = data
            orig_1d = False

        work = np.nan_to_num(work, nan=0.0, posinf=0.0, neginf=0.0)
        sr = int(samplerate)
        if sr <= 0:
            raise ValueError("Invalid sample rate")

        if self.oversample and sr >= 8000:
            if work.shape[1] == 1:
                up = _linear_upsample_2x(work[:, 0])[:, np.newaxis]
            else:
                up = np.column_stack(
                    [_linear_upsample_2x(work[:, ch]) for ch in range(work.shape[1])]
                )
            up_sr = sr * 2
            up = _first_order_highpass(up, up_sr, min(self.hp_fc_hz, 120.0))
            if up.ndim == 1:
                up = up[:, np.newaxis]
            fried_up = self._fry_stage(up, up_sr)
            work_out = _linear_downsample_2x(fried_up)
            if work_out.ndim == 1:
                work_out = work_out[:, np.newaxis]
            if work_out.shape[0] < work.shape[0]:
                pad = np.zeros((work.shape[0] - work_out.shape[0], work.shape[1]), dtype=np.float64)
                work_out = np.vstack([work_out, pad])
            elif work_out.shape[0] > work.shape[0]:
                work_out = work_out[: work.shape[0], :]
        else:
            work_out = self._fry_stage(work, sr)

        work_out = np.nan_to_num(work_out, nan=0.0, posinf=0.0, neginf=0.0)
        work_out = np.clip(work_out, -1.0, 1.0)

        if orig_1d:
            out = work_out[:, 0]
        else:
            out = work_out

        sf.write(output_path, out, sr, subtype="PCM_24")
        return output_path
