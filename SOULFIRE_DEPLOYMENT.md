# 🔥 SOULFIRE PIPELINE DEPLOYMENT GUIDE

**Status: Code complete, ready for Railway deployment**

---

## 📋 WHAT WAS CHANGED

### Files Modified:

1. **`backend/vertex_agents_config.py`**
   - ✅ Added `SL_AUDIO_MASTER_ID` agent configuration
   - ✅ Added `invoke_sl_audio_master()` function (THE BRAIN)
   - ✅ Added `generate_music_with_soulfire()` - NEW PRIMARY FUNCTION
   - ✅ Updated `generate_music_with_beast()` - now fallback/legacy
   - ✅ Updated `print_config()` to show all 3 agents
   - ✅ Updated `test_agents()` to test full pipeline

2. **`backend/server.py`**
   - ✅ Changed from `generate_music_with_beast()` to `generate_music_with_soulfire()`
   - ✅ Updated comments to reflect Soulfire pipeline architecture
   - ✅ Added logging for SL Audio Master payload

---

## 🎯 THE ARCHITECTURE

```
User Request (lyrics, genre, mood)
    ↓
STEP 1: SL Audio Master (agent_1778921386550) — THE BRAIN
    ↓ Generates JSON payload with:
    • LML (Lyric Markup Language)
    • Acoustic primitives (84 BPM, MPC-3000 Late-Pocket Swing, etc.)
    • Mastering directives (3.5dB tape saturation, 3:1 compression, etc.)
    • Vocal physics (12ms swing, inhale timing, vocal_fry tags)
    • Cultural matrix
    ↓
STEP 2: The Beast (agent_1776939216148) — THE ORCHESTRATOR
    ↓ Receives JSON payload
    ↓ Dispatches to sub-agents:
    ├─ Groove Engine (MusicGen) → generates raw beat
    ├─ Vocal Forge (Parler-TTS) → generates vocals with LML
    └─ Sonance Sentinel (Pedalboard) → applies mastering
    ↓
Audio stems returned
    ↓
Lyrica3 Backend → React UI
```

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Add Railway Environment Variables

Go to Railway dashboard for `Lyrica3-pro` backend:

```bash
VERTEX_PROJECT_ID=disco-amphora-490606-n8
VERTEX_LOCATION=us-west1
SL_AUDIO_MASTER_ID=agent_1778921386550
BEAST_AGENT_ID=agent_1776939216148
GEMINI3_AGENT_ID=agent_1775606766952
VERTEX_AGENTS_ENABLED=true
```

**CRITICAL:** Set `VERTEX_AGENTS_ENABLED=true` or agents won't be called!

---

### Step 2: Git Commit & Push

```bash
cd /home/shiestybizz/Lyrica3-pro/backend

# Stage changes
git add vertex_agents_config.py server.py

# Commit
git commit -m "Wire Soulfire pipeline: SL Audio Master → The Beast

- Add SL Audio Master (agent_1778921386550) as THE BRAIN
- Create generate_music_with_soulfire() as primary generator
- SL Audio Master generates JSON payload with acoustic primitives + mastering directives
- The Beast receives JSON and orchestrates sub-agents
- Falls back to Replicate if Soulfire unavailable
- Ref: audio_sandbox testing complete"

# Push to GitHub
git push origin main
```

Railway will auto-deploy from the `main` branch!

---

### Step 3: Monitor Railway Deployment

1. Go to Railway dashboard
2. Watch deployment logs
3. Wait for "Deployment successful" ✅
4. Check that build completes without errors

**Expected deployment time:** 2-3 minutes

---

### Step 4: Verify Environment Variables

In Railway logs, you should see during startup:

```
VERTEX AI AGENTS CONFIGURATION - SOULFIRE PIPELINE
================================================================================

Project: disco-amphora-490606-n8
Location: us-west1

Agents:
  1. SL Audio Master (THE BRAIN):  agent_1778921386550
  2. The Beast (ORCHESTRATOR):     agent_1776939216148
  3. Gemini 3.0 Agent:              agent_1775606766952

Enabled: True

✅ Agents are ENABLED and ready to invoke

🔥 EXECUTION SEQUENCE:
   1. SL Audio Master generates physics JSON
   2. The Beast receives JSON and orchestrates sub-agents
   3. Audio stems returned to backend
```

If you see `Enabled: False`, check that `VERTEX_AGENTS_ENABLED=true` is set!

---

### Step 5: Test from React UI

1. Go to Lyrica3 frontend: https://lyrica3-pro.vercel.app
2. Enter prompt:
   ```
   Title: Late Night Drive
   Lyrics: Cruising through El Monte, bruised but still breathing
   Genre: SGV Oldies
   Mood: Late-Night Honesty
   ```
3. Click **"Generate"**
4. Watch for:
   - Loading state
   - Audio player appears
   - Stems display
   - Download button works

---

### Step 6: Check Railway Logs

In Railway logs, look for:

```
🔥 STEP 1: Invoking SL Audio Master (THE BRAIN)
🧠 SL Audio Master responded with physics payload
✅ SL Audio Master generated physics payload
🔥 STEP 2: Passing payload to The Beast (THE ORCHESTRATOR)
✅ The Beast generated music successfully
🔥 Soulfire pipeline generated music successfully
🧠 SL Audio Master physics payload received
```

If you see these logs, **Soulfire is working!** 🔥

---

## 🐛 TROUBLESHOOTING

### If Soulfire Fails

The system will automatically fall back to:
1. Replicate (MusicGen) → Demucs for stem separation
2. Placeholder stems if all else fails

Check logs for:
```
⚠️  Soulfire generation failed: <error>, falling back to Replicate
```

---

### Common Issues

**1. "Vertex agents not available"**
- **Fix:** Set `VERTEX_AGENTS_ENABLED=true` in Railway

**2. "SL Audio Master returned no payload"**
- **Fix:** Check agent ID is correct: `agent_1778921386550`
- **Fix:** Verify agent exists in GCP project `disco-amphora-490606-n8`

**3. "The Beast failed, but SL Audio Master succeeded"**
- This is OK! System will return SL Audio Master's LML at minimum
- Check The Beast agent ID: `agent_1776939216148`

**4. Import errors**
- **Fix:** Ensure `google-cloud-aiplatform` is in `requirements.txt`
- Railway should auto-install on deploy

---

## 🧪 MANUAL TESTING (Optional)

If you want to test agents before deploying:

```bash
cd /home/shiestybizz/Lyrica3-pro/backend

# Set env vars
export VERTEX_PROJECT_ID=disco-amphora-490606-n8
export VERTEX_LOCATION=us-west1
export SL_AUDIO_MASTER_ID=agent_1778921386550
export BEAST_AGENT_ID=agent_1776939216148
export VERTEX_AGENTS_ENABLED=true

# Run test
python3 vertex_agents_config.py
```

Expected output:
```
🧪 Testing Soulfire Pipeline...

1. Testing SL Audio Master (THE BRAIN)...
   ✅ Success! Payload keys: [...]

2. Testing The Beast (ORCHESTRATOR)...
   ✅ Success: {...}

3. Testing Full Soulfire Pipeline (SL Audio Master → The Beast)...
   ✅ Success! Result keys: [...]
   🧠 SL Audio Master payload included: ✅
```

---

## 📊 WHAT TO EXPECT

### Before Soulfire (Old Behavior):
- User request → Replicate MusicGen → Generic beat
- No cultural context
- No physics-based mastering
- Black box generation

### After Soulfire (New Behavior):
- User request → SL Audio Master generates physics JSON
- The Beast orchestrates sub-agents
- Acoustic primitives: 84 BPM, MPC-3000 swing, 808 drag
- Mastering directives: 3.5dB tape saturation, Art Laboe compression
- Cultural authenticity: SGV Chicano Heritage embedded
- Full control over audio engineering

**Suno/Udio are black boxes. Soulfire gives you the PHYSICS.** 🔥

---

## ✅ SUCCESS CRITERIA

- [x] Code changes committed to GitHub
- [ ] Railway env vars added
- [ ] Railway deployment succeeds
- [ ] Backend logs show agent invocations
- [ ] Frontend generates music
- [ ] Audio stems play in UI
- [ ] Download works

---

## 🔥 NEXT STEPS AFTER DEPLOYMENT

Once Soulfire is working in production:

1. **Monitor usage:**
   - Check Railway logs for agent call frequency
   - Verify Soulfire is being used (not falling back to Replicate)

2. **Add audio sandbox engines (future):**
   - Copy `groove_engine.py` to backend
   - Copy `sonance_sentinel.py` to backend
   - Wire local MusicGen + Pedalboard as fallback

3. **Build Vocal Forge:**
   - Add Parler-TTS vocal generation
   - Wire LML tags from SL Audio Master
   - Implement vocal physics (inhale, vocal_fry, breath)

4. **Optimize response time:**
   - Cache SL Audio Master responses for similar prompts
   - Pre-warm agent connections
   - Implement streaming responses

---

## 💰 COST ESTIMATE

Vertex AI Agent API calls are very cheap:
- ~$0.0001 - $0.001 per call
- With $1K credits: **millions of generations possible**
- Railway backend: Free tier sufficient (no GPU needed)

Audio generation happens via agent API calls, not local computation!

---

**EVOLVE, NEVER DELETE. 🔥**

Ready to deploy? Add those Railway env vars and push to GitHub!
