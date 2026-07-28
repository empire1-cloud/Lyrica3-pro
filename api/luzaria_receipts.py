from __future__ import annotations

import copy
from datetime import datetime, timezone
from typing import Any, Callable, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from .luzaria import _require_internal_operator, load_luzaria_canon


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class LuzariaReceiptClosure(BaseModel):
    event_id: str = Field(min_length=1)


def _validate_verified_outbox(document: Optional[dict[str, Any]], track_id: str) -> dict[str, Any]:
    if not document:
        raise HTTPException(status_code=404, detail="Verified Archisynapse outbox event was not found.")
    if document.get("state") != "receipted":
        raise HTTPException(status_code=409, detail="Archisynapse outbox event is not receipted.")

    event = document.get("event")
    receipt = document.get("receipt")
    if not isinstance(event, dict) or not isinstance(receipt, dict):
        raise HTTPException(status_code=409, detail="Archisynapse outbox evidence is incomplete.")

    event_track_id = event.get("track", {}).get("track_id")
    if event_track_id != track_id:
        raise HTTPException(status_code=409, detail="Archisynapse receipt is bound to a different track.")

    receipt_id = receipt.get("receipt_id")
    if not isinstance(receipt_id, str) or not receipt_id:
        raise HTTPException(status_code=409, detail="Archisynapse receipt ID is missing.")
    if receipt.get("event_id") != event.get("event_id"):
        raise HTTPException(status_code=409, detail="Archisynapse receipt event binding is invalid.")

    amounts = receipt.get("amounts")
    if not isinstance(amounts, dict):
        raise HTTPException(status_code=409, detail="Archisynapse receipt amounts are missing.")
    if (
        receipt.get("status") != "paid"
        or amounts.get("gross") != "1.2500"
        or amounts.get("net") != "1.2500"
        or amounts.get("platform_fee") != "0.0000"
    ):
        raise HTTPException(status_code=422, detail="Archisynapse receipt violates Luzaria's paid creator-pool invariant.")
    return receipt


async def attach_archisynapse_receipt(
    db: Any,
    *,
    track_id: str,
    event_id: str,
    now_factory: Callable[[], datetime] = _utc_now,
) -> dict[str, Any]:
    artist_id = load_luzaria_canon()["artist_id"]
    catalog_document = await db.artist_catalog.find_one(
        {"artist_id": artist_id, "track_id": track_id},
        {"_id": 0},
    )
    if not catalog_document:
        raise HTTPException(status_code=404, detail="Luzaria catalog track is not registered.")
    if not catalog_document.get("proof_complete"):
        raise HTTPException(status_code=409, detail="Luzaria track proof must be complete before royalty closure.")

    outbox_document = await db.royalty_outbox.find_one(
        {"event_id": event_id},
        {"_id": 0},
    )
    receipt = _validate_verified_outbox(outbox_document, track_id)
    receipt_id = receipt["receipt_id"]

    existing_receipt_id = catalog_document.get("archisynapse_receipt_id")
    if existing_receipt_id:
        if existing_receipt_id != receipt_id:
            raise HTTPException(status_code=409, detail="Luzaria royalty receipt is append-only and already closed.")
        return catalog_document

    closure = {
        "archisynapse_receipt_id": receipt_id,
        "archisynapse_event_id": event_id,
        "archisynapse_receipt": copy.deepcopy(receipt),
        "royalty_closed": True,
        "release_status": "royalty_closed",
        "royalty_closed_at": now_factory().astimezone(timezone.utc).isoformat(),
    }
    await db.artist_catalog.update_one(
        {"artist_id": artist_id, "track_id": track_id, "archisynapse_receipt_id": None},
        {"$set": copy.deepcopy(closure)},
    )
    updated = await db.artist_catalog.find_one(
        {"artist_id": artist_id, "track_id": track_id},
        {"_id": 0},
    )
    if not updated or updated.get("archisynapse_receipt_id") != receipt_id:
        raise HTTPException(status_code=409, detail="Luzaria royalty receipt closure did not persist.")
    return updated


def _default_db() -> Any:
    import server  # type: ignore

    return server.db


def create_luzaria_receipt_router(db_provider: Optional[Callable[[], Any]] = None) -> APIRouter:
    router = APIRouter(tags=["luzaria"])
    db_provider = db_provider or _default_db

    @router.post("/internal/v1/artist/luzaria/catalog/{track_id}/receipt")
    async def close_royalty(track_id: str, payload: LuzariaReceiptClosure, request: Request):
        _require_internal_operator(request)
        return await attach_archisynapse_receipt(
            db_provider(),
            track_id=track_id,
            event_id=payload.event_id,
        )

    return router
