# LYRICA3 PRO: LOCAL AGENT CONFIGURATION

## GCP Vertex AI Agents

**Project:** `disco-amphora-490606-n8`  
**Location:** `us-west1`  
**Credits:** $1K available

### Active Agents

#### 1. SL Audio Master (THE BRAIN)
- **Agent ID:** `agent_1778921386550`
- **Role:** Primary orchestrator for Soulfire pipeline
- **Function:** Parses emotional arcs, generates LML (Lyrica Markup Language), enforces cultural OS rules
- **Model:** Gemini 3.0
- **Status:** LIVE on Railway backend at `https://lyrica3.com`

#### 2. The Beast (Music Generation Orchestrator)
- **Agent ID:** `agent_1776939216148`
- **Role:** Multi-agent orchestrator for audio generation
- **Function:** Coordinates 4 sub-agents (drums, bass, melody, vocals) → returns 4 stems
- **Model:** Gemini 3.0
- **Status:** LIVE on Railway backend at `https://lyrica3.com`

#### 3. Gemini 3.0 Agent (General Intelligence)
- **Agent ID:** `agent_1775606766952`
- **Role:** General-purpose reasoning and fallback
- **Function:** Handles edge cases, prompt refinement, metadata generation
- **Model:** Gemini 3.0
- **Status:** LIVE on Railway backend at `https://lyrica3.com`

---

## Local Development Setup

### Backend
**File:** `/home/shiestybizz/Lyrica3-pro/backend/vertex_agents_config.py`

**Required Environment Variables:**
```bash
VERTEX_PROJECT_ID=disco-amphora-490606-n8
VERTEX_LOCATION=us-west1
VERTEX_AGENTS_ENABLED=true

# Agent IDs (already set as defaults in code)
SL_AUDIO_MASTER_ID=agent_1778921386550
BEAST_AGENT_ID=agent_1776939216148
GEMINI3_AGENT_ID=agent_1775606766952

# Auth
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### Frontend
**File:** `/home/shiestybizz/Lyrica3-pro/frontend/.env.local`

**Current Config:**
```bash
REACT_APP_BACKEND_URL=https://lyrica3.com
```

**For local development:**
```bash
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## Soulfire Pipeline Flow

```
User Prompt
    ↓
SL Audio Master (agent_1778921386550)
    ↓
Parses emotional arc + generates LML
    ↓
The Beast (agent_1776939216148)
    ↓
Orchestrates 4 sub-agents
    ↓
Returns 4 stems: drums, bass, melody, vocals
    ↓
Post-processing: vocal chain (MIDI + acid delay + tape saturation)
    ↓
Digital birth certificate generation
    ↓
Micro-royalty distribution (7 stakeholders)
```

---

## Current Deployment Status

### Railway Backend
- **URL:** `https://lyrica3.com`
- **Status:** ✅ LIVE
- **Soulfire Pipeline:** ✅ Active
- **Vertex Agents:** ✅ Connected

### Vercel Frontend
- **URL:** `https://frontend-empire1-sla113-projects.vercel.app`
- **Status:** ✅ LIVE (bypassed landing page, direct studio access)
- **Backend Connection:** Points to `https://lyrica3.com`

### Local Setup
- **MongoDB:** ❌ Not installed (required for local backend)
- **Backend Server:** ❌ Not running
- **Frontend Server:** ❌ Not running

---

## To Start Local Development

### Option 1: Use Railway Backend (Recommended)
Frontend connects to live Railway backend at `https://lyrica3.com`:

```bash
cd /home/shiestybizz/Lyrica3-pro/frontend
yarn install
yarn start
```

Access at: `http://localhost:3000`

### Option 2: Full Local Stack (Requires MongoDB)
Install MongoDB, then:

```bash
# Terminal 1: Start MongoDB
docker run -d -p 27017:27017 mongo

# Terminal 2: Start Backend
cd /home/shiestybizz/Lyrica3-pro/backend
cp .env.example .env
# Edit .env: set VERTEX_AGENTS_ENABLED=true, add GOOGLE_APPLICATION_CREDENTIALS
uvicorn server:app --reload --port 8001

# Terminal 3: Start Frontend
cd /home/shiestybizz/Lyrica3-pro/frontend
yarn install
REACT_APP_BACKEND_URL=http://localhost:8001 yarn start
```

---

## Cost Per Track

**Agent API Calls:**
- SL Audio Master invocation: ~$0.00001
- The Beast orchestration: ~$0.00005
- 4 sub-agent generations: ~$0.0002
- Post-processing: ~$0.00001

**Total:** ~$0.0001 - $0.001 per track

**$1K GCP Credits:** ~1,000,000 tracks

---

## Anti-Generic Architecture

**Why Lyrica3 Never Outputs Generic AI:**

1. **Canon Locks:** SL Audio Master enforces cultural OS rules (E♭ Major/C Minor scale, SGV Chicano tuning)
2. **Persona Constraints:** The Beast maps persona embeddings to prevent "supportive boyfriend" energy
3. **Emotional Math:** Biometric artifacts (vocal fry, emotional crack) are enforced via MIDI generator
4. **Structured Payloads:** LML (Lyrica Markup Language) prevents JSON-singing nonsense
5. **Cultural OS:** SGV Chicano tuning locks prevent Americano tone drift

**Result:** Structured, sovereign, creator-owned music production with ZERO generic AI behavior.

---

**Built with 🔥 by shiestybizz113-cell**  
**El Monte // SGV // Since Day One**
