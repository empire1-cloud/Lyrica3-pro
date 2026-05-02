# LYRICA 3 PRO · PUBLIC SCALE READINESS GATE

**Date**: 2026-04-21 · **Env**: preview (single replica) · **Target**: GCP Cloud Run + `www.lyrica3.com`

---

## A · GCP Production Architecture

```
┌───────────── Cloudflare (optional pre-CDN) ─────────────┐
│                                                         │
│      Global HTTPS LB (static IP · managed SSL)          │
│       ├─ www.lyrica3.com  → lyrica3-frontend (nginx)    │
│       ├─ api.lyrica3.com  → lyrica3-backend  (FastAPI)  │
│       └─ apex/.online/.org/.store → 301 www.lyrica3.com │
│                                                         │
│   Cloud Run (--ingress=internal-and-cloud-load-balancing)
│     lyrica3-frontend   1–20 instances                   │
│     lyrica3-backend    1–10 instances   ← Redis bound   │
│     lyrica3-discord-bot  min=1 max=1                    │
│                                                         │
│   Memorystore Redis (TLS)   → distributed rate limits   │
│   MongoDB Atlas (M10)       → ledger + tracks + users   │
│   Secret Manager            → all secrets               │
│   Artifact Registry         → lyrica3/{backend,frontend,discord-bot}
└─────────────────────────────────────────────────────────┘
```

## B · DNS Plan (IONOS-compatible)

| Domain | Record | Type | Target | TTL | Purpose |
|---|---|---|---|---|---|
| `lyrica3.com` | `@` | A | `$LB_IP` | 300 | LB apex → 301 redirect to www |
| `lyrica3.com` | `www` | A | `$LB_IP` | 300 | canonical frontend |
| `lyrica3.com` | `api` | A | `$LB_IP` | 300 | backend host |
| `lyrica3.com` | `@` | TXT | *(GCP issues at verify)* | 3600 | domain verification |
| `lyrica3.com` | `_acme-challenge` | TXT | *(as issued)* | 300 | managed cert DNS-01 |
| `lyrica3.online` | `@` | A | `$LB_IP` | 300 | 301 → www.lyrica3.com |
| `lyrica3.online` | `www` | A | `$LB_IP` | 300 | 301 → www.lyrica3.com |
| `lyrica3.org` | `@` | A | `$LB_IP` | 300 | 301 → www.lyrica3.com |
| `lyrica3.org` | `www` | A | `$LB_IP` | 300 | 301 → www.lyrica3.com |
| `lyrica3.store` | `@` | A | `$LB_IP` | 300 | 301 → www.lyrica3.com |
| `lyrica3.store` | `www` | A | `$LB_IP` | 300 | 301 → www.lyrica3.com |

`$LB_IP` comes from step C-5 below. AAAA records optional but recommended (same step exposes IPv6).

## C · Deploy Commands (exact)

```bash
# ─── 1 · project + services ─────────────────────────────
export PROJECT_ID=lyrica3-prod
export REGION=us-central1
gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com \
  compute.googleapis.com redis.googleapis.com vpcaccess.googleapis.com

# ─── 2 · Artifact Registry + Docker auth ─────────────────
gcloud artifacts repositories create lyrica3 \
  --repository-format=docker --location=$REGION
gcloud auth configure-docker $REGION-docker.pkg.dev

# ─── 3 · Redis (Memorystore — 1 GB basic tier, TLS) ─────
gcloud redis instances create lyrica3-redis \
  --size=1 --region=$REGION --tier=basic --redis-version=redis_7_0 \
  --transit-encryption-mode=SERVER_AUTHENTICATION
REDIS_HOST=$(gcloud redis instances describe lyrica3-redis --region=$REGION --format='value(host)')
REDIS_PORT=$(gcloud redis instances describe lyrica3-redis --region=$REGION --format='value(port)')
REDIS_URL="rediss://${REDIS_HOST}:${REDIS_PORT}/0"
printf "%s" "$REDIS_URL" | gcloud secrets create REDIS_URL --data-file=-

# ─── 4 · VPC connector (Cloud Run → Memorystore) ─────────
gcloud compute networks vpc-access connectors create lyrica3-vpc \
  --region=$REGION --range=10.8.0.0/28

# ─── 5 · secrets ────────────────────────────────────────
for s in MONGO_URL EMERGENT_LLM_KEY JWT_SECRET REPLICATE_API_KEY \
         DISCORD_BOT_TOKEN DISCORD_APP_ID DISCORD_PUBLIC_KEY EMPIRE1_BOT_PASS; do
  printf "%s: " "$s" && read -rs v && echo
  printf "%s" "$v" | gcloud secrets create "$s" --data-file=- 2>/dev/null \
    || printf "%s" "$v" | gcloud secrets versions add "$s" --data-file=-
done
RUNTIME_SA="$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')-compute@developer.gserviceaccount.com"
for s in MONGO_URL EMERGENT_LLM_KEY JWT_SECRET REPLICATE_API_KEY REDIS_URL \
         DISCORD_BOT_TOKEN DISCORD_APP_ID DISCORD_PUBLIC_KEY EMPIRE1_BOT_PASS; do
  gcloud secrets add-iam-policy-binding $s \
    --member="serviceAccount:${RUNTIME_SA}" --role="roles/secretmanager.secretAccessor"
done

# ─── 6 · build all 3 images via Cloud Build ─────────────
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_REGION=$REGION,_REPO=lyrica3,_API_URL=https://api.lyrica3.com

# ─── 7 · deploy BACKEND (internal-only, LB-gated) ───────
gcloud run deploy lyrica3-backend \
  --image=$REGION-docker.pkg.dev/$PROJECT_ID/lyrica3/backend:latest \
  --region=$REGION --platform=managed \
  --ingress=internal-and-cloud-load-balancing \
  --no-allow-unauthenticated \
  --port=8001 --cpu=2 --memory=2Gi \
  --min-instances=1 --max-instances=10 --concurrency=40 --timeout=300 \
  --vpc-connector=lyrica3-vpc --vpc-egress=private-ranges-only \
  --set-env-vars="DB_NAME=lyrica3_prod,CORS_ORIGINS=https://www.lyrica3.com,VOICE_TTL_MIN=240,UPLOAD_TTL_MIN=1440,DEMUCS_ENABLED=false,TRUSTED_PROXY_CIDRS=35.191.0.0/16\,130.211.0.0/22\,10.8.0.0/28" \
  --set-secrets=MONGO_URL=MONGO_URL:latest,EMERGENT_LLM_KEY=EMERGENT_LLM_KEY:latest,JWT_SECRET=JWT_SECRET:latest,REPLICATE_API_KEY=REPLICATE_API_KEY:latest,REDIS_URL=REDIS_URL:latest

# ─── 8 · deploy FRONTEND + bot ──────────────────────────
gcloud run deploy lyrica3-frontend \
  --image=$REGION-docker.pkg.dev/$PROJECT_ID/lyrica3/frontend:latest \
  --region=$REGION --ingress=internal-and-cloud-load-balancing \
  --no-allow-unauthenticated --port=8080 --cpu=1 --memory=512Mi \
  --min-instances=0 --max-instances=20

gcloud run deploy lyrica3-discord-bot \
  --image=$REGION-docker.pkg.dev/$PROJECT_ID/lyrica3/discord-bot:latest \
  --region=$REGION --ingress=all --no-allow-unauthenticated \
  --port=8080 --cpu=1 --memory=512Mi --min-instances=1 --max-instances=1 \
  --set-env-vars="LYRICA_API_URL=https://api.lyrica3.com,LYRICA_PUBLIC_URL=https://www.lyrica3.com,EMPIRE1_API_URL=https://api.lyrica3.com,EMPIRE1_PUBLIC_URL=https://www.lyrica3.com,EMPIRE1_BOT_HANDLE=discord.empire1" \
  --set-secrets=DISCORD_BOT_TOKEN=DISCORD_BOT_TOKEN:latest,DISCORD_APP_ID=DISCORD_APP_ID:latest,DISCORD_PUBLIC_KEY=DISCORD_PUBLIC_KEY:latest,EMPIRE1_BOT_PASS=EMPIRE1_BOT_PASS:latest

# ─── 9 · Global HTTPS LB + static IP + managed cert ─────
gcloud compute addresses create lyrica3-lb-ip --global
LB_IP=$(gcloud compute addresses describe lyrica3-lb-ip --global --format='value(address)')
echo "DNS A-record target: $LB_IP"

# serverless NEGs (one per service)
gcloud compute network-endpoint-groups create lyrica3-neg-frontend \
  --region=$REGION --network-endpoint-type=serverless --cloud-run-service=lyrica3-frontend
gcloud compute network-endpoint-groups create lyrica3-neg-backend \
  --region=$REGION --network-endpoint-type=serverless --cloud-run-service=lyrica3-backend

# backend services
gcloud compute backend-services create lyrica3-be-frontend \
  --global --load-balancing-scheme=EXTERNAL_MANAGED
gcloud compute backend-services add-backend lyrica3-be-frontend \
  --global --network-endpoint-group=lyrica3-neg-frontend --network-endpoint-group-region=$REGION

gcloud compute backend-services create lyrica3-be-backend \
  --global --load-balancing-scheme=EXTERNAL_MANAGED
gcloud compute backend-services add-backend lyrica3-be-backend \
  --global --network-endpoint-group=lyrica3-neg-backend --network-endpoint-group-region=$REGION

# URL map: www → frontend, /api/* → backend
gcloud compute url-maps create lyrica3-urlmap --default-service=lyrica3-be-frontend
gcloud compute url-maps add-path-matcher lyrica3-urlmap \
  --path-matcher-name=api --default-service=lyrica3-be-frontend \
  --path-rules="/api/*=lyrica3-be-backend" \
  --new-hosts=api.lyrica3.com
# apex + alt TLDs → 301 redirect to canonical www
cat >/tmp/redirect.yaml <<'YAML'
kind: compute#urlMap
name: lyrica3-urlmap-redirect
defaultUrlRedirect:
  hostRedirect: www.lyrica3.com
  redirectResponseCode: MOVED_PERMANENTLY_DEFAULT
  stripQuery: false
  httpsRedirect: true
YAML
# (add host rules for lyrica3.com, lyrica3.online, .org, .store via Console UI
#  or `gcloud compute url-maps edit` — paste the redirect block under hostRules)

# managed SSL cert covering all 6 hostnames
gcloud compute ssl-certificates create lyrica3-cert \
  --global \
  --domains=www.lyrica3.com,lyrica3.com,api.lyrica3.com,lyrica3.online,lyrica3.org,lyrica3.store

# HTTPS proxy + forwarding rule (port 443)
gcloud compute target-https-proxies create lyrica3-https \
  --url-map=lyrica3-urlmap --ssl-certificates=lyrica3-cert
gcloud compute forwarding-rules create lyrica3-fr-https \
  --global --address=lyrica3-lb-ip --target-https-proxy=lyrica3-https --ports=443

# HTTP → HTTPS redirect on port 80
cat >/tmp/http-redirect.yaml <<'YAML'
kind: compute#urlMap
name: lyrica3-urlmap-http
defaultUrlRedirect:
  httpsRedirect: true
  redirectResponseCode: MOVED_PERMANENTLY_DEFAULT
YAML
gcloud compute url-maps import lyrica3-urlmap-http --source=/tmp/http-redirect.yaml --global -q
gcloud compute target-http-proxies create lyrica3-http --url-map=lyrica3-urlmap-http
gcloud compute forwarding-rules create lyrica3-fr-http \
  --global --address=lyrica3-lb-ip --target-http-proxy=lyrica3-http --ports=80

# ─── 10 · smoke tests ──────────────────────────────────
curl -s https://api.lyrica3.com/api/ | jq .
open https://www.lyrica3.com
# Discord:  /ignite genre:"SGV Oldies" mood:"Porch-Light Grief" lyrics:...
```

## D · Discord Phase 1 (shipped)

`/app/discord_bot/bot.py` — 2 slash commands registered:

| Command | Inputs | Returns |
|---|---|---|
| `/ignite` | `genre` (enum · 21), `mood` (enum · 12), `lyrics` (≤800 chars) | Embed · Claude title · DNA SynthID · OpenAI TTS MP3 attachment · buttons: 🔁 **FLIP IT ON EMPIRE 1** (`/feed?flip=<dna>`) · ♫ **Open Stem Deck** (`/deck?dna=<dna>`) · 📊 **Bloodline** (`/universal?root=<dna>`) |
| `/bloodline` | *(none — top 5)* | Embed w/ top 5 bloodlines, links to `/universal?root=<dna>` |

Env matrix: `DISCORD_BOT_TOKEN`, `DISCORD_APP_ID`, `DISCORD_PUBLIC_KEY`, `DISCORD_GUILD_ID`, `EMPIRE1_API_URL`, `EMPIRE1_PUBLIC_URL`, `EMPIRE1_BOT_HANDLE`, `EMPIRE1_BOT_PASS`. Aliases `LYRICA_API_URL` / `LYRICA_PUBLIC_URL` both supported.

## E · Security & Hardening — implemented

| Control | File | Evidence |
|---|---|---|
| Redis-backed distributed rate-limit | `server.py` (`Limiter(storage_uri=REDIS_URL)`) | 200 calls / 20 concurrency → 5 ✓ · 195 × 429 |
| Graceful fallback if Redis down | `try/except` around Limiter init → `memory://` | Boot log line when Redis unreachable |
| Trusted-proxy client-IP extraction | `trusted_client_ip()` + `TRUSTED_PROXY_CIDRS` | Spoofed headers from untrusted peer are ignored |
| Upload guards (MIME / 25 MB / sanitization) | `_safe_basename`, streaming write, `ALLOWED_UPLOAD_MIMES` | 415 on bad MIME, 413 on oversize |
| TTL sweeper (voices 4h / uploads 24h) | `_ttl_sweep()` | Task started at boot |
| Sanitized error responses | Global `HTTPException` + `Exception` handlers | 500 → `{"detail":"Empire 1 internal error."}` |
| PWA security headers | `vercel.json` + `frontend/nginx.conf` | HSTS, X-CTO, Referrer-Policy, Permissions-Policy |

## F · Test Evidence

### Single replica (preview, MEMORY storage)
```
-- AUTH REGISTER BURST (policy 5/min)
      5 × 200
    195 × 429
-- SPOOF PROBE from TRUSTED peer (127.0.0.1 is in default CIDRs)
     30 × 200         ← EXPECTED: loopback is trusted in dev defaults.
-- SPOOF PROBE from UNTRUSTED peer (verified earlier inline test)
     spoofed headers IGNORED → rate limit hit real socket IP
-- LATENCY /api/tracks (60 sequential)
p50 = 0.006s    p95 = 0.006s    p99 = 0.007s
```

### Multi-replica (≥ 2 Cloud Run instances, REDIS storage) — **required post-deploy gate**
Must be executed against the prod URL after step C-10:
```bash
API=https://api.lyrica3.com scripts/loadtest.sh
# Expected identical burst results regardless of replica the request hits,
# because rate-limit bucket lives in Memorystore Redis.
```

## G · Env Var Matrix

| Var | dev (preview) | staging | prod |
|---|---|---|---|
| `MONGO_URL` | local mongod | Atlas M0 | Atlas M10 |
| `DB_NAME` | `test_database` | `lyrica3_stg` | `lyrica3_prod` |
| `CORS_ORIGINS` | `*` | `https://stg.lyrica3.com` | `https://www.lyrica3.com` |
| `EMERGENT_LLM_KEY` | universal | universal | universal |
| `REPLICATE_API_KEY` | empty (fallback) | test token | prod token |
| `REDIS_URL` | empty → memory | Memorystore basic | Memorystore standard HA |
| `TRUSTED_PROXY_CIDRS` | default (permissive) | LB CIDRs only | LB + Cloudflare CIDRs |
| `JWT_SECRET` | dev secret | rotate | rotate + Secret Manager |
| `VOICE_TTL_MIN` / `UPLOAD_TTL_MIN` | 240 / 1440 | 240 / 1440 | 120 / 720 |
| `DEMUCS_ENABLED` | false | false | true on GPU host |

## H · Files / Infra Changed

**Code**
- `/app/backend/server.py` — Redis-backed `Limiter`, `trusted_client_ip()`, `TRUSTED_PROXY_CIDRS`
- `/app/backend/requirements.txt` — *no change* (`slowapi` + `limits[redis]` + `redis>=5`)
- `/app/discord_bot/bot.py` — `aiohttp` health endpoint on `$PORT` for Cloud Run
- `/app/discord_bot/Dockerfile` — new
- `/app/frontend/Dockerfile` + `/app/frontend/nginx.conf` — new, Cloud Run serving
- `/app/cloudbuild.yaml` — new, builds 3 images
- `/app/DEPLOYMENT.md` — rewritten for GCP
- `/app/LAUNCH_RUNBOOK.md` — this file
- `/app/.env.example` — added `REDIS_URL`, `TRUSTED_PROXY_CIDRS`, `DISCORD_*`, `LYRICA_*`, `VOICE_TTL_MIN`
- `/app/scripts/loadtest.sh` — new, repeatable gate test

**Infra** (post-deploy — not yet applied to prod)
- Artifact Registry `lyrica3` · Memorystore Redis (1 GB) · VPC connector `lyrica3-vpc`
- Cloud Run × 3 services · Secret Manager × 9 secrets
- Global HTTPS LB + static IP + managed SSL cert (6 SANs)
- URL map with `/api/*` → backend + 301 redirects for lyrica3.com/.online/.org/.store

## I · Open Risks

1. **`TRUSTED_PROXY_CIDRS` default is permissive (includes loopback + RFC1918)** for dev convenience. **MUST override in prod** to only the GCP LB health-checker (`35.191.0.0/16`, `130.211.0.0/22`) and — if fronting with Cloudflare — the Cloudflare v4 ranges. Set via `--set-env-vars`. Incomplete override = spoofable client-IP → rate-limit bypass. **Class: S (0.5d to ship, blocks prod)**.
2. **Redis failure mode currently fails OPEN**: if Memorystore is unreachable, limiter silently degrades to in-memory per-instance. Under multi-replica this means 2× throughput during Redis outages. For stricter posture: add a `/health/redis` probe that 503s when Redis is down, and let Cloud Run pull the instance out of rotation. **Class: M (1d)**.
3. **`--no-allow-unauthenticated` on backend requires LB service account identity tokens** — the LB NEG handles this, but if you ever bypass the LB, calls will 401. By design but worth calling out.
4. **Cloud Run min-instances=1 on backend costs ~$18/mo idle** — cheap insurance against cold-start-induced rate-limit false positives. Turn down to 0 only once you have production traffic patterns.
5. **Discord bot WebSocket disconnects on revisions** — `min=max=1` prevents duplicate gateway sessions; the gateway reconnects automatically (≤ 30s) but users may see a brief gap. **Acceptable.**
6. **Load-test evidence is single-replica only**. Multi-replica behavior with Redis CANNOT be verified from the preview environment — requires the post-deploy gate to complete the verdict.

## J · Acceptance Criteria Checklist

| Criterion | Result |
|---|---|
| Redis-backed rate limits identical across replicas | **PENDING** (code shipped; requires post-deploy multi-replica run) |
| Real client IP correctly identified behind proxy | **PASS** (trusted_client_ip + CIDR gating) |
| Header spoof from untrusted peer does NOT bypass | **PASS** (verified inline earlier; see §F note) |
| Load test meets SLA p95 < 200ms on `/api/tracks` | **PASS** (p95=6ms single-replica baseline) |
| Error rate < 1% under burst | **PASS** (429 is correct, not error) |
| Redis failure degrades safely (no open floodgate) | **PARTIAL** (memory fallback per-instance — see Risk #2) |
| Sanitized errors, no stack/secret leakage | **PASS** (global handlers) |

---

## 🟡 FINAL VERDICT

### **READY FOR STAGING — NOT YET READY FOR PUBLIC PRODUCTION**

**Reason**: two blockers below must clear on the staging/prod environment before public scale:

| Blocker | Effort | Fix |
|---|---|---|
| `TRUSTED_PROXY_CIDRS` prod override not yet applied (preview uses permissive defaults) | **S · 0.5d** | Set `TRUSTED_PROXY_CIDRS=35.191.0.0/16,130.211.0.0/22,<Cloudflare ranges>` in Cloud Run env on staging → re-run §F tests. |
| Multi-replica Redis test not yet run (preview is single-replica) | **S · 0.5d** | Deploy per §C, run `API=https://api.lyrica3.com scripts/loadtest.sh` against ≥2 instances → confirm **identical 5 × 200 / 195 × 429** bucket behavior. Attach log in PR. |

Once both clear with evidence attached (log snippets + LB dashboard screenshot):

> ### 🟢 READY FOR PUBLIC SCALE

**ETA**: 1 dev-day. No architectural changes required — just prod-env configuration and the gate re-run.
