# 🚀 SHIP KIT — Lyrica3 Beta, This Week

Everything needed to go live, in order. Your Dockerfile ALREADY has the
Ubuntu Studio audio chain baked in (fluidsynth + soundfonts + ffmpeg, lines 3-6).
The cost guard is ALREADY wired (`LYRICA_FREE_TIER_ONLY`). This is assembly,
not construction.

## The shape

- **Public beta (cloud):** unlimited free instrumental generations — FluidSynth/procedural chain, DNA-tagged, $0 per track. `LYRICA_FREE_TIER_ONLY=1`. Cannot die from credit burnout: the free tier spends no credits, ever.
- **Paid custom orders (your Ubuntu Studio box):** full Soulfire + vocals + Nemotron ad-libs, fulfilled by you, $75–200/track, paid up front via PayPal link. Flag = 0 locally.

## Day 1 — Accounts + secrets (60–90 min)

1. MongoDB Atlas free tier (M0) → create cluster → get `MONGO_URL`.
2. Railway (or Render) account → you'll deploy two services: `lyrica-backend` (the existing Dockerfile) and `archisynapse` (fraud+spine service). Add a Railway Postgres to archisynapse.
3. Vercel account → frontend.
4. Generate secrets locally:
   ```bash
   python -c "import secrets; print('JWT_SECRET=' + secrets.token_hex(32))"
   python -c "import secrets; print('EMPIRE_SPINE_SIGNING_KEY=' + secrets.token_hex(32))"
   python -c "import secrets; print('ARCHISYNAPSE_PEPPER=' + secrets.token_hex(32))"
   ```
5. Copy `.env.example` → fill values. `LYRICA_FREE_TIER_ONLY=1` on cloud.

## Day 2 — Deploy backend + trust plane

```bash
# ArchiSynapse (from archisynapse-fraud-mvp/):
#   Railway: new service from repo, start cmd:
#   uvicorn archisynapse_fraud_mvp:app --host 0.0.0.0 --port $PORT
#   env: ARCHISYNAPSE_DATABASE_URL (Railway PG), ARCHISYNAPSE_PEPPER, EMPIRE_SPINE_SIGNING_KEY
# then create your merchant + API key:
curl -X POST https://YOUR-ARCHI.up.railway.app/admin/merchants \
  -H 'Content-Type: application/json' \
  -d '{"merchant_id":"lyrica3","name":"Lyrica3 Pro"}'
# SAVE the api_key it returns → ARCHISYNAPSE_API_KEY in Lyrica env

# Lyrica backend (from Lyrica3-pro/): Railway deploys the Dockerfile as-is.
# env: MONGO_URL, DB_NAME, JWT_SECRET, CORS_ORIGINS, LYRICA_FREE_TIER_ONLY=1,
#      EMPIRE_SPINE_SIGNING_KEY, ARCHISYNAPSE_BASE_URL, ARCHISYNAPSE_API_KEY
```

Smoke test (nothing goes further until these pass):
```bash
curl https://YOUR-LYRICA.up.railway.app/api/health         # or /docs
curl https://YOUR-ARCHI.up.railway.app/health
# generate one track via the API or UI, then:
curl -H "X-API-Key: $ARCHISYNAPSE_API_KEY" \
  https://YOUR-ARCHI.up.railway.app/api/v1/certificates     # cert minted?
```

Run the spine relay as a second process on the Lyrica service (Procfile-style)
or a Railway cron/worker:
```bash
python -m empire_spine.outbox --relay
```

## Day 3 — Frontend + gate

1. `frontend/`: set API base URL env to the Railway backend → `vercel --prod`.
2. Masthead: add "BETA" badge. Keep existing auth (signup = the gate; rate limiter already protects generation endpoints).
3. Add the money button on the track page: **"Want this with full vocals + Soulfire production? Custom orders 48h →"** linking to your order form (Google Form or Tally + PayPal.me link, live in 20 minutes).

## Day 4 — Money rail + fulfillment loop

1. PayPal.me / PayPal invoice for order intake. Price tiers:
   - **$75 Dedication** — custom instrumental + one vocal verse, MP3
   - **$150 Full Track** — full Soulfire production, vocals + ad-libs, WAV + MP3
   - **$200 Master + Stems** — everything + 4 stems + birth certificate PDF
2. Fulfillment on your box: pull order → run pipeline with `LYRICA_FREE_TIER_ONLY=0` → deliver files by email/Drive link → certificate lives at `/api/v1/certificates/{dna_tag}` as public proof.

## Day 5 — Launch

Post everywhere at once (copy below), then respond to every comment for 48h.

### IG/Facebook post
> We built the AI that Suno couldn't be. 🎶
> Lyrica3 makes music with CULTURA — Chicano Soul, oldies, corridos — with real
> groove, real feeling, not generic AI mush.
> 🔓 Free beta is LIVE: unlimited instrumentals, every track gets a digital
> birth certificate proving it's yours.
> 🎤 Want a full custom song — dedication, quinceañera, memorial, your own
> track with vocals? We make it in 48 hours. DM "SONG" or hit the link.
> El Monte born. SGV raised. Creator owned. 🌹
> [link]

### DM / text script (car clubs, local artists, friends)
> Hey — I finally launched my music platform. Free to try: [link]
> Real talk though: I'm doing custom songs this month — dedications, corridos,
> hooks for your tracks — $75-150, done in 48h, full ownership yours with
> receipts. Know anyone with a birthday/quince/anniversary coming up?

### BeatStars listing blurb
> SGV Chicano Soul / Oldies / Late-Pocket instrumentals. Analog-warm, human
> swing timing — not quantized AI mush. Every beat ships with a cryptographic
> ownership certificate. Custom orders available.

## The rules that keep it alive

1. Cloud NEVER runs metered engines. If you're tempted, re-read why every other launch died.
2. Money arrives BEFORE the expensive pipeline runs. No exceptions, not even for homies (give homies the free tier).
3. Nothing new gets built until this loop makes its first $500. Not one engine. The empire waits; it's good at that.
4. Any AI session that touches this repo starts by reading `EMPIRE_RESUME.md` at the projects root.
