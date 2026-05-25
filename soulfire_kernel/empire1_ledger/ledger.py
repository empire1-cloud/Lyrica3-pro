"""
Empire 1 Ledger — Phase 1
Hashes Soulfire asset metadata and records provenance + royalty splits.

Phase 1: local JSON file ledger (portable, no chain needed to start).
Phase 2: anchor hashes to Hedera HashGraph / Substrate parachain.
Phase 3: on-chain micro-royalty distribution via stable-token contract.
"""

from __future__ import annotations
import hashlib, json, time, uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


LEDGER_PATH = Path(__file__).parent / "ledger.jsonl"


@dataclass
class RoyaltySplit:
    artist_uid:        str
    artist_pct:        float   = 0.70    # creator default
    platform_pct:      float   = 0.15
    model_owners_pct:  float   = 0.10
    infrastructure_pct: float  = 0.05

    def validate(self) -> None:
        total = self.artist_pct + self.platform_pct + self.model_owners_pct + self.infrastructure_pct
        if abs(total - 1.0) > 0.001:
            raise ValueError(f"Royalty splits must sum to 1.0, got {total:.4f}")


@dataclass
class LedgerEntry:
    entry_id:       str
    asset_id:       str
    schema_hash:    str
    metadata_hash:  str
    creator_uid:    str
    royalty_split:  RoyaltySplit
    timestamp_utc:  float
    render_tier:    str           = "DRAFT"
    territory:      str           = "GLOBAL"
    tags:           list[str]     = field(default_factory=list)
    extra:          dict[str, Any] = field(default_factory=dict)


class Empire1Ledger:
    """
    Records every rendered asset with its immutable metadata hash
    and royalty split. REST endpoints wrap this in Phase 3.
    """

    def record(
        self,
        *,
        asset_id:      str,
        schema:        dict[str, Any],
        creator_uid:   str,
        render_tier:   str = "DRAFT",
        royalty_split: RoyaltySplit | None = None,
        territory:     str = "GLOBAL",
        tags:          list[str] | None = None,
    ) -> LedgerEntry:
        if royalty_split is None:
            royalty_split = RoyaltySplit(artist_uid=creator_uid)
        royalty_split.validate()

        schema_hash   = self._sha256(json.dumps(schema, sort_keys=True))
        metadata_hash = self._sha256(json.dumps({
            "asset_id":    asset_id,
            "creator_uid": creator_uid,
            "schema_hash": schema_hash,
            "render_tier": render_tier,
            "territory":   territory,
        }, sort_keys=True))

        entry = LedgerEntry(
            entry_id=str(uuid.uuid4()),
            asset_id=asset_id,
            schema_hash=schema_hash,
            metadata_hash=metadata_hash,
            creator_uid=creator_uid,
            royalty_split=royalty_split,
            timestamp_utc=time.time(),
            render_tier=render_tier,
            territory=territory,
            tags=tags or [],
        )
        self._append(entry)
        return entry

    def get_by_asset(self, asset_id: str) -> list[LedgerEntry]:
        results = []
        if not LEDGER_PATH.exists():
            return results
        for line in LEDGER_PATH.read_text().splitlines():
            row = json.loads(line)
            if row.get("asset_id") == asset_id:
                rs = RoyaltySplit(**row.pop("royalty_split"))
                results.append(LedgerEntry(**row, royalty_split=rs))
        return results

    def compute_micro_royalty(
        self, entry: LedgerEntry, gross_revenue_usd: float
    ) -> dict[str, float]:
        """
        Returns per-party USD amounts for a given gross revenue event.
        Called on every playback/resale trigger in Phase 3.
        """
        rs = entry.royalty_split
        return {
            "artist":        round(gross_revenue_usd * rs.artist_pct,        6),
            "platform":      round(gross_revenue_usd * rs.platform_pct,      6),
            "model_owners":  round(gross_revenue_usd * rs.model_owners_pct,  6),
            "infrastructure":round(gross_revenue_usd * rs.infrastructure_pct,6),
        }

    # ------------------------------------------------------------------
    def _sha256(self, data: str) -> str:
        return hashlib.sha256(data.encode()).hexdigest()

    def _append(self, entry: LedgerEntry) -> None:
        LEDGER_PATH.parent.mkdir(parents=True, exist_ok=True)
        row = {
            "entry_id":      entry.entry_id,
            "asset_id":      entry.asset_id,
            "schema_hash":   entry.schema_hash,
            "metadata_hash": entry.metadata_hash,
            "creator_uid":   entry.creator_uid,
            "royalty_split": {
                "artist_uid":         entry.royalty_split.artist_uid,
                "artist_pct":         entry.royalty_split.artist_pct,
                "platform_pct":       entry.royalty_split.platform_pct,
                "model_owners_pct":   entry.royalty_split.model_owners_pct,
                "infrastructure_pct": entry.royalty_split.infrastructure_pct,
            },
            "timestamp_utc": entry.timestamp_utc,
            "render_tier":   entry.render_tier,
            "territory":     entry.territory,
            "tags":          entry.tags,
        }
        with LEDGER_PATH.open("a") as f:
            f.write(json.dumps(row) + "\n")
