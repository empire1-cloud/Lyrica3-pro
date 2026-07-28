from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from api.luzaria_receipts import attach_archisynapse_receipt


class FakeCollection:
    def __init__(self, documents=None):
        self.documents = [deepcopy(document) for document in (documents or [])]

    @staticmethod
    def _matches(document, query):
        return all(document.get(key) == value for key, value in query.items())

    async def find_one(self, query, projection=None):
        for document in self.documents:
            if self._matches(document, query):
                result = deepcopy(document)
                result.pop("_id", None)
                return result
        return None

    async def update_one(self, query, update):
        for document in self.documents:
            if self._matches(document, query):
                document.update(deepcopy(update.get("$set", {})))
                return None
        return None


class FakeDB:
    def __init__(self, catalog=None, outbox=None):
        self.artist_catalog = FakeCollection(catalog)
        self.royalty_outbox = FakeCollection(outbox)


def _now():
    return datetime(2026, 7, 28, 13, 0, 0, tzinfo=timezone.utc)


def _registered_track(**overrides):
    document = {
        "artist_id": "LZR-00000001",
        "track_id": "trk_luzaria_001",
        "title": "Sleep On The Floor",
        "proof_complete": True,
        "royalty_closed": False,
        "archisynapse_receipt_id": None,
    }
    document.update(overrides)
    return document


def _outbox(**overrides):
    document = {
        "event_id": "evt_luzaria_001",
        "state": "receipted",
        "event": {
            "event_id": "evt_luzaria_001",
            "track": {"track_id": "trk_luzaria_001"},
        },
        "receipt": {
            "receipt_id": "rcp_luzaria_001",
            "event_id": "evt_luzaria_001",
            "status": "paid",
            "transaction_id": "txn_luzaria_001",
            "ledger_transaction_id": "ldg_luzaria_001",
            "amounts": {
                "gross": "1.2500",
                "net": "1.2500",
                "platform_fee": "0.0000",
            },
        },
    }
    document.update(overrides)
    return document


@pytest.mark.asyncio
async def test_verified_outbox_receipt_closes_catalog_royalty_gate():
    db = FakeDB([_registered_track()], [_outbox()])

    result = await attach_archisynapse_receipt(
        db,
        track_id="trk_luzaria_001",
        event_id="evt_luzaria_001",
        now_factory=_now,
    )

    assert result["archisynapse_receipt_id"] == "rcp_luzaria_001"
    assert result["archisynapse_event_id"] == "evt_luzaria_001"
    assert result["royalty_closed"] is True
    assert result["release_status"] == "royalty_closed"
    assert result["archisynapse_receipt"]["amounts"]["platform_fee"] == "0.0000"


@pytest.mark.asyncio
async def test_same_verified_receipt_retry_is_idempotent():
    db = FakeDB(
        [
            _registered_track(
                royalty_closed=True,
                archisynapse_receipt_id="rcp_luzaria_001",
            )
        ],
        [_outbox()],
    )

    result = await attach_archisynapse_receipt(
        db,
        track_id="trk_luzaria_001",
        event_id="evt_luzaria_001",
        now_factory=_now,
    )

    assert result["archisynapse_receipt_id"] == "rcp_luzaria_001"


@pytest.mark.asyncio
async def test_different_verified_receipt_cannot_replace_closed_record():
    outbox = _outbox(
        receipt={
            **_outbox()["receipt"],
            "receipt_id": "rcp_replacement",
        }
    )
    db = FakeDB(
        [
            _registered_track(
                royalty_closed=True,
                archisynapse_receipt_id="rcp_original",
            )
        ],
        [outbox],
    )

    with pytest.raises(HTTPException) as exc:
        await attach_archisynapse_receipt(
            db,
            track_id="trk_luzaria_001",
            event_id="evt_luzaria_001",
            now_factory=_now,
        )
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_unreceipted_or_missing_outbox_cannot_close_gate():
    missing_db = FakeDB([_registered_track()])
    with pytest.raises(HTTPException) as missing:
        await attach_archisynapse_receipt(
            missing_db,
            track_id="trk_luzaria_001",
            event_id="evt_missing",
            now_factory=_now,
        )
    assert missing.value.status_code == 404

    pending_db = FakeDB([_registered_track()], [_outbox(state="pending", receipt=None)])
    with pytest.raises(HTTPException) as pending:
        await attach_archisynapse_receipt(
            pending_db,
            track_id="trk_luzaria_001",
            event_id="evt_luzaria_001",
            now_factory=_now,
        )
    assert pending.value.status_code == 409


@pytest.mark.asyncio
async def test_receipt_must_match_track_event_and_creator_pool():
    wrong_track = _outbox()
    wrong_track["event"]["track"]["track_id"] = "trk_other"

    wrong_event = _outbox()
    wrong_event["receipt"]["event_id"] = "evt_other"

    fee_deducted = _outbox()
    fee_deducted["receipt"]["amounts"]["platform_fee"] = "0.0400"

    for outbox, expected_status in (
        (wrong_track, 409),
        (wrong_event, 409),
        (fee_deducted, 422),
    ):
        db = FakeDB([_registered_track()], [outbox])
        with pytest.raises(HTTPException) as exc:
            await attach_archisynapse_receipt(
                db,
                track_id="trk_luzaria_001",
                event_id="evt_luzaria_001",
                now_factory=_now,
            )
        assert exc.value.status_code == expected_status


@pytest.mark.asyncio
async def test_catalog_track_must_exist_and_have_complete_proof():
    outbox = [_outbox()]

    missing_db = FakeDB([], outbox)
    with pytest.raises(HTTPException) as missing:
        await attach_archisynapse_receipt(
            missing_db,
            track_id="trk_luzaria_001",
            event_id="evt_luzaria_001",
            now_factory=_now,
        )
    assert missing.value.status_code == 404

    incomplete_db = FakeDB([_registered_track(proof_complete=False)], outbox)
    with pytest.raises(HTTPException) as incomplete:
        await attach_archisynapse_receipt(
            incomplete_db,
            track_id="trk_luzaria_001",
            event_id="evt_luzaria_001",
            now_factory=_now,
        )
    assert incomplete.value.status_code == 409
