import pytest

from paid_growth_core import (
    add_utm,
    allocate_budget,
    approval_digest,
    build_test_cells,
    calculate_metrics,
    launch_readiness,
    recommend_action,
    validate_plan,
)


def valid_plan():
    return {
        "objective": "creator_signup",
        "providers": ["tiktok", "meta"],
        "total_budget_usd": 500,
        "daily_cap_usd": 50,
        "operator_max_budget_usd": 1000,
        "creative_ids": ["creative_a", "creative_b"],
        "audience_ids": ["audience_cold"],
        "rights_verified": True,
        "landing_page_ready": True,
        "conversion_tracking_ready": True,
    }


def test_validate_plan_requires_tracking_and_rights():
    validate_plan(valid_plan())
    broken = valid_plan()
    broken["conversion_tracking_ready"] = False
    with pytest.raises(ValueError, match="Conversion tracking"):
        validate_plan(broken)


def test_budget_allocation_preserves_total_to_cent():
    allocation = allocate_budget(333.33, ["tiktok", "meta", "spotify_manual"], "release_streams")
    assert round(sum(allocation.values()), 2) == 333.33
    assert allocation["tiktok"] > allocation["meta"]
    assert allocation["spotify_manual"] > 0


def test_cells_create_attributed_variants():
    cells = build_test_cells(
        campaign_name="Lyrica Creator Launch",
        provider="tiktok",
        budget_usd=120,
        creative_ids=["hook_a", "hook_b"],
        audience_ids=["indie_artists", "producers"],
        destination_url="https://lyrica3.com/join?ref=launch",
    )
    assert len(cells) == 4
    assert round(sum(cell["test_budget_usd"] for cell in cells), 2) == 120
    assert all("utm_source=tiktok" in cell["destination_url"] for cell in cells)
    assert all(cell["status"] == "planned" for cell in cells)


def test_utm_preserves_existing_query():
    url = add_utm(
        "https://lyrica3.com/release?ref=creator",
        campaign="Release One",
        source="meta",
        medium="paid_social",
        content="video-a",
    )
    assert "ref=creator" in url
    assert "utm_campaign=release-one" in url
    assert "utm_content=video-a" in url


def test_metrics_and_pause_recommendation():
    row = {
        "impressions": 4000,
        "clicks": 20,
        "conversions": 0,
        "spend_usd": 50,
        "revenue_usd": 0,
    }
    metrics = calculate_metrics(row)
    assert metrics["ctr_pct"] == 0.5
    assert metrics["cpc_usd"] == 2.5

    recommendation = recommend_action(row, target_cpa_usd=20)
    assert recommendation["action"] == "pause_recommended"
    assert recommendation["automatic_change_enabled"] is False
    assert recommendation["requires_operator_approval"] is True


def test_scale_recommendation_still_requires_approval():
    result = recommend_action(
        {
            "impressions": 10000,
            "clicks": 500,
            "conversions": 10,
            "spend_usd": 100,
            "revenue_usd": 400,
        },
        target_cpa_usd=15,
    )
    assert result["action"] == "scale_recommended"
    assert result["metrics"]["cpa_usd"] == 10
    assert result["metrics"]["roas"] == 4
    assert result["automatic_change_enabled"] is False


def test_readiness_requires_budget_and_credentials():
    plan = valid_plan()
    plan["budget_approved"] = False
    plan["provider_credentials_present"] = False
    status = launch_readiness(plan)
    assert status["ready"] is False
    assert "budget_approved" in status["missing"]
    assert "provider_credentials_present" in status["missing"]


def test_approval_digest_is_stable_and_scope_bound():
    first = approval_digest("pcmp_1", 500, "manda")
    second = approval_digest("pcmp_1", 500, "manda")
    changed = approval_digest("pcmp_1", 600, "manda")
    assert first == second
    assert first != changed
