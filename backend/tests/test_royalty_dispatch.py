from __future__ import annotations

import hashlib
from copy import deepcopy

import pytest

from api.royalty_dispatch import safe_send_outbox_event
from api.royalty_outbox import _canonical_event_bytes


class FakeOutbox:
    def __init__(self, document):
        self.document = deepcopy(document)

    async def find_one(self, query, projection=None):
        if self.document.get("event_id") == query.get("event_id"):
            result = deepcopy(self.document)
            result.pop("_id", None)
            return result
        return None

    async def update_one(self, query, update):
        if self.document.get("event_id") == query.get("event_id"):
            self.document.update(deepcopy(update.get("$set", {})))
        return None


class FakeDB:
    def __init__(self, document):
        self.royalty_outbox = FakeOutbox(document)


def _event():
    return {
        "schema_version": "1.0",
        "event_id": "evt_config_test",
        "event_type": "royalty.obligation.created",
        "occurred_at": "2026-07-26T10:00:00+00:00",
        "correlation_id": "corr_config_test",
        "idempotency_key": "idem_config_test",
        "tenant_id": "lyrica",
        "track": {
            "track_id": "trk_test",
            "dna_tag": "dna_test",
            "soulprint_hash": "sp_sha256_test",
            "vics_proof": {
                "proof_id": "vics_test",
                "issued_at": "2026-07-26T09:59:00+00:00",
                "chain_ref": "vics://empire1/lyrica/trk_test",
            },
        },
        "creator": {
            "creator_id": "cre_test",
            "identity_ref": "sla113://identity/cre_test",
        },
        "splits": [{"owner_id": "cre_test", "bps": 10000}],
        "trigger": {
            "kind": "remix",
            "source_ref": "lyrica://remix/trk_flip_test",
            "actor_id": "usr_test",
        },
        "amount": {"currency": "USD", "value": "1.2500"},
    }


def _document():
    event = _event()
    body = _canonical_event_bytes(event)
    return {
        "event_id": event["event_id"],
        "state": "pending",
        "attempts": 0,
        "event": event,
        "event_body_sha256": hashlib.sha256(body).hexdigest(),
        "receipt": None,
        "last_error": None,
    }


@pytest.mark.asyncio
async def test_missing_signing_configuration_never_leaves_sending(monkeypatch):
    for name in (
        "LYRICA_ARCHISYNAPSE_ED25519_PRIVATE_KEY_B64",
        "ARCHISYNAPSE_V2_TENANT_API_KEY",
        "ARCHISYNAPSE_V2_EVENTS_URL",
        "LYRICA_ARCHISYNAPSE_KEY_ID",
        "ARCHISYNAPSE_RECEIPT_PUBLIC_KEY_B64",
    ):
        monkeypatch.delenv(name, raising=False)
    db = FakeDB(_document())

    result = await safe_send_outbox_event(db=db, event_id="evt_config_test")

    assert result["state"] == "pending"
    assert result["attempts"] == 0
    assert result["last_error"]["code"] == "configuration_error"
    assert result["next_attempt_at"]
    assert db.royalty_outbox.document["state"] != "sending"


@pytest.mark.asyncio
async def test_invalid_timeout_never_leaves_sending(monkeypatch):
    monkeypatch.setenv("ARCHISYNAPSE_V2_TIMEOUT_SECONDS", "not-a-number")
    db = FakeDB(_document())

    result = await safe_send_outbox_event(db=db, event_id="evt_config_test")

    assert result["state"] == "pending"
    assert result["attempts"] == 0
    assert result["last_error"]["code"] == "configuration_error"


@pytest.mark.asyncio
async def test_tampered_body_is_rejected_without_dispatch(monkeypatch):
    document = _document()
    document["event"]["amount"]["value"] = "9.9999"
    db = FakeDB(document)

    result = await safe_send_outbox_event(db=db, event_id="evt_config_test")

    assert result["state"] == "rejected"
    assert result["attempts"] == 0
    assert result["last_error"]["code"] == "outbox_body_tampered"


@pytest.mark.asyncio
async def test_terminal_record_is_returned_without_reopening():
    document = _document()
    document["state"] = "receipted"
    document["receipt"] = {"receipt_id": "rcp_existing"}
    db = FakeDB(document)

    result = await safe_send_outbox_event(db=db, event_id="evt_config_test")

    assert result["state"] == "receipted"
    assert result["receipt"]["receipt_id"] == "rcp_existing"
