# Lyrica 3 Pro / Sonance Pro — PRD (SLA-113 MVP)

## Vision
**The Future of Music isn't AI. It's Creator-Owned AI.** A sovereign, biometrically-driven
music studio rooted in LA / SGV / El Monte Chicano heritage, Art Laboe oldies, raw corridos,
and late-pocket street bounce. Generates "Soulfire" — bruised, culturally-loaded song-craft —
and mints every track's cryptographic DNA Tag onto the **Empire 1 Ledger** so creators earn
generational wealth from every remix (the "Flip It" economy).

## Original Problem Statement
Build a biometrically-driven decentralized AI music studio with 3 core screens:
1. Sonance Pro Stem Deck (SSL-console + cyberpunk mixer w/ biometric panel)
2. Flip-It Social Feed + live micro-royalty dashboard (Empire 1 Ledger)
3. S2 Mutation Engine (lyric ingestion + IGNITE SOULFIRE generator)

## User Choices (locked)
- Backend: FastAPI + MongoDB + WebSocket real-time royalty streaming
- Audio: Real stems (4 royalty-free MP3s) with working volume faders
- AI: Claude Sonnet 4.5 via Emergent Universal Key → structured LML JSON
- Auth: JWT + bcrypt, deterministic mock on-chain wallet (sha256(handle)[:16])
- Aesthetic: deep black #030303, amber/gold tubes, pink/blue biometric haze

## Architecture
```
React 19 (craco)                       FastAPI + Motor(MongoDB)
├─ /login                              ├─ /api/auth/{register,login,me}     JWT
├─ /deck   (Stem Deck)                 ├─ /api/tracks, /tracks/{dna}
├─ /feed   (Flip-It Feed)              ├─ /api/tracks/{dna}/flip            mints child DNA
└─ /ignite (Mutation Engine)           ├─ /api/generate                     Claude Sonnet 4.5
                                       ├─ /api/ledger, /api/wallet
                                       └─ /api/ws/royalties?token=…         live stream
```

## What's Been Implemented (2026-01)
- JWT auth (register/login/me) + bcrypt hashing + 14-day tokens
- 4 seeded SGV/Chicano/Laboe tracks w/ DNA tags (trk_alpha_006_elmonte, …)
  with idempotent upsert for schema evolution
- 4-track Stem Mixer (Raw Human Pipes / Late-Pocket Drums / Sub Bass-Requinto / Analog Melody)
  with real HTMLAudio stems, working faders controlling `.volume`, animated VU meters
- Biometric panel: Vulnerability Index, Lung Capacity, Throat Resonance (SVG ring dials),
  Phonation Type, Swing Delay, Emotional Cracks, Aether-Voice Map
- Flip-It Feed: track cards w/ DNA SynthID, 50/30/20 royalty splits, glowing FLIP IT modal
  that mints child DNA with parent_dna set → parent earns forever
- Live WebSocket Royalty Ticker: streams $0.004 events w/ split breakdown + parent residual
- Sovereign Wallet live-increments when user's own track streams
- S2 Mutation Engine: lyrics textarea, Cultural Matrix dropdown, Ghost Audio upload zone,
  4 biometric sliders, IGNITE SOULFIRE button w/ staged pipeline animation
- Claude Sonnet 4.5 LML generation via EMERGENT_LLM_KEY — returns JSON `{title,cultural_subtext,lml}`
  with embedded tags `<vocal_fry>`, `<adaptive_inhale>`, `<emotional_crack>`, `<tape_hiss>`,
  `<chest_voice>`, `<falsetto_break>`, `<grain_rasp>`, `<subharmonic>`. Fallback template on failure.
- TypeScript schema: `/app/frontend/src/lib/schema.ts` with `resolvePayout()` flip residual math
- Aesthetic: Unbounded display + JetBrains Mono + Instrument Serif, grain overlay, scanlines,
  amber-pulse / ignite-pulse / vu-flicker animations, custom vertical faders, tube glow

## Backlog / P1
- Real-time WebSocket reconnect + backoff (minor console warn on mount)
- Waveform preview per track on Feed cards
- Genre-tag search + filter on Feed
- Creator public profile pages
- On-chain settlement (currently simulated by WS)
- Ghost audio — actually process into drum transients (FFT)

## P2 / Future
- Stem isolation via stems-separation model (Demucs/Spleeter)
- Mobile companion (Expo)
- Social DM + beat marketplace
- Real smart-contract deployment (current ledger = Mongo)

## Test Credentials
See `/app/memory/test_credentials.md`. Default demo: `lyrica.prime` / `soulfire123`.

## Test Status (iter_1)
- Backend: 94% (16/17) — minor lml backfill issue fixed post-report
- Frontend: 100% — all 3 screens render, nav works, auth guard works, WS ticker live
