# Lyrica 3 Pro / Sonance Pro — PRD (SLA-113 MVP)

## Vision
**The Future of Music isn't AI. It's Creator-Owned AI.** Sovereign, biometrically-driven
music studio rooted in LA / SGV / El Monte Chicano heritage.

## Architecture
React 19 PWA + FastAPI + Motor(Mongo) + WebSocket + Claude Sonnet 4.5 via EMERGENT_LLM_KEY.
Static mount `/static/` for user uploads. Demucs v4 pipeline prepared (`backend/demucs_worker.py` + `Dockerfile`).

## Screens
- `/deck`      — Sonance Pro Stem Deck (4-track mixer, qualitative biometrics, **HTDemucs upload**, DNA panel)
- `/feed`      — Flip-It Economy (odometer wallet, live WS royalty ticker, cinematic MintingModal)
- `/universal` — **Bloodline Remix Leaderboard** (parent→flip chains, Network Gravity orbit SVG, immutable ledger)
- `/ignite`    — S2 Mutation Engine (**21 genres / 12 moods grouped**, ghost audio upload, IGNITE SOULFIRE)

## IP sanitization
Backend strips `lml`, `cultural_subtext`, raw biometric decimals before any client response.
`/api/generate` consumer schema = `{lyrics, genre, mood}`. Genre→cultural_matrix + mood→(lung,throat,fry,crack)
mapping lives **only in server.py**, never serialized to wire.

## Endpoints
- Auth: POST /api/auth/{register,login}, GET /api/auth/me
- Tracks: GET /api/tracks, /tracks/{dna}, POST /tracks/{dna}/flip
- Generate: POST /api/generate, GET /api/vibes (grouped)
- Upload: POST /api/demucs/separate (multipart, returns 4 stem URLs)
- Ledger: GET /api/ledger, GET /api/wallet
- Leaderboard: GET /api/leaderboard/bloodlines
- WebSocket: /api/ws/royalties?token=<jwt>

## Deployment
`Dockerfile` (Demucs-enabled FastAPI), `vercel.json` (frontend), `render.yaml` (backend), `DEPLOYMENT.md` runbook.

## Test
See `/app/memory/test_credentials.md`. Seed user `lyrica.prime / soulfire123`.
Iteration 2 report: backend 100%, frontend 100%.
