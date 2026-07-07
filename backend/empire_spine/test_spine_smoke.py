"""
Empire Spine smoke test — no network, no ArchiSynapse needed.

Run from Lyrica3-pro/backend:

    EMPIRE_SPINE_SIGNING_KEY=testkey python -m empire_spine.test_spine_smoke

Verifies:
  1. build_track_generated produces a signed, schema-shaped event
  2. verify_event accepts it and rejects tampering
  3. bad royalty splits are refused
  4. outbox enqueue + relay (against a mock client) round-trips
  5. dead-letter + replay works
"""

import json
import os
import sys

os.environ.setdefault("EMPIRE_SPINE_SIGNING_KEY", "smoke-test-key")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .events import build_track_generated, verify_event
from .outbox import OutboxEvent, ensure_outbox_table, enqueue_event, relay_once, replay_dead
from .client import SpineDeliveryError


def _make_event():
    return build_track_generated(
        dna_tag="trk_alpha_7f3a9c2e",
        content_hash="sha256:" + "ab" * 32,
        stakeholders={"prompt_writer": "@shiestybizz", "vocal_owner": "@shiestybizz"},
        royalty_split={"prompt_writer": 60.0, "vocal_owner": 40.0},
        track_title="Sleep on the Floor",
        core_genre="SGV Chicano Soul",
        cultural_lens="chicano_soul",
        cognitive_history={"aura": {"subtext": "smiling through tears"}},
        ai_models_used=["MusicGen 1.5 (Meta)", "Demucs 4 (Meta)"],
    )


class MockClient:
    """Stands in for SpineClient. First N calls fail, then succeed."""
    def __init__(self, fail_first: int = 0, permanent: bool = False):
        self.fail_first = fail_first
        self.permanent = permanent
        self.delivered = []

    def deliver_event(self, event):
        if self.permanent:
            raise SpineDeliveryError("schema rejected", status_code=422, retryable=False)
        if self.fail_first > 0:
            self.fail_first -= 1
            raise SpineDeliveryError("simulated outage", status_code=503, retryable=True)
        self.delivered.append(event["event_id"])
        return {"ok": True}


def main() -> int:
    failures = []

    def check(name, cond):
        print(("  PASS  " if cond else "  FAIL  ") + name)
        if not cond:
            failures.append(name)

    print("[1] signing")
    ev = _make_event()
    check("event has signature", ev.get("signature", "").startswith("hmac-sha256:"))
    check("signature verifies", verify_event(ev))
    tampered = dict(ev)
    tampered["royalty_split"] = {"prompt_writer": 100.0}
    check("tampering rejected", not verify_event(tampered))

    print("[2] guardrails")
    try:
        build_track_generated(
            dna_tag="trk_x", content_hash="sha256:" + "00" * 32,
            stakeholders={"prompt_writer": "@a"},
            royalty_split={"prompt_writer": 55.0},  # bad: 55% != 100%
        )
        check("bad split refused", False)
    except ValueError:
        check("bad split refused", True)

    print("[3] outbox round-trip")
    engine = create_engine("sqlite:///:memory:")
    ensure_outbox_table(engine)
    Session = sessionmaker(bind=engine)
    with Session() as s:
        enqueue_event(s, ev)
        s.commit()
        mock = MockClient(fail_first=1)
        stats1 = relay_once(s, mock)          # first pass: fails once
        stats2 = relay_once(s, mock)          # second pass: delivers
        check("retryable failure kept", stats1["failed"] == 1 and stats1["sent"] == 0)
        check("second pass delivered", stats2["sent"] == 1)
        check("delivered right event", mock.delivered == [ev["event_id"]])
        row = s.query(OutboxEvent).one()
        check("row marked sent", row.status == "sent")

    print("[4] dead-letter + replay")
    with Session() as s:
        ev2 = _make_event()
        enqueue_event(s, ev2)
        s.commit()
        stats = relay_once(s, MockClient(permanent=True))
        check("non-retryable goes dead", stats["dead"] == 1)
        n = replay_dead(s)
        check("replay requeues", n == 1)
        stats = relay_once(s, MockClient())
        check("replayed event delivers", stats["sent"] == 1)

    print()
    if failures:
        print(f"SMOKE TEST FAILED: {failures}")
        return 1
    print("SMOKE TEST PASSED — spine is sound.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
