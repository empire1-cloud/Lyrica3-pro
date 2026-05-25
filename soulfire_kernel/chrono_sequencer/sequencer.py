"""
Chrono Sequencer — Phase 1
Converts a Soulfire Schema into a timed section blueprint,
enabling >4 minute continuous renders by splitting into
~30s latent blocks that the Aural Core renders individually.

Block stitching uses cross-fade + phase alignment (Phase 2).
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any


@dataclass
class Section:
    label: str           # e.g. "intro", "verse_1", "chorus_1"
    start_sec: float
    end_sec: float
    bpm: float
    emotion_override: dict[str, float] = field(default_factory=dict)
    render_block_ids: list[int]        = field(default_factory=list)

    @property
    def duration(self) -> float:
        return self.end_sec - self.start_sec


@dataclass
class RenderBlock:
    block_id: int
    start_sec: float
    end_sec: float
    section_label: str
    crossfade_in_ms: float  = 50.0
    crossfade_out_ms: float = 50.0


class ChronoSequencer:
    """
    Phase 1: rule-based section scheduler.
    Phase 2: add beat-grid alignment and swing-quantisation.
    """

    BLOCK_DURATION_SEC = 30.0  # target block size for ACE-Step chunked inference

    def build_blueprint(self, schema: dict[str, Any]) -> tuple[list[Section], list[RenderBlock]]:
        cit  = schema.get("creative_intent_trace", {})
        ap   = schema.get("acoustic_primitives", {})
        bpm  = float(ap.get("bpm", 90))
        secs = self._parse_sections(cit, bpm)
        blocks = self._slice_blocks(secs)
        return secs, blocks

    # ------------------------------------------------------------------

    def _parse_sections(self, cit: dict[str, Any], bpm: float) -> list[Section]:
        raw_sections = cit.get("song_sections", None)

        if raw_sections:
            # Schema explicitly defines sections
            result, t = [], 0.0
            for rs in raw_sections:
                dur = float(rs.get("duration_bars", 8)) * (60.0 / bpm) * 4
                result.append(Section(
                    label=rs.get("label", "section"),
                    start_sec=t,
                    end_sec=t + dur,
                    bpm=bpm,
                    emotion_override=rs.get("emotion_override", {}),
                ))
                t += dur
            return result

        # Default song structure: intro 8, verse 16, chorus 8, verse 16, chorus 8, outro 8 bars
        default_bars = [
            ("intro", 8), ("verse_1", 16), ("chorus_1", 8),
            ("verse_2", 16), ("chorus_2", 8),
            ("bridge", 8),  ("chorus_3", 8), ("outro", 8),
        ]
        result, t = [], 0.0
        for label, bars in default_bars:
            dur = bars * (60.0 / bpm) * 4
            result.append(Section(label=label, start_sec=t, end_sec=t + dur, bpm=bpm))
            t += dur
        return result

    def _slice_blocks(self, sections: list[Section]) -> list[RenderBlock]:
        blocks: list[RenderBlock] = []
        bid = 0
        for sec in sections:
            t = sec.start_sec
            while t < sec.end_sec:
                end = min(t + self.BLOCK_DURATION_SEC, sec.end_sec)
                block = RenderBlock(
                    block_id=bid,
                    start_sec=t,
                    end_sec=end,
                    section_label=sec.label,
                    crossfade_in_ms=50.0 if t > sec.start_sec else 0.0,
                    crossfade_out_ms=50.0 if end < sec.end_sec else 0.0,
                )
                sec.render_block_ids.append(bid)
                blocks.append(block)
                bid += 1
                t = end
        return blocks

    def total_duration(self, sections: list[Section]) -> float:
        return sections[-1].end_sec if sections else 0.0
