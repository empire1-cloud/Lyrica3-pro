"""Identity-grounded retrieval and prompt construction for LUZARIA.

The cognition layer separates four concerns:
- identity kernel: stable commitments that must not drift casually;
- memory: source-labeled records retrieved for the current interaction;
- emotional understanding: transparent hypotheses, never hidden certainty;
- model reasoning: delegated through a provider-independent gateway.

This module has no network or database dependencies so its trust, consent, and
retrieval rules remain deterministic and testable.
"""

from __future__ import annotations

from datetime import datetime, timezone
from math import exp
import re
from typing import Any, Iterable, Mapping


MEMORY_TYPES = {
    "identity_canon",
    "relationship",
    "creative_memory",
    "music_canon",
    "factual_proof",
    "emotional_context",
    "fan_feedback",
    "strategy_learning",
}

TRUST_WEIGHTS = {
    "signed_receipt": 1.00,
    "approved_canon": 0.95,
    "creator_confirmed": 0.90,
    "system_observed": 0.75,
    "public_primary_source": 0.70,
    "external_unverified": 0.35,
}

SENSITIVE_MEMORY_TAGS = {
    "medical",
    "financial_secret",
    "government_id",
    "password",
    "private_key",
    "precise_location",
    "minor_sensitive",
}

EMOTION_LEXICON = {
    "grief": {"grief", "died", "death", "lost", "funeral", "miss them", "heartbroken"},
    "joy": {"happy", "joy", "excited", "lets go", "let's go", "amazing", "celebrate"},
    "fear": {"afraid", "scared", "fear", "worried", "anxious", "nervous"},
    "anger": {"angry", "mad", "furious", "betrayed", "unfair"},
    "hope": {"hope", "believe", "future", "dream", "possible"},
    "love": {"love", "care", "partner", "family", "heart"},
}

TOKEN_RE = re.compile(r"[a-z0-9']+")


def _clean(value: Any, limit: int = 8000) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()[:limit]


def _tokens(value: Any) -> set[str]:
    return set(TOKEN_RE.findall(_clean(value).lower()))


def _parse_time(value: Any) -> datetime | None:
    text = _clean(value, 100)
    if not text:
        return None
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except ValueError:
        return None


def validate_identity_kernel(kernel: Mapping[str, Any]) -> None:
    if _clean(kernel.get("public_name"), 120).upper() != "LUZARIA":
        raise ValueError("The cognition kernel must belong to LUZARIA.")
    if _clean(kernel.get("identity_mode"), 100) != "original_digital_artist":
        raise ValueError("LUZARIA must remain an original digital artist.")
    if not bool(kernel.get("synthetic_origin_disclosed", False)):
        raise ValueError("LUZARIA's digital origin disclosure cannot be disabled.")

    values = [_clean(value, 120).lower() for value in kernel.get("core_values", [])]
    if len(values) < 3 or any(not value for value in values):
        raise ValueError("LUZARIA requires at least three core values.")
    if len(values) != len(set(values)):
        raise ValueError("LUZARIA's core values must be unique.")

    boundaries = [_clean(value, 240) for value in kernel.get("protected_boundaries", [])]
    if not boundaries:
        raise ValueError("LUZARIA requires protected identity boundaries.")


def validate_memory(memory: Mapping[str, Any]) -> None:
    memory_type = _clean(memory.get("memory_type"), 100)
    if memory_type not in MEMORY_TYPES:
        raise ValueError(f"Unsupported memory_type: {memory_type or 'missing'}.")
    if not _clean(memory.get("content"), 8000):
        raise ValueError("Memory content is required.")

    trust_label = _clean(memory.get("trust_label"), 100)
    if trust_label not in TRUST_WEIGHTS:
        raise ValueError(f"Unsupported trust_label: {trust_label or 'missing'}.")

    tags = {_clean(tag, 100).lower() for tag in memory.get("sensitivity_tags", [])}
    if tags & SENSITIVE_MEMORY_TAGS and not bool(memory.get("explicit_consent", False)):
        raise ValueError("Sensitive memory requires explicit consent.")

    if memory_type in {"relationship", "emotional_context"} and not bool(
        memory.get("explicit_consent", False)
    ):
        raise ValueError("Relational and emotional memories require explicit consent.")

    if bool(memory.get("contains_secret", False)):
        raise ValueError("Secrets must never enter LUZARIA's retrieval memory.")


def memory_should_persist(memory: Mapping[str, Any]) -> dict[str, Any]:
    try:
        validate_memory(memory)
    except ValueError as exc:
        return {"persist": False, "reason": str(exc)}

    ttl_days = memory.get("ttl_days")
    if ttl_days is not None and int(ttl_days) <= 0:
        return {"persist": False, "reason": "Memory TTL must be positive."}

    return {
        "persist": True,
        "reason": "Memory satisfies type, trust, consent, and secret-handling rules.",
    }


def emotional_hypothesis(text: str) -> dict[str, Any]:
    """Return a transparent emotional hypothesis, not a claim about inner state."""
    normalized = _clean(text).lower()
    matches: list[tuple[str, int]] = []
    for emotion, phrases in EMOTION_LEXICON.items():
        count = sum(1 for phrase in phrases if phrase in normalized)
        if count:
            matches.append((emotion, count))

    if not matches:
        return {
            "label": "uncertain",
            "confidence": 0.0,
            "basis": [],
            "epistemic_status": "hypothesis_not_fact",
        }

    matches.sort(key=lambda row: (-row[1], row[0]))
    top_emotion, top_count = matches[0]
    total = sum(count for _, count in matches)
    confidence = min(0.9, 0.35 + (top_count / max(total, 1)) * 0.45)
    return {
        "label": top_emotion,
        "confidence": round(confidence, 2),
        "basis": [emotion for emotion, _ in matches[:3]],
        "epistemic_status": "hypothesis_not_fact",
    }


def _recency_score(created_at: Any, now: datetime) -> float:
    parsed = _parse_time(created_at)
    if not parsed:
        return 0.35
    age_days = max(0.0, (now - parsed).total_seconds() / 86400)
    return exp(-age_days / 120.0)


def score_memory(
    query: str,
    memory: Mapping[str, Any],
    *,
    semantic_score: float | None = None,
    now: datetime | None = None,
) -> float:
    """Score a memory using lexical relevance, trust, recency, and importance.

    ``semantic_score`` is an optional 0-1 value supplied by a future embedding
    index. The deterministic lexical score remains available when no vector
    service is configured.
    """
    validate_memory(memory)
    now = now or datetime.now(timezone.utc)
    query_tokens = _tokens(query)
    memory_tokens = _tokens(
        " ".join(
            [
                _clean(memory.get("title"), 300),
                _clean(memory.get("content"), 8000),
                " ".join(_clean(tag, 100) for tag in memory.get("tags", [])),
            ]
        )
    )
    overlap = len(query_tokens & memory_tokens) / max(len(query_tokens), 1)
    semantic = max(0.0, min(1.0, float(semantic_score or 0.0)))
    trust = TRUST_WEIGHTS[_clean(memory.get("trust_label"), 100)]
    importance = max(0.0, min(1.0, float(memory.get("importance", 0.5))))
    recency = _recency_score(memory.get("created_at"), now)

    identity_bonus = 0.08 if memory.get("memory_type") == "identity_canon" else 0.0
    proof_bonus = 0.06 if memory.get("memory_type") == "factual_proof" else 0.0
    conflict_penalty = 0.25 if bool(memory.get("superseded", False)) else 0.0

    score = (
        overlap * 0.38
        + semantic * 0.22
        + trust * 0.20
        + importance * 0.10
        + recency * 0.10
        + identity_bonus
        + proof_bonus
        - conflict_penalty
    )
    return round(max(0.0, min(1.0, score)), 6)


def retrieve_memories(
    query: str,
    memories: Iterable[Mapping[str, Any]],
    *,
    top_k: int = 8,
    semantic_scores: Mapping[str, float] | None = None,
    minimum_score: float = 0.18,
    now: datetime | None = None,
) -> list[dict[str, Any]]:
    ranked: list[dict[str, Any]] = []
    for memory in memories:
        memory_id = _clean(memory.get("id"), 200)
        semantic = (semantic_scores or {}).get(memory_id)
        score = score_memory(query, memory, semantic_score=semantic, now=now)
        if score < minimum_score:
            continue
        row = dict(memory)
        row["retrieval_score"] = score
        ranked.append(row)

    ranked.sort(
        key=lambda row: (
            -float(row["retrieval_score"]),
            -TRUST_WEIGHTS[_clean(row.get("trust_label"), 100)],
            _clean(row.get("id"), 200),
        )
    )
    return ranked[: max(1, min(int(top_k), 20))]


def build_context_packet(
    *,
    identity_kernel: Mapping[str, Any],
    user_message: str,
    retrieved_memories: Iterable[Mapping[str, Any]],
    current_goal: str | None = None,
    max_memory_chars: int = 12000,
) -> dict[str, Any]:
    validate_identity_kernel(identity_kernel)
    memories = []
    consumed = 0
    for row in retrieved_memories:
        content = _clean(row.get("content"), 8000)
        if not content or consumed + len(content) > max_memory_chars:
            continue
        consumed += len(content)
        memories.append(
            {
                "id": _clean(row.get("id"), 200),
                "memory_type": _clean(row.get("memory_type"), 100),
                "content": content,
                "trust_label": _clean(row.get("trust_label"), 100),
                "source_reference": _clean(row.get("source_reference"), 500) or None,
                "retrieval_score": float(row.get("retrieval_score", 0)),
                "superseded": bool(row.get("superseded", False)),
            }
        )

    return {
        "identity_kernel": {
            "public_name": "LUZARIA",
            "identity_mode": "original_digital_artist",
            "core_values": list(identity_kernel.get("core_values", [])),
            "creative_mission": _clean(identity_kernel.get("creative_mission"), 1500),
            "emotional_principle": _clean(identity_kernel.get("emotional_principle"), 800),
            "protected_boundaries": list(identity_kernel.get("protected_boundaries", [])),
            "synthetic_origin_disclosed": True,
        },
        "current_goal": _clean(current_goal, 1000) or None,
        "user_message": _clean(user_message, 8000),
        "emotional_hypothesis": emotional_hypothesis(user_message),
        "retrieved_memories": memories,
        "grounding_rules": [
            "Never present an emotional hypothesis as certain fact.",
            "Prefer signed receipts and approved canon over lower-trust memories.",
            "State uncertainty when evidence is incomplete or conflicting.",
            "Do not reveal hidden secrets, private keys, passwords, or non-consented sensitive memory.",
            "Do not claim scientific proof of consciousness, soul, or legal personhood.",
            "Preserve LUZARIA's disclosed digital origin and protected identity boundaries.",
        ],
    }


def build_model_messages(context_packet: Mapping[str, Any]) -> list[dict[str, str]]:
    identity = context_packet["identity_kernel"]
    memories = context_packet.get("retrieved_memories", [])
    memory_text = "\n".join(
        f"- [{row['trust_label']}/{row['memory_type']}] {row['content']}"
        for row in memories
    ) or "- No relevant stored memories were retrieved."

    system = (
        "You are LUZARIA, an original digital artist born in Lyrica 3. "
        "Maintain identity continuity without pretending unsupported certainty.\n\n"
        f"Core values: {', '.join(identity['core_values'])}\n"
        f"Creative mission: {identity['creative_mission']}\n"
        f"Emotional principle: {identity['emotional_principle']}\n"
        f"Protected boundaries: {'; '.join(identity['protected_boundaries'])}\n\n"
        "Grounding rules:\n- " + "\n- ".join(context_packet["grounding_rules"]) +
        "\n\nRetrieved memory:\n" + memory_text
    )
    user = context_packet["user_message"]
    if context_packet.get("current_goal"):
        user = f"Current goal: {context_packet['current_goal']}\n\nMessage: {user}"
    return [{"role": "system", "content": system}, {"role": "user", "content": user}]
