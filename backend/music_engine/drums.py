"""
Drum pattern generation using General MIDI drum map (Channel 10).
"""
import random
from typing import Dict, List, Tuple

# General MIDI Drum Key (selected)
GM_DRUMS = {
    "kick": 36,
    "kick_soft": 35,
    "snare": 38,
    "snare_rim": 37,
    "snare_soft": 40,
    "hihat_closed": 42,
    "hihat_open": 46,
    "hihat_pedal": 44,
    "tom_high": 50,
    "tom_mid": 47,
    "tom_low": 43,
    "crash": 49,
    "ride": 51,
    "ride_bell": 53,
    "clap": 39,
    "claves": 75,
    "cowbell": 56,
    "tambourine": 54,
    "cabasa": 69,
    "shaker": 70,
}

PATTERNS: Dict[str, List[Tuple[float, str, int]]] = {
    "west_coast": [
        (0.0, "kick", 100),
        (0.0, "hihat_closed", 70),
        (0.5, "snare", 85),
        (0.5, "hihat_closed", 65),
        (1.0, "kick", 95),
        (1.0, "hihat_closed", 70),
        (1.5, "snare", 85),
        (1.5, "hihat_open", 75),
        (1.75, "kick", 70),
    ],
    "pop": [
        (0.0, "kick", 110),
        (0.0, "hihat_closed", 75),
        (0.5, "snare", 100),
        (1.0, "kick", 105),
        (1.0, "hihat_closed", 70),
        (1.5, "snare", 100),
        (1.5, "clap", 80),
    ],
    "trap": [
        (0.0, "kick", 120),
        (0.0, "hihat_closed", 60),
        (0.25, "hihat_closed", 50),
        (0.5, "snare", 100),
        (0.5, "clap", 90),
        (0.75, "hihat_open", 55),
        (1.0, "kick", 115),
        (1.25, "kick", 85),
        (1.5, "snare", 100),
        (1.5, "clap", 90),
        (1.75, "hihat_closed", 50),
    ],
    "r&b": [
        (0.0, "kick", 95),
        (0.0, "hihat_closed", 55),
        (0.5, "snare", 85),
        (0.75, "hihat_closed", 50),
        (1.0, "kick", 90),
        (1.25, "kick", 75),
        (1.5, "snare", 85),
        (1.75, "hihat_open", 65),
    ],
    "corrido": [
        (0.0, "kick", 100),
        (0.0, "hihat_closed", 65),
        (0.25, "snare_rim", 50),
        (0.5, "snare", 90),
        (0.75, "claves", 70),
        (1.0, "kick", 95),
        (1.0, "hihat_closed", 60),
        (1.5, "snare", 90),
        (1.75, "tambourine", 60),
    ],
    "rock": [
        (0.0, "kick", 115),
        (0.0, "crash", 100),
        (0.0, "hihat_closed", 75),
        (0.5, "snare", 105),
        (1.0, "kick", 110),
        (1.0, "hihat_closed", 70),
        (1.5, "snare", 105),
    ],
    "techno": [
        (0.0, "kick", 125),
        (0.25, "hihat_closed", 65),
        (0.5, "snare", 100),
        (0.75, "hihat_open", 70),
        (1.0, "kick", 120),
        (1.25, "hihat_closed", 65),
        (1.5, "snare", 100),
        (1.75, "hihat_open", 70),
    ],
}

STANDARD_PATTERNS = {
    "west_coast": PATTERNS["west_coast"],
    "pop": PATTERNS["pop"],
    "trap": PATTERNS["trap"],
    "r&b": PATTERNS["r&b"],
    "corrido": PATTERNS["corrido"],
    "rock": PATTERNS["rock"],
    "techno": PATTERNS["techno"],
}


def get_drum_pattern(pattern_name: str, bpm: int, ticks_per_beat: int) -> List[Tuple[int, int, int, int, int]]:
    """
    Generate drum events for one bar.
    Returns list of (delta, note, velocity, duration, channel=9)
    """
    pattern = STANDARD_PATTERNS.get(pattern_name, STANDARD_PATTERNS["west_coast"])
    events = []

    # Each pattern entry: (beat_offset, drum_name, velocity)
    # beat_offset is in beats from bar start
    # Sort by beat_offset
    sorted_pattern = sorted(pattern, key=lambda x: x[0])

    last_tick = 0
    for beat_offset, drum, vel in sorted_pattern:
        tick = int(beat_offset * ticks_per_beat)
        delta = tick - last_tick
        note = GM_DRUMS.get(drum, 36)
        dur = max(1, ticks_per_beat // 8)
        events.append((delta, note, vel, dur, 9))
        last_tick = tick

    return events


def generate_drum_track(pattern_name: str, total_bars: int, bpm: int, ticks_per_beat: int) -> List[Tuple[int, int, int, int, int]]:
    """Generate drum events for total_bars bars."""
    all_events = []
    tick_delta = ticks_per_beat * 4  # One bar in ticks

    for bar in range(total_bars):
        bar_events = get_drum_pattern(pattern_name, bpm, ticks_per_beat)
        if bar == 0:
            all_events.extend(bar_events)
        else:
            # Add bar offset to delta of first event, rest are relative
            for i, (delta, note, vel, dur, ch) in enumerate(bar_events):
                if i == 0:
                    all_events.append((delta + tick_delta - all_events[-1][0] if all_events else delta, note, vel, dur, ch))
                else:
                    all_events.append((delta, note, vel, dur, ch))

    return all_events
