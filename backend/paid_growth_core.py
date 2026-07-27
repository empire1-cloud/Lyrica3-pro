"""Pure planning, measurement, and safety rules for Lyrica paid growth.

No function in this module calls an advertising platform or spends money.
"""

from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from hashlib import sha256
from typing import Any, Iterable, Mapping
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
import re

CENT = Decimal("0.01")
ALLOWED_PROVIDERS = {"tiktok", "meta", "spotify_manual"}
ALLOWED_OBJECTIVES = {"awareness", "traffic", "fan_capture", "creator_signup", "release_streams", "retargeting"}


def money(value: Any) -> Decimal:
    return Decimal(str(value or 0)).quantize(CENT, rounding=ROUND_HALF_UP)


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", str(value).lower()).strip("-")[:80] or "lyrica"


def add_utm(url: str, *, campaign: str, source: str, medium: str, content: str) -> str:
    parts = urlsplit(url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query.update(
        {
            "utm_campaign": slug(campaign),
            "utm_source": slug(source),
            "utm_medium": slug(medium),
            "utm_content": slug(content),
        }
    )
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def approval_digest(campaign_id: str, max_spend_usd: Any, approved_by: str) -> str:
    raw = f"{campaign_id}|{money(max_spend_usd)}|{approved_by.strip().lower()}"
    return sha256(raw.encode("utf-8")).hexdigest()


def validate_plan(plan: Mapping[str, Any]) -> None:
    objective = str(plan.get("objective", ""))
    if objective not in ALLOWED_OBJECTIVES:
        raise ValueError(f"Unsupported objective: {objective}")

    providers = list(plan.get("providers") or [])
    if not providers:
        raise ValueError("At least one advertising provider is required.")
    invalid = sorted(set(providers) - ALLOWED_PROVIDERS)
    if invalid:
        raise ValueError(f"Unsupported providers: {invalid}")

    total = money(plan.get("total_budget_usd", 0))
    daily = money(plan.get("daily_cap_usd", 0))
    if total <= 0:
        raise ValueError("total_budget_usd must be greater than zero.")
    if daily <= 0 or daily > total:
        raise ValueError("daily_cap_usd must be positive and no greater than total budget.")
    if total > money(plan.get("operator_max_budget_usd", 10000)):
        raise ValueError("Campaign exceeds the configured operator maximum.")

    creatives = list(plan.get("creative_ids") or [])
    if len(creatives) < 2:
        raise ValueError("Paid tests require at least two approved creatives.")
    if not bool(plan.get("rights_verified", False)):
        raise ValueError("Music and visual rights must be verified before paid promotion.")
    if not bool(plan.get("landing_page_ready", False)):
        raise ValueError("An attributed landing page or smart link is required.")
    if not bool(plan.get("conversion_tracking_ready", False)):
        raise ValueError("Conversion tracking must be configured before launch.")


def allocate_budget(total_budget_usd: Any, providers: Iterable[str], objective: str) -> dict[str, float]:
    providers = list(dict.fromkeys(providers))
    if not providers:
        raise ValueError("At least one provider is required.")
    invalid = sorted(set(providers) - ALLOWED_PROVIDERS)
    if invalid:
        raise ValueError(f"Unsupported providers: {invalid}")

    weights = {
        "awareness": {"tiktok": 0.55, "meta": 0.35, "spotify_manual": 0.10},
        "traffic": {"tiktok": 0.45, "meta": 0.45, "spotify_manual": 0.10},
        "fan_capture": {"tiktok": 0.40, "meta": 0.50, "spotify_manual": 0.10},
        "creator_signup": {"tiktok": 0.45, "meta": 0.45, "spotify_manual": 0.10},
        "release_streams": {"tiktok": 0.45, "meta": 0.30, "spotify_manual": 0.25},
        "retargeting": {"tiktok": 0.30, "meta": 0.55, "spotify_manual": 0.15},
    }.get(objective)
    if weights is None:
        raise ValueError(f"Unsupported objective: {objective}")

    active = {provider: weights[provider] for provider in providers}
    denominator = sum(active.values())
    total = money(total_budget_usd)
    allocations: dict[str, Decimal] = {}
    remaining = total
    for provider in providers[:-1]:
        amount = money(total * Decimal(str(active[provider] / denominator)))
        allocations[provider] = amount
        remaining -= amount
    allocations[providers[-1]] = money(remaining)
    return {provider: float(amount) for provider, amount in allocations.items()}


def build_test_cells(
    *,
    campaign_name: str,
    provider: str,
    budget_usd: Any,
    creative_ids: Iterable[str],
    audience_ids: Iterable[str],
    destination_url: str,
) -> list[dict[str, Any]]:
    creatives = list(dict.fromkeys(creative_ids))
    audiences = list(dict.fromkeys(audience_ids))
    if provider not in ALLOWED_PROVIDERS:
        raise ValueError(f"Unsupported provider: {provider}")
    if not creatives or not audiences:
        raise ValueError("At least one creative and one audience are required.")

    combinations = [(creative, audience) for audience in audiences for creative in creatives]
    total = money(budget_usd)
    per_cell = money(total / Decimal(len(combinations)))
    remaining = total
    cells = []
    for index, (creative, audience) in enumerate(combinations):
        amount = per_cell if index < len(combinations) - 1 else money(remaining)
        remaining -= amount
        cell_id = f"cell_{sha256(f'{campaign_name}|{provider}|{creative}|{audience}'.encode()).hexdigest()[:16]}"
        cells.append(
            {
                "id": cell_id,
                "provider": provider,
                "creative_id": creative,
                "audience_id": audience,
                "test_budget_usd": float(amount),
                "destination_url": add_utm(
                    destination_url,
                    campaign=campaign_name,
                    source=provider,
                    medium="paid_social" if provider != "spotify_manual" else "paid_streaming",
                    content=f"{creative}-{audience}",
                ),
                "status": "planned",
            }
        )
    return cells


def calculate_metrics(row: Mapping[str, Any]) -> dict[str, float | None]:
    impressions = Decimal(str(row.get("impressions", 0) or 0))
    clicks = Decimal(str(row.get("clicks", 0) or 0))
    conversions = Decimal(str(row.get("conversions", 0) or 0))
    spend = money(row.get("spend_usd", 0))
    revenue = money(row.get("revenue_usd", 0))

    def ratio(numerator: Decimal, denominator: Decimal, multiplier: Decimal = Decimal("1")) -> float | None:
        if denominator <= 0:
            return None
        return round(float((numerator / denominator) * multiplier), 4)

    return {
        "ctr_pct": ratio(clicks, impressions, Decimal("100")),
        "cvr_pct": ratio(conversions, clicks, Decimal("100")),
        "cpm_usd": ratio(spend, impressions, Decimal("1000")),
        "cpc_usd": ratio(spend, clicks),
        "cpa_usd": ratio(spend, conversions),
        "roas": ratio(revenue, spend),
    }


def recommend_action(
    row: Mapping[str, Any],
    *,
    target_cpa_usd: Any,
    minimum_impressions: int = 1500,
    minimum_conversions_to_scale: int = 3,
) -> dict[str, Any]:
    metrics = calculate_metrics(row)
    impressions = int(row.get("impressions", 0) or 0)
    conversions = int(row.get("conversions", 0) or 0)
    spend = money(row.get("spend_usd", 0))
    target_cpa = money(target_cpa_usd)

    action = "hold"
    reason = "Insufficient evidence to change delivery."
    if impressions >= minimum_impressions and conversions == 0 and spend >= target_cpa * 2:
        action = "pause_recommended"
        reason = "The cell spent at least 2x target CPA without a conversion."
    elif conversions >= minimum_conversions_to_scale and metrics["cpa_usd"] is not None and Decimal(str(metrics["cpa_usd"])) <= target_cpa:
        action = "scale_recommended"
        reason = "The cell has enough conversions and is at or below target CPA."
    elif impressions >= minimum_impressions and metrics["ctr_pct"] is not None and metrics["ctr_pct"] < 0.5:
        action = "creative_refresh_recommended"
        reason = "Click-through rate is below the initial creative threshold."

    return {
        "action": action,
        "reason": reason,
        "metrics": metrics,
        "automatic_change_enabled": False,
        "requires_operator_approval": action != "hold",
    }


def launch_readiness(plan: Mapping[str, Any]) -> dict[str, Any]:
    checks = {
        "rights_verified": bool(plan.get("rights_verified", False)),
        "landing_page_ready": bool(plan.get("landing_page_ready", False)),
        "conversion_tracking_ready": bool(plan.get("conversion_tracking_ready", False)),
        "two_or_more_creatives": len(list(plan.get("creative_ids") or [])) >= 2,
        "audience_defined": bool(list(plan.get("audience_ids") or [])),
        "budget_approved": bool(plan.get("budget_approved", False)),
        "provider_credentials_present": bool(plan.get("provider_credentials_present", False)),
    }
    return {
        "ready": all(checks.values()),
        "checks": checks,
        "missing": [name for name, passed in checks.items() if not passed],
    }
