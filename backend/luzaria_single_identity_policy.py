"""Canonical identity-continuity policy for LUZARIA.

LUZARIA has one protected identity. Musical genres, moods, eras, styling, and
performance choices are expressions of that identity, not separate personas.
Multi-persona creation remains disabled until an explicit future canon decision,
identity-impact review, and founder approval changes this policy.
"""

from __future__ import annotations

from typing import Any, Mapping


IDENTITY_CONTINUITY_MODE = "single_identity"
EXPRESSION_POLICY = "one_identity_many_expressions"
MULTI_PERSONA_ENABLED = False
POLICY_STATUS = "paused_by_founder"

PROHIBITED_FIELDS = {
    "alternate_persona",
    "alternate_personas",
    "secondary_identity",
    "secondary_identities",
    "persona_switch",
    "persona_roster",
}


def validate_single_identity_policy(payload: Mapping[str, Any]) -> None:
    """Reject any identity kernel that enables or embeds alternate personas."""
    mode = str(payload.get("identity_continuity_mode", "")).strip()
    if mode != IDENTITY_CONTINUITY_MODE:
        raise ValueError("LUZARIA identity_continuity_mode must remain single_identity.")

    if bool(payload.get("multi_persona_enabled", False)):
        raise ValueError("Multi-persona mode is paused and cannot be enabled.")

    expression = str(payload.get("expression_policy", "")).strip()
    if expression != EXPRESSION_POLICY:
        raise ValueError("LUZARIA expression_policy must remain one_identity_many_expressions.")

    present = sorted(field for field in PROHIBITED_FIELDS if payload.get(field))
    if present:
        raise ValueError(
            "Alternate persona fields are prohibited while multi-persona is paused: "
            + ", ".join(present)
        )


def identity_policy_status() -> dict[str, Any]:
    return {
        "artist": "LUZARIA",
        "identity_continuity_mode": IDENTITY_CONTINUITY_MODE,
        "expression_policy": EXPRESSION_POLICY,
        "multi_persona_enabled": MULTI_PERSONA_ENABLED,
        "multi_persona_status": POLICY_STATUS,
        "allowed_evolution": [
            "musical genres",
            "emotional range",
            "visual eras",
            "performance styles",
            "languages",
            "collaborations",
        ],
        "prohibited_without_new_canon": [
            "alternate named identities",
            "separate memories per persona",
            "persona switching",
            "voice or face replacement presented as the same continuity",
        ],
        "canon_statement": "One soul. One identity. Many expressions.",
    }
