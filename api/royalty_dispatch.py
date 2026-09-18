"""Fail-closed operator surface for the Lyrica royalty outbox.

The core outbox sender changes a persisted record to ``sending`` immediately
before transport. This wrapper validates all signing, endpoint, timeout, and
receipt-verification configuration first. A deployment mistake is therefore
recorded as a repairable ``pending`` obligation rather than leaving a ghost
``sending`` record or permanently discarding a creator obligation.
"""

from __future__ import annotations

import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable, Optional

from fastapi import APIRouter, HTTPException, Request

from .economic_truth_bridge import ensure_royalty_authorized
from .royalty_outbox import (
    _canonical_event_bytes,
    _clean_document,
    _event_headers,
    _events_url,
    _receipt_key_id,
    _receipt_public_key,
    _set_outbox_state,
    queue_flip_obligation,
    send_outbox_event,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat()


def _validate_dispatch_configuration(event: dict[str, Any], body: bytes) -> None:
    _event_headers(event, body)
    _events_url()
    _receipt_public_key()
    _receipt_key_id()
    timeout = float(os.getenv("ARCHISYNAPSE_V2_TIMEOUT_SECONDS", "10"))
    if timeout <= 0:
        raise ValueError("ARCHISYNAPSE_V2_TIMEOUT_SECONDS must be greater than zero")


async def safe_send_outbox_event(
    *,
    db: Any,
    event_id: str,
    transport=None,
    now_factory=None,
) -> dict[str, Any]:
    document = await db.royalty_outbox.find_one({"event_id": event_id}, {"_id": 0})
    if not document:
        raise HTTPException(status_code=404, detail="Royalty outbox event not found.")
    if document.get("state") in {"receipted", "rejected"}:
        return _clean_document(document)

    event = document.get("event")
    current_time = now_factory() if now_factory is not None else _now()
    if not isinstance(event, dict):
        await _set_outbox_state(
            db,
            event_id,
            {
                "state": "rejected",
                "last_error": {"code": "malformed_outbox_event"},
                "updated_at": _iso(current_time),
            },
        )
        return _clean_document(
            await db.royalty_outbox.find_one({"event_id": event_id}, {"_id": 0})
        )

    body = _canonical_event_bytes(event)
    if hashlib.sha256(body).hexdigest() != document.get("event_body_sha256"):
        await _set_outbox_state(
            db,
            event_id,
            {
                "state": "rejected",
                "last_error": {"code": "outbox_body_tampered"},
                "updated_at": _iso(current_time),
            },
        )
        return _clean_document(
            await db.royalty_outbox.find_one({"event_id": event_id}, {"_id": 0})
        )

    try:
        _validate_dispatch_configuration(event, body)
    except (HTTPException, ValueError, TypeError) as exc:
        detail = exc.detail if isinstance(exc, HTTPException) else str(exc)
        await _set_outbox_state(
            db,
            event_id,
            {
                "state": "pending",
                "last_error": {
                    "code": "configuration_error",
                    "message": str(detail)[:200],
                },
                "next_attempt_at": _iso(current_time + timedelta(seconds=60)),
                "updated_at": _iso(current_time),
            },
        )
        return _clean_document(
            await db.royalty_outbox.find_one({"event_id": event_id}, {"_id": 0})
        )

    document = await ensure_royalty_authorized(db, event_id)
    if document.get("state") in {"authorization_pending", "rejected"}:
        return _clean_document(document)
    event = document.get("event")
    body = _canonical_event_bytes(event)
    if hashlib.sha256(body).hexdigest() != document.get("event_body_sha256"):
        await _set_outbox_state(
            db, event_id, {
                "state": "rejected",
                "last_error": {"code": "authorized_outbox_body_tampered"},
                "updated_at": _iso(current_time),
            },
        )
        return _clean_document(await db.royalty_outbox.find_one({"event_id": event_id}, {"_id": 0}))
    try:
        _validate_dispatch_configuration(event, body)
    except (HTTPException, ValueError, TypeError) as exc:
        detail = exc.detail if isinstance(exc, HTTPException) else str(exc)
        await _set_outbox_state(db, event_id, {
            "state": "pending",
            "last_error": {"code": "configuration_error", "message": str(detail)[:200]},
            "next_attempt_at": _iso(current_time + timedelta(seconds=60)),
            "updated_at": _iso(current_time),
        })
        return _clean_document(await db.royalty_outbox.find_one({"event_id": event_id}, {"_id": 0}))

    kwargs: dict[str, Any] = {"db": db, "event_id": event_id}
    if transport is not None:
        kwargs["transport"] = transport
    if now_factory is not None:
        kwargs["now_factory"] = now_factory
    return await send_outbox_event(**kwargs)


def _default_context() -> tuple[Any, Path, Path]:
    import server  # type: ignore

    return server.db, Path(server.ROOT_DIR), Path(server.MUSIC_OUTPUT_DIR)


def _require_internal_operator(request: Request) -> None:
    allowed = {
        value.strip()
        for value in os.getenv(
            "LYRICA_ROYALTY_ALLOWED_SERVICES",
            "empire1-cofounder,lyrica3-backend",
        ).split(",")
        if value.strip()
    }
    service = request.headers.get("x-empire1-service", "")
    if service not in allowed:
        raise HTTPException(
            status_code=403,
            detail="Service is not allowed to operate the royalty outbox.",
        )
    expected = os.getenv("LYRICA_ROYALTY_INTERNAL_TOKEN", "").strip()
    if not expected:
        raise HTTPException(
            status_code=503,
            detail="Royalty outbox authentication is not configured.",
        )
    authorization = request.headers.get("authorization", "")
    supplied = (
        authorization.removeprefix("Bearer ").strip()
        if authorization.startswith("Bearer ")
        else ""
    )
    if not supplied or not hmac.compare_digest(supplied, expected):
        raise HTTPException(status_code=401, detail="Invalid royalty outbox credentials.")


def create_safe_royalty_outbox_router(
    context_provider: Optional[Callable[[], tuple[Any, Path, Path]]] = None,
) -> APIRouter:
    router = APIRouter(prefix="/internal/v1/royalties", tags=["internal-royalties"])
    context_provider = context_provider or _default_context

    @router.post("/queue/{child_track_reference}")
    async def queue(child_track_reference: str, http_request: Request):
        _require_internal_operator(http_request)
        db, root_dir, music_output_dir = context_provider()
        return await queue_flip_obligation(
            db=db,
            child_track_reference=child_track_reference,
            root_dir=root_dir,
            music_output_dir=music_output_dir,
        )

    @router.post("/send/{event_id}")
    async def send(event_id: str, http_request: Request):
        _require_internal_operator(http_request)
        db, _, _ = context_provider()
        return await safe_send_outbox_event(db=db, event_id=event_id)

    @router.post("/dispatch/{child_track_reference}")
    async def dispatch(child_track_reference: str, http_request: Request):
        _require_internal_operator(http_request)
        db, root_dir, music_output_dir = context_provider()
        queued = await queue_flip_obligation(
            db=db,
            child_track_reference=child_track_reference,
            root_dir=root_dir,
            music_output_dir=music_output_dir,
        )
        return await safe_send_outbox_event(db=db, event_id=queued["event_id"])

    @router.get("/outbox/{event_id}")
    async def get_outbox(event_id: str, http_request: Request):
        _require_internal_operator(http_request)
        db, _, _ = context_provider()
        document = await db.royalty_outbox.find_one(
            {"event_id": event_id}, {"_id": 0}
        )
        if not document:
            raise HTTPException(status_code=404, detail="Royalty outbox event not found.")
        return document

    return router
