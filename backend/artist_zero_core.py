"""Strategy and governance rules for Lyrica's first original AI artist.

Artist Zero is a Lyrica-owned synthetic performance identity, not an imitation
of a real person. Every track still carries human contributor splits, DNA
provenance, release receipts, and truthful synthetic-media disclosure.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Iterable, Mapping
import re


BPS_TOTAL = 10_000
REQUIRED_DISCLOSURE = "Original synthetic artist created and operated by Lyrica 3."
PROHIBITED_IDENTITY_MODES = {
    "living_artist_clone",
    "celebrity_voice_clone",
    "undisclosed_synthetic_person",
    "real_person_impersonation",
}


@dataclass(frozen=True)
class StrategyWeights:
    brand_fit: int = 20
    proof_value: int = 20
    audience_demand: int = 15
    conversion_path: int = 15
    repeatability: int = 10
    revenue_potential: int = 10
    evidence_quality: int = 10


def _clean(value: Any, limit: int = 500) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()[:limit]


def validate_artist_blueprint(blueprint: Mapping[str, Any]) -> None:
    public_name = _clean(blueprint.get("public_name"), 120)
    if len(public_name) < 2:
        raise ValueError("Artist Zero requires a public name.")

    identity_mode = _clean(blueprint.get("identity_mode"), 100)
    if identity_mode in PROHIBITED_IDENTITY_MODES:
        raise ValueError("Artist Zero must be an original identity, never a clone or impersonation.")
    if identity_mode != "original_synthetic_artist":
        raise ValueError("identity_mode must be original_synthetic_artist.")

    if not bool(blueprint.get("synthetic_disclosure_enabled", False)):
        raise ValueError("Synthetic identity disclosure must remain enabled.")
    if not bool(blueprint.get("voice_rights_verified", False)):
        raise ValueError("Voice model rights must be verified before release.")
    if not bool(blueprint.get("visual_rights_verified", False)):
        raise ValueError("Visual identity rights must be verified before release.")
    if not bool(blueprint.get("cultural_review_required", False)):
        raise ValueError("Cultural review must be required for Artist Zero releases.")

    pillars = list(blueprint.get("brand_pillars") or [])
    if len(pillars) < 3:
        raise ValueError("Artist Zero needs at least three brand pillars.")
    if len(set(_clean(pillar, 80).lower() for pillar in pillars)) != len(pillars):
        raise ValueError("Brand pillars must be unique.")


def validate_track_splits(participants: Iterable[Mapping[str, Any]]) -> None:
    rows = list(participants)
    if not rows:
        raise ValueError("Every Artist Zero track requires contributor splits.")
    total = sum(int(row.get("share_bps", 0)) for row in rows)
    if total != BPS_TOTAL:
        raise ValueError(f"Contributor splits must total {BPS_TOTAL} bps; received {total}.")
    payees = [_clean(row.get("payee"), 160).lower() for row in rows]
    if any(not payee for payee in payees):
        raise ValueError("Every split row requires a payee.")
    if len(payees) != len(set(payees)):
        raise ValueError("Track contributors must be unique.")


def strategy_score(candidate: Mapping[str, Any], weights: StrategyWeights = StrategyWeights()) -> int:
    """Score one strategic move from 0-100 using evidence-backed dimensions."""
    dimensions = {
        "brand_fit": weights.brand_fit,
        "proof_value": weights.proof_value,
        "audience_demand": weights.audience_demand,
        "conversion_path": weights.conversion_path,
        "repeatability": weights.repeatability,
        "revenue_potential": weights.revenue_potential,
        "evidence_quality": weights.evidence_quality,
    }
    score = Decimal("0")
    for key, weight in dimensions.items():
        rating = Decimal(str(candidate.get(key, 0)))
        rating = max(Decimal("0"), min(Decimal("5"), rating))
        score += (rating / Decimal("5")) * Decimal(weight)

    risk = Decimal(str(candidate.get("risk", 0)))
    risk = max(Decimal("0"), min(Decimal("5"), risk))
    score -= risk * Decimal("3")

    if not bool(candidate.get("has_measurement_plan", False)):
        score -= Decimal("10")
    if not bool(candidate.get("has_owner", False)):
        score -= Decimal("10")

    return max(0, min(100, int(score.quantize(Decimal("1"), rounding=ROUND_HALF_UP))))


def rank_strategy_moves(candidates: Iterable[Mapping[str, Any]]) -> list[dict[str, Any]]:
    ranked = []
    for candidate in candidates:
        row = dict(candidate)
        row["strategy_score"] = strategy_score(row)
        row["decision"] = (
            "execute_next" if row["strategy_score"] >= 75
            else "validate_first" if row["strategy_score"] >= 50
            else "hold"
        )
        ranked.append(row)
    return sorted(ranked, key=lambda row: row["strategy_score"], reverse=True)


def build_artist_zero_launch_plan(
    *,
    public_name: str,
    debut_track_title: str,
    primary_goal: str = "prove creator-owned AI music can build real fans and verified revenue",
) -> dict[str, Any]:
    """Return the canonical 90-day strategy for Artist Zero."""
    return {
        "program": "LYRICA_ARTIST_ZERO",
        "public_name": _clean(public_name, 120),
        "debut_track_title": _clean(debut_track_title, 160),
        "primary_goal": _clean(primary_goal, 300),
        "north_star_metric": "verified_fans_who_complete_a_creator_or_revenue_action",
        "phases": [
            {
                "name": "identity_and_proof",
                "days": "1-14",
                "deliverables": [
                    "Lock original voice, visual identity, biography, values, and disclosure language",
                    "Create DNA-tagged debut master and signed contributor split agreement",
                    "Build smart link, fan capture, content bank, and conversion instrumentation",
                    "Pass Cultura review, rights review, safety review, and release receipt gate",
                ],
                "exit_gate": "one release-ready master with complete ownership and provenance proof",
            },
            {
                "name": "closed_world_premiere",
                "days": "15-30",
                "deliverables": [
                    "Premiere to a small invited creator and fan cohort",
                    "Run two identity narratives and two music hooks as controlled tests",
                    "Capture consented fan profiles, remix intent, creator signups, and qualitative reactions",
                    "Select the strongest message using evidence rather than vanity views",
                ],
                "exit_gate": "repeat engagement from real people and one validated conversion path",
            },
            {
                "name": "public_launch",
                "days": "31-60",
                "deliverables": [
                    "Release the debut track with transparent synthetic-artist labeling",
                    "Launch TikTok and Meta paid tests through Lyrica Growth Autopilot",
                    "Activate Flip It remix challenge with automatic DNA lineage and split receipts",
                    "Publish weekly proof: fans, remixes, creator earnings, and campaign learnings",
                ],
                "exit_gate": "measurable fan growth with controlled acquisition cost and verified actions",
            },
            {
                "name": "catalog_and_economy",
                "days": "61-90",
                "deliverables": [
                    "Release follow-up music based on validated fan signals without chasing every trend",
                    "Launch limited merch or ticketed digital experience only after demand is proven",
                    "Open brand partnership lane with strict identity and cultural-fit scoring",
                    "Produce Artist Zero case study as Lyrica's own customer proof",
                ],
                "exit_gate": "repeatable release-to-fan-to-revenue loop with signed receipts",
            },
        ],
        "mandatory_disclosure": REQUIRED_DISCLOSURE,
        "world_first_claim_allowed": False,
    }


def release_readiness(release: Mapping[str, Any]) -> dict[str, Any]:
    checks = {
        "original_identity": release.get("identity_mode") == "original_synthetic_artist",
        "synthetic_disclosure": bool(release.get("synthetic_disclosure_enabled", False)),
        "voice_rights": bool(release.get("voice_rights_verified", False)),
        "visual_rights": bool(release.get("visual_rights_verified", False)),
        "track_dna": _clean(release.get("track_dna_tag"), 200).startswith("trk_"),
        "vics_receipt": bool(_clean(release.get("vics_receipt_id"), 200)),
        "split_agreement": bool(_clean(release.get("split_agreement_id"), 200)),
        "cultural_review": release.get("cultural_review_status") == "approved",
        "content_approval": release.get("content_approval_status") == "approved",
        "smart_link": bool(_clean(release.get("smart_link_id"), 200)),
        "conversion_tracking": bool(release.get("conversion_tracking_ready", False)),
    }
    missing = [name for name, passed in checks.items() if not passed]
    return {
        "ready": not missing,
        "checks": checks,
        "missing": missing,
        "release_enabled": not missing,
    }


def artist_zero_kpis() -> list[dict[str, Any]]:
    return [
        {"metric": "qualified_fan_cost", "definition": "paid and organic spend divided by fans completing a meaningful action"},
        {"metric": "listener_to_known_fan", "definition": "known consented fans divided by unique listeners"},
        {"metric": "fan_to_creator", "definition": "fans who start creating or remixing in Lyrica divided by known fans"},
        {"metric": "time_to_first_flip", "definition": "time from release to first verified remix derivative"},
        {"metric": "verified_revenue_per_fan", "definition": "receipt-backed revenue divided by known fans"},
        {"metric": "repeat_engagement_30d", "definition": "known fans returning within 30 days"},
        {"metric": "content_to_conversion_rate", "definition": "qualified actions divided by attributed content visits"},
    ]
