# AGENTS.md

## Cursor Cloud specific instructions

### Services overview

| Service | Path | Start command | Port |
|---|---|---|---|
| Backend (FastAPI) | `backend/` | `uvicorn server:app --reload --port 8001` | 8001 |
| Frontend (React/CRA+CRACO) | `frontend/` | `yarn start` | 3000 |

Optional services (not required for core dev):
- Discord Bot (`discord_bot/`) — requires `DISCORD_BOT_TOKEN`
- Empire1 Ledger Service (`empire1_ledger_service/`)
- Cultura Frontend/Backend (`cultura/`)

### Prerequisites

- **MongoDB** must be running on `localhost:27017` before starting the backend. Quick start:
  ```
  mkdir -p /tmp/mongodb && mongod --dbpath /tmp/mongodb --bind_ip 127.0.0.1 --port 27017 --fork --logpath /tmp/mongodb/mongod.log
  ```
- Backend `.env` — copy from `backend/.env.example` to `backend/.env`. The defaults work for local dev (MongoDB on localhost, dev JWT secret).
- Frontend `.env.local` — set `REACT_APP_BACKEND_URL=http://localhost:8001`.

### Lint and test

- **Backend lint**: `cd backend && python3 -m flake8 server.py --max-line-length=120`
- **Backend tests**: `REACT_APP_BACKEND_URL=http://127.0.0.1:8001 python3 -m pytest backend/tests/backend_test.py -v` (requires backend running)
- **Frontend build check**: `cd frontend && yarn build` (CRA/CRACO build; ESLint is disabled in `craco.config.js`)

### Gotchas

- **No lockfile committed.** The repo has no `yarn.lock` or `package-lock.json`; `yarn install` generates a fresh lockfile each time.
- **TypeScript version mismatch.** The frontend pins `typescript@^4.9.5` but some dependencies (e.g. `react-hook-form@^7.56`) require TS 5+. Running `tsc --noEmit` fails on `node_modules` types. The CRA/CRACO build uses Babel and works fine regardless.
- **Frontend build fails (`yarn build`).** Some source files have incorrect relative import paths (e.g. `../lib/utils` instead of `../../lib/utils`). These are pre-existing issues. `yarn build` (production) fails with TS2307, but `yarn start` (dev server) compiles and serves fine.
- **Two pre-existing test failures** in `backend_test.py`: `TestVibes.test_vibes` (expects 7 genres, API returns 21) and `TestManifest.test_manifest` (404 — endpoint not implemented). The `test_emss_phase234.py` tests target endpoints not yet implemented (duet features).
- **System dependencies**: `ffmpeg` and `libsndfile1` are required by the backend for audio processing (Demucs/PyDub).
- **Redis is optional.** The backend falls back to in-memory rate limiting if `REDIS_URL` is not set.
- **AI API keys are optional for dev.** Track generation falls back to a `fallback` synth provider when no LLM keys are configured.
