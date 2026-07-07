"""
Transactional outbox for the Empire Spine.

Guarantee: if the track exists, its trust event exists. Write the event row
in the SAME database transaction as your track metadata; a relay ships it to
ArchiSynapse afterward. ArchiSynapse dedupes on event_id, so at-least-once
delivery is safe.

States: pending -> sent
                -> failed (retryable, relay picks it up again)
                -> dead   (non-retryable or exhausted; alert + manual replay)

Usage (producer, inside your existing session/transaction):

    from empire_spine import build_track_generated, enqueue_event
    event = build_track_generated(...)
    enqueue_event(session, event)   # same txn as track INSERT
    session.commit()

Usage (relay):

    python -m empire_spine.outbox --relay [--once] [--db-url sqlite:///./lyrica.db]

Env:
    EMPIRE_SPINE_DB_URL   SQLAlchemy URL for the outbox (default: sqlite:///./empire_spine_outbox.db)
    EMPIRE_SPINE_MAX_ATTEMPTS   attempts before an event is marked dead (default 25)
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import time
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Column, DateTime, Integer, String, Text, create_engine,
)
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from .client import SpineClient, SpineDeliveryError

logger = logging.getLogger("lyrica3.empire_spine.outbox")

Base = declarative_base()

MAX_ATTEMPTS = int(os.environ.get("EMPIRE_SPINE_MAX_ATTEMPTS", "25"))


class OutboxEvent(Base):
    __tablename__ = "empire_spine_outbox"

    id = Column(Integer, primary_key=True)
    event_id = Column(String, unique=True, index=True, nullable=False)
    event_type = Column(String, index=True, nullable=False)
    dna_tag = Column(String, index=True, nullable=True)
    payload = Column(Text, nullable=False)          # signed event, canonical JSON
    status = Column(String, index=True, default="pending")  # pending|sent|failed|dead
    attempts = Column(Integer, default=0)
    last_error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime, nullable=True)


def ensure_outbox_table(engine) -> None:
    Base.metadata.create_all(bind=engine, tables=[OutboxEvent.__table__])


def enqueue_event(session: Session, event: dict) -> OutboxEvent:
    """Add a signed event to the outbox INSIDE the caller's transaction.

    The caller commits. Never commit here — that would break atomicity with
    the business write.
    """
    if "signature" not in event:
        raise ValueError("Refusing to enqueue unsigned event — use events.sign_event()/build_*()")
    row = OutboxEvent(
        event_id=event["event_id"],
        event_type=event["event_type"],
        dna_tag=event.get("dna_tag"),
        payload=json.dumps(event, sort_keys=True, separators=(",", ":"), ensure_ascii=False),
    )
    session.add(row)
    return row


def relay_once(session: Session, client: Optional[SpineClient] = None, batch: int = 50) -> dict:
    """Deliver up to `batch` pending/failed events. Returns counters."""
    client = client or SpineClient()
    rows = (
        session.query(OutboxEvent)
        .filter(OutboxEvent.status.in_(["pending", "failed"]))
        .order_by(OutboxEvent.id.asc())
        .limit(batch)
        .all()
    )
    stats = {"sent": 0, "failed": 0, "dead": 0}
    for row in rows:
        event = json.loads(row.payload)
        row.attempts += 1
        try:
            client.deliver_event(event)
            row.status = "sent"
            row.sent_at = datetime.utcnow()
            row.last_error = None
            stats["sent"] += 1
        except SpineDeliveryError as exc:
            row.last_error = str(exc)[:2000]
            if not exc.retryable or row.attempts >= MAX_ATTEMPTS:
                row.status = "dead"
                stats["dead"] += 1
                logger.error("outbox event %s marked DEAD after %d attempts: %s",
                             row.event_id, row.attempts, row.last_error)
            else:
                row.status = "failed"
                stats["failed"] += 1
                logger.warning("outbox event %s delivery failed (attempt %d): %s",
                               row.event_id, row.attempts, row.last_error)
        session.commit()
    return stats


def replay_dead(session: Session, event_id: Optional[str] = None) -> int:
    """Move dead events back to pending (after fixing the root cause)."""
    q = session.query(OutboxEvent).filter(OutboxEvent.status == "dead")
    if event_id:
        q = q.filter(OutboxEvent.event_id == event_id)
    n = 0
    for row in q.all():
        row.status = "pending"
        row.attempts = 0
        n += 1
    session.commit()
    return n


def _main() -> None:
    parser = argparse.ArgumentParser(description="Empire Spine outbox relay")
    parser.add_argument("--relay", action="store_true", help="run the relay loop")
    parser.add_argument("--once", action="store_true", help="single pass, then exit")
    parser.add_argument("--replay-dead", action="store_true", help="requeue dead events")
    parser.add_argument("--interval", type=float, default=2.0, help="poll interval seconds")
    parser.add_argument("--db-url", default=os.environ.get(
        "EMPIRE_SPINE_DB_URL", "sqlite:///./empire_spine_outbox.db"))
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

    connect_args = {"check_same_thread": False} if args.db_url.startswith("sqlite") else {}
    engine = create_engine(args.db_url, connect_args=connect_args)
    ensure_outbox_table(engine)
    SessionLocal = sessionmaker(bind=engine)

    if args.replay_dead:
        with SessionLocal() as s:
            n = replay_dead(s)
        print(f"requeued {n} dead events")
        return

    if not args.relay:
        parser.print_help()
        return

    client = SpineClient()
    logger.info("relay starting against %s", client.base_url)
    while True:
        with SessionLocal() as s:
            stats = relay_once(s, client)
        if any(stats.values()):
            logger.info("relay pass: %s", stats)
        if args.once:
            break
        time.sleep(args.interval)


if __name__ == "__main__":
    _main()
