"""
Benchmark #5: measure — do not assert — settlement-adjacent latencies.

Distinguishes three numbers that must never be conflated in a pitch:
  1. risk_decision_ms   : POST /risk/royalty round-trip (fraud decision)
  2. ledger_ack_ms      : POST event -> ArchiSynapse acknowledgment
  3. settlement         : actual money movement — NOT measured here; comes from
                          Stripe/processor reports. This script prints a reminder.

Reports p50/p95/p99 over N runs. Whatever these numbers are, THEY are the claim.

Usage:
    python benchmarks/bench_settlement_latency.py --n 100
"""

import argparse
import json
import os
import statistics
import subprocess
import sys
import time
import uuid
from datetime import datetime, timezone

import requests

BASE = os.environ.get("ARCHISYNAPSE_BASE_URL", "http://localhost:8000").rstrip("/")
API_KEY = os.environ.get("ARCHISYNAPSE_FRAUD_API_KEY", "")


def pct(values, p):
    values = sorted(values)
    idx = min(len(values) - 1, max(0, int(round(p / 100 * len(values))) - 1))
    return values[idx]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--n", type=int, default=100)
    args = parser.parse_args()

    headers = {"X-API-Key": API_KEY}
    body = {
        "creator_id": "bench_creator",
        "track_id": "trk_bench_latency",
        "amount": 10.0,
        "dna_verified": True,
        "soulprint_verified": True,
        "ledger_record_found": True,
        "creator_account_age_days": 400,
        "payout_method_age_days": 90,
    }

    latencies = []
    errors = 0
    for _ in range(args.n):
        t0 = time.perf_counter()
        try:
            r = requests.post(f"{BASE}/risk/royalty", json=body,
                              headers={**headers, "Idempotency-Key": f"lat-{uuid.uuid4()}"},
                              timeout=30)
            r.raise_for_status()
            latencies.append((time.perf_counter() - t0) * 1000)
        except Exception:
            errors += 1

    try:
        sha = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], text=True).strip()
    except Exception:
        sha = "unknown"

    report = {
        "benchmark": "risk_decision_latency",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "git_sha": sha,
        "base_url": BASE,
        "n": args.n,
        "errors": errors,
        "risk_decision_ms": {
            "p50": round(pct(latencies, 50), 1) if latencies else None,
            "p95": round(pct(latencies, 95), 1) if latencies else None,
            "p99": round(pct(latencies, 99), 1) if latencies else None,
            "mean": round(statistics.mean(latencies), 1) if latencies else None,
        },
        "note": (
            "This measures FRAUD DECISION latency only. 'Settlement' means money "
            "movement and must be sourced from processor reports (Stripe payout "
            "timing). Do not present this number as settlement latency."
        ),
    }

    os.makedirs(os.path.join(os.path.dirname(__file__), "results"), exist_ok=True)
    out = os.path.join(os.path.dirname(__file__), "results", f"latency_{int(time.time())}.json")
    with open(out, "w") as f:
        json.dump(report, f, indent=2)
    print(json.dumps(report, indent=2))
    return 0 if latencies and errors == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
