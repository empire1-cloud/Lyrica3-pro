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
    receipt_id: str = Field(min_length=1)
    event_id: str = Field(min_length=1)
    transaction_id: str = Field(min_length=1)
    ledger_transaction_id: str = Field(min_length=1)
    status: str = "paid"
    gross: str = "1.2500"
    net: str = "1.2500"
    platform_fee: str = "0.0000"


def _validate_creator_pool(payload: LuzariaReceiptClosure) -> None:
    if payload.status != "paid":
        raise HTTPException(status_code=422, detail="Only a paid Archisynapse receipt can close Luzaria's royalty gate.")
    if payload.gross != "1.2500" or payload.net != "1.2500" or payload.platform_fee != "0.0000":
        raise HTTPException(status_code=422, detail="Archisynapse receipt violates the Luzaria creator-pool invariant.")


async def attach_archisynapse_receipt(
    db: Any,
    *,
    track_id: str,
    payload: LuzariaReceiptClosure,
    now_factory: Callable[[], datetime] = _utc_now,
) -> dict[str, Any]:
    _validate_creator_pool(payload)
    artist_id = load_luzaria_canon()["artist_id"]
    document = await db.artist_catalog.find_one(
        {"artist_id": artist_id, "track_id": track_id},
        {"_id": 0},
    )
    if not document:
        raise HTTPException(status_code=404, detail="Luzaria catalog track is not registered.")
    if not document.get("proof_complete"):
        raise HTTPException(status_code=409, detail="Luzaria track proof must be complete before royalty closure.")

    existing_receipt_id = document.get("archisynapse_receipt_id")
    if existing_receipt_id:
        if existing_receipt_id != payload.receipt_id:
            raise HTTPException(status_code=409, detail="Luzaria royalty receipt is append-only and already closed.")
        return document

    closure = {
        "archisynapse_receipt_id": payload.receipt_id,
        "archisynapse_receipt": payload.model_dump(),
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
    if not updated or updated.get("archisynapse_receipt_id") != payload.receipt_id:
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
            payload=payload,
        )

    return router
