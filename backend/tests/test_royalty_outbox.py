from __future__ import annotations

import base64
import json
from copy import deepcopy
from datetime import datetime, timezone

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from fastapi import HTTPException

from api.royalty_outbox import (
    ROYALTY_AMOUNT,
    _canonical_event_bytes,
    _fractions_to_bps,
    queue_flip_obligation,
    send_outbox_event,
)


class FakeCollection:
    def __init__(self, documents=None):
        self.documents = [deepcopy(document) for document in (documents or [])]

    @staticmethod
    def _matches(document, query):
        if "$or" in query:
            return any(FakeCollection._matches(document, clause) for clause in query["$or"])
        return all(document.get(key) == value for key, value in query.items())

    async def find_one(self, query, projection=None):
        for document in self.documents:
            if self._matches(document, query):
                result = deepcopy(document)
                result.pop("_id", None)
                return result
        return None

    async def insert_one(self, document):
        self.documents.append(deepcopy(document))
        return None

    async def update_one(self, query, update):
        for document in self.documents:
            if self._matches(document, query):
                document.update(deepcopy(update.get("$set", {})))
                if "$inc" in update:
                    for key, value in update["$inc"].items():
                        document[key] = document.get(key, 0) + value
                return None
        return None


class FakeDB:
    def __init__(self, tracks):
        self.tracks = FakeCollection(tracks)
        self.royalty_outbox = FakeCollection()


@pytest.fixture(autouse=True)
def signing_material(monkeypatch):
    tenant_private = Ed25519PrivateKey.generate()
    tenant_private_raw = tenant_private.private_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption(),
    )
    receipt_private = Ed25519PrivateKey.generate()
    receipt_public_raw = receipt_private.public_key().public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )

    monkeypatch.setenv(
        "LYRICA_ARCHISYNAPSE_ED25519_PRIVATE_KEY_B64",
        base64.b64encode(tenant_private_raw).decode("ascii"),
    )
    monkeypatch.setenv(
        "ARCHISYNAPSE_RECEIPT_PUBLIC_KEY_B64",
        base64.b64encode(receipt_public_raw).decode("ascii"),
    )
    monkeypatch.setenv("LYRICA_ARCHISYNAPSE_KEY_ID", "lyrica-event-k1")
    monkeypatch.setenv("ARCHISYNAPSE_RECEIPT_KEY_ID", "arch-rcpt-k1")
    monkeypatch.setenv("ARCHISYNAPSE_V2_TENANT_API_KEY", "tenant-api-key")
    monkeypatch.setenv("ARCHISYNAPSE_V2_EVENTS_URL", "https://archisynapse.example/api/v1/events")
    monkeypatch.setenv("LYRICA_VICS_PROOF_SIGNING_KEY", "vics-proof-signing-key-at-least-32-bytes")
    monkeypatch.setenv("LYRICA_VICS_SERVICE_TOKEN", "vics-service-token")
    return tenant_private.public_key(), receipt_private


@pytest.fixture
def tracks(tmp_path):
    parent_id = "track_parent_001"
    music_output = tmp_path / "music_output"
    parent_dir = music_output / parent_id
    parent_dir.mkdir(parents=True)
    (parent_dir / "master.mp3").write_bytes(b"parent-audio-for-soulprint")

    return (
        [
            {
                "id": parent_id,
                "dna_tag": "dna_parent_001",
                "creator": "original.creator",
                "title": "Original Track",
            },
            {
                "id": "flip_child_001",
                "dna_tag": "flip_dna_001",
                "creator": "remix.creator",
                "title": "Child Flip",
                "parent_dna": "dna_parent_001",
                "royalty_chain": {
                    "original.creator": 0.5,
                    "remix.creator": 0.5,
                },
            },
        ],
        music_output,
    )


def _id_factory():
    values = iter(
        [
            "01K00000000000000000000001",
            "01K00000000000000000000002",
            "01K00000000000000000000003",
        ]
    )
    return lambda: next(values)


def _now():
    return datetime(2026, 7, 26, 10, 0, 0, tzinfo=timezone.utc)


async def _queue(tmp_path, tracks):
    documents, music_output = tracks
    db = FakeDB(documents)
    outbox = await queue_flip_obligation(
        db=db,
        child_track_reference="flip_child_001",
        root_dir=tmp_path,
        music_output_dir=music_output,
        id_factory=_id_factory(),
        now_factory=_now,
    )
    return db, outbox


def _signed_receipt(event, receipt_private, *, platform_fee="0.0000", status="paid"):
    receipt_body = {
        "schema_version": "1.0",
        "receipt_id": "rcp_test_001",
        "status": status,
        "status_reasons": [],
        "event_id": event["event_id"],
        "correlation_id": event["correlation_id"],
        "tenant_id": "lyrica",
        "transaction_id": "txn_test_001",
        "ledger_transaction_id": "ldg_test_001",
        "amounts": {
            "currency": "USD",
            "gross": ROYALTY_AMOUNT,
            "platform_fee": platform_fee,
            "net": ROYALTY_AMOUNT,
        },
        "payouts": [
            {"owner_id": event["splits"][0]["owner_id"], "amount": "0.6250", "state": "paid"},
            {"owner_id": event["splits"][1]["owner_id"], "amount": "0.6250", "state": "paid"},
        ],
        "decision": {"policy": "allow", "risk_score": 0.1, "checks": ["vics_valid"]},
        "issued_at": "2026-07-26T10:00:01+00:00",
    }
    signed_bytes = json.dumps(receipt_body, sort_keys=True).encode("utf-8")
    signature = receipt_private.sign(signed_bytes)
    return {
        **receipt_body,
        "signature": {
            "alg": "ed25519",
            "key_id": "arch-rcpt-k1",
            "value": base64.b64encode(signature).decode("ascii"),
        },
    }


def test_fraction_conversion_is_deterministic_and_exact():
    chain = {"creator.c": 0.3333, "creator.a": 0.3333, "creator.b": 0.3334}
    first = _fractions_to_bps(chain)
    second = _fractions_to_bps(dict(reversed(list(chain.items()))))

    assert first == second
    assert sum(row["bps"] for row in first) == 10000
    assert all(row["bps"] > 0 for row in first)


@pytest.mark.asyncio
async def test_queue_persists_before_send_with_stable_ids_and_full_pool(tmp_path, tracks):
    db, outbox = await _queue(tmp_path, tracks)

    assert outbox["state"] == "pending"
    assert outbox["attempts"] == 0
    assert outbox["event"]["amount"] == {"currency": "USD", "value": "1.2500"}
    assert sum(row["bps"] for row in outbox["event"]["splits"]) == 10000
    assert outbox["event"]["track"]["track_id"].startswith("trk_")
    assert outbox["event"]["track"]["soulprint_hash"].startswith("sp_sha256_")
    assert outbox["event_body_sha256"] == __import__("hashlib").sha256(
        _canonical_event_bytes(outbox["event"])
    ).hexdigest()
    assert len(db.royalty_outbox.documents) == 1


@pytest.mark.asyncio
async def test_duplicate_queue_returns_original_event_without_second_insert(tmp_path, tracks):
    db, first = await _queue(tmp_path, tracks)
    documents, music_output = tracks
    second = await queue_flip_obligation(
        db=db,
        child_track_reference="flip_child_001",
        root_dir=tmp_path,
        music_output_dir=music_output,
        id_factory=lambda: "SHOULD_NOT_BE_USED",
        now_factory=_now,
    )

    assert second["event_id"] == first["event_id"]
    assert second["idempotency_key"] == first["idempotency_key"]
    assert len(db.royalty_outbox.documents) == 1


@pytest.mark.asyncio
async def test_successful_send_verifies_event_and_persists_exact_receipt(
    tmp_path, tracks, signing_material
):
    tenant_public, receipt_private = signing_material
    db, outbox = await _queue(tmp_path, tracks)
    captured = {}

    def transport(url, body, headers, timeout):
        captured.update({"url": url, "body": body, "headers": headers, "timeout": timeout})
        signature = base64.b64decode(headers["X-Empire1-Signature"].split("=", 1)[1])
        tenant_public.verify(signature, body)
        event = json.loads(body)
        receipt = _signed_receipt(event, receipt_private)
        return 201, json.dumps(receipt).encode("utf-8")

    result = await send_outbox_event(
        db=db,
        event_id=outbox["event_id"],
        transport=transport,
        now_factory=_now,
    )

    assert result["state"] == "receipted"
    assert result["receipt"]["receipt_id"] == "rcp_test_001"
    assert result["receipt"]["amounts"]["platform_fee"] == "0.0000"
    assert captured["headers"]["Idempotency-Key"] == outbox["idempotency_key"]
    assert captured["headers"]["X-Correlation-Id"] == outbox["correlation_id"]
    assert captured["body"] == _canonical_event_bytes(outbox["event"])


@pytest.mark.asyncio
async def test_503_retries_keep_identical_event_and_idempotency_key(
    tmp_path, tracks, signing_material
):
    db, outbox = await _queue(tmp_path, tracks)
    attempts = []

    def unavailable(url, body, headers, timeout):
        attempts.append((body, headers["Idempotency-Key"], headers["X-Correlation-Id"]))
        return 503, json.dumps({"code": "retry_later", "retryable": True}).encode("utf-8")

    first = await send_outbox_event(
        db=db,
        event_id=outbox["event_id"],
        transport=unavailable,
        now_factory=_now,
    )
    second = await send_outbox_event(
        db=db,
        event_id=outbox["event_id"],
        transport=unavailable,
        now_factory=_now,
    )

    assert first["state"] == "pending"
    assert second["state"] == "pending"
    assert second["attempts"] == 2
    assert attempts[0] == attempts[1]
    assert second["event_id"] == outbox["event_id"]
    assert second["idempotency_key"] == outbox["idempotency_key"]


@pytest.mark.asyncio
async def test_invalid_receipt_signature_never_becomes_receipted(
    tmp_path, tracks, signing_material
):
    _, receipt_private = signing_material
    db, outbox = await _queue(tmp_path, tracks)

    def tampered(url, body, headers, timeout):
        event = json.loads(body)
        receipt = _signed_receipt(event, receipt_private)
        receipt["transaction_id"] = "tampered_after_signing"
        return 201, json.dumps(receipt).encode("utf-8")

    result = await send_outbox_event(
        db=db,
        event_id=outbox["event_id"],
        transport=tampered,
        now_factory=_now,
    )

    assert result["state"] == "rejected"
    assert result["receipt"] is None
    assert result["last_error"]["code"] == "invalid_receipt"


@pytest.mark.asyncio
async def test_nonzero_platform_fee_receipt_is_rejected(
    tmp_path, tracks, signing_material
):
    _, receipt_private = signing_material
    db, outbox = await _queue(tmp_path, tracks)

    def fee_deducted(url, body, headers, timeout):
        event = json.loads(body)
        receipt = _signed_receipt(event, receipt_private, platform_fee="0.0400")
        return 201, json.dumps(receipt).encode("utf-8")

    result = await send_outbox_event(
        db=db,
        event_id=outbox["event_id"],
        transport=fee_deducted,
        now_factory=_now,
    )

    assert result["state"] == "rejected"
    assert result["receipt"] is None


@pytest.mark.asyncio
async def test_idempotency_conflict_is_permanent_rejection(
    tmp_path, tracks, signing_material
):
    db, outbox = await _queue(tmp_path, tracks)

    def conflict(url, body, headers, timeout):
        return 409, json.dumps({"code": "idempotency_conflict"}).encode("utf-8")

    result = await send_outbox_event(
        db=db,
        event_id=outbox["event_id"],
        transport=conflict,
        now_factory=_now,
    )

    assert result["state"] == "rejected"
    assert result["last_error"]["http_status"] == 409


@pytest.mark.asyncio
async def test_tampered_persisted_event_is_blocked_before_network(
    tmp_path, tracks, signing_material
):
    db, outbox = await _queue(tmp_path, tracks)
    db.royalty_outbox.documents[0]["event"]["amount"]["value"] = "9.9999"
    called = False

    def transport(url, body, headers, timeout):
        nonlocal called
        called = True
        return 500, b"{}"

    with pytest.raises(HTTPException) as exc:
        await send_outbox_event(
            db=db,
            event_id=outbox["event_id"],
            transport=transport,
            now_factory=_now,
        )

    assert exc.value.status_code == 409
    assert called is False
    assert db.royalty_outbox.documents[0]["state"] == "rejected"
