"""
Chord progression generation based on genre and mood.
Procedural generation with genre templates.
"""
import random
from typing import List, Optional, Tuple

# Note: MIDI note numbers
# C4=60, D4=62, E4=64, F4=65, G4=67, A4=69, B4=71
# C3=48, D3=50, E3=52, F3=53, G3=55, A3=57, B3=59

NOTE_NAMES = {
    0: "C", 1: "C#", 2: "D", 3: "D#", 4: "E", 5: "F",
    6: "F#", 7: "G", 8: "G#", 9: "A", 10: "A#", 11: "B",
}

ROMAN = ["I", "ii", "iii", "IV", "V", "vi", "vii°"]

# Chord templates: (root, type) where type: "maj", "min", "dom7", "maj7", "min7"
# Each chord defined as intervals from root
CHORD_INTERVALS = {
    "maj": (0, 4, 7),
    "min": (0, 3, 7),
    "dom7": (0, 4, 7, 10),
    "maj7": (0, 4, 7, 11),
    "min7": (0, 3, 7, 10),
    "dim": (0, 3, 6),
    "sus4": (0, 5, 7),
    "aug": (0, 4, 8),
}

GENRE_TEMPLATES = {
    "west coast": {
        "bpm_range": (88, 98),
        "key_center": 0,  # C
        "scale": "major",
        "chord_progressions": [
            [(0, "maj7"), (4, "min7"), (5, "dom7"), (3, "min7")],
            [(0, "maj7"), (3, "min7"), (4, "maj7"), (5, "dom7")],
            [(2, "min7"), (5, "dom7"), (0, "maj7"), (4, "maj7")],
            [(0, "maj7"), (5, "dom7"), (3, "min7"), (4, "maj7")],
        ],
        "instruments": {
            "chords": 1,      # Acoustic Grand
            "melody": 89,     # Pad 2 (warm)
            "bass": 33,       # Electric Bass (finger)
            "arp": 6,         # Electric Piano 2
        },
        "drum_pattern": "west_coast",
    },
    "pop": {
        "bpm_range": (110, 130),
        "key_center": 0,  # C
        "scale": "major",
        "chord_progressions": [
            [(0, "maj"), (5, "maj"), (6, "min"), (3, "min")],
            [(0, "maj"), (4, "maj"), (5, "maj"), (5, "maj")],
            [(6, "min"), (4, "maj"), (0, "maj"), (5, "maj")],
            [(0, "maj"), (0, "maj"), (4, "maj"), (5, "maj")],
        ],
        "instruments": {
            "chords": 4,      # Electric Piano
            "melody": 81,     # Lead 1 (square wave)
            "bass": 34,       # Electric Bass (pick)
            "arp": 90,        # Pad 3 (polysynth)
        },
        "drum_pattern": "pop",
    },
    "hip hop": {
        "bpm_range": (95, 110),
        "key_center": 9,  # A
        "scale": "minor",
        "chord_progressions": [
            [(9, "min7"), (0, "maj7"), (7, "min7"), (5, "dom7")],
            [(9, "min7"), (11, "maj7"), (0, "maj7"), (7, "min")],
            [(7, "min7"), (0, "maj7"), (9, "min7"), (5, "dom7")],
            [(9, "min7"), (4, "min7"), (7, "min7"), (5, "dom7")],
        ],
        "instruments": {
            "chords": 3,      # Honky-tonk Piano
            "melody": 84,     # Lead 6 (voice)
            "bass": 35,       # Electric Bass (fretless)
            "arp": 88,        # Pad 1 (fantasia)
        },
        "drum_pattern": "trap",
    },
    "r&b": {
        "bpm_range": (70, 85),
        "key_center": 5,  # F
        "scale": "major",
        "chord_progressions": [
            [(5, "maj7"), (3, "min7"), (4, "maj7"), (0, "maj7")],
            [(0, "maj7"), (5, "maj7"), (6, "min7"), (3, "min7")],
            [(5, "maj7"), (4, "maj7"), (3, "min7"), (5, "dom7")],
            [(3, "min7"), (4, "maj7"), (0, "maj7"), (5, "dom7")],
        ],
        "instruments": {
            "chords": 5,      # Electric Piano 1
            "melody": 46,     # Harp
            "bass": 33,       # Electric Bass (finger)
            "arp": 91,        # Pad 4 (choir)
        },
        "drum_pattern": "r&b",
    },
    "corrido": {
        "bpm_range": (100, 120),
        "key_center": 7,  # G
        "scale": "major",
        "chord_progressions": [
            [(7, "maj"), (0, "maj"), (5, "maj"), (7, "maj")],
            [(0, "maj"), (5, "maj"), (6, "min"), (3, "min")],
            [(7, "maj"), (4, "maj"), (0, "maj"), (5, "maj")],
            [(2, "min"), (5, "maj"), (0, "maj"), (5, "maj")],
        ],
        "instruments": {
            "chords": 24,     # Nylon Guitar
            "melody": 25,     # Steel Guitar
            "bass": 34,       # Electric Bass (pick)
            "arp": 26,        # Jazz Guitar
        },
        "drum_pattern": "corrido",
    },
    "soul": {
        "bpm_range": (75, 90),
        "key_center": 2,  # D
        "scale": "major",
        "chord_progressions": [
            [(2, "maj7"), (6, "min7"), (7, "dom7"), (0, "maj7")],
            [(2, "maj7"), (4, "maj7"), (3, "min7"), (7, "dom7")],
            [(6, "min7"), (3, "min7"), (4, "maj7"), (2, "maj7")],
            [(2, "maj7"), (1, "min7"), (6, "min7"), (7, "dom7")],
        ],
        "instruments": {
            "chords": 4,      # Electric Piano
            "melody": 65,     # Alto Sax
            "bass": 34,       # Electric Bass (pick)
            "arp": 6,         # Electric Piano 2
        },
        "drum_pattern": "r&b",
    },
    "electronic": {
        "bpm_range": (120, 140),
        "key_center": 0,  # C
        "scale": "minor",
        "chord_progressions": [
            [(0, "min7"), (7, "min7"), (5, "dom7"), (8, "maj7")],
            [(9, "min7"), (5, "min7"), (4, "maj7"), (7, "dom7")],
            [(0, "min7"), (3, "min7"), (7, "min7"), (8, "maj7")],
            [(5, "min7"), (7, "min7"), (0, "min7"), (9, "min7")],
        ],
        "instruments": {
            "chords": 90,     # Pad 3 (polysynth)
            "melody": 81,     # Lead 1 (square)
            "bass": 39,       # Synth Bass 2
            "arp": 88,        # Pad 1 (fantasia)
        },
        "drum_pattern": "techno",
    },
    "rock": {
        "bpm_range": (110, 140),
        "key_center": 7,  # G
        "scale": "major",
        "chord_progressions": [
            [(7, "maj"), (0, "maj"), (5, "maj"), (4, "maj")],
            [(0, "maj"), (4, "maj"), (5, "maj"), (5, "maj")],
            [(9, "min"), (5, "maj"), (4, "maj"), (7, "maj")],
            [(7, "maj"), (5, "maj"), (4, "maj"), (0, "maj")],
        ],
        "instruments": {
            "chords": 30,     # Distortion Guitar
            "melody": 81,     # Lead 1 (square)
            "bass": 34,       # Electric Bass (pick)
            "arp": 26,        # Jazz Guitar
        },
        "drum_pattern": "rock",
    },
}


def get_template(genre: str, mood: str) -> dict:
    """Get genre template, falling back to west coast if genre not found."""
    genre_key = genre.lower().replace(" ", "_").replace("-", "_")
    # Try exact match
    if genre_key in GENRE_TEMPLATES:
        return GENRE_TEMPLATES[genre_key]
    # Try partial match
    for key, tmpl in GENRE_TEMPLATES.items():
        if genre_key in key or key in genre_key:
            return tmpl
    return GENRE_TEMPLATES["west coast"]


def resolve_chord(root_note: int, quality: str) -> Tuple[int, ...]:
    """Resolve a chord to MIDI note numbers given a root note."""
    intervals = CHORD_INTERVALS.get(quality, CHORD_INTERVALS["maj"])
    return tuple(root_note + interval for interval in intervals)


def get_chord_notes(progression: List[Tuple[int, str]], key_center: int, bars: int = 8) -> List[Tuple[int, ...]]:
    """Convert a Roman numeral progression to MIDI notes, repeated for given bars."""
    chords = []
    for _ in range(bars // len(progression) + 1):
        for degree, quality in progression:
            root = key_center + degree
            chords.append(resolve_chord(root, quality))
    return chords[:bars]


def get_bass_note_for_chord(chord_notes: Tuple[int, ...]) -> int:
    """Get the root (lowest) note for bass."""
    return chord_notes[0] - 12  # One octave down


def generate_bass_line(chords: List[Tuple[int, ...]], ticks_per_beat: int, beats_per_chord: int = 2) -> List:
    """Generate a bass line following chord roots."""
    events = []
    for i, chord in enumerate(chords):
        root = chord[0] - 12  # Bass root
        fifth = chord[0] + 7 - 12 if len(chord) > 2 else root + 7  # Fifth
        beat_type = i % 4
        if beat_type == 0:
            events.append((ticks_per_beat, root + 12, 90, ticks_per_beat))
        elif beat_type == 1:
            events.append((0, root, 85, ticks_per_beat))
        elif beat_type == 2:
            events.append((0, fifth, 80, ticks_per_beat))
        else:
            events.append((0, root + 5, 80, ticks_per_beat))
    return events
