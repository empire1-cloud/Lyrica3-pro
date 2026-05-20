"""
Empire 1 · VICS Ledger — Cryptographic Track Signing
=====================================================
HMAC-SHA256 signature on every generated track.
Ensures IP provenance even if audio is stripped, re-encoded, or stolen.

Every track leaving the server is sealed with:
  - SHA-256 hash of the full track payload
  - HMAC-SHA256 signature using JWT_SECRET as signing key
  - Immutable DNA tag bound to the signature
"""
from __future__ import annotations
import hmac
import hashlib
import json
import os
from typing import Dict, Any

_VICS_SECRET = os.environ.get("JWT_SECRET", "lyrica3_jwt_secret_change_in_prod").encode()


def _payload_hash(payload: Dict[str, Any]) -> str:
    """SHA-256 hash of the canonical JSON representation."""
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode()).hexdigest()


def sign_track(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Seal a track payload with VICS signature.
    Returns the payload with 'vics_signature' and 'vics_hash' fields added.
    """
    track_hash = _payload_hash(payload)
    signature = hmac.new(
        _VICS_SECRET,
        track_hash.encode(),
        hashlib.sha256,
    ).hexdigest()

    payload["vics_hash"] = f"sha256:{track_hash}"
    payload["vics_signature"] = f"vics_v1_{signature}"
    return payload


def verify_track(payload: Dict[str, Any]) -> bool:
    """
    Verify a track's VICS signature.
    Returns True if the signature matches the payload content.
    """
    stored_sig = payload.get("vics_signature", "")
    stored_hash = payload.get("vics_hash", "")

    # Strip our prefixes to get raw values
    raw_hash = stored_hash.replace("sha256:", "") if stored_hash else ""
    raw_sig = stored_sig.replace("vics_v1_", "") if stored_sig else ""

    if not raw_hash or not raw_sig:
        return False

    # Recompute hash from payload (excluding the signature fields themselves)
    verify_payload = {k: v for k, v in payload.items()
                      if k not in ("vics_signature", "vics_hash")}
    computed_hash = _payload_hash(verify_payload)

    # Verify HMAC
    expected_sig = hmac.new(
        _VICS_SECRET,
        computed_hash.encode(),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(raw_sig, expected_sig) and hmac.compare_digest(raw_hash, computed_hash)
