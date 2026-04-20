# Lyrica 3 Pro · Empire 1 — Deployment Runbook

Ship in 2 pieces: **Frontend → Vercel** (static PWA), **Backend → Render** (FastAPI + Demucs). MongoDB = **Atlas free tier**.

---

## 0 · Prereqs (one-time)

```bash
# 0.1 — create Atlas free cluster, whitelist 0.0.0.0/0, copy the SRV URI
# 0.2 — grab your Emergent Universal LLM key:  https://app.emergent.sh → Profile → Universal Key
# 0.3 — install CLIs
npm  i -g vercel
brew install render   # or: curl -fsSL https://render.com/download-cli/linux.sh | sh
```

---

## 1 · Push monorepo to GitHub

```bash
cd /app
git init -q                                # if not already
git remote add origin git@github.com:<you>/lyrica3pro.git
git add -A
git commit -m "SLA-113: ship Empire 1"
git push -u origin main
```

> On Emergent Platform the **"Save to GitHub"** button in the chat input handles this one-shot.

---

## 2 · Backend → Render

Render reads `/render.yaml` at repo root — it's already committed.

```bash
render login
render blueprint deploy         # creates the web service from render.yaml
# …or in the dashboard:  New → Blueprint → connect repo → Apply
```

Then in the Render dashboard for the `lyrica3pro-backend` service, set the 2 **secret** env vars (`sync: false` in the yaml):

| Key                 | Value                                                                  |
|---------------------|------------------------------------------------------------------------|
| `MONGO_URL`         | `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true`  |
| `EMERGENT_LLM_KEY`  | paste from Emergent dashboard                                          |

`JWT_SECRET` is auto-generated. `CORS_ORIGINS` / `DB_NAME` / `PORT` come from yaml.

Once deployed, test:

```bash
curl https://lyrica3pro-backend.onrender.com/api/
# → {"message":"Empire 1 Ledger online. Soulfire armed.","version":"SLA-113"}
```

Copy the Render URL — you'll need it for Vercel.

---

## 3 · Frontend → Vercel

```bash
cd /app
vercel login
vercel link                     # select scope, project name: lyrica3pro
vercel env add REACT_APP_BACKEND_URL production
# paste: https://lyrica3pro-backend.onrender.com

vercel --prod                   # first production deploy
```

Vercel reads `/vercel.json` — security headers, SW cache-control, and SPA rewrites are pre-baked.

Test the prod URL:
```bash
open https://lyrica3pro.vercel.app
# → PWA installable from Chrome/Edge/iOS Safari (Add to Home Screen)
```

---

## 4 · Custom domain (optional)

```bash
vercel domains add lyrica3pro.com
# update CORS_ORIGINS on Render to include the apex + www
```

---

## 5 · Demucs separation endpoint

The Docker image pre-caches the `htdemucs` model at build time (see Dockerfile). Once deployed you can hit:

```bash
curl -X POST https://lyrica3pro-backend.onrender.com/api/demucs/separate \
     -H "Authorization: Bearer <jwt>" \
     -F "file=@/path/to/track.mp3"
```

> Wire `/api/demucs/separate` into `server.py` per the snippet at the top of `backend/demucs_worker.py`.

**Hard notes:**
- Render **Starter** plan OOMs on demucs. Use **Standard** (2GB) or bigger.
- Switch to a GPU host (Fly.io A100, Lambda) + change the Dockerfile's `torch==2.3.1+cpu` line to the CUDA wheel for ~8× speedup.
- Stem output is written to `/app/backend/static/stems/` — mount it via FastAPI `StaticFiles` (one-liner).

---

## 6 · Post-deploy hardening checklist

- [ ] Rotate `JWT_SECRET` if it leaked during dev
- [ ] Lock `CORS_ORIGINS` to only your prod domains (no `*`)
- [ ] Set MongoDB Atlas IP whitelist to Render's outbound static IPs
- [ ] Confirm `GENERATE_SOURCEMAP=false` in Vercel env → no .map files in `/static/js`
- [ ] Open Chrome DevTools → Application → Manifest → "Installable: Yes" ✅
- [ ] Lighthouse PWA score should be ≥ 90

---

## 7 · Rollback (if prod misbehaves)

```bash
# Vercel — instant rollback
vercel rollback

# Render — dashboard → Events → "Rollback to previous deploy"
```

---

**That's it. Hood is locked. Engine is hidden. Empire 1 is live.** 🔥
