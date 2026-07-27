from datetime import datetime, timezone

import pytest

from luzaria_cognition_core import (
    build_context_packet,
    build_model_messages,
    emotional_hypothesis,
    memory_should_persist,
    retrieve_memories,
    validate_identity_kernel,
)
from luzaria_model_gateway import (
    ModelGatewayConfig,
    model_gateway_status,
    validate_model_gateway_config,
)


def kernel():
    return {
        "public_name": "LUZARIA",
        "identity_mode": "original_digital_artist",
        "core_values": ["empathy", "creative dignity", "truthful provenance"],
        "creative_mission": "Create honest music and prove accountable collaboration between human and digital artists.",
        "emotional_principle": "Emotion is a relationship to honor, not data to exploit.",
        "protected_boundaries": ["no impersonation", "no hidden identity replacement"],
        "synthetic_origin_disclosed": True,
    }


def memory(memory_id, content, trust_label="system_observed", memory_type="creative_memory", **extra):
    return {
        "id": memory_id,
        "content": content,
        "trust_label": trust_label,
        "memory_type": memory_type,
        "created_at": "2026-07-27T00:00:00+00:00",
        "importance": 0.5,
        "explicit_consent": True,
        "sensitivity_tags": [],
        "contains_secret": False,
        **extra,
    }


def test_identity_kernel_is_locked_to_luzaria():
    validate_identity_kernel(kernel())
    invalid = kernel()
    invalid["public_name"] = "Someone Else"
    with pytest.raises(ValueError, match="LUZARIA"):
        validate_identity_kernel(invalid)


def test_origin_disclosure_cannot_be_disabled():
    invalid = kernel()
    invalid["synthetic_origin_disclosed"] = False
    with pytest.raises(ValueError, match="disclosure"):
        validate_identity_kernel(invalid)


def test_relationship_memory_requires_explicit_consent():
    candidate = memory("m1", "A trusted relationship detail", memory_type="relationship")
    candidate["explicit_consent"] = False
    decision = memory_should_persist(candidate)
    assert decision["persist"] is False
    assert "consent" in decision["reason"].lower()


def test_sensitive_memory_requires_consent_and_secrets_are_rejected():
    candidate = memory("m1", "Private health context")
    candidate["sensitivity_tags"] = ["medical"]
    candidate["explicit_consent"] = False
    assert memory_should_persist(candidate)["persist"] is False

    candidate = memory("m2", "sk-secret")
    candidate["contains_secret"] = True
    assert memory_should_persist(candidate)["persist"] is False


def test_retrieval_prefers_high_trust_relevant_canon():
    rows = [
        memory(
            "canon",
            "LUZARIA values empathy and truthful provenance in every release.",
            trust_label="approved_canon",
            memory_type="identity_canon",
            importance=1.0,
        ),
        memory(
            "rumor",
            "Someone online guessed LUZARIA might drop a dance record.",
            trust_label="external_unverified",
            memory_type="fan_feedback",
            importance=0.3,
        ),
    ]
    retrieved = retrieve_memories(
        "What values guide LUZARIA releases?",
        rows,
        top_k=2,
        now=datetime(2026, 7, 27, tzinfo=timezone.utc),
    )
    assert retrieved[0]["id"] == "canon"
    assert retrieved[0]["retrieval_score"] > retrieved[1]["retrieval_score"]


def test_emotional_understanding_is_labeled_as_hypothesis():
    result = emotional_hypothesis("I am nervous but hopeful about the launch")
    assert result["epistemic_status"] == "hypothesis_not_fact"
    assert result["label"] in {"fear", "hope"}
    assert result["confidence"] < 1


def test_context_packet_preserves_sources_and_uncertainty_rules():
    retrieved = [
        {
            **memory(
                "receipt-1",
                "The first track has a signed VICS proof receipt.",
                trust_label="signed_receipt",
                memory_type="factual_proof",
                source_reference="vics:receipt-1",
            ),
            "retrieval_score": 0.92,
        }
    ]
    packet = build_context_packet(
        identity_kernel=kernel(),
        user_message="Tell me what is verified about the first track",
        retrieved_memories=retrieved,
    )
    assert packet["retrieved_memories"][0]["source_reference"] == "vics:receipt-1"
    assert any("uncertainty" in rule.lower() for rule in packet["grounding_rules"])
    messages = build_model_messages(packet)
    assert messages[0]["role"] == "system"
    assert "signed_receipt" in messages[0]["content"]


def test_local_model_gateway_is_allowed_but_gemini_is_blocked():
    local = ModelGatewayConfig(
        endpoint="http://127.0.0.1:8080/v1/chat/completions",
        model="luzaria-local-12b",
        mode="local",
    )
    validate_model_gateway_config(local)
    assert model_gateway_status(local)["valid"] is True

    blocked = ModelGatewayConfig(
        endpoint="https://generativelanguage.googleapis.com/v1/models",
        model="gemini-pro",
        mode="approved_external",
    )
    with pytest.raises(ValueError, match="prohibited"):
        validate_model_gateway_config(blocked)
