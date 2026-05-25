"""
Soulfire Audio Kernel — Top-level orchestrator (Phase 1)

Ties together:
  intent_parser  → ConditioningVector
  chrono_sequencer → Section/RenderBlock blueprint
  empire1_ledger  → immutable provenance record

The AuralCore (ACE-Step) and PhonationEngine (DiffSinger/VALLE-X)
are stubbed here; Phase 2 wires in real model inference.
"""

from __future__ import annotations
import uuid
from typing import Any

from intent_parser.tokenizer import SoulfireIntentTokenizer, ConditioningVector
from chrono_sequencer.sequencer import ChronoSequencer, Section, RenderBlock
from empire1_ledger.ledger import Empire1Ledger, RoyaltySplit


class SoulfireKernel:
    def __init__(self) -> None:
        self.tokenizer  = SoulfireIntentTokenizer()
        self.sequencer  = ChronoSequencer()
        self.ledger     = Empire1Ledger()

    def prepare(self, schema: dict[str, Any], creator_uid: str) -> dict[str, Any]:
        """
        Phase 1 — returns conditioning + blueprint.
        Does NOT yet call a real audio model.
        """
        # 1. Tokenize intent
        cond_vec: ConditioningVector = self.tokenizer.tokenize(schema)

        # 2. Build time blueprint
        sections, blocks = self.sequencer.build_blueprint(schema)
        total_dur = self.sequencer.total_duration(sections)

        # 3. Record to Empire 1 ledger
        asset_id = str(uuid.uuid4())
        split = RoyaltySplit(
            artist_uid=creator_uid,
            **schema.get("track_metadata", {}).get("royalty_split", {})
        ) if schema.get("track_metadata", {}).get("royalty_split") else RoyaltySplit(artist_uid=creator_uid)

        entry = self.ledger.record(
            asset_id=asset_id,
            schema=schema,
            creator_uid=creator_uid,
            render_tier=schema.get("track_metadata", {}).get("render_tier", "DRAFT"),
            royalty_split=split,
            territory=schema.get("track_metadata", {}).get("territory", "GLOBAL"),
            tags=schema.get("track_metadata", {}).get("tags", []),
        )

        return {
            "asset_id":       asset_id,
            "schema_hash":    cond_vec.schema_hash,
            "metadata_hash":  entry.metadata_hash,
            "conditioning":   cond_vec.to_dict(),
            "sections":       [{"label": s.label, "start": s.start_sec, "end": s.end_sec, "bpm": s.bpm} for s in sections],
            "render_blocks":  [{"id": b.block_id, "start": b.start_sec, "end": b.end_sec, "section": b.section_label} for b in blocks],
            "total_duration_sec": total_dur,
            "royalty_split": {
                "artist_pct":         split.artist_pct,
                "platform_pct":       split.platform_pct,
                "model_owners_pct":   split.model_owners_pct,
                "infrastructure_pct": split.infrastructure_pct,
            },
            "status": "PREPARED",  # PREPARED → RENDERING → COMPLETE in Phase 2
        }
