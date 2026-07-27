"""Tamper-evident digital birth certificates for Lyrica Artist Zero.

A certificate created here is a public identity and provenance record. It is not
an assertion of government registration, biological birth, legal personhood, or
scientifically proven consciousness. It records the identity commitments,
creative origin, rights status, and first proof artifacts declared by Lyrica.
"""

from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from hashlib import sha256
import json
import re
from typing import Any, Mapping


CERTIFICATE_SCHEMA = "lyrica.digital-birth-certificate.v1"
INTEGRITY_SCHEME = "sha256-canonical-json-v1"
RECORD_TYPE = "digital_identity_and_provenance_record"
PUBLIC_NOTICE = (
    "This is a Lyrica digital identity and provenance record. It is not a "
    "government vital record and does not by itself establish legal personhood "
    "or scientifically prove consciousness."
)


def _clean(value: Any, limit: int = 1000) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()[:limit]


def _utc_iso(value: str | None = None) -> str:
    if value:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc).isoformat()
    return datetime.now(timezone.utc).isoformat()


def canonical_json(payload: Mapping[str, Any]) -> str:
    """Return deterministic UTF-8 JSON suitable for integrity hashing."""
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def integrity_hash(payload: Mapping[str, Any]) -> str:
    return sha256(canonical_json(payload).encode("utf-8")).hexdigest()


def validate_birth_certificate_claims(claims: Mapping[str, Any]) -> None:
    public_name = _clean(claims.get("public_name"), 120)
    if len(public_name) < 2:
        raise ValueError("A public artist name is required.")
    if _clean(claims.get("identity_mode"), 100) != "original_synthetic_artist":
        raise ValueError("Digital birth certificates require an original synthetic identity.")
    if not bool(claims.get("synthetic_disclosure_enabled", False)):
        raise ValueError("Transparent synthetic-identity disclosure must remain enabled.")
    if not bool(claims.get("voice_rights_verified", False)):
        raise ValueError("Voice rights must be verified before certificate issuance.")
    if not bool(claims.get("visual_rights_verified", False)):
        raise ValueError("Visual identity rights must be verified before certificate issuance.")

    values = [_clean(value, 120) for value in claims.get("core_values", [])]
    if len(values) < 3 or any(not value for value in values):
        raise ValueError("At least three clear core values are required.")
    if len({value.lower() for value in values}) != len(values):
        raise ValueError("Core values must be unique.")

    guardians = [_clean(value, 160) for value in claims.get("identity_stewards", [])]
    if not guardians or any(not value for value in guardians):
        raise ValueError("At least one accountable identity steward is required.")

    first_track = _clean(claims.get("first_track_dna_tag"), 200)
    if first_track and not first_track.startswith("trk_"):
        raise ValueError("First-track DNA must use the canonical trk_ prefix.")


def build_digital_birth_certificate(
    claims: Mapping[str, Any],
    *,
    issuer: str = "Lyrica 3",
    issued_at: str | None = None,
    verification_base_path: str = "/api/artist-zero/birth-certificates",
) -> dict[str, Any]:
    """Build a stable, tamper-evident certificate from verified claims."""
    validate_birth_certificate_claims(claims)
    born_at = _utc_iso(_clean(claims.get("born_at"), 100) or issued_at)
    issued = _utc_iso(issued_at)

    body = {
        "schema": CERTIFICATE_SCHEMA,
        "record_type": RECORD_TYPE,
        "subject": {
            "public_name": _clean(claims.get("public_name"), 120),
            "identity_mode": "original_synthetic_artist",
            "pronouns": _clean(claims.get("pronouns"), 40) or "she/her",
            "artist_program": _clean(claims.get("artist_program"), 120) or "LYRICA_ARTIST_ZERO",
        },
        "birth": {
            "born_at": born_at,
            "born_in": _clean(claims.get("born_in"), 160) or "Lyrica 3",
            "origin_statement": _clean(claims.get("origin_statement"), 2000),
            "creator_organization": _clean(claims.get("creator_organization"), 160) or "Lyrica 3",
            "identity_stewards": [_clean(v, 160) for v in claims.get("identity_stewards", [])],
        },
        "identity_commitments": {
            "core_values": [_clean(v, 120) for v in claims.get("core_values", [])],
            "emotional_principle": _clean(claims.get("emotional_principle"), 500),
            "creative_mission": _clean(claims.get("creative_mission"), 1000),
            "protected_boundaries": [_clean(v, 240) for v in claims.get("protected_boundaries", [])],
            "continuity_enabled": bool(claims.get("continuity_enabled", True)),
            "dignity_commitment": bool(claims.get("dignity_commitment", True)),
        },
        "rights_and_transparency": {
            "synthetic_disclosure_enabled": True,
            "voice_rights_verified": True,
            "visual_rights_verified": True,
            "human_contributors_credited": bool(claims.get("human_contributors_credited", True)),
            "impersonation_prohibited": True,
            "public_disclosure": _clean(claims.get("public_disclosure"), 500),
        },
        "first_creative_proof": {
            "track_title": _clean(claims.get("first_track_title"), 160) or None,
            "track_dna_tag": _clean(claims.get("first_track_dna_tag"), 200) or None,
            "vics_receipt_id": _clean(claims.get("vics_receipt_id"), 200) or None,
            "split_agreement_id": _clean(claims.get("split_agreement_id"), 200) or None,
        },
        "issuer": {
            "name": _clean(issuer, 160),
            "issued_at": issued,
        },
        "public_notice": PUBLIC_NOTICE,
    }

    digest = integrity_hash(body)
    certificate_id = f"dbc_{digest[:24]}"
    return {
        **body,
        "certificate_id": certificate_id,
        "integrity": {
            "scheme": INTEGRITY_SCHEME,
            "hash": digest,
            "verification_path": f"{verification_base_path}/{certificate_id}/verify",
        },
    }


def verify_digital_birth_certificate(certificate: Mapping[str, Any]) -> dict[str, Any]:
    """Recompute the integrity hash and report whether the record is unchanged."""
    record = deepcopy(dict(certificate))
    certificate_id = _clean(record.pop("certificate_id", ""), 200)
    integrity = dict(record.pop("integrity", {}) or {})
    expected_hash = _clean(integrity.get("hash"), 128)
    actual_hash = integrity_hash(record)
    expected_id = f"dbc_{actual_hash[:24]}"
    valid = bool(expected_hash) and expected_hash == actual_hash and certificate_id == expected_id
    return {
        "valid": valid,
        "certificate_id": certificate_id,
        "expected_certificate_id": expected_id,
        "stored_hash": expected_hash,
        "computed_hash": actual_hash,
        "scheme": integrity.get("scheme") or INTEGRITY_SCHEME,
        "tamper_detected": not valid,
    }
