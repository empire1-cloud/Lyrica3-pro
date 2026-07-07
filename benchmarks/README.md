# Benchmarks & Claims Inventory

Purpose: every externally-stated performance/cost claim must map to a script in this
directory that a third-party auditor can run without our help. If a claim has no
script, it does not leave the building. (Investor feedback, 2026-07: "asserted but
lack independent benchmarks or reproducible validation.")

## Claims inventory

| # | Claim (as pitched) | Status | Script | Disposition |
|---|---|---|---|---|
| 1 | Deterministic pipeline: same payload → identical output hashes | **Benchmarkable now** | `bench_determinism.py` | Keep — this is our strongest differentiator and it's provable |
| 2 | Cost per track $0.0001–$0.001 / "1M tracks on $1K GCP credits" | **Needs measurement** | `bench_cost_per_track.py` (stub — needs prod billing export) | Soften to measured number with date + config, or remove |
| 3 | "10–200x cheaper per track than competitors" (COMPETITIVE_ANALYSIS.md) | **Not benchmarkable** (competitor internals unknown) | — | Replace with our measured cost vs their public *prices* — different claim, honest one |
| 4 | Idempotent risk/payment endpoints (no double-charge on retry) | **Benchmarkable now** | `bench_idempotency.py` | Keep |
| 5 | Sub-100ms settlement | **NOT FOUND in repo docs** — if in deck, it is currently unsupported | `bench_settlement_latency.py` measures reality | Remove from deck until measured; settlement via Stripe Connect is seconds-to-days, "ledger event acknowledgment" may be sub-100ms — say which one we mean |
| 6 | Zero-shot voice cloning fidelity | **NOT FOUND in repo docs**; legal exposure flagged by investors | — | Remove entirely. We do not ship voice cloning; PFA biometric artifacts are synthesis parameters, not cloned voices. Never re-add without counsel sign-off |
| 7 | 31% cost savings | **NOT FOUND in repo docs** — provenance of number unknown | — | Remove until someone can say what it measures |
| 8 | 99.9% uptime (COMPETITIVE_ANALYSIS.md) | **Needs measurement** | use uptime monitor export, not a script | Replace with actual monitor data + window |
| 9 | Novelty 8.7 / Cohesion 8.2 / Impact 9.1 (manifesto) | Internal ASE scores, self-graded | — | Fine as *pipeline telemetry*; never present as external quality benchmarks |

## Running

```bash
export ARCHISYNAPSE_BASE_URL=...   # prod or staging
export ARCHISYNAPSE_API_KEY=...
python benchmarks/bench_idempotency.py
python benchmarks/bench_settlement_latency.py --n 100
python benchmarks/bench_determinism.py --payload tests/fixtures/sleep_on_the_floor.json
```

Each script prints a JSON report (machine-readable, timestamped, includes git SHA and
environment) to stdout and writes it to `benchmarks/results/`. Hand the auditor this
directory and the env vars; nothing else should be required.

## Auditor scope (Day-14 engagement, per wedge plan)

1. Reproduce claims #1 and #4 from a clean checkout.
2. Measure #5 (ledger-event ack latency AND actual settlement latency) and publish both numbers.
3. Verify #2 methodology against GCP billing export.
4. Confirm #6 and #7 do not appear in any current external material.
