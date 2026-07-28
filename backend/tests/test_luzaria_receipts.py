from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from api.luzaria_receipts import LuzariaReceiptClosure, attach_archisynapse_receipt


class FakeCatalog:
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
    def __init__(self, documents=None):
        self.artist_catalog = FakeCatalog(documents)


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


def _receipt(**overrides):
    payload = {
        "receipt_id": "rcp_luzaria_001",
        "event_id": "evt_luzaria_001",
        "transaction_id": "txn_luzaria_001",
        "ledger_transaction_id": "ldg_luzaria_001",
        "status": "paid",
        "gross": "1.2500",
        "net": "1.2500",
        "platform_fee": "0.0000",
    }
    payload.update(overrides)
    return LuzariaReceiptClosure(**payload)


@pytest.mark.asyncio
async def test_receipt_closure_is_persisted_and_marks_royalty_closed():
    db = FakeDB([_registered_track()])

    result = await attach_archisynapse_receipt(
        db,
        track_id="trk_luzaria_001",
        payload=_receipt(),
        now_factory=_now,
    )

    assert result["archisynapse_receipt_id"] == "rcp_luzaria_001"
    assert result["royalty_closed"] is True
    assert result["release_status"] == "royalty_closed"
    assert result["archisynapse_receipt"]["platform_fee"] == "0.0000"


@pytest.mark.asyncio
async def test_same_receipt_retry_is_idempotent():
    db = FakeDB(
        [
            _registered_track(
                royalty_closed=True,
                archisynapse_receipt_id="rcp_luzaria_001",
                archisynapse_receipt=_receipt().model_dump(),
            )
        ]
    )

    result = await attach_archisynapse_receipt(
        db,
        track_id="trk_luzaria_001",
        payload=_receipt(),
        now_factory=_now,
    )

    assert result["archisynapse_receipt_id"] == "rcp_luzaria_001"


@pytest.mark.asyncio
async def test_different_receipt_cannot_replace_closed_record():
    db = FakeDB(
        [
            _registered_track(
                royalty_closed=True,
                archisynapse_receipt_id="rcp_original",
            )
        ]
    )

    with pytest.raises(HTTPException) as exc:
        await attach_archisynapse_receipt(
            db,
            track_id="trk_luzaria_001",
            payload=_receipt(receipt_id="rcp_replacement"),
            now_factory=_now,
        )
    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_receipt_rejects_platform_fee_or_unpaid_status():
    db = FakeDB([_registered_track()])

    for payload in (
        _receipt(platform_fee="0.0400"),
        _receipt(status="pending"),
    ):
        with pytest.raises(HTTPException) as exc:
            await attach_archisynapse_receipt(
                db,
                track_id="trk_luzaria_001",
                payload=payload,
                now_factory=_now,
            )
        assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_receipt_requires_registered_proof_complete_track():
    missing_db = FakeDB()
    with pytest.raises(HTTPException) as missing:
        await attach_archisynapse_receipt(
            missing_db,
            track_id="trk_missing",
            payload=_receipt(),
            now_factory=_now,
        )
    assert missing.value.status_code == 404

    incomplete_db = FakeDB([_registered_track(proof_complete=False)])
    with pytest.raises(HTTPException) as incomplete:
        await attach_archisynapse_receipt(
            incomplete_db,
            track_id="trk_luzaria_001",
            payload=_receipt(),
            now_factory=_now,
        )
    assert incomplete.value.status_code == 409
