# Lyrica 3 Pro — Production Deploy Guide (GCP Cloud Run)
**Stack:** GCP Cloud Run (backend + frontend + discord bot) · MongoDB Atlas · GCP Secret Manager

---

## 0. Prerequisites

```bash
gcloud auth login
gcloud config set project <YOUR_PROJECT_ID>
gcloud services enable run.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
```

Create Artifact Registry repo (once):
```bash
gcloud artifacts repositories create lyrica3 \
  --repository-format=docker \
  --location=us-central1
```

---

## 1. MongoDB Atlas

1. https://cloud.mongodb.com → free M0 cluster
2. Database Access → Add user: `lyrica3`, generate password
3. Network Access → `0.0.0.0/0` (Cloud Run IPs are dynamic)
4. Connect → Drivers → copy SRV string → this is your `MONGO_URL`

---

## 2. GCP Secret Manager — store all secrets once

```bash
# MongoDB
echo -n "mongodb+srv://lyrica3:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority" | \
  gcloud secrets create lyrica3-mongo-url --data-file=- --replication-policy=automatic

# JWT — MUST match sla113-jwt-secret (SLA113 is identity provider)
# If sla113-jwt-secret already exists, reuse the same value:
gcloud secrets versions access latest --secret=sla113-jwt-secret | \
  gcloud secrets create lyrica3-jwt-secret --data-file=- --replication-policy=automatic
# OR just mount sla113-jwt-secret directly (recommended — one secret, one value):

# Discord bot token
echo -n "<your-discord-token>" | \
  gcloud secrets create lyrica3-discord-token --data-file=- --replication-policy=automatic

# Emergent LLM key
echo -n "<your-emergent-key>" | \
  gcloud secrets create lyrica3-emergent-key --data-file=- --replication-policy=automatic
```

Grant Cloud Run SA access to secrets:
```bash
PROJECT_NUMBER=$(gcloud projects describe $GOOGLE_CLOUD_PROJECT --format="value(projectNumber)")
SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

for secret in sla113-jwt-secret lyrica3-mongo-url lyrica3-discord-token lyrica3-emergent-key; do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:$SA" \
    --role="roles/secretmanager.secretAccessor"
done
```

---

## 3. Build images via Cloud Build

```bash
cd /path/to/Lyrica3-pro
gcloud builds submit --config cloudbuild.yaml .
```

This builds and pushes 3 images (backend, frontend, discord-bot) tagged `$SHORT_SHA` + `latest`.

---

## 4. Deploy backend

```bash
REGION=us-central1
PROJECT=$(gcloud config get-value project)
REPO=us-central1-docker.pkg.dev/$PROJECT/lyrica3

gcloud run deploy lyrica3-backend \
  --image $REPO/backend:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8001 \
  --memory 2Gi \
  --cpu 2 \
  --set-secrets "MONGO_URL=lyrica3-mongo-url:latest,JWT_SECRET=sla113-jwt-secret:latest,EMERGENT_LLM_KEY=lyrica3-emergent-key:latest" \
  --set-env-vars "DB_NAME=lyrica3_prod,CORS_ORIGINS=https://lyrica3.com,https://www.lyrica3.com,DEMUCS_ENABLED=false"
```

Copy the service URL: `https://lyrica3-backend-<hash>-uc.a.run.app`
Point `api.lyrica3.com` at it via GCP URL map (`empire1-web-map`).

---

## 5. Deploy frontend

```bash
gcloud run deploy lyrica3-frontend \
  --image $REPO/frontend:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 80 \
  --set-env-vars "REACT_APP_BACKEND_URL=https://api.lyrica3.com"
```

`lyrica3.com` and `www.lyrica3.com` route to this service via `empire1-web-map`.

---

## 6. Deploy Discord bot

```bash
gcloud run deploy lyrica3-discord-bot \
  --image $REPO/discord-bot:latest \
  --region $REGION \
  --platform managed \
  --no-allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --min-instances 1 \
  --set-secrets "DISCORD_BOT_TOKEN=lyrica3-discord-token:latest,JWT_SECRET=sla113-jwt-secret:latest" \
  --set-env-vars "EMPIRE1_API_URL=https://api.lyrica3.com,EMPIRE1_PUBLIC_URL=https://lyrica3.com,EMPIRE1_BOT_HANDLE=discord.empire1"
```

The bot is always-on (`--min-instances 1`). No HTTP traffic — Cloud Run keeps it alive as a worker.

---

## 7. Post-Deploy Login Test

```bash
# Health
curl https://api.lyrica3.com/api/

# Register via SLA113 Identity Firewall
curl -X POST https://sla113.southernlifestyle.org/api/identity/register \
  -H "Content-Type: application/json" \
  -d '{"handle":"testuser","password":"test123"}'
# → returns access_token + refresh_token

# Use token on Lyrica3
curl https://api.lyrica3.com/api/tracks?limit=5 \
  -H "Authorization: Bearer <access_token>"
```

---

## 8. Common Failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| Backend 500 on startup | `MONGO_URL` secret missing or SA lacks access | Check `gcloud secrets add-iam-policy-binding` step |
| 401 on all Lyrica3 routes | `JWT_SECRET` mismatch with SLA113 | Both services must use `sla113-jwt-secret:latest` |
| CORS errors | Frontend domain not in `CORS_ORIGINS` | Update `--set-env-vars` on backend and redeploy |
| Bot disconnects | `--min-instances 0` (default) | Set `--min-instances 1` |
| Demucs OOM | Default 512Mi RAM | Use `--memory 4Gi --cpu 4` + `DEMUCS_ENABLED=true` |

---

## 9. Local Dev

```bash
# Terminal 1 — MongoDB
docker run -d -p 27017:27017 --name mongo mongo:7

# Terminal 2 — Backend
cd Lyrica3-pro/backend
cp ../.env.example .env   # set MONGO_URL=mongodb://localhost:27017, JWT_SECRET=dev-secret
pip install -r requirements.txt
uvicorn server:app --reload --port 8001

# Terminal 3 — Frontend
cd Lyrica3-pro/frontend
# .env.local: REACT_APP_BACKEND_URL=http://localhost:8001
yarn install && yarn start
```

> **Local JWT_SECRET note:** for local dev use any string. For staging/prod, always use
> `sla113-jwt-secret` from GCP Secret Manager so tokens issued by SLA113 work on Lyrica3.
