"""
MMA: Micro-Rhythm MIDI Sub-Agent — Late-pocket swing (hardened).

- Deterministic optional seed (same inputs → same timing offsets).
- BPM bounds; configurable late-pocket and hi-hat micro-swing.
- Emits both wall-clock ms and MIDI ticks (PPQ) for downstream engines.
"""

from __future__ import annotations

import json
import random
from dataclasses import dataclass
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class LatePocketProfile:
    """Snare drag range in milliseconds (inclusive)."""

    snare_drag_ms_min: float = 12.0
    snare_drag_ms_max: float = 18.0
    hihat_offbeat_swing_ms_max: float = 5.0


class MicroRhythmAgent:
    """Generates humanized 16-step timing arrays with late-pocket snare."""

    PPQ_DEFAULT = 480

    def __init__(
        self,
        bpm: int,
        *,
        ppq: int = PPQ_DEFAULT,
        profile: Optional[LatePocketProfile] = None,
        seed: Optional[int] = None,
    ) -> None:
        if not (40 <= int(bpm) <= 240):
            raise ValueError("bpm must be between 40 and 240")
        if not (24 <= int(ppq) <= 9600):
            raise ValueError("ppq must be between 24 and 9600")
        self.bpm = int(bpm)
        self.ppq = int(ppq)
        self.profile = profile or LatePocketProfile()
        self._rng = random.Random(seed) if seed is not None else random.Random()

        self.ms_per_beat = 60000.0 / self.bpm
        self.ms_per_16th = self.ms_per_beat / 4.0
        self.ms_per_tick = self.ms_per_beat / self.ppq

    def _ms_to_ticks(self, time_ms: float) -> int:
        ticks = time_ms / self.ms_per_tick
        return int(round(ticks))

    def generate_late_pocket_groove(self) -> Dict[str, Any]:
        """One bar, 16 sixteenth steps; returns MIDI-like events with ms + ticks."""
        kick_pattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
        snare_pattern = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
        hihat_pattern = [1] * 16

        midi_data: Dict[str, List[Dict[str, Any]]] = {"kick": [], "snare": [], "hihat": []}

        for step in range(16):
            base_time_ms = step * self.ms_per_16th
            base_tick = self._ms_to_ticks(base_time_ms)

            if kick_pattern[step] == 1:
                t = base_time_ms
                midi_data["kick"].append(
                    {
                        "step": step,
                        "time_ms": round(t, 4),
                        "time_tick": base_tick,
                        "velocity": 110,
                    }
                )

            if snare_pattern[step] == 1:
                p = self.profile
                late_drag = self._rng.uniform(p.snare_drag_ms_min, p.snare_drag_ms_max)
                t = base_time_ms + late_drag
                tick = self._ms_to_ticks(t)
                midi_data["snare"].append(
                    {
                        "step": step,
                        "time_ms": round(t, 4),
                        "time_tick": tick,
                        "velocity": self._rng.randint(95, 105),
                        "soulfire_artifact": f"+{late_drag:.2f}ms_drag",
                    }
                )

            if hihat_pattern[step] == 1:
                swing = (
                    self._rng.uniform(0.0, self.profile.hihat_offbeat_swing_ms_max)
                    if step % 2 != 0
                    else 0.0
                )
                t = base_time_ms + swing
                tick = self._ms_to_ticks(t)
                midi_data["hihat"].append(
                    {
                        "step": step,
                        "time_ms": round(t, 4),
                        "time_tick": tick,
                        "velocity": self._rng.randint(65, 95),
                        "swing_offset_ms": round(swing, 4),
                    }
                )

        bar_length_ms = 16 * self.ms_per_16th
        return {
            "bpm": self.bpm,
            "ppq": self.ppq,
            "bar_length_ms": round(bar_length_ms, 4),
            "bar_length_ticks": self._ms_to_ticks(bar_length_ms),
            "tracks": midi_data,
            "profile": {
                "snare_drag_ms_min": self.profile.snare_drag_ms_min,
                "snare_drag_ms_max": self.profile.snare_drag_ms_max,
                "hihat_offbeat_swing_ms_max": self.profile.hihat_offbeat_swing_ms_max,
            },
        }

    def to_json(self, groove: Optional[Dict[str, Any]] = None) -> str:
        return json.dumps(groove or self.generate_late_pocket_groove(), indent=2)


def _demo() -> None:
    mma = MicroRhythmAgent(85, seed=42)
    print(mma.to_json())


if __name__ == "__main__":
    _demo()
