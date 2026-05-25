# AGENTS.md — STOP. READ THIS BEFORE TOUCHING ANYTHING.

## ⛔ CRITICAL RULES FOR ALL AI AGENTS (Copilot, Cursor, Vercel, etc.)

1. **DO NOT** create new branches without explicit human approval
2. **DO NOT** modify `LyricaPublicLanding.tsx` — this is the canonical landing page
3. **DO NOT** replace the landing page with placeholder/stub components
4. **DO NOT** push directly to `main` — all changes go through PRs
5. **DO NOT** modify `App.tsx` routing without explicit instruction
6. **DO NOT** add new deployment configurations or override `vercel.json`

## Architecture — DO NOT CHANGE

```
Landing page:  LyricaPublicLanding.tsx  →  (click "Get Started")  →  LoginGate  →  MainApp (Black Box Studio)
Backend:       FastAPI at lyrica3-backend-e2q5oemapa-uw.a.run.app
Frontend:      Vercel (builds from frontend/, CRA)
```

## Protected Files (DO NOT MODIFY without human approval)
- `frontend/src/LyricaPublicLanding.tsx` — Landing page (1976 lines, black + neon pink)
- `frontend/src/App.tsx` — Main routing
- `vercel.json` — Deployment config
- `AGENTS.md` — This file

## Services Overview

| Service | Path | Start command | Port |
|---|---|---|---|
| Backend (FastAPI) | `backend/` | `uvicorn server:app --reload --port 8001` | 8001 |
| Frontend (React/CRA+CRACO) | `frontend/` | `yarn start` | 3000 |

Optional services (not required for core dev):
- Discord Bot (`discord_bot/`) — requires `DISCORD_BOT_TOKEN`
- Empire1 Ledger Service (`empire1_ledger_service/`)
- Cultura Frontend/Backend (`cultura/`)

## Prerequisites

- **MongoDB** must be running on `localhost:27017` before starting the backend. Quick start:
  ```
  mkdir -p /tmp/mongodb && mongod --dbpath /tmp/mongodb --bind_ip 127.0.0.1 --port 27017 --fork --logpath /tmp/mongodb/mongod.log
  ```
- Backend `.env` — copy from `backend/.env.example` to `backend/.env`. The defaults work for local dev (MongoDB on localhost, dev JWT secret).
- Frontend `.env.local` — set `REACT_APP_BACKEND_URL=http://localhost:8001`.

## Lint and Test

- **Backend lint:** `cd backend && ruff check .`
- **Backend tests:** `cd backend && python -m pytest tests/ -v`
- **Frontend lint:** `cd frontend && npx eslint src/`
- **Frontend tests:** `cd frontend && npx react-scripts test --watchAll=false`

## Build Notes
- Frontend uses Create React App with CRACO config override
- `TSC_COMPILE_ON_ERROR=true` and `DISABLE_ESLINT_PLUGIN=true` are set in `vercel.json` so TS warnings don't block builds
- Backend Dockerfile pulls `htdemucs` model weights at build time — first build takes longer
