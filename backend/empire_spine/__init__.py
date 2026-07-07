"""
Empire Spine — the signed, idempotent, outbox-backed event lane between
Lyrica (creative plane) and ArchiSynapse (trust plane).

Implements Phase 1-2 of ARCHISYNAPSE_LYRICA_SCALE_DESIGN.md:

- events.py  : event envelopes, canonical JSON, HMAC-SHA256 signing/verification
- client.py  : resilient ArchiSynapse client (retries, backoff, Idempotency-Key)
- outbox.py  : transactional outbox table + relay worker

Prime directive honored: this module does NOT replace
`archisynapse_integration.py`. That client remains for reads and blueprint
intelligence. All MONEY-and-TRUTH writes (royalty events, birth certificate
minting) should flow through this spine so they are never lost, never
duplicated, and always signed.

Quickstart (inside a request handler / pipeline completion):

    from empire_spine import build_track_generated, enqueue_event

    event = build_track_generated(
        dna_tag="trk_alpha_7f3a9c2e",
        content_hash=content_sha256,
        stakeholders={"prompt_writer": "@shiestybizz"},
        royalty_split={"prompt_writer": 100.0},
        track_title="Sleep on the Floor",
    )
    # Same DB session/transaction as your track INSERT:
    enqueue_event(session, event)

Then run the relay (separate process or startup task):

    python -m empire_spine.outbox --relay
"""

from .events import (
    build_track_generated,
    canonical_json,
    sign_event,
    verify_event,
    EventSigningError,
)
from .client import SpineClient, SpineDeliveryError
from .outbox import OutboxEvent, enqueue_event, relay_once, ensure_outbox_table

__all__ = [
    "build_track_generated",
    "canonical_json",
    "sign_event",
    "verify_event",
    "EventSigningError",
    "SpineClient",
    "SpineDeliveryError",
    "OutboxEvent",
    "enqueue_event",
    "relay_once",
    "ensure_outbox_table",
]
