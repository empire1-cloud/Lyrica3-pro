"""FABLE-5 authorization bridge for Lyrica royalty obligations.

The royalty obligation is persisted first. Dispatch remains fail-closed until
FABLE-5 returns an authorization receipt and SLA113 returns the shared action id.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import os
from datetime import datetime, timedelta, timezone
from typing import Any
import urllib.error
import urllib.request

def _canonical_event_bytes(event: dict[str, Any]) -> bytes:
    return json.dumps(event, sort_keys=True, separators=(",", ":")).encode("utf-8")


def _post_json(url: str, payload: dict[str, Any], headers: dict[str, str], timeout: float) -> tuple[int, dict[str, Any]]:
    request = urllib.request.Request(
        url=url,
        data=json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8"),
        headers={"Content-Type": "application/json", **headers},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read()
        try:
            return exc.code, json.loads(body.decode("utf-8"))
        except Exception:
            return exc.code, {"reason": body.decode("utf-8", "replace")[:300]}


async def ensure_royalty_authorized(db: Any, event_id: str, transport=_post_json) -> dict[str, Any]:
    document = await db.royalty_outbox.find_one({"event_id": event_id}, {"_id": 0})
    if not document:
        raise RuntimeError("Royalty outbox event not found")
    event = document.get("event") or {}
    existing = event.get("economic_truth")
    if isinstance(existing, dict) and existing.get("action_id") and existing.get("authorization_receipt_id"):
        return document

    url = os.getenv("FABLE5_ECONOMIC_AUTH_URL", "").strip()
    service_key = os.getenv("FABLE5_ECONOMIC_SERVICE_KEY", "").strip()
    tenant_id = os.getenv("FABLE5_LYRICA_TENANT_ID", "").strip()
    token_id = os.getenv("FABLE5_LYRICA_ROYALTY_INTENT_TOKEN_ID", "").strip()
    if not all((url, service_key, tenant_id, token_id)):
        error = "FABLE-5 royalty authorization is not configured"
        await db.royalty_outbox.update_one(
            {"event_id": event_id},
            {"$set": {
                "state": "authorization_pending",
                "last_error": {"code": "authorization_configuration_error", "message": error},
                "next_attempt_at": (datetime.now(timezone.utc) + timedelta(seconds=60)).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
        return await db.royalty_outbox.find_one({"event_id": event_id}, {"_id": 0})

    amount = event.get("amount") or {}
    payload = {
        "tenantId": tenant_id,
        "tokenId": token_id,
        "request": {
            "action": "creator.royalty_payout",
            "vendorOrSystem": "archisynapse-v2",
            "amount": amount.get("value"),
            "currency": amount.get("currency"),
            "environment": os.getenv("LYRICA_ECONOMIC_ENVIRONMENT", "sandbox"),
            "idempotencyKey": event["idempotency_key"],
            "charterId": os.getenv("LYRICA_CHARTER_ID", "lyrica-creator-ownership-charter-v1"),
            "policyId": os.getenv("LYRICA_ROYALTY_POLICY_ID", "lyrica-royalty-policy-v1"),
            "target": {
                "track_id": event.get("track_id"),
                "creator_id": event.get("creator_id"),
                "recipient_id": event.get("recipient_id"),
            },
            "evidence": {
                "source": "lyrica-vics",
                "coverage_surfaces": ["lyrica.vics", "lyrica.royalty"],
                "vics_proof_id": event.get("vics_proof_id"),
                "dna_tag": event.get("dna_tag"),
                "soulprint_hash": event.get("soulprint_hash"),
                "provenance": event.get("provenance"),
            },
        },
    }
    try:
        status, response = await asyncio.to_thread(
            transport,
            url,
            payload,
            {"X-Empire-Service-Key": service_key},
            float(os.getenv("FABLE5_ECONOMIC_TIMEOUT_SECONDS", "8")),
        )
    except Exception as exc:
        status, response = 503, {"reason": str(exc)}

    if status != 200 or not response.get("allowed") or not response.get("economicTruthActionId"):
        state = "rejected" if status in {400, 401, 403, 409} else "authorization_pending"
        await db.royalty_outbox.update_one(
            {"event_id": event_id},
            {"$set": {
                "state": state,
                "last_error": {
                    "code": response.get("code", "authorization_refused"),
                    "message": response.get("reason", f"FABLE-5 HTTP {status}"),
                },
                "next_attempt_at": (datetime.now(timezone.utc) + timedelta(seconds=60)).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
        return await db.royalty_outbox.find_one({"event_id": event_id}, {"_id": 0})

    event["economic_truth"] = {
        "contract_version": "empire1.economic-event.v1",
        "action_id": response["economicTruthActionId"],
        "authorization_receipt_id": response["receipt"]["receipt_id"],
        "intent_token_id": token_id,
        "authorized_by": "fable-5",
    }
    body_hash = hashlib.sha256(_canonical_event_bytes(event)).hexdigest()
    await db.royalty_outbox.update_one(
        {"event_id": event_id},
        {"$set": {
            "event": event,
            "event_body_sha256": body_hash,
            "state": "pending",
            "last_error": None,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return await db.royalty_outbox.find_one({"event_id": event_id}, {"_id": 0})
