# Creator-owned AI music — A–Z playbook

**Scope:** Lyrica 3 Pro / Empire 1 Ledger / Soulfire — attribution, provenance, economics, and trust for **creator-owned** (not platform-owned) AI-assisted music.

**Related code:** `backend/server.py` (generate, ledger, tracks), `backend/soul_composer.py` (SoulComposer), `AGENTS.md` (agent runbook).

---

## Product principle — back what you promote

**Founder intent:** Marketing and in-app copy must be **defensible**: every strong claim should map to something **stored, inspectable, or exportable** (manifest, ledger events, policy decision, charter version), not vibes.

| If we say… | We should be able to show… |
|------------|----------------------------|
| Creator-owned | Splits + ledger + charter acceptance on the manifest; who minted what |
| Provenance / DNA | `dna_tag`, manifest hashes, bloodline/parent links |
| Cultural care (CCNA) | Policy outcome + version + optional rationale (sanitized for UX) |
| No mimicry / safe use | Classifier decision logged; blocked/rewrite before expensive synth |
| Transparent money | Idempotent events + export (CSV/JSON) that reconciles |
| Soul / intentionality | SoulComposer plan (EPD/MMA) persisted and chainable to the final generate |

**Rule of thumb:** If we cannot attach **evidence** (artifact or export) to a claim within one release cycle, soften the claim or ship the evidence first.

---

## Next priority — economics (“everyone eats”)

**Founder intent:** After provability (*back what you promote*), **fair money** is the spine. Nobody should feel ripped off; the goal is **broad participation**, not “rich get richer” off opaque black boxes.

**Design commitments (product + engineering):**

| Principle | What it means in practice |
|-----------|---------------------------|
| **Transparency** | Splits are visible **at mint** and stored on the **manifest** snapshot; ledger events are **exportable** (CSV/JSON) so any creator can reconcile. |
| **No mystery math** | Document the formula for streams, flips, and parent residuals in plain language; version it (`economics_rules_version`). |
| **Anti-ripoff mechanics** | **Idempotent** events so retries don’t double-charge or double-credit; immutable append-only ledger; audit who changed splits (if ever). |
| **Remix fairness** | Bloodline / flip rules reward **upstream creators** without trapping new artists in zero-sum games — tune parent residual % with real data and clear caps if needed. |
| **Platform share** | If Lyrica / Empire takes a fee, it must be **named, capped, and disclosed** (charter + manifest); avoid hidden skims in “adjustments.” |
| **Access** | Small payouts matter: design for **low minimum friction** (within legal/payment rails) so emerging artists aren’t excluded. |

**Marketing alignment:** Do not claim “creator-owned” or “fair” until **export + split snapshot + written rules** ship — that *is* backing the promise.

---

## A — Attribution

**Goal:** Answer *who contributed what, when, with which tools?*

- Separate **human roles** (lyric seed, axis choices, performer DNA, edits) from **machine roles** (model IDs, provider, policy decisions).
- Persist a structured record beside every minted artifact (see **M — Manifest**).

**Done when:** A track document (or sidecar) lists creators, inputs, and engine versions without scraping logs.

---

## B — Bloodlines

**Goal:** Remixes and flips are a **directed graph** (parent → child), not a flat list.

- Carry `parent_dna` (already in model); aggregate **streams / earnings / depth** per root (bloodline leaderboard pattern).
- Royalty rules should **follow edges** (e.g. parent residual on flips — align math with product copy).

**Done when:** Any flip shows lineage; ledger events reference parent where applicable; bloodline totals reconcile with per-track totals.

---

## C — CCNA (Cultural validation)

**Goal:** Reduce **cultural flattening** and caricature; document pass / review / block.

- Today: heuristic stub in SoulComposer; target: LLM + **policy JSON** (`ALLOW` | `REQUIRE_REWRITE` | `BLOCK` + reasons).
- Surface **non-technical rationales** for creators when rewrite is required.

**Done when:** Every generation path can record a CCNA outcome in the manifest; blocked requests never mint silently.

---

## D — DNA (deterministic identity)

**Goal:** Stable **`dna_tag`** + hash for URLs, ledger, and disputes.

- Keep IDs unique; avoid reusing tags across environments.
- Tie **manifest hash** to audio + metadata when VICS lands.

**Done when:** No collision in production; DNA is the primary key in API and exports.

---

## E — EPD (Emotional / poetic delivery)

**Goal:** LML tags are **performance instructions**, not decorative markup.

- Map tags to measurable targets (F0 contour, breathiness, jitter) over time; document the mapping table.
- Allow **intentional rhyme fracture** when CCNA + arc justify it (prompt + policy, not only heuristics).

**Done when:** EPD blueprint from SoulComposer is stored on the plan/manifest; TTS path respects stripped LML + style hints consistently.

---

## F — Fractional economics

**Goal:** **Auditable** micro-royalties and splits.

- Splits: beat / vocal / lyricist (defaults + custom collab templates later).
- Use **append-only ledger events** with clear event types (`mint`, `flip`, `stream`, `payout`).

**Done when:** Wallet snapshot matches sum of rules applied to events (for test fixtures at minimum).

---

## G — Governance packs (universes)

**Goal:** One engine, **multiple universes** (Lyrica, Empire1, SLA113, etc.) with different policy + branding.

- Pack = policy version + allowed axes + copy + optional feature flags.
- Route by host, tenant header, or config — avoid forking the core pipeline per brand.

**Done when:** Two universes can run different CCNA strictness without duplicate compose/generate code.

---

## H — Heartbeat pocket (MMA)

**Goal:** Rhythm carries **emotional arc** (grief vs defiance), not only genre.

- SoulComposer **MMA** injects rhythm hints; `/api/generate` remains source of truth for actual audio.
- Document BPM / swing ranges per arc for QA.

**Done when:** Arc changes measurable defaults (axis + mood hint) and is visible in the plan JSON.

---

## I — Idempotency

**Goal:** Retries never **double-apply** money or mints.

- Add `Idempotency-Key` (or body `client_request_id`) on mint/stream/payout endpoints.
- Store processed keys with outcome reference.

**Done when:** Duplicate POST with same key returns same result, not a second track or double balance.

---

## J — JSON contracts

**Goal:** Prompts drift; **schemas** should not.

- Maintain JSON Schema for: manifest, policy check, SoulComposer output (subset), and critical API payloads.
- Validate in CI (fixtures) and optionally at runtime on ingress.

**Done when:** Invalid payloads fail fast with structured errors; schema versions are bumped intentionally.

---

## K — Keys & secrets

**Goal:** No secrets in repo, logs, or client bundles.

- GCP: Secret Manager for `MONGO_URL`, `JWT_SECRET`, LLM keys, Replicate, etc.
- Rotate after any exposure; redact in logging middleware.

**Done when:** Production deploy uses secrets references; grep/audit passes for accidental leaks.

---

## L — LML (Lyric Markup Language)

**Goal:** Single source for **tagged lyrics**; clean text for engines that cannot parse tags.

- Centralize strip/transform in one module (see `integrations._strip_lml` pattern).
- Version LML conventions when tags expand.

**Done when:** All TTS/music prompts use the same stripping rules; docs list supported tags.

---

## M — Manifest (provenance) v1

**Goal:** Every artifact has a **birth certificate**.

**Suggested minimum fields (illustrative):**

| Field | Purpose |
|--------|--------|
| `schema_version` | Manifest evolution |
| `request_id` / `dna_tag` | Correlation |
| `created_at` | ISO timestamp |
| `creators` | Handles + roles |
| `human_inputs` | Seeds, axes, DNA sliders |
| `soulcomposer` | CCNA, EPD summary, MMA (if used) |
| `models` | Provider + model id + versions |
| `policy` | CCNA decision, mimicry classifier outcome |
| `splits` | Royalty split snapshot |
| `content_hashes` | Lyrics hash, audio hash (when available) |

**Done when:** Mint writes manifest alongside track; API can return a **sanitized** manifest read model if product needs it.

---

## N — Non-mimicry

**Goal:** Block **artist imitation**; steer users to emotional/style parameters.

- Classifier + rewriter upstream of expensive generation.
- Log decision for audit; optional creator-visible explanation.

**Done when:** Known mimicry patterns are rejected or rewritten before synth; manifest records outcome.

---

## O — Ownership language (Creator Charter)

**Goal:** Plain-language **trust**: training use, sublicensing, takedowns, data retention.

- One short charter page + in-app summary at mint time.
- Align legal review with manifest fields (consent flags).

**Done when:** Charter is linked from app and versioned (e.g. `charter_version` in manifest).

---

## P — Policy-as-code

**Goal:** Rules enforced in **code + tests**, not only system prompts.

- Unit tests for: forbidden patterns, required manifest fields, split invariants.
- Optional: OpenAPI examples for compose → generate chain.

**Done when:** CI fails if policy regressions ship.

---

## Q — QC / moderation

**Goal:** Escalation path for edge outputs (similarity, hate, sexual minors, etc.).

- Queue + admin review hooks; block publish until cleared when severity is high.
- Keep PII out of moderation notes.

**Done when:** Role-gated review API or internal tool spec exists; events audit who approved.

---

## R — Render chain

**Goal:** Order of operations is explicit: **plan → compose (LML) → stems → vocal → (future) master**.

- SoulComposer = plan only; `/api/generate` = execute.
- Document fallbacks (Vertex / Replicate / placeholder).

**Done when:** Sequence diagram in repo matches code paths; failures return structured errors.

---

## S — SoulComposer

**Goal:** Visible **intentionality**: CCNA + EPD + MMA before synthesis.

- Backend: `POST /api/soul/compose` returns `generate_request`.
- Frontend (recommended): preview plan → confirm → `POST /api/generate`.

**Done when:** Primary creator flow uses compose → generate in UI, not only API scripts.

---

## T — Transparency

**Goal:** Creators can **export** what the platform knows about their money and works.

- CSV/PDF statements from ledger; downloadable manifest bundle.

**Done when:** Export endpoint or job exists; sample export in tests.

---

## U — Universal provider (SL Universal)

**Goal:** **Multi-tenant** operations: routing, DNS, policy packs, observability per universe.

- Shared core; per-tenant config in datastore or env.
- Runbooks for deploy order (backend vs frontend vs DNS).

**Done when:** Second production universe deploys without duplicating the FastAPI app.

---

## V — VICS / signing

**Goal:** Cryptographic or content-addressed **bundle** tying manifest + audio.

- Start with **hashes + signed URL discipline**; evolve to explicit signatures if product requires.

**Done when:** Third parties can verify “this file matches this manifest” offline (spec + reference impl).

---

## W — Wallet & webhooks

**Goal:** Move from **simulated** streams to partner-integrated events (future).

- Webhook ingress with signature verification; reconciliation jobs.

**Done when:** Design doc + stub endpoint or queue consumer; idempotent processing.

---

## X — eXplainability

**Goal:** Short **human-readable** reasons: why rhyme fracture, why tempo, why blocked.

- Map internal codes to copy strings; avoid raw model dumps in UI.

**Done when:** SoulComposer / policy responses include a `user_message` field where appropriate.

---

## Y — Yield (unit economics)

**Goal:** Sustainable **cost per generation** (LLM + TTS + music model).

- Meter per tenant; caps for free tier; dashboards for burn.

**Done when:** Internal dashboard or BigQuery export shows cost per `dna_tag`.

---

## Z — Zero-trust exposure

**Goal:** Assume breach: minimize blast radius.

- Rate limits, CORS + cookies, sanitized errors, no stack traces to clients.
- Regular dependency and secret scanning.

**Done when:** Security checklist passes for Cloud Run deployment; incident runbook exists.

---

## Recommended build order

1. **Manifest v1** — write on mint; store beside track; sanitize for public API (include **split snapshot** + `economics_rules_version` when ready).
2. **Economics core** — ledger **idempotency**, **creator export**, documented **stream/flip/residual** rules; optional: named **platform fee** fields on manifest.
3. **UI: SoulComposer → Generate** — preview plan, then call `/api/generate`.
4. **Creator Charter + mimicry UX** — trust layer; charter must include **money rules** in plain language.
5. **Governance packs** — per-universe policy version (economics pack may differ per universe).
6. **VICS bundle** — hashes + verification story.

---

## GitHub issues (copy-paste)

Use these as draft issues; adjust labels (`backend`, `frontend`, `docs`, `legal`, `P0`) to your project conventions.

---

### Issue 1 — Provenance manifest v1 + persistence

**Summary:** Add `manifest` (or `provenance`) document aligned with section **M**, written atomically when a track is minted (`POST /api/generate` and any other mint paths).

**Acceptance criteria**

- [ ] JSON Schema checked in under `docs/schemas/` (or `backend/schemas/`) with `schema_version`.
- [ ] Mint handler persists manifest on the track document (or `manifests` collection keyed by `dna_tag`).
- [ ] Black-box API does not leak raw internals; add `_sanitize_manifest` if needed.
- [ ] Fixture test: mint → read DB → assert required keys present.

---

### Issue 2 — SoulComposer in Mutation / generate UI

**Summary:** Wire `POST /api/soul/compose` then `POST /api/generate` from the primary creation flow; show CCNA / EPD / MMA preview.

**Acceptance criteria**

- [ ] Authenticated requests; cookie/session same as today.
- [ ] User can edit narrative after preview before final generate.
- [ ] Errors from compose or generate surface readable messages.
- [ ] Basic E2E or integration test optional (or manual QA checklist in PR).

---

### Issue 3 — Ledger idempotency keys

**Summary:** Support idempotent mint/stream/payout events per section **I**.

**Acceptance criteria**

- [ ] Header or body idempotency key documented in OpenAPI / README.
- [ ] Duplicate request returns same logical result (same `dna_tag` or same event id).
- [ ] Mongo index on idempotency key + operation type.

---

### Issue 4 — Creator statement export

**Summary:** Export ledger + track list for a user (CSV or JSON); section **T**.

**Acceptance criteria**

- [ ] `GET /api/wallet/export` or similar behind auth.
- [ ] Includes handles, dna_tags, event types, amounts, timestamps.
- [ ] Rate limited; no other users’ data.

---

### Issue 5 — Mimicry classifier + manifest logging

**Summary:** Integrate non-mimicry policy (**N**) pre-generation; store decision in manifest (**M**).

**Acceptance criteria**

- [ ] Block or rewrite path covered by tests.
- [ ] Manifest includes `policy.mimicry` decision + version.
- [ ] User-visible message on rewrite/block.

---

### Issue 6 — Governance pack skeleton

**Summary:** Config-driven policy version per universe (**G**); single compose/generate code path.

**Acceptance criteria**

- [ ] `policy_pack_id` (or host-derived) selects CCNA strictness / copy / feature flags.
- [ ] Document how to add a new universe in `AGENTS.md` or this file.
- [ ] Two packs tested in CI (fixtures).

---

### Issue 7 — VICS v0 (content-addressed bundle)

**Summary:** Export zip or JSON bundle: manifest + audio URLs + hashes (**V**).

**Acceptance criteria**

- [ ] `GET /api/tracks/{dna_tag}/bundle` or export job returns hash list.
- [ ] README explains verification steps for a third party.
- [ ] No unsigned binary trust claims beyond hashes unless crypto signing is implemented.

---

### Issue 8 — Creator Charter (product + legal)

**Summary:** Public charter page (**O**); `charter_version` on manifest; link from mint flow.

**Acceptance criteria**

- [ ] Charter markdown or CMS page linked from app footer and mint confirmation.
- [ ] Manifest stores `charter_version` user accepted.
- [ ] Legal review tracked (outside repo if needed).

---

### Issue 9 — Economics fairness spec (“everyone eats”)

**Summary:** Document and implement **transparent, defensible economics**: split snapshot on manifest, `economics_rules_version`, optional disclosed **platform_fee_bps** / cap, flip/parent residual formula in plain language + code.

**Acceptance criteria**

- [ ] Single source of truth doc (this file + `docs/ECONOMICS.md` or charter section) describes stream/flip/payout math.
- [ ] Mint persists **exact splits** and rules version on manifest or track doc.
- [ ] Creator can **export** ledger + per-track earnings (ties to Issue 4).
- [ ] No marketing claim of “fair” / “creator-owned money” until export + rules version ship.

---

## Maintenance

- Bump **manifest** and **policy** `schema_version` when fields change; migrate old documents or read with compatibility shims.
- Keep this doc and `AGENTS.md` in sync when SoulComposer or mint paths change.
