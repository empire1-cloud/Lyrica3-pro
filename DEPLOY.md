# Lyrica 3 Pro — Production Deploy Guide
**Stack:** Render (backend Docker) + Vercel (frontend CRA) + MongoDB Atlas

---

## 1. MongoDB Atlas (free tier — do this first)

1. Go to https://cloud.mongodb.com → create a free M0 cluster (any region)
2. Database Access → Add user → username: `lyrica3`, password: generate one, save it
3. Network Access → Allow from anywhere: `0.0.0.0/0` (Render IPs are dynamic)
4. Connect → Drivers → copy the SRV string:
   ```
   mongodb+srv://lyrica3:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password. Save this — it's your `MONGO_URL`.

---

## 2. Backend on Render

1. Go to https://render.com → New → Web Service → Connect GitHub repo `shiestybizz113-cell/lyrica3-pro`
2. Settings:
   - **Name:** `lyrica3pro-backend`
   - **Root Directory:** `.` (repo root)
   - **Docker** runtime (Render auto-detects `Dockerfile` at root)
   - **Plan:** Standard (2GB RAM — Starter OOMs on Demucs)
   - **Region:** Oregon
3. Environment Variables (set in Render dashboard → Environment tab):

   | Key | Value |
   |-----|-------|
   | `MONGO_URL` | your Atlas SRV string from step 1 |
   | `DB_NAME` | `lyrica3_prod` |
   | `JWT_SECRET` | click "Generate" — Render creates a 32-char secret |
   | `EMERGENT_LLM_KEY` | your Emergent/Claude API key |
   | `CORS_ORIGINS` | `https://lyrica3.com,https://www.lyrica3.com` (update after Vercel deploy) |
   | `PORT` | `8001` |
   | `DEMUCS_ENABLED` | `false` (enable later with GPU plan) |

4. Health Check Path: `/api/`
5. Deploy → wait for build (~5 min for Docker + torch wheels)
6. Copy the Render service URL: `https://lyrica3pro-backend.onrender.com`

---

## 3. Frontend on Vercel

1. Go to https://vercel.com → New Project → Import `shiestybizz113-cell/lyrica3-pro`
2. Framework: **Create React App** (auto-detected)
3. Build settings (auto from `vercel.json`):
   - Build Command: `cd frontend && yarn install --frozen-lockfile && yarn build`
   - Output Directory: `frontend/build`
4. Environment Variables:

   | Key | Value |
   |-----|-------|
   | `REACT_APP_BACKEND_URL` | `https://lyrica3pro-backend.onrender.com` |
   | `GENERATE_SOURCEMAP` | `false` |

5. Deploy → get your Vercel URL: `https://lyrica3-pro.vercel.app`
6. **Go back to Render** → update `CORS_ORIGINS` to include this Vercel URL
7. Custom domain: add `lyrica3.com` in Vercel → point DNS CNAME to `cname.vercel-dns.com`

---

## 4. Discord Bot on Render (worker service)

1. In Render → New → **Background Worker** → same repo
2. Settings:
   - **Name:** `lyrica3pro-discord-bot`
   - **Root Directory:** `discord_bot`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python bot.py`
3. Environment Variables:

   | Key | Value |
   |-----|-------|
   | `DISCORD_BOT_TOKEN` | from Discord Developer Portal |
   | `DISCORD_GUILD_ID` | your server ID (for fast dev sync) |
   | `EMPIRE1_API_URL` | `https://lyrica3pro-backend.onrender.com` |
   | `EMPIRE1_PUBLIC_URL` | `https://lyrica3.com` |
   | `EMPIRE1_BOT_HANDLE` | `discord.empire1` |
   | `EMPIRE1_BOT_PASS` | generate a strong password |

---

## 5. Post-Deploy Login Test

```bash
# Test backend is up
curl https://lyrica3pro-backend.onrender.com/api/

# Test register
curl -X POST https://lyrica3pro-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"handle":"testuser","password":"test123"}'

# Test login
curl -X POST https://lyrica3pro-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"handle":"testuser","password":"test123"}'
# → should return {"token":"...","handle":"testuser","wallet":{...}}
```

---

## 6. Common Login Failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| Frontend shows "Access denied" | Backend CORS blocking Vercel domain | Add Vercel URL to `CORS_ORIGINS` in Render |
| Backend crashes on boot | `MONGO_URL` missing or wrong | Check Atlas connection string, whitelist `0.0.0.0/0` |
| Login returns 401 immediately | Wrong handle/password | Use register first; handle is lowercase |
| JWT errors after redeploy | `JWT_SECRET` changed | All existing tokens invalidated — users re-login |
| "Network Error" on frontend | `REACT_APP_BACKEND_URL` wrong | Must match Render URL exactly, no trailing slash |

---

## 7. Local Dev (quick start)

```bash
# Terminal 1 — MongoDB (Docker)
docker run -d -p 27017:27017 --name mongo mongo:7

# Terminal 2 — Backend
cd Lyrica3-pro/backend
cp ../.env.example .env   # already done — MONGO_URL=mongodb://localhost:27017
pip install -r requirements.txt
uvicorn server:app --reload --port 8001

# Terminal 3 — Frontend
cd Lyrica3-pro/frontend
# .env.local already has REACT_APP_BACKEND_URL=http://localhost:8001
yarn install
yarn start
# → http://localhost:3000
```
