"""Pure business logic for the Lyrica 3 Artist Growth + Royalty Engine.

This module intentionally has no database or network dependencies so the
critical money, attribution, and segmentation rules remain easy to test.
"""

from __future__ import annotations

from collections import Counter
from decimal import Decimal, ROUND_HALF_UP
from hashlib import sha256
from typing import Any, Iterable, Mapping

CENT = Decimal("0.01")
BPS_DENOMINATOR = Decimal("10000")


def money(value: Any) -> Decimal:
    """Normalize a value to USD cents using decimal arithmetic."""
    return Decimal(str(value or 0)).quantize(CENT, rounding=ROUND_HALF_UP)


def money_float(value: Any) -> float:
    return float(money(value))


def contact_fingerprint(value: str | None) -> str | None:
    """Return a privacy-preserving stable identifier for email/phone values."""
    if not value:
        return None
    normalized = "".join(value.strip().lower().split())
    if not normalized:
        return None
    return sha256(normalized.encode("utf-8")).hexdigest()


def validate_split_bps(participants: Iterable[Mapping[str, Any]]) -> None:
    """Require unique participants and an exact 100.00% split."""
    rows = list(participants)
    if not rows:
        raise ValueError("At least one split participant is required.")

    payees = [str(row.get("payee", "")).strip().lower() for row in rows]
    if any(not payee for payee in payees):
        raise ValueError("Every split participant requires a payee.")
    if len(payees) != len(set(payees)):
        raise ValueError("Split participants must be unique.")

    total = sum(Decimal(str(row.get("share_bps", 0))) for row in rows)
    if total != BPS_DENOMINATOR:
        raise ValueError(f"Split shares must total 10000 bps; received {total}.")


def calculate_roas(revenue_usd: Any, spend_usd: Any) -> float | None:
    spend = money(spend_usd)
    if spend <= 0:
        return None
    return round(float(money(revenue_usd) / spend), 4)


def fan_score(events: Iterable[Mapping[str, Any]]) -> int:
    """Compute a transparent 0-100 relationship score from fan behavior."""
    weights = {
        "link_click": 2,
        "presave": 10,
        "follow": 8,
        "email_signup": 12,
        "sms_signup": 14,
        "stream": 3,
        "repeat_stream": 6,
        "share": 9,
        "remix": 18,
        "ticket_purchase": 25,
        "merch_purchase": 25,
        "download_purchase": 20,
        "tip": 20,
    }
    total = 0
    for event in events:
        event_type = str(event.get("event_type", ""))
        total += weights.get(event_type, 1)
        value = money(event.get("value_usd", 0))
        if value > 0:
            total += min(20, int(value // Decimal("10")))
    return max(0, min(100, total))


def fan_stage(score: int) -> str:
    if score >= 80:
        return "superfan"
    if score >= 50:
        return "buyer"
    if score >= 25:
        return "engaged"
    if score >= 10:
        return "known_fan"
    return "anonymous_listener"


def audit_statement_rows(
    rows: Iterable[Mapping[str, Any]],
    expected_rate_usd_by_isrc: Mapping[str, Any] | None = None,
    variance_tolerance_pct: Any = Decimal("0.10"),
) -> dict[str, Any]:
    """Audit DSP/distributor rows for duplicates, malformed money, and underpayment.

    Expectations are intentionally supplied by the caller. This lets Lyrica use
    contract-specific rates instead of pretending every DSP has one universal
    rate. A row without an expectation remains visible as ``no_expectation``.
    """
    # Per-unit royalty rates are often fractions of one cent. Preserve their
    # full decimal precision here, then round only the extended row total.
    expected_rates = {
        str(key).strip().upper(): Decimal(str(value or 0))
        for key, value in (expected_rate_usd_by_isrc or {}).items()
    }
    tolerance = Decimal(str(variance_tolerance_pct))
    materialized = [dict(row) for row in rows]

    duplicate_keys = Counter(
        (
            str(row.get("source", "")).strip().lower(),
            str(row.get("period", "")).strip(),
            str(row.get("isrc", "")).strip().upper(),
            str(row.get("territory", "")).strip().upper(),
            str(row.get("usage_type", "stream")).strip().lower(),
        )
        for row in materialized
    )

    findings: list[dict[str, Any]] = []
    totals = {
        "gross_usd": Decimal("0"),
        "fees_usd": Decimal("0"),
        "net_usd": Decimal("0"),
        "expected_usd": Decimal("0"),
        "recoverable_usd": Decimal("0"),
    }

    for index, row in enumerate(materialized):
        source = str(row.get("source", "")).strip().lower()
        period = str(row.get("period", "")).strip()
        isrc = str(row.get("isrc", "")).strip().upper()
        territory = str(row.get("territory", "")).strip().upper()
        usage_type = str(row.get("usage_type", "stream")).strip().lower()
        units = Decimal(str(row.get("units", 0) or 0))
        gross = money(row.get("gross_usd", 0))
        fees = money(row.get("fees_usd", 0))
        net = money(row.get("net_usd", gross - fees))

        totals["gross_usd"] += gross
        totals["fees_usd"] += fees
        totals["net_usd"] += net

        row_key = (source, period, isrc, territory, usage_type)
        codes: list[str] = []
        severity = "info"

        if not isrc:
            codes.append("missing_isrc")
            severity = "high"
        if units < 0 or gross < 0 or fees < 0 or net < 0:
            codes.append("negative_value")
            severity = "high"
        if fees > gross:
            codes.append("fees_exceed_gross")
            severity = "high"
        if duplicate_keys[row_key] > 1:
            codes.append("possible_duplicate")
            severity = "medium" if severity == "info" else severity

        expected_rate = expected_rates.get(isrc)
        expected = money(units * expected_rate) if expected_rate is not None else None
        variance = None
        recoverable = Decimal("0")

        if expected is None:
            codes.append("no_expectation")
        else:
            totals["expected_usd"] += expected
            variance = money(net - expected)
            allowed_shortfall = max(CENT, money(expected * tolerance))
            if variance < -allowed_shortfall:
                codes.append("possible_underpayment")
                severity = "high"
                recoverable = abs(variance)
                totals["recoverable_usd"] += recoverable

        findings.append(
            {
                "row_index": index,
                "source": source,
                "period": period,
                "isrc": isrc,
                "territory": territory,
                "usage_type": usage_type,
                "units": float(units),
                "gross_usd": float(gross),
                "fees_usd": float(fees),
                "net_usd": float(net),
                "expected_usd": float(expected) if expected is not None else None,
                "variance_usd": float(variance) if variance is not None else None,
                "recoverable_usd": float(recoverable),
                "severity": severity,
                "codes": codes,
            }
        )

    actionable = [finding for finding in findings if finding["severity"] in {"medium", "high"}]
    return {
        "summary": {
            "row_count": len(findings),
            "actionable_count": len(actionable),
            "high_severity_count": sum(1 for finding in findings if finding["severity"] == "high"),
            **{key: float(money(value)) for key, value in totals.items()},
        },
        "findings": findings,
    }


def preview_royalty_advance(
    verified_receivables_usd: Any,
    advance_rate_bps: int = 7000,
    fee_bps: int = 500,
) -> dict[str, Any]:
    """Return a non-binding faster-access preview; never initiates a transfer."""
    if advance_rate_bps < 0 or advance_rate_bps > 7000:
        raise ValueError("Advance rate must be between 0 and 7000 bps.")
    if fee_bps < 0 or fee_bps > 2500:
        raise ValueError("Fee must be between 0 and 2500 bps.")

    receivables = money(verified_receivables_usd)
    gross_advance = money(receivables * Decimal(advance_rate_bps) / BPS_DENOMINATOR)
    fee = money(gross_advance * Decimal(fee_bps) / BPS_DENOMINATOR)
    net_advance = money(gross_advance - fee)
    retained_receivable = money(receivables - gross_advance)

    return {
        "status": "non_binding_preview",
        "verified_receivables_usd": float(receivables),
        "advance_rate_bps": advance_rate_bps,
        "fee_bps": fee_bps,
        "gross_advance_usd": float(gross_advance),
        "fee_usd": float(fee),
        "net_advance_usd": float(net_advance),
        "retained_receivable_usd": float(retained_receivable),
        "money_movement_enabled": False,
    }
