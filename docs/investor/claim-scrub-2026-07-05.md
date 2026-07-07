# Claim Scrub — 2026-07-05

Sources reviewed: `ANTI_GENERIC_MANIFESTO.md`, `COMPETITIVE_ANALYSIS.md`,
`docs/investor/empire-one-one-pager.md`, `docs/investor/friends-and-family-mini-memo.md`,
plus three claims cited in investor feedback that do NOT appear in repo docs.

Legend: 🟢 keep · 🟡 reword · 🔴 remove until proven

## Claims cited by investors but NOT found in repo docs

These are apparently deck/verbal claims. They are the most dangerous kind — unsourced and unbenchmarked.

| Claim | Verdict | Action |
|---|---|---|
| "Zero-shot voice cloning" | 🔴 | Remove everywhere. We don't ship voice cloning; PFA biometric artifacts are synthesis parameters. Voice cloning also carries right-of-publicity/BIPA-class legal exposure the feedback correctly flags. Never reintroduce without counsel sign-off. |
| "Sub-100ms settlement" | 🔴 | Remove. Settlement (money movement) via processor rails is seconds-to-days. If the intended claim was fraud-decision or ledger-ack latency, measure with `benchmarks/bench_settlement_latency.py` and state the measured number with its correct name. |
| "31% cost savings" | 🔴 | Remove. Nobody can currently say what it measures or against what baseline. |
| "Multi-trillion-dollar fintech OS" | 🔴 | Replace with the capped, falsifiable chain in `causal-expansion-narrative.md`. |
| "7 universes, 245+ engines" | 🟡 | True-ish internally but strains credulity externally (their words). Externally: "one product (Lyrica3), one trust layer (ArchiSynapse), shared infrastructure." Universe count is internal roadmap language. |

## ANTI_GENERIC_MANIFESTO.md

| Claim | Verdict | Action |
|---|---|---|
| Suno sang our JSON payload (screen recording, 299MB, 2026-05-17) | 🟢 | Strong evidence — a dated recording. Keep. Publish a compressed clip so it's independently viewable. |
| Flow "supportive boyfriend" quote | 🟡 | Marked "comparison screenshot TBD" — don't use quoted dialogue until the screenshot exists. Paraphrase or capture it. |
| "IMPOSSIBLE for generic AI behavior to leak into output" | 🟡 | "Impossible" is an audit magnet. Reword: "structurally prevented and detectable — every rejection is logged and auditable." Same punch, defensible. |
| Novelty 8.7 / Cohesion 8.2 / Impact 9.1 | 🟡 | Self-graded by our own ASE organ. Fine as pipeline telemetry; never present as external quality benchmarks. Label as such. |
| Competitor comparison table (Suno/Udio/LIA/Jamu/Flow/Greysound ❌s) | 🟡 | Date-stamp it and cite each cell (docs page or test video). Undated feature tables about fast-moving competitors rot within a quarter. |
| Cost per track $0.0001–$0.001; "1M tracks on $1K GCP" | 🟡 | Plausible but unmeasured. Run one billing-export-backed measurement, then state: "measured $X/track on YYYY-MM config." Until then say "engineered for sub-cent generation cost." |
| Creator share 95% | 🟡 | This is a pricing decision, not a measurement — fine, but state it as policy ("our fee schedule takes 5%") not as a proven economic outcome. |
| Suno 70% / Udio 100% creator-share cells | 🟡 | Cite competitor ToS with retrieval dates or drop the column. |
| 5-organ pipeline, canon locks, LML, cultural gatekeeping descriptions | 🟢 | Architecture descriptions of shipped code — keep. Determinism claim now provable live via `benchmarks/bench_determinism.py`. |

## COMPETITIVE_ANALYSIS.md

| Claim | Verdict | Action |
|---|---|---|
| "99.9% uptime (Railway + Vercel)" | 🔴 as stated | That's the *platforms'* SLA, not our measured uptime. Replace with our monitor data over a stated window, or say "hosted on Railway/Vercel (99.9% platform SLA)." |
| "10–200x cheaper per track than competitors" | 🔴 | Competitor internal costs are unknowable. Honest version: our measured cost vs their public *prices* — a different, stronger claim. |
| "Break-even ~1,000 tracks at $1/track" | 🟢 | Simple arithmetic from stated assumptions — fine with assumptions shown. |
| "12ms vocal swing", "84 BPM MPC-3000 swing" etc. | 🟢 | Engineering parameters, not performance claims. Keep. |

## Investor docs (one-pager, mini memo)

Both are commendably modest — mostly 🟢. Two adjustments:

| Claim | Verdict | Action |
|---|---|---|
| "orchestration and mastering path under test" / "tests passing locally" | 🟢 | Honest. Strengthen post-wedge with prod evidence + audit summary. |
| "Southern Lifestyle handles white-label entertainment and arcade-style experiences" | 🟡 | Present tense for a future product. "Planned white-label layer" until it has users. |

## The rule going forward

A number appears in external material only if `benchmarks/README.md` lists it with a script/source and a dated result. Everything else is described qualitatively. This converts the audit demand from a threat into a marketing asset: we become the only AI music company whose deck is reproducible.
