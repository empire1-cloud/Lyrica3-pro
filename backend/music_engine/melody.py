"""
Melody generation from chord progression and scale.
"""
import random
from typing import List, Tuple

# Major scale intervals
MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]
MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10]
PENTATONIC_MAJOR = [0, 2, 4, 7, 9]
PENTATONIC_MINOR = [0, 3, 5, 7, 10]
BLUES_SCALE = [0, 3, 5, 6, 7, 10]


def _scale_to_notes(key_center: int, scale: List[int], octaves: int = 2) -> List[int]:
    """Generate all notes in a scale across given octaves."""
    notes = []
    for octave in range(3, 6):
        for interval in scale:
            note = key_center + interval + (octave - 4) * 12
            if 48 <= note <= 96:
                notes.append(note)
    return notes


def _get_scale_notes(key_center: int, scale_type: str) -> List[int]:
    if scale_type == "minor":
        scale = MINOR_SCALE
    elif scale_type == "blues":
        scale = BLUES_SCALE
    elif scale_type == "pentatonic_major":
        scale = PENTATONIC_MAJOR
    elif scale_type == "pentatonic_minor":
        scale = PENTATONIC_MINOR
    else:
        scale = MAJOR_SCALE
    return _scale_to_notes(key_center, scale)


def generate_melody(chords: List[Tuple[int, ...]], bars: int, ticks_per_beat: int,
                    bpm: int, key_center: int = 0, scale_type: str = "major") -> List[Tuple[int, int, int, int, int]]:
    """Generate a melody line from chord progression.

    Args:
        chords: List of chord note tuples (one per bar)
        bars: Number of bars
        ticks_per_beat: MIDI ticks per beat
        bpm: Tempo in BPM
        key_center: Root key MIDI note
        scale_type: 'major', 'minor', 'blues', etc.

    Returns: List of (delta, note, velocity, duration, channel) events
    """
    scale_notes = _get_scale_notes(key_center, scale_type)
    events = []
    resolution = ticks_per_beat // 2  # Eighth notes
    current_tick = 0
    last_note = None

    for bar in range(bars):
        chord = chords[bar] if bar < len(chords) else chords[-1]
        chord_notes_up = [n + 12 for n in chord if 48 <= n + 12 <= 96]
        chord_notes_mid = [n for n in chord if 60 <= n <= 84]
        chord_pool = chord_notes_up + chord_notes_mid
        if not chord_pool:
            chord_pool = [n + 24 for n in chord] if chord else [60, 64, 67]
        scale_pool = scale_notes if scale_notes else [60, 64, 67, 72]

        beats = 4
        for beat in range(beats):
            # 2 notes per beat for variety
            sub_positions = 2 if beat % 2 == 0 else random.choice([1, 2])

            for sub in range(sub_positions):
                # Pick a note: mostly chord tones, some passing tones
                if random.random() < 0.65:
                    note = random.choice(chord_pool)
                elif random.random() < 0.5:
                    # Scale tone
                    note = random.choice(scale_pool)
                else:
                    # Neighbor / passing tone
                    if last_note:
                        step = random.choice([-1, 1])
                        note = last_note + step
                        if note < 48 or note > 96:
                            note = last_note
                    else:
                        note = random.choice(scale_pool)

                # Avoid same note twice
                if last_note == note and random.random() < 0.5:
                    note = note + random.choice([-2, 2])

                vel = random.randint(70, 100)
                dur = ticks_per_beat // 4  # Sixteenth note

                if sub == 0:
                    events.append((0, note, vel, dur, 1))
                else:
                    events.append((resolution // 2, note, vel, dur, 1))

                last_note = note

            current_tick += resolution * 2

    return events


def generate_arpeggio(chords: List[Tuple[int, ...]], bars: int, ticks_per_beat: int,
                      key_center: int = 0) -> List[Tuple[int, int, int, int, int]]:
    """Generate a gentle arpeggio pattern."""
    events = []
    for bar in range(bars):
        chord = chords[bar] if bar < len(chords) else chords[-1]
        arp_notes = sorted(set(chord))
        # Shift up one octave for arp
        arp_notes = [n + 12 for n in arp_notes]

        for beat in range(4):
            offset = beat * ticks_per_beat
            # Play chord as arpeggio: root-3rd-5th-7th
            pattern = [0, 1, 2, 3 % len(arp_notes), 1, 2, 0, 3 % len(arp_notes)]
            for i, idx in enumerate(pattern):
                sub_offset = offset + (i * ticks_per_beat // 8)
                note = arp_notes[idx % len(arp_notes)]
                if bar == 0 and beat == 0 and i == 0:
                    events.append((0, note, 60, ticks_per_beat // 8, 2))
                else:
                    events.append((ticks_per_beat // 8, note, 60, ticks_per_beat // 8, 2))

    return events


def generate_pad(chords: List[Tuple[int, ...]], bars: int, ticks_per_beat: int) -> List[Tuple[int, int, int, int, int]]:
    """Generate sustained pad chords."""
    events = []
    for bar in range(bars):
        chord = chords[bar] if bar < len(chords) else chords[-1]
        # Voicing: root + 3rd + 5th in lower octave
        voicing = [chord[0], chord[1], chord[2] if len(chord) > 2 else chord[0] + 7]
        for i, note in enumerate(voicing):
            note = note - 12  # One octave down
            delta = 0 if i == 0 else 120
            events.append((delta, note, 55, ticks_per_beat * 4 - delta, 3))
    return events
