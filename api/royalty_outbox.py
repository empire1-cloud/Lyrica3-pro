"""Durable Lyrica -> Archisynapse v2 royalty obligation outbox.

Canonical boundary:

    Lyrica creates a royalty obligation -> persists it -> signs exact bytes
    -> Archisynapse gateway verifies/decides -> transaction service posts
    -> Archisynapse returns a signed receipt -> Lyrica persists it unchanged.

This module never writes to a financial ledger and never fabricates a paid
state. The legacy Archisynapse adapter remains untouched for compatibility.
"""

from __future__ import annotations

import asyncio
import base64
import hashlib
import hmac
import json
import os
import secrets
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_FLOOR
from pathlib import Path
from typing import Any, Callable, Optional

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from fastapi import APIRouter, HTTPException, Request

from .vics_bridge import _stable_creator_id, issue_track_proof


TENANT_ID = "lyrica"
ROYALTY_AMOUNT = "1.2500"
CROCKFORD32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
PERMANENT_HTTP_CODES = {400, 401, 403, 409}
SUCCESS_HTTP_CODES = {200, 201, 422}


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat()


def _new_ulid() -> str:
    timestamp_ms = int(time.time() * 1000)
    value = (timestamp_ms << 80) | int.from_bytes(secrets.token_bytes(10), "big")
    chars = []
    for shift in range(125, -1, -5):
        chars.append(CROCKFORD32[(value >> shift) & 31])
    return "".join(chars)


def _canonical_event_bytes(event: dict[str, Any]) -> bytes:
    return json.dumps(event, sort_keys=True, separators=(",", ":")).encode("utf-8")


def _receipt_signing_bytes(receipt: dict[str, Any]) -> bytes:
    unsigned = {key: value for key, value in receipt.items() if key != "signature"}
    # Archisynapse v2 signs json.dumps(..., sort_keys=True) with default
    # separators. Match that exact contract instead of normalizing it.
    return json.dumps(unsigned, sort_keys=True).encode("utf-8")


def _decode_b64(value: str, field_name: str) -> bytes:
    try:
        return base64.b64decode(value, validate=True)
    except Exception as exc:  # noqa: BLE001 - normalize secret configuration errors
        raise HTTPException(status_code=503, detail=f"Invalid {field_name} configuration.") from exc


def _tenant_private_key() -> Ed25519PrivateKey:
    encoded = os.getenv("LYRICA_ARCHISYNAPSE_ED25519_PRIVATE_KEY_B64", "").strip()
    if not encoded:
        raise HTTPException(status_code=503, detail="Lyrica event signing key is not configured.")
    raw = _decode_b64(encoded, "Lyrica event signing key")
    if len(raw) != 32:
        raise HTTPException(status_code=503, detail="Lyrica event signing key must be 32 raw bytes.")
    return Ed25519PrivateKey.from_private_bytes(raw)


def _tenant_api_key() -> str:
    value = os.getenv("ARCHISYNAPSE_V2_TENANT_API_KEY", "").strip()
    if not value:
        raise HTTPException(status_code=503, detail="Archisynapse tenant API key is not configured.")
    return value


def _events_url() -> str:
    value = os.getenv("ARCHISYNAPSE_V2_EVENTS_URL", "").strip()
    if not value:
        raise HTTPException(status_code=503, detail="Archisynapse events URL is not configured.")
    return value


def _tenant_key_id() -> str:
    value = os.getenv("LYRICA_ARCHISYNAPSE_KEY_ID", "").strip()
    if not value:
        raise HTTPException(status_code=503, detail="Lyrica event key ID is not configured.")
    return value


def _receipt_public_key() -> Ed25519PublicKey:
    encoded = os.getenv("ARCHISYNAPSE_RECEIPT_PUBLIC_KEY_B64", "").strip()
    if not encoded:
        raise HTTPException(status_code=503, detail="Archisynapse receipt public key is not configured.")
    raw = _decode_b64(encoded, "Archisynapse receipt public key")
    if len(raw) != 32:
        raise HTTPException(status_code=503, detail="Archisynapse receipt public key must be 32 raw bytes.")
    return Ed25519PublicKey.from_public_bytes(raw)


def _receipt_key_id() -> str:
    return os.getenv("ARCHISYNAPSE_RECEIPT_KEY_ID", "arch-rcpt-k1").strip() or "arch-rcpt-k1"


def _event_headers(event: dict[str, Any], body: bytes) -> dict[str, str]:
    signature = _tenant_private_key().sign(body)
    return {
        "Authorization": f"Bearer {_tenant_api_key()}",
        "Content-Type": "application/json; charset=utf-8",
        "X-Empire1-Key-Id": _tenant_key_id(),
        "X-Empire1-Signature": f"ed25519={base64.b64encode(signature).decode('ascii')}",
        "X-Correlation-Id": event["correlation_id"],
        "Idempotency-Key": event["idempotency_key"],
    }


def _stable_actor_id(handle: str) -> str:
    digest = hashlib.sha256(handle.strip().lower().encode("utf-8")).hexdigest()
    return f"usr_{digest[:20]}"


def _fractions_to_bps(royalty_chain: dict[str, Any]) -> list[dict[str, Any]]:
    """Convert creator fractions to deterministic integer basis points.

    Fractions are normalized, floored, then remaining basis points are assigned
    by largest fractional remainder. Ties break by owner_id so every retry and
    every runtime produces identical output.
    """
    normalized: list[tuple[str, Decimal]] = []
    total = Decimal("0")
    for handle, raw_fraction in royalty_chain.items():
        fraction = Decimal(str(raw_fraction))
        if fraction <= 0:
            continue
        owner_id = _stable_creator_id(str(handle))
        normalized.append((owner_id, fraction))
        total += fraction
    if not normalized or total <= 0:
        raise HTTPException(status_code=422, detail="Royalty chain is empty.")

    rows: list[dict[str, Any]] = []
    floor_sum = 0
    for owner_id, fraction in normalized:
        exact = (fraction / total) * Decimal(10000)
        floor_value = int(exact.to_integral_value(rounding=ROUND_FLOOR))
        floor_sum += floor_value
        rows.append(
            {
                "owner_id": owner_id,
                "bps": floor_value,
                "remainder": exact - Decimal(floor_value),
            }
        )

    remaining = 10000 - floor_sum
    order = sorted(
        range(len(rows)),
        key=lambda index: (-rows[index]["remainder"], rows[index]["owner_id"]),
    )
    for index in order[:remaining]:
        rows[index]["bps"] += 1

    result = [
        {"owner_id": row["owner_id"], "bps": row["bps"]}
        for row in sorted(rows, key=lambda item: item["owner_id"])
        if row["bps"] > 0
    ]
    if sum(row["bps"] for row in result) != 10000:
        raise HTTPException(status_code=500, detail="Royalty basis-point invariant failed.")
    return result


def _clean_document(document: Optional[dict[str, Any]]) -> Optional[dict[str, Any]]:
    if not document:
        return document
    cleaned = dict(document)
    cleaned.pop("_id", None)
    return cleaned


async def _find_track(db: Any, reference: str) -> Optional[dict[str, Any]]:
    return await db.tracks.find_one(
        {
            "$or": [
                {"id": reference},
                {"canonical_track_id": reference},
                {"dna_tag": reference},
            ]
        },
        {"_id": 0},
    )


async def queue_flip_obligation(
    *,
    db: Any,
    child_track_reference: str,
    root_dir: Path,
    music_output_dir: Path,
    id_factory: Callable[[], str] = _new_ulid,
    now_factory: Callable[[], datetime] = _utc_now,
) -> dict[str, Any]:
    child = await _find_track(db, child_track_reference)
    if not child:
        raise HTTPException(status_code=404, detail="Flip track not found.")
    parent_dna = str(child.get("parent_dna") or "")
    if not parent_dna:
        raise HTTPException(status_code=422, detail="Track is not a Flip derivative.")

    child_ref = str(
        child.get("canonical_track_id")
        or child.get("id")
        or child.get("dna_tag")
        or child_track_reference
    )
    source_ref = f"lyrica://remix/{child_ref}"
    existing = await db.royalty_outbox.find_one({"source_ref": source_ref}, {"_id": 0})
    if existing:
        return existing

    parent = await _find_track(db, parent_dna)
    if not parent:
        raise HTTPException(status_code=422, detail="Flip parent track is unavailable.")
    parent_reference = str(parent.get("id") or parent.get("canonical_track_id") or parent_dna)
    proof = await issue_track_proof(
        db=db,
        track_id=parent_reference,
        root_dir=root_dir,
        music_output_dir=music_output_dir,
    )

    royalty_chain = child.get("royalty_chain")
    if not isinstance(royalty_chain, dict) or not royalty_chain:
        raise HTTPException(status_code=422, detail="Flip royalty chain is unavailable.")
    splits = _fractions_to_bps(royalty_chain)

    event_id = id_factory()
    correlation_id = id_factory()
    idempotency_key = id_factory()
    now = now_factory()
    actor_handle = str(child.get("creator") or "")
    if not actor_handle:
        raise HTTPException(status_code=422, detail="Flip actor identity is unavailable.")

    event = {
        "schema_version": "1.0",
        "event_id": event_id,
        "event_type": "royalty.obligation.created",
        "occurred_at": _iso(now),
        "correlation_id": correlation_id,
        "idempotency_key": idempotency_key,
        "tenant_id": TENANT_ID,
        "track": {
            "track_id": proof["track_id"],
            "dna_tag": proof["dna_tag"],
            "soulprint_hash": proof["soulprint_hash"],
            "vics_proof": {
                "proof_id": proof["proof_id"],
                "issued_at": proof["issued_at"],
                "chain_ref": f"vics://empire1/lyrica/{proof['track_id']}",
            },
        },
        "creator": {
            "creator_id": proof["creator_id"],
            "identity_ref": proof["identity_ref"],
        },
        "splits": splits,
        "trigger": {
            "kind": "remix",
            "source_ref": source_ref,
            "actor_id": _stable_actor_id(actor_handle),
        },
        "amount": {"currency": "USD", "value": ROYALTY_AMOUNT},
    }
    body = _canonical_event_bytes(event)
    outbox = {
        "event_id": event_id,
        "correlation_id": correlation_id,
        "idempotency_key": idempotency_key,
        "source_ref": source_ref,
        "child_track_reference": child_ref,
        "parent_track_id": proof["track_id"],
        "state": "pending",
        "attempts": 0,
        "event": event,
        "event_body_sha256": hashlib.sha256(body).hexdigest(),
        "receipt": None,
        "last_error": None,
        "next_attempt_at": _iso(now),
        "created_at": _iso(now),
        "updated_at": _iso(now),
    }
    await db.royalty_outbox.insert_one(dict(outbox))
    return outbox


def _post_bytes(
    url: str,
    body: bytes,
    headers: dict[str, str],
    timeout_seconds: float,
) -> tuple[int, bytes]:
    request = urllib.request.Request(url=url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as error:
        return error.code, error.read()


def _verify_receipt(receipt: object, event: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(receipt, dict):
        raise ValueError("receipt is not an object")
    signature = receipt.get("signature")
    if not isinstance(signature, dict):
        raise ValueError("receipt signature is missing")
    if signature.get("alg") != "ed25519" or signature.get("key_id") != _receipt_key_id():
        raise ValueError("receipt signing identity is invalid")
    try:
        signature_bytes = base64.b64decode(signature.get("value", ""), validate=True)
        _receipt_public_key().verify(signature_bytes, _receipt_signing_bytes(receipt))
    except (InvalidSignature, ValueError, TypeError) as exc:
        raise ValueError("receipt signature does not verify") from exc

    if receipt.get("event_id") != event["event_id"]:
        raise ValueError("receipt event_id mismatch")
    if receipt.get("correlation_id") != event["correlation_id"]:
        raise ValueError("receipt correlation_id mismatch")
    amounts = receipt.get("amounts")
    if not isinstance(amounts, dict):
        raise ValueError("receipt amounts are missing")
    if amounts.get("gross") != ROYALTY_AMOUNT:
        raise ValueError("receipt gross amount mismatch")
    if amounts.get("net") != ROYALTY_AMOUNT or amounts.get("platform_fee") != "0.0000":
        raise ValueError("receipt creator-pool invariant failed")
    return receipt


async def _set_outbox_state(db: Any, event_id: str, values: dict[str, Any]) -> None:
    await db.royalty_outbox.update_one({"event_id": event_id}, {"$set": values})


async def send_outbox_event(
    *,
    db: Any,
    event_id: str,
    transport: Callable[[str, bytes, dict[str, str], float], tuple[int, bytes]] = _post_bytes,
    now_factory: Callable[[], datetime] = _utc_now,
) -> dict[str, Any]:
    document = await db.royalty_outbox.find_one({"event_id": event_id}, {"_id": 0})
    if not document:
        raise HTTPException(status_code=404, detail="Royalty outbox event not found.")
    if document.get("state") in {"receipted", "rejected"}:
        return document

    event = document.get("event")
    if not isinstance(event, dict):
        raise HTTPException(status_code=500, detail="Royalty outbox event is malformed.")
    body = _canonical_event_bytes(event)
    if hashlib.sha256(body).hexdigest() != document.get("event_body_sha256"):
        await _set_outbox_state(
            db,
            event_id,
            {
                "state": "rejected",
                "last_error": {"code": "outbox_body_tampered"},
                "updated_at": _iso(now_factory()),
            },
        )
        raise HTTPException(status_code=409, detail="Royalty outbox body integrity failed.")

    attempt = int(document.get("attempts", 0)) + 1
    now = now_factory()
    await _set_outbox_state(
        db,
        event_id,
        {
            "state": "sending",
            "attempts": attempt,
            "last_attempt_at": _iso(now),
            "updated_at": _iso(now),
        },
    )

    try:
        headers = _event_headers(event, body)
        timeout_seconds = float(os.getenv("ARCHISYNAPSE_V2_TIMEOUT_SECONDS", "10"))
        status_code, response_body = await asyncio.to_thread(
            transport,
            _events_url(),
            body,
            headers,
            timeout_seconds,
        )
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001 - transport failures are retryable
        retry_at = now + timedelta(seconds=min(120, 5 * (2 ** min(attempt, 5))))
        await _set_outbox_state(
            db,
            event_id,
            {
                "state": "pending",
                "last_error": {"code": "network_error", "message": str(exc)[:200]},
                "next_attempt_at": _iso(retry_at),
                "updated_at": _iso(now),
            },
        )
        return _clean_document(await db.royalty_outbox.find_one({"event_id": event_id}, {"_id": 0}))

    try:
        payload = json.loads(response_body.decode("utf-8")) if response_body else {}
    except (UnicodeDecodeError, json.JSONDecodeError):
        payload = {"code": "invalid_response", "message": "Archisynapse returned non-JSON data"}

    if status_code in SUCCESS_HTTP_CODES:
        try:
            receipt = _verify_receipt(payload, event)
        except (ValueError, HTTPException) as exc:
            await _set_outbox_state(
                db,
                event_id,
                {
                    "state": "rejected",
                    "last_error": {"code": "invalid_receipt", "message": str(exc)[:200]},
                    "raw_response": payload,
                    "updated_at": _iso(now),
                },
            )
        else:
            state = "receipted" if status_code in {200, 201} else "rejected"
            await _set_outbox_state(
                db,
                event_id,
                {
                    "state": state,
                    "receipt": receipt,
                    "receipt_id": receipt.get("receipt_id"),
                    "last_error": None if state == "receipted" else {
                        "code": receipt.get("decision", {}).get("policy", "ownership_rejected")
                    },
                    "receipted_at": _iso(now),
                    "updated_at": _iso(now),
                },
            )
    elif status_code == 503:
        retry_at = now + timedelta(seconds=min(120, 5 * (2 ** min(attempt, 5))))
        await _set_outbox_state(
            db,
            event_id,
            {
                "state": "pending",
                "last_error": payload,
                "next_attempt_at": _iso(retry_at),
                "updated_at": _iso(now),
            },
        )
    elif status_code in PERMANENT_HTTP_CODES:
        await _set_outbox_state(
            db,
            event_id,
            {
                "state": "rejected",
                "last_error": {"http_status": status_code, "response": payload},
                "updated_at": _iso(now),
            },
        )
    else:
        retryable = status_code >= 500
        await _set_outbox_state(
            db,
            event_id,
            {
                "state": "pending" if retryable else "rejected",
                "last_error": {"http_status": status_code, "response": payload},
                "next_attempt_at": _iso(now + timedelta(seconds=30)) if retryable else None,
                "updated_at": _iso(now),
            },
        )

    result = await db.royalty_outbox.find_one({"event_id": event_id}, {"_id": 0})
    return _clean_document(result)


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
        raise HTTPException(status_code=403, detail="Service is not allowed to operate the royalty outbox.")
    expected = os.getenv("LYRICA_ROYALTY_INTERNAL_TOKEN", "").strip()
    if not expected:
        raise HTTPException(status_code=503, detail="Royalty outbox authentication is not configured.")
    authorization = request.headers.get("authorization", "")
    supplied = authorization.removeprefix("Bearer ").strip() if authorization.startswith("Bearer ") else ""
    if not supplied or not hmac.compare_digest(supplied, expected):
        raise HTTPException(status_code=401, detail="Invalid royalty outbox credentials.")


def create_royalty_outbox_router(
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
        return await send_outbox_event(db=db, event_id=event_id)

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
        return await send_outbox_event(db=db, event_id=queued["event_id"])

    @router.get("/outbox/{event_id}")
    async def get_outbox(event_id: str, http_request: Request):
        _require_internal_operator(http_request)
        db, _, _ = context_provider()
        document = await db.royalty_outbox.find_one({"event_id": event_id}, {"_id": 0})
        if not document:
            raise HTTPException(status_code=404, detail="Royalty outbox event not found.")
        return document

    return router
