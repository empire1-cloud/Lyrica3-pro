---
name: run-lyrica3-pro
description: Install, start (backend + frontend), health-check, and drive the Lyrica3-pro creator loop — register, generate a track, view My Tracks, hit the Radio/SL Universal routes. Use when asked to run this app, build it, take a screenshot of it, test the creator/track-generation/radio flow, or check for console/API failures.
---

Lyrica 3 Pro is a FastAPI backend (`backend/server.py`, MongoDB-backed)
plus a Vite/React frontend (`frontend/`). Repo origin:
`empire1-cloud/Lyrica3-pro` (this is **not** the same repo as
`shiestybizz113-cell/LYRICA3_PRO` — verify `git remote -v` if unsure
which checkout you're in). Drive it by starting both servers, then
piping commands to the Playwright REPL at
`.claude/skills/run-lyrica3-pro/driver.mjs` (same vocabulary as the
`chromium-cli` skill — this machine doesn't have that skill installed,
so this driver is a same-command stand-in).

All paths below are relative to the repo root
(`~/projects/empires main project folders/Lyrica3-pro/`).

**The working tree may have uncommitted changes** (currently:
`frontend/src/features/radio/api/radioApi.ts`, `frontend/src/lib/api.ts`)
on branch `codex/lyrica-pr32-trust-fix`. Don't stash/commit/discard —
work around it. None of the steps below touch those files.

## Prerequisites

- Python 3.14 was what's installed here; the pinned `backend/requirements.txt`
  (`pydantic==2.5.0` → `pydantic-core==2.14.1`) **fails to build from
  source** on 3.14 (`ForwardRef._evaluate()` signature changed). Fix:
  install newer, API-compatible versions instead of the exact pins —
  they have prebuilt wheels for 3.14 (see Setup). `runtime.txt` says
  `python-3.11.7` for Railway; if you have 3.11 available, the exact
  pins would work unmodified, but 3.14 + relaxed versions is verified
  working here.
- MongoDB via Docker (`mongod` is not installed locally):
  ```bash
  docker start mongodb 2>/dev/null || docker run -d --name mongodb -p 27017:27017 mongo:7
  ```
  (A container named `mongodb` may already exist, stopped, from prior
  sessions — `docker start` reuses it. `docker ps -a | grep mongodb` to check.)
- Node 18+ (verified on v22.22.1), npm.

## Setup

```bash
# Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install "pydantic>=2.9" "fastapi>=0.115" "uvicorn>=0.30" \
  motor pymongo python-dotenv pyjwt bcrypt slowapi python-multipart \
  numpy scipy cryptography
cd ..

# Frontend
cd frontend && npm install && cd ..

# Driver's own Playwright dep (isolated — does not touch the app's package.json)
cd .claude/skills/run-lyrica3-pro && npm install && cd ../../..
npx --prefix .claude/skills/run-lyrica3-pro playwright install chromium   # one-time, ~300MB, no --with-deps (no passwordless sudo here)
```

`backend/.env` already has a working `MONGO_URL`/`DB_NAME`/`JWT_SECRET`
checked in for local dev. `EMERGENT_LLM_KEY` and `GOOGLE_API_KEY` are
blank — **this is fine**, track generation still works end-to-end via
the local procedural `music_engine/` pipeline (no AI key needed for a
real, non-stub audio file — verified, ~14s per track).

## Run (agent path)

**Background processes must be started with `setsid`, not plain `&`.**
Verified: a plain `cmd > log 2>&1 &` in one Bash tool call does not
reliably survive into the *next* tool call in this environment (the
process group gets torn down) — `setsid` fully detaches it so it
survives across calls.

```bash
docker start mongodb 2>/dev/null || docker run -d --name mongodb -p 27017:27017 mongo:7

cd backend && source .venv/bin/activate
setsid uvicorn server:app --host 0.0.0.0 --port 8001 > /tmp/backend.log 2>&1 < /dev/null &
disown
cd ..
timeout 30 bash -c 'until curl -sf http://localhost:8001/api/health >/dev/null; do sleep 1; done'

cd frontend
setsid env VITE_BACKEND_URL=http://localhost:8001/api npm run dev -- --port 3002 > /tmp/frontend.log 2>&1 < /dev/null &
disown
cd ..
timeout 30 bash -c 'until curl -sf http://localhost:3002/ >/dev/null; do sleep 1; done'
```

**`VITE_BACKEND_URL` must include the `/api` suffix** — see Gotchas.
Without it, every API call 404s.

Drive the creator loop in **one continuous driver invocation** (a new
`node driver.mjs` process = a fresh browser = empty localStorage, so
the auth token from a `nav`+register won't carry over to a separate
invocation — do the whole loop in one heredoc):

```bash
node .claude/skills/run-lyrica3-pro/driver.mjs <<'EOF'
nav http://localhost:3002/auth
fill input:nth-of-type(1) e2e_creator_0001
fill input[type=email] e2e0001@example.com
fill input[type=password] testpass123
click button:has-text("Create Account")
wait-for text=Create a protected Lyrica 3 track
screenshot 01-make-music
fill input[placeholder^="My"] E2E-Test-Track
fill textarea[placeholder^="Enter"] A soulful late-night boulevard anthem.
click button:has-text("Create + Save Track")
wait-for text=Open My Tracks 25000
screenshot 02-track-result
click button:has-text("View Proof")
wait-for text=Mint Ledger Record 10000
screenshot 02b-proof-page
click a:has-text("Back to Tracks")
wait-for text=Ready for SL Universal 15000
screenshot 03-my-tracks
console --errors
nav http://localhost:3002/radio
wait-for body 10000
screenshot 04-radio
nav http://localhost:3002/sl-universal
wait-for body 10000
screenshot 05-sl-universal
console --errors
quit
EOF
```

Screenshots land in `/tmp/shots/` (override with `SCREENSHOT_DIR`).

### Driver commands

| command | what it does |
|---|---|
| `nav <url>` | launch the browser (first call only) and navigate |
| `wait-for <selector> [timeoutMs]` | wait for a Playwright selector (`text=...`, CSS, `:has-text()`); default 10s — generation takes ~14-25s, pass an explicit timeout for post-submit waits |
| `screenshot [name]` | full-page screenshot → `/tmp/shots/<name>.png` |
| `screenshot-element <sel> [name]` | crop screenshot to one element |
| `click <selector>` | click via Playwright's real input pipeline |
| `fill <selector> <value...>` | fill a form field — selector must not contain spaces (splits on first space only); use `input[placeholder^="prefix"]` or `input:nth-of-type(n)`, not a full-string `[placeholder="..."]` match |
| `type <text>` / `press <key>` | keyboard input |
| `console [--errors]` | print collected `console.error`/`pageerror` output |
| `eval <js>` | evaluate JS in the page, print JSON result |
| `text [selector]` | print `innerText` |
| `quit` | close the browser, exit |

## Run (human path)

```bash
cd backend && source .venv/bin/activate && uvicorn server:app --reload --port 8001   # Ctrl-C to stop
cd frontend && npm run dev                                                           # opens on :3002 by default → visit in a browser. Ctrl-C to stop.
```

## Test

No frontend test script defined. Backend has `pytest`-style test files
(`test_*.py`) at repo root, untried as part of this pass — not run.

---

## Gotchas

- **FIXED (was: double `/api/api/` 404 on inline audio playback).**
  `absoluteAudioUrl()` in `frontend/src/lib/creatorLoop.ts` used to
  naively prepend the full `VITE_BACKEND_URL` (which needs a `/api`
  suffix for `lib/api.ts`'s axios client) onto `audio_url` (which the
  backend already returns as `/api/music/{id}/audio`), producing
  `.../api/api/music/{id}/audio`. Now strips a trailing `/api` from the
  backend origin before concatenating, so it works regardless of
  whether the env var includes the suffix or not. Verified: the
  `<audio>` element's real `src` resolves and plays (200, real MP3
  bytes) after this fix.
- **`REACT_APP_BACKEND_URL` in `frontend/.env.local` does nothing in
  Vite.** Vite only exposes env vars prefixed `VITE_` to
  `import.meta.env` (no custom `envPrefix` is set in `vite.config.ts`).
  The `.env.local` file sets `REACT_APP_BACKEND_URL` (a
  Create-React-App-era name) — it's silently ignored, and `api.ts`
  falls through to the `"/api"` default, which the dev proxy then
  routes to `lyrica3-pro.onrender.com` (see above).
- **Background dev servers need `setsid`.** A plain `cmd &` backgrounded
  in one shell tool call does not survive into the next call in this
  environment — the process gets torn down with its parent. Use
  `setsid cmd > log 2>&1 < /dev/null &` + `disown`.
- **Two separate `driver.mjs` invocations = two separate browsers.**
  `nav` only launches a browser on the *first* call within a process;
  each new `node driver.mjs` run starts a fresh, empty-localStorage
  browser. Auth tokens set in one invocation are gone in the next — do
  the whole register→create→view loop in one heredoc.
- **`wait-for text=...` can false-positive on static page copy.**
  E.g. `wait-for text=DNA` matched instantly because the MakeMusic
  form's static helper text ("DNA, Soulprint, and VICS metadata will
  be saved...") contains "DNA" — it resolved before the real ~14-25s
  generation finished, capturing a mid-"Creating..." screenshot. Wait
  for text that only exists in the *completed* state (e.g. `Open My
  Tracks`), with a generous timeout.
- **Real track generation is genuinely real, no AI key required.**
  Even with `EMERGENT_LLM_KEY`/`GOOGLE_API_KEY` blank, `POST
  /api/music/create` returns a real synthesized audio file (~14s,
  `music_engine/` procedural composer — drums/harmony/melody/render,
  no external API call). Not a stub, not a mock.
- **FIXED (was: `/music/:id/proof` dead on both ends, badges were
  client-fabricated).** Originally nothing linked to the proof page and
  the backend had no matching route; the DNA/Soulprint/VICS badges came
  from a client-side deterministic hash (`buildProof()`), not anything
  backend-verified. Now:
  - `backend/server.py`'s `/music/create` reuses the **same
    `vics_ledger.sign_track()` HMAC-SHA256 mechanism the sibling
    `/generate` endpoint already used** (it just wasn't wired into
    `/music/create` before) — every track gets a real cryptographic
    signature plus a real `mint` ledger event in `db.ledger` at
    creation.
  - New `GET /api/music/{track_id}/proof` re-verifies the signature at
    request time via `vics_ledger.verify_track()` (an actual
    recompute-and-compare — **tested adversarially**: hand-editing a
    track's title directly in Mongo flips `soulprint_verified` from
    `true` to `false` on the next proof fetch), looks up the real mint
    ledger record, and checks for flip/dispute lineage for
    `royalty_trust`. Nothing here is fabricated or ML-scored — it's
    real crypto verification + real ledger lookups only.
  - `MakeMusic.tsx` now fetches this real proof right after creation
    instead of calling `buildProof()`; `MyTracks.tsx`'s `TrackCard` and
    the `MakeMusic` result view both link to `/music/:id/proof`.
  - `TrackProof.tsx`'s "Blockchain Ledger" label was renamed to "Mint
    Ledger Record" — it's a real MongoDB ledger insert, not literally a
    blockchain; the old label overclaimed. `README.md`'s "blockchain-verified
    watermark" language (two occurrences) was corrected the same way in a
    separate docs-only pass — now says "cryptographically signed,
    server-verified provenance" (HMAC-SHA256, ledger-verified), matching
    what the backend actually does.
- **A React warning fires on every navigation away from `/auth`:**
  *"Cannot update a component (`RouterProvider`) while rendering a
  different component (`Auth`)"* — `Auth.tsx` calls `navigate()` in the
  component body (`if (getAuthToken()) { navigate(...); return null }`)
  instead of in a `useEffect`. Harmless in practice (navigation still
  works) but shows up in every `console --errors` check after visiting
  `/auth` — expected noise, not a new bug if you see it repeatedly.
- **Selectors with embedded spaces break `fill`/`click` args if you
  don't watch the driver's parsing.** The driver splits `fill <sel>
  <value>` on the *first* space only (fixed during this session — it
  originally split on *every* space, breaking any selector containing a
  quoted string with spaces, like `input[placeholder="My creator-owned
  track"]`). Prefer selectors without embedded spaces regardless:
  `input[placeholder^="My"]`, `input:nth-of-type(n)`.

## Troubleshooting

- **`POST /auth/register` → 404** (no `/api` prefix in the log line):
  `VITE_BACKEND_URL` was set without the `/api` suffix. Must be
  `http://localhost:8001/api`, not `http://localhost:8001`.
- **pip fails building `pydantic-core` with a Rust/maturin/cargo
  traceback ending in `ForwardRef._evaluate() missing 1 required
  keyword-only argument`:** Python 3.14 + the exact-pinned
  `pydantic==2.5.0`. Install `pydantic>=2.9` instead (prebuilt `cp314`
  wheels exist) — see Setup.
- **Backend log shows `MongoDB connection FAILED`:** the `mongodb`
  Docker container isn't running. `docker start mongodb` (or `docker
  run -d --name mongodb -p 27017:27017 mongo:7` if it doesn't exist yet).
- **`npx playwright install chromium --with-deps` fails** (`sudo: A
  terminal is required to authenticate`): no passwordless sudo here.
  Plain `npx playwright install chromium` (no `--with-deps`) works —
  the needed shared libs were already present.
- **A curl/driver command that started a background server "disappears"
  between tool calls:** it wasn't started with `setsid` — see Gotchas.
