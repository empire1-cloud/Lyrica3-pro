# Lyrica 3 Pro · Empire 1 — Google Cloud Deployment

Target: **Cloud Run** for everything, **MongoDB Atlas** for data, domain **`www.lyrica3.com`**.

```
┌───────────────────────────────────────────────────────────────┐
│  www.lyrica3.com   →   Cloud Run  lyrica3-frontend  (nginx)   │
│  api.lyrica3.com   →   Cloud Run  lyrica3-backend  (FastAPI)  │
│  (always-on)       →   Cloud Run  lyrica3-bot  (Discord)      │
│  data              →   MongoDB Atlas cluster                  │
└───────────────────────────────────────────────────────────────┘
```

---

## 0 · One-time GCP setup

```bash
# 0.1 — create/select the project
export PROJECT_ID=lyrica3-prod
export REGION=us-central1
gcloud auth login
gcloud config set project $PROJECT_ID

# 0.2 — enable services
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  compute.googleapis.com

# 0.3 — Artifact Registry (hosts the 3 Docker images)
gcloud artifacts repositories create lyrica3 \
  --repository-format=docker \
  --location=$REGION \
  --description="Lyrica 3 Pro container images"

# 0.4 — Docker auth
gcloud auth configure-docker $REGION-docker.pkg.dev
```

---

## 1 · Secrets in Secret Manager

```bash
# Paste each value when prompted (or pipe from a secure file)
for s in MONGO_URL EMERGENT_LLM_KEY JWT_SECRET REPLICATE_API_KEY \
         DISCORD_BOT_TOKEN DISCORD_APP_ID DISCORD_PUBLIC_KEY \
         EMPIRE1_BOT_PASS; do
  printf "Enter %s: " "$s" && read -rs v && echo
  printf "%s" "$v" | gcloud secrets create "$s" --data-file=- 2>/dev/null \
    || printf "%s" "$v" | gcloud secrets versions add "$s" --data-file=-
done

# ─── 1b · Vertex AI IAM (the killer unlock — real music via Lyria) ─
# One-time grants on the Cloud Run runtime service account.
# This is what turns $REPLICATE_API_KEY from "needed" to "optional".
gcloud services enable aiplatform.googleapis.com texttospeech.googleapis.com
RUNTIME_SA="$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')-compute@developer.gserviceaccount.com"
for role in aiplatform.user texttospeech.user; do
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${RUNTIME_SA}" --role="roles/${role}"
done

# Lyria 2 access: may require one-time allowlist approval at
#   https://cloud.google.com/vertex-ai/generative-ai/docs/music-generation
# until approved, the pipeline auto-falls-back to Replicate → SoundHelix.


# Grant Cloud Run runtime SA read access to all of them
RUNTIME_SA="$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')-compute@developer.gserviceaccount.com"
for s in MONGO_URL EMERGENT_LLM_KEY JWT_SECRET REPLICATE_API_KEY \
         DISCORD_BOT_TOKEN DISCORD_APP_ID DISCORD_PUBLIC_KEY \
         EMPIRE1_BOT_PASS; do
  gcloud secrets add-iam-policy-binding $s \
    --member="serviceAccount:${RUNTIME_SA}" \
    --role="roles/secretmanager.secretAccessor"
done
```

---

## 2 · Build all 3 images via Cloud Build

From the repo root (the monorepo has `/cloudbuild.yaml`):

```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_REGION=$REGION,_REPO=lyrica3,_API_URL=https://api.lyrica3.com
```

The build tags images with `$BUILD_ID` (always set) so manual submits work. Git-triggered builds that set `$SHORT_SHA` are fine too; using only `$SHORT_SHA` breaks local/CLI submit because that variable can be empty.

This produces (pushes to Artifact Registry):
- `…/backend:latest`
- `…/frontend:latest`      ← built with `REACT_APP_BACKEND_URL=https://api.lyrica3.com`
- `…/discord-bot:latest`

---

## 3 · Deploy **backend** to Cloud Run  (`api.lyrica3.com`)

```bash
gcloud run deploy lyrica3-backend \
  --image=$REGION-docker.pkg.dev/$PROJECT_ID/lyrica3/backend:latest \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --port=8001 \
  --cpu=2 --memory=2Gi \
  --min-instances=1 --max-instances=10 \
  --timeout=300 \
  --concurrency=40 \
  --set-env-vars=DB_NAME=lyrica3_prod,CORS_ORIGINS=https://www.lyrica3.com\,https://lyrica3.com,VOICE_TTL_MIN=240,UPLOAD_TTL_MIN=1440,DEMUCS_ENABLED=false,VERTEX_AI_ENABLED=true,VERTEX_PROJECT_ID=$PROJECT_ID,VERTEX_LOCATION=us-central1 \
  --set-secrets=MONGO_URL=MONGO_URL:latest,EMERGENT_LLM_KEY=EMERGENT_LLM_KEY:latest,JWT_SECRET=JWT_SECRET:latest,REPLICATE_API_KEY=REPLICATE_API_KEY:latest
```

> Enable Demucs on a GPU host (Fly.io A100 / Vertex) — set `DEMUCS_ENABLED=true` and bump `--memory=4Gi --cpu=4` at minimum.

---

## 4 · Deploy **frontend** to Cloud Run  (`www.lyrica3.com`)

```bash
gcloud run deploy lyrica3-frontend \
  --image=$REGION-docker.pkg.dev/$PROJECT_ID/lyrica3/frontend:latest \
  --region=$REGION --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --cpu=1 --memory=512Mi \
  --min-instances=0 --max-instances=20
```

---

## 5 · Deploy **Discord bot** (always-on)

```bash
gcloud run deploy lyrica3-bot \
  --image=$REGION-docker.pkg.dev/$PROJECT_ID/lyrica3/discord-bot:latest \
  --region=$REGION --platform=managed \
  --no-allow-unauthenticated \
  --port=8080 \
  --cpu=1 --memory=512Mi \
  --min-instances=1 --max-instances=1 \
  --set-env-vars=EMPIRE1_API_URL=https://api.lyrica3.com,EMPIRE1_PUBLIC_URL=https://www.lyrica3.com,EMPIRE1_BOT_HANDLE=discord.empire1 \
  --set-secrets=DISCORD_BOT_TOKEN=DISCORD_BOT_TOKEN:latest,DISCORD_APP_ID=DISCORD_APP_ID:latest,DISCORD_PUBLIC_KEY=DISCORD_PUBLIC_KEY:latest,EMPIRE1_BOT_PASS=EMPIRE1_BOT_PASS:latest
```

> `min-instances=1` keeps the WebSocket gateway connected. Do not scale to zero for the bot.

---

## 6 · Map the domain  (`www.lyrica3.com`, `api.lyrica3.com`)

```bash
# 6.1 — verify the domain (one-time, outside of CLI)
#   Go to https://console.cloud.google.com/run/domains and click "Verify new domain"
#   GCP gives you a TXT record to paste into your registrar. Verify.

# 6.2 — map the frontend
gcloud beta run domain-mappings create \
  --service=lyrica3-frontend \
  --domain=www.lyrica3.com \
  --region=$REGION

gcloud beta run domain-mappings create \
  --service=lyrica3-frontend \
  --domain=lyrica3.com \
  --region=$REGION

# 6.3 — map the backend
gcloud beta run domain-mappings create \
  --service=lyrica3-backend \
  --domain=api.lyrica3.com \
  --region=$REGION
```

GCP returns A/AAAA records (for apex) or a CNAME (for subdomains). Paste them into your registrar's DNS panel. SSL certs are auto-provisioned.

---

## 7 · MongoDB Atlas

```
1. https://cloud.mongodb.com → create M0 free cluster (or M10 prod)
2. Security → Database Access → add user `lyrica3_app` with read/write on `lyrica3_prod`
3. Security → Network Access → add Cloud Run egress IPs
     (simplest: 0.0.0.0/0 until you enable VPC egress)
4. Clusters → Connect → "Connect your application" → copy the SRV URI
5. Paste it into the MONGO_URL secret (already done in step 1)
```

For lower-latency prod, enable **Cloud Run Direct VPC Egress** to a Serverless VPC Access connector, then whitelist only that connector's IP range on Atlas.

---

## 8 · Smoke tests

```bash
curl -s https://api.lyrica3.com/api/ | jq .
#  → {"message":"Empire 1 Ledger online. Soulfire armed.","version":"SLA-113"}

curl -s https://api.lyrica3.com/api/vibes | jq '.genres | length'
#  → 21

open https://www.lyrica3.com              # PWA loads; installable
# In Discord:
/ignite genre:SGV Oldies mood:Porch-Light Grief lyrics:east of the freeway wildflowers…
```

---

## 9 · Rolling deploys & rollback

```bash
# new version of backend
gcloud run deploy lyrica3-backend --image=$REGION-docker.pkg.dev/$PROJECT_ID/lyrica3/backend:<new-sha>

# instant rollback to previous revision
gcloud run services update-traffic lyrica3-backend \
  --to-revisions=LATEST=0,lyrica3-backend-00003-abc=100 \
  --region=$REGION
```

Cloud Run keeps all previous revisions — point traffic at any of them to rollback in <10s.

---

## 10 · Observability

```bash
gcloud run services describe lyrica3-backend --region=$REGION --format='value(status.url)'
gcloud run logs read --service=lyrica3-backend --region=$REGION --limit=100

# Metrics, alerts:
#   console.cloud.google.com/monitoring → Lyrica 3 dashboards
#   recommended alerts: 5xx rate > 1%, p95 latency > 2s, bot 0-instance > 5min
```

---

## 11 · Security & cost posture

- All secrets in Secret Manager (never in env files). Rotate `JWT_SECRET` on every major release.
- Uploads capped 25 MB, MIME-whitelisted, streaming-written.
- Generated voices TTL-sweeped every 30 min.
- Rate limits live on `/api/{auth,generate,demucs/separate}`.
- Typical monthly Cloud Run spend at MVP traffic (< 10k MAU):
  ~ $18 backend, $4 frontend (cold-start), $8 bot always-on, $0 Atlas M0 = **< $30/mo**.

**Hood is locked. Engine is hidden. Empire 1 is live on Google Cloud.** 🔥
