"""
Low-level Standard MIDI File writer.
No dependencies — pure Python struct packing.
"""
import struct
from typing import List, Tuple

HEADER = b"MThd"
TRACK_HEADER = b"MTrk"
DEFAULT_TICKS = 480


def _write_var_len(value: int) -> bytes:
    """Write a MIDI variable-length integer."""
    value = max(0, int(value))
    buffer = value & 0x7F

    out = []
    while value >> 7:
        value >>= 7
        buffer <<= 8
        buffer |= ((value & 0x7F) | 0x80)

    while True:
        out.append(buffer & 0xFF)
        if buffer & 0x80:
            buffer >>= 8
        else:
            break

    return bytes(out)


def _write_track(track_data: bytes) -> bytes:
    return TRACK_HEADER + struct.pack(">I", len(track_data)) + track_data


def write_midi_program_change(
    filename: str,
    tracks_programs: List[Tuple[int, List[Tuple[int, int, int, int, int]]]],
    bpm: int = 120,
    ticks: int = DEFAULT_TICKS,
) -> None:
    """
    Write a MIDI file with program changes per track.

    tracks_programs:
        [
            (program_number, [(delta, note, velocity, duration, channel), ...]),
            ...
        ]

    Program numbers are General MIDI numbers:
        0 = Acoustic Grand Piano
        33 = Finger Bass
        81 = Lead Synth
        Channel 9 = drums
    """
    us_per_q = 60000000 // bpm
    tempo_event = bytes([0xFF, 0x51, 0x03]) + struct.pack(">I", us_per_q)[1:]
    end_of_track = bytes([0x00, 0xFF, 0x2F, 0x00])

    chunks = [
        HEADER + struct.pack(">IHHH", 6, 1, len(tracks_programs), ticks)
    ]

    for program, events in tracks_programs:
        track_bytes = bytearray()

        # Tempo
        track_bytes += _write_var_len(0) + tempo_event

        channel = events[0][4] if events else 0

        # Program change, except drums use channel 9 and ignore program
        if channel != 9:
            track_bytes += _write_var_len(0)
            track_bytes += bytes([0xC0 | channel, program & 0x7F])

        for delta, note, velocity, duration, event_channel in events:
            note = max(0, min(127, int(note)))
            velocity = max(0, min(127, int(velocity)))
            event_channel = max(0, min(15, int(event_channel)))

            track_bytes += _write_var_len(delta)
            track_bytes += bytes([0x90 | event_channel, note, velocity])

            track_bytes += _write_var_len(duration)
            track_bytes += bytes([0x80 | event_channel, note, 0])

        track_bytes += end_of_track
        chunks.append(_write_track(bytes(track_bytes)))

    with open(filename, "wb") as f:
        for chunk in chunks:
            f.write(chunk)
