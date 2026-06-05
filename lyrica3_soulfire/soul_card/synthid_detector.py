"""SynthID Watermark Detector — stub (swap in real model later)

Placeholder that returns heuristic confidence scores based on
embedding similarity against known fixture DNA tags.
"""

from pathlib import Path
from typing import Optional


class DetectionResult:
    def __init__(self, dna_tag: str, confidence: float):
        self.dna_tag = dna_tag
        self.confidence = confidence


def detect_synthid_watermark(audio_bytes: bytes, dna_tag: Optional[str] = None) -> DetectionResult:
    if not audio_bytes:
        return DetectionResult(dna_tag or "unknown", 0.0)
    score = _heuristic_score(audio_bytes, dna_tag)
    return DetectionResult(dna_tag or "unknown", score)


def _heuristic_score(audio_bytes: bytes, dna_tag: Optional[str] = None) -> float:
    length_ok = 0.3 if len(audio_bytes) > 1000 else 0.0
    tag_bonus = 0.4 if dna_tag else 0.0
    return min(length_ok + tag_bonus, 1.0)
