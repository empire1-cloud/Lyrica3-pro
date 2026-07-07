"""
Pipeline hook: one call wires any track-mint site into the Empire Spine.

    from empire_spine.pipeline_hook import emit_track_minted
    ...
    await db.tracks.insert_one(track)
    emit_track_minted(track)   # never raises, never blocks the request path

Design notes
------------
- Lyrica's product DB is Mongo (async); the spine outbox is SQLAlchemy with its
  own DB (EMPIRE_SPINE_DB_URL). This hook enqueues immediately after the Mongo
  insert. If the enqueue itself fails, it logs CRITICAL with the full event so
  nothing is silently lost (the event can be replayed from logs).
- The hook is fail-open by design: a spine outage must never block music
  creation. The outbox + relay handle ArchiSynapse being down; this guard
  handles the outbox DB itself being down.
- Fractional splits ({"beat_maker": 0.5}) are converted to percentages.
  Roles are attributed to the track creator unless the track document carries
  an explicit `stakeholders` map (role -> handle).
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, Optional

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .events import build_track_generated, sha256_of_obj
from .outbox import ensure_outbox_table, enqueue_event

logger = logging.getLogger("lyrica3.empire_spine.hook")

_engine = None
_SessionLocal = None

# Fields that vary per read or are Mongo-internal — excluded from content hash
_VOLATILE_FIELDS = {"_id", "streams", "flips", "earnings_usd"}


def _session():
    global _engine, _SessionLocal
    if _SessionLocal is None:
        db_url = os.environ.get("EMPIRE_SPINE_DB_URL", "sqlite:///./empire_spine_outbox.db")
        connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
        _engine = create_engine(db_url, connect_args=connect_args)
        ensure_outbox_table(_engine)
        _SessionLocal = sessionmaker(bind=_engine)
    return _SessionLocal()


def _splits_to_percentages(splits: Dict[str, float]) -> Dict[str, float]:
    """{'beat_maker': 0.5} -> {'beat_maker': 50.0}; already-percent maps pass through."""
    if not splits:
        return {}
    total = sum(splits.values())
    if 0.98 <= total <= 1.02:          # fractional
        return {k: round(v * 100.0, 2) for k, v in splits.items()}
    if 99.8 <= total <= 100.2:         # already percentages
        return dict(splits)
    # Unnormalized — normalize proportionally and log
    logger.warning("splits sum to %.3f; normalizing proportionally: %s", total, splits)
    return {k: round(v / total * 100.0, 2) for k, v in splits.items()}


def emit_track_minted(track: Dict[str, Any],
                      source_transaction_id: Optional[str] = None) -> Optional[str]:
    """Build + sign + enqueue a track.generated event for a minted track.

    Returns the event_id on success, None on failure. NEVER raises.
    """
    try:
        dna_tag = track["dna_tag"]
        creator = track.get("creator", "unknown")

        splits = _splits_to_percentages(track.get("splits", {}))
        if not splits:
            splits = {"creator": 100.0}

        stakeholders = track.get("stakeholders") or {role: creator for role in splits}

        hash_basis = {k: v for k, v in track.items() if k not in _VOLATILE_FIELDS}
        content_hash = sha256_of_obj(hash_basis)

        cultural = track.get("cultural_matrix") or track.get("cultural_subtext")
        cognitive = track.get("vics_blueprint") or track.get("s2_blueprint")

        stem_uris = {}
        for s in track.get("stems", []) or []:
            if isinstance(s, dict) and s.get("src"):
                stem_uris[str(s.get("name", "stem")).lower().replace(" ", "_")] = s["src"]

        event = build_track_generated(
            dna_tag=dna_tag,
            content_hash=content_hash,
            stakeholders=stakeholders,
            royalty_split=splits,
            track_title=track.get("title"),
            core_genre=cultural if isinstance(cultural, str) else None,
            cognitive_history=cognitive if isinstance(cognitive, dict) else None,
            artifacts={"stems": stem_uris} if stem_uris else None,
            source_transaction_id=source_transaction_id,
        )

        with _session() as s:
            enqueue_event(s, event)
            s.commit()

        logger.info("spine: enqueued track.generated %s for %s", event["event_id"], dna_tag)
        return event["event_id"]

    except Exception:
        logger.critical(
            "spine: FAILED to enqueue track.generated for %s — event lost unless replayed. track=%r",
            track.get("dna_tag", "?"), {k: track.get(k) for k in ("dna_tag", "title", "creator", "splits")},
            exc_info=True,
        )
        return None
