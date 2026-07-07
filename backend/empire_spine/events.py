"""
Event envelopes + HMAC signing for the Empire Spine.

Contract: empire1-lyrica-ecosystem/contracts/track_generated.v1.schema.json

Stdlib only — no new dependencies.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


SCHEMA_VERSION = "1.0"
PRODUCER = "lyrica3-pro/backend"

# Rotating signing key. NEVER hardcode. Set both sides:
#   Lyrica:       EMPIRE_SPINE_SIGNING_KEY / EMPIRE_SPINE_SIGNING_KEY_ID
#   ArchiSynapse: same values, used to verify.
ENV_SIGNING_KEY = "EMPIRE_SPINE_SIGNING_KEY"
ENV_SIGNING_KEY_ID = "EMPIRE_SPINE_SIGNING_KEY_ID"


class EventSigningError(RuntimeError):
    pass


def _signing_key() -> bytes:
    key = os.environ.get(ENV_SIGNING_KEY, "")
    if not key:
        raise EventSigningError(
            f"{ENV_SIGNING_KEY} is not set. Refusing to emit unsigned trust events. "
            "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
        )
    return key.encode("utf-8")


def canonical_json(obj: Dict[str, Any]) -> bytes:
    """Deterministic JSON: sorted keys, no whitespace, UTF-8."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sign_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """Return a copy of the event with `signature` and `signing_key_id` set.

    Signature = HMAC-SHA256 over canonical JSON of the event WITHOUT the
    signature/signing_key_id fields.
    """
    body = {k: v for k, v in event.items() if k not in ("signature", "signing_key_id")}
    digest = hmac.new(_signing_key(), canonical_json(body), hashlib.sha256).hexdigest()
    signed = dict(event)
    signed["signature"] = f"hmac-sha256:{digest}"
    signed["signing_key_id"] = os.environ.get(ENV_SIGNING_KEY_ID, "default")
    return signed


def verify_event(event: Dict[str, Any]) -> bool:
    """Consumer-side verification. Constant-time compare."""
    provided = event.get("signature", "")
    if not provided.startswith("hmac-sha256:"):
        return False
    body = {k: v for k, v in event.items() if k not in ("signature", "signing_key_id")}
    expected = hmac.new(_signing_key(), canonical_json(body), hashlib.sha256).hexdigest()
    return hmac.compare_digest(provided[len("hmac-sha256:"):], expected)


def sha256_of_files(paths: List[str]) -> str:
    """Content hash over artifact files in the given (sorted) order."""
    h = hashlib.sha256()
    for p in sorted(paths):
        with open(p, "rb") as f:
            for chunk in iter(lambda: f.read(1 << 20), b""):
                h.update(chunk)
    return f"sha256:{h.hexdigest()}"


def sha256_of_obj(obj: Any) -> str:
    return f"sha256:{hashlib.sha256(canonical_json(obj if isinstance(obj, dict) else {'v': obj})).hexdigest()}"


def build_track_generated(
    dna_tag: str,
    content_hash: str,
    stakeholders: Dict[str, str],
    royalty_split: Dict[str, float],
    track_title: Optional[str] = None,
    core_genre: Optional[str] = None,
    cultural_lens: Optional[str] = None,
    cognitive_history: Optional[Dict[str, Any]] = None,
    canon_lock_ref: Optional[str] = None,
    artifacts: Optional[Dict[str, Any]] = None,
    ai_models_used: Optional[List[str]] = None,
    source_transaction_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Build and sign a track.generated v1.0 event.

    Raises ValueError on a bad royalty split — a wrong split must never
    leave the building.
    """
    if not dna_tag.startswith("trk_"):
        raise ValueError(f"dna_tag must start with 'trk_': {dna_tag}")
    if not content_hash.startswith("sha256:"):
        raise ValueError("content_hash must be 'sha256:<hex>' — use sha256_of_files()")
    if not stakeholders:
        raise ValueError("stakeholders must not be empty")

    total_pct = sum(royalty_split.get(role, 0.0) for role in stakeholders)
    if not (99.8 <= total_pct <= 100.2):
        raise ValueError(
            f"royalty_split for present stakeholders sums to {total_pct:.1f}% (expected ~100%). "
            f"stakeholders={list(stakeholders)} split={royalty_split}"
        )

    event: Dict[str, Any] = {
        "event_id": str(uuid.uuid4()),
        "event_type": "track.generated",
        "schema_version": SCHEMA_VERSION,
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "producer": PRODUCER,
        "dna_tag": dna_tag,
        "content_hash": content_hash,
        "stakeholders": stakeholders,
        "royalty_split": royalty_split,
    }
    if track_title:
        event["track_title"] = track_title
    if core_genre:
        event["core_genre"] = core_genre
    if cultural_lens:
        event["cultural_lens"] = cultural_lens
    if cognitive_history is not None:
        event["cognitive_history_hash"] = sha256_of_obj(cognitive_history)
    if canon_lock_ref:
        event["canon_lock_ref"] = canon_lock_ref
    if artifacts:
        event["artifacts"] = artifacts
    if ai_models_used:
        event["ai_models_used"] = ai_models_used
    if source_transaction_id:
        event["source_transaction_id"] = source_transaction_id

    return sign_event(event)
