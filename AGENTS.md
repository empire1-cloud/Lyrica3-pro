# Agent notes — Lyrica 3 Pro / Empire 1 Ledger

## Creator-owned roadmap (A–Z)

Full playbook + copy-paste GitHub issues: [`docs/CREATOR_OWNED_AZ.md`](docs/CREATOR_OWNED_AZ.md) (attribution, manifest, ledger idempotency, charter, governance packs, VICS).

**Product principle:** *Back what you promote* — strong claims (ownership, provenance, cultural care, economics) must map to **manifest + ledger + policy logs + exports** where applicable. See the “backable claims” table at the top of that doc.

**Founder priority after that:** **Fair economics** — transparent splits, exportable ledger, documented rules, idempotent events, no hidden skims; goal is *everyone eats*, not opaque winner-take-all. See **“Next priority — economics”** in the same doc (Issue 9 template).

## SoulComposer (orchestrator)

The **SoulComposer** is a plan-only orchestration layer that sits **above** the existing S2 `POST /api/generate` pipeline. It does not mint tracks or call external TTS/MusicGen by itself.

- **Module:** `backend/soul_composer.py` — CCNA validation stub, EPD vocal blueprint (line → biometric LML tag suggestions), MMA “heartbeat” rhythm profile (BPM center, swing delay, default rhythm axis id).
- **API:** `POST /api/soul/compose` (auth required) — accepts `SoulComposeRequest`; returns JSON including `ccna`, `epd`, `mma`, `resolved_emotional_arc`, and `generate_request` (a body you can pass to `POST /api/generate`).
- **Tests:** `backend/tests/test_soul_composer.py` — run from repo: `cd backend && python3 -m pytest tests/test_soul_composer.py -v`

**Workflow:** Call `/api/soul/compose` → take `generate_request` from the response → `POST /api/generate` with the same session/cookie to produce stems, vocal, and ledger mint.

**Product:** **Mutation Engine** (`frontend/src/pages/MutationEngine.jsx`) runs this chain on **Ignite Soulfire**: `soulCompose` then `generate(plan.generate_request)`; users pick **Emotional Arc** (grief / intimacy / defiance / neutral) and see a short CCNA · MMA · EPD summary after mint.

**Vocal v2:** `backend/vocal_v2.py` — parses LML into spans with active tag stack, maps tags to **performance directives + TTS speed**, renders **one TTS call per span**, stitches MP3 with pydub. Used in `/api/generate` when Vertex Chirp is unavailable (before legacy single-pass `vocal_performance`). Env: same `EMERGENT_LLM_KEY` as TTS.

## Standard dev commands

See `README.md` / `memory/PRD.md` and `frontend/package.json` for frontend (`yarn install`, `yarn start`). Backend: `uvicorn server:app` from `backend/` with `.env` set (`MONGO_URL`, `DB_NAME`, etc.).

## Cursor Cloud specific instructions

- **SoulComposer** is intentionally **non-destructive**: it only returns a plan and a `generate_request` blob; all audio and DNA tags still flow through existing `/api/generate` logic.
- When `emotional_arc` is `grief` or `intimacy`, the composer may inject a default **rhythm** axis (`laboe_sunday_68` or `lowrider_cruise_76`) unless the client already set `axes.rhythm`.
- With `apply_arc_mood_hint: true` (default), `grief` / `defiance` / `intimacy` may override the request `mood` string to align with `_MOOD_RECIPE` keys used by the generator — set `apply_arc_mood_hint: false` to keep the client’s mood verbatim.
