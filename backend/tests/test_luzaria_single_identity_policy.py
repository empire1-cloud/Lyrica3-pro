import pytest

from luzaria_single_identity_policy import (
    identity_policy_status,
    validate_single_identity_policy,
)


def valid_kernel():
    return {
        "public_name": "LUZARIA",
        "identity_continuity_mode": "single_identity",
        "expression_policy": "one_identity_many_expressions",
        "multi_persona_enabled": False,
    }


def test_single_identity_policy_accepts_one_identity_many_expressions():
    validate_single_identity_policy(valid_kernel())
    status = identity_policy_status()
    assert status["multi_persona_enabled"] is False
    assert status["multi_persona_status"] == "paused_by_founder"
    assert status["canon_statement"] == "One soul. One identity. Many expressions."


def test_multi_persona_cannot_be_enabled():
    candidate = valid_kernel()
    candidate["multi_persona_enabled"] = True
    with pytest.raises(ValueError, match="paused"):
        validate_single_identity_policy(candidate)


def test_alternate_identity_fields_are_rejected():
    candidate = valid_kernel()
    candidate["alternate_personas"] = ["night persona"]
    with pytest.raises(ValueError, match="prohibited"):
        validate_single_identity_policy(candidate)


def test_expression_changes_do_not_require_new_personas():
    status = identity_policy_status()
    allowed = set(status["allowed_evolution"])
    assert "musical genres" in allowed
    assert "emotional range" in allowed
    assert "visual eras" in allowed
    assert "persona switching" in status["prohibited_without_new_canon"]
