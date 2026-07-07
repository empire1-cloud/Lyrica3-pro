# 90-Day Wedge Plan v2 — ArchiSynapse + VICS Ledger

Date: 2026-07-05
Supersedes: `90-day-proof-plan.md` (v1 stays as evidence — WE EVOLVE. NEVER DELETE)
Responds to: investor feedback demanding ONE proven wedge before any expansion narrative

## The Commitment

For 90 days, the company externally IS one thing:

> **A provable trust layer for AI-generated music: every track gets a cryptographic birth certificate, every dollar routes through an auditable ledger with fraud controls.**

Lyrica3 is the demand engine for the wedge, not the pitch. The 7-universe framing, gaming, and fintech-OS story are internal roadmap only. They do not appear in any external material until Day 91, and then only via the causal expansion narrative (see `causal-expansion-narrative.md`).

## The Freeze List (what we will NOT do)

- No new universes, no new engines, no renames.
- No public claims without a benchmark script in `benchmarks/` that reproduces them (see claim scrub).
- No voice-cloning claims of any kind until the legal review closes (biometric/right-of-publicity exposure is a lawyer problem, not an engineering one).
- No architecture built for optics. New code must serve the wedge loop.

## The Wedge Loop (the only thing we demo)

```
Creator generates track in Lyrica3
  → Soulfire pipeline emits signed track.generated event   [BUILT: empire_spine]
  → ArchiSynapse verifies signature, dedupes, mints birth certificate
  → Payment charged with Idempotency-Key                   [BUILT: fraud MVP hardened]
  → Royalty split registered; fraud engine scores payout    [BUILT: /risk/royalty]
  → Creator sees certificate + split + payout status
```

## Milestones

**Days 1–14 — Make the wedge undeniable**
- Wire `empire_spine` into the pipeline completion path (event in same txn as track insert).
- Add `POST /api/v1/events` to deployed ArchiSynapse: verify HMAC, dedupe on event_id, mint certificate.
- Migrate deployed ArchiSynapse to Postgres; set env secrets.
- **Day 14: third-party technical auditor engaged** (investor feedback item). Scope: only claims in `benchmarks/README.md` claims inventory. Do NOT scope voice cloning — we don't ship it.
- Exit: end-to-end loop runs on production infra; `benchmarks/` scripts pass against prod.

**Days 15–45 — Testers on the real loop** (absorbs v1 plan days 1–30)
- 7–10 testers run the loop with the standard script; capture evidence.
- Publish first reproducibility demo publicly: same payload → same content hash, twice, live. This is the anti-Suno receipt that no competitor can fake.
- Daily Merkle root of certificates published to a public GCS object (external anchoring).
- Exit: testers complete loop unaided; certificate is legible to non-technical users.

**Days 46–75 — Repeatability + audit publication**
- 25–50 users or qualified waitlist.
- Auditor executive summary published (whatever it says — credibility comes from publishing).
- Operating dashboard: tracks minted, certificates verified, royalty events, fraud decisions, payout holds.
- Exit: multiple users complete loop without hand-holding; audit summary public.

**Days 76–90 — Commercial signal**
- Convert strongest segment: 50 paying creators or pilot accounts.
- One retention signal worth reporting.
- Investor update built ONLY from dashboard numbers.
- Ship `causal-expansion-narrative.md` externally (Day 91+), now backed by a proven wedge.

## Metrics That Count (nothing else gets reported)

| Metric | Day 45 target | Day 90 target |
|---|---|---|
| Certificates minted on prod | 100 | 1,000 |
| Signature verification failures | 0 | 0 |
| Duplicate events accepted by ledger | 0 | 0 |
| Testers completing loop unaided | 7 | 25 |
| Paying creators / pilots | — | 50 |
| Fraud engine decisions logged | 50 | 500 |
| Published benchmark claims | 3 | all deck claims |

## Kill / Pivot Criteria (honesty clause)

If by Day 60 testers do not care about certificates (complete loop but never view/share proof), the wedge thesis is wrong as stated — the value is elsewhere in the loop (generation quality or payout speed), and we re-aim before Day 90 rather than after a raise.
