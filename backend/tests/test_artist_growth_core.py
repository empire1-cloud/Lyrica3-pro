from decimal import Decimal

import pytest

from artist_growth_core import (
    audit_statement_rows,
    calculate_roas,
    contact_fingerprint,
    fan_score,
    fan_stage,
    preview_royalty_advance,
    validate_split_bps,
)


def test_split_requires_exact_100_percent():
    validate_split_bps(
        [
            {"payee": "artist", "share_bps": 7000},
            {"payee": "producer", "share_bps": 3000},
        ]
    )
    with pytest.raises(ValueError):
        validate_split_bps(
            [
                {"payee": "artist", "share_bps": 7000},
                {"payee": "producer", "share_bps": 2500},
            ]
        )


def test_split_rejects_duplicate_payees():
    with pytest.raises(ValueError):
        validate_split_bps(
            [
                {"payee": "Artist", "share_bps": 5000},
                {"payee": "artist", "share_bps": 5000},
            ]
        )


def test_statement_audit_finds_duplicate_and_underpayment():
    rows = [
        {
            "source": "ExampleDSP",
            "period": "2026-06",
            "isrc": "US-AAA-26-00001",
            "territory": "US",
            "usage_type": "stream",
            "units": 1000,
            "gross_usd": 4.00,
            "fees_usd": 0.50,
            "net_usd": 3.50,
        },
        {
            "source": "ExampleDSP",
            "period": "2026-06",
            "isrc": "US-AAA-26-00001",
            "territory": "US",
            "usage_type": "stream",
            "units": 1000,
            "gross_usd": 4.00,
            "fees_usd": 0.50,
            "net_usd": 3.50,
        },
    ]
    result = audit_statement_rows(
        rows,
        {"US-AAA-26-00001": Decimal("0.005")},
        Decimal("0.10"),
    )
    assert result["summary"]["row_count"] == 2
    assert result["summary"]["high_severity_count"] == 2
    assert result["summary"]["recoverable_usd"] == 3.0
    assert "possible_duplicate" in result["findings"][0]["codes"]
    assert "possible_underpayment" in result["findings"][0]["codes"]


def test_statement_without_contract_expectation_is_not_fake_underpayment():
    result = audit_statement_rows(
        [
            {
                "source": "Distributor",
                "period": "2026-Q2",
                "isrc": "US-AAA-26-00002",
                "units": 25,
                "net_usd": 1.25,
            }
        ]
    )
    finding = result["findings"][0]
    assert finding["severity"] == "info"
    assert finding["expected_usd"] is None
    assert "no_expectation" in finding["codes"]


def test_fan_score_and_stage_are_transparent():
    events = [
        {"event_type": "email_signup", "value_usd": 0},
        {"event_type": "share", "value_usd": 0},
        {"event_type": "merch_purchase", "value_usd": 40},
    ]
    score = fan_score(events)
    assert score == 50
    assert fan_stage(score) == "buyer"


def test_roas_handles_zero_spend():
    assert calculate_roas(100, 0) is None
    assert calculate_roas(100, 25) == 4.0


def test_contact_fingerprint_is_normalized_and_private():
    assert contact_fingerprint(" ARTIST@EXAMPLE.COM ") == contact_fingerprint("artist@example.com")
    assert contact_fingerprint("artist@example.com") != "artist@example.com"


def test_advance_is_preview_only_and_capped():
    preview = preview_royalty_advance(1000, advance_rate_bps=7000, fee_bps=500)
    assert preview["gross_advance_usd"] == 700.0
    assert preview["fee_usd"] == 35.0
    assert preview["net_advance_usd"] == 665.0
    assert preview["money_movement_enabled"] is False

    with pytest.raises(ValueError):
        preview_royalty_advance(1000, advance_rate_bps=7001, fee_bps=500)
