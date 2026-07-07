"""
Benchmark #4: idempotency — a retried request must NOT double-count.

Sends the same /risk/royalty request N times with one Idempotency-Key and
verifies (a) identical responses, (b) the merchant event count increased by
exactly 1. Then sends N distinct keys and verifies the count increases by N.

Usage:
    export ARCHISYNAPSE_BASE_URL=https://.../   (fraud service root)
    export ARCHISYNAPSE_FRAUD_API_KEY=ark_...
    python benchmarks/bench_idempotency.py --n 10
"""

import argparse
import json
import os
import subprocess
import sys
import time
import uuid
from datetime import datetime, timezone

import requests

BASE = os.environ.get("ARCHISYNAPSE_BASE_URL", "http://localhost:8000").rstrip("/")
API_KEY = os.environ.get("ARCHISYNAPSE_FRAUD_API_KEY", "")


def git_sha() -> str:
    try:
        return subprocess.check_output(["git", "rev-parse", "--short", "HEAD"],
                                       text=True).strip()
    except Exception:
        return "unknown"


def event_count(headers) -> int:
    r = requests.get(f"{BASE}/merchant/summary", headers=headers, timeout=15)
    r.raise_for_status()
    return r.json()["total_events"]


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--n", type=int, default=10)
    args = p.parse_args()

    headers = {"X-API-Key": API_KEY}
    body = {
        "creator_id": "bench_creator",
        "track_id": "trk_bench_idem",
        "amount": 42.0,
        "dna_verified": True,
        "soulprint_verified": True,
        "ledger_record_found": True,
        "creator_account_age_days": 400,
        "payout_method_age_days": 90,
    }

    report = {
        "benchmark": "idempotency",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "git_sha": git_sha(),
        "base_url": BASE,
        "n": args.n,
    }

    # Phase 1: same key N times -> exactly 1 new event, identical responses
    before = event_count(headers)
    key = f"bench-{uuid.uuid4()}"
    responses = []
    for _ in range(args.n):
        r = requests.post(f"{BASE}/risk/royalty", json=body,
                          headers={**headers, "Idempotency-Key": key}, timeout=15)
        r.raise_for_status()
        responses.append(r.json())
    after = event_count(headers)

    report["same_key_new_events"] = after - before
    report["same_key_responses_identical"] = all(r == responses[0] for r in responses)
    report["same_key_pass"] = (after - before == 1) and report["same_key_responses_identical"]

    # Phase 2: distinct keys N times -> exactly N new events
    before = event_count(headers)
    for _ in range(args.n):
        r = requests.post(f"{BASE}/risk/royalty", json=body,
                          headers={**headers, "Idempotency-Key": f"bench-{uuid.uuid4()}"},
                          timeout=15)
        r.raise_for_status()
    after = event_count(headers)
    report["distinct_keys_new_events"] = after - before
    report["distinct_keys_pass"] = (after - before == args.n)

    report["pass"] = report["same_key_pass"] and report["distinct_keys_pass"]

    os.makedirs(os.path.join(os.path.dirname(__file__), "results"), exist_ok=True)
    out = os.path.join(os.path.dirname(__file__), "results",
                       f"idempotency_{int(time.time())}.json")
    with open(out, "w") as f:
        json.dump(report, f, indent=2)
    print(json.dumps(report, indent=2))
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
