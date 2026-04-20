from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, random, asyncio, json, re, uuid, hashlib
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal, Dict
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ['MONGO_URL']
DB_NAME   = os.environ['DB_NAME']
JWT_SECRET = os.environ.get('JWT_SECRET', 'dev_secret_change_me')
JWT_ALGO   = "HS256"
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Sonance Pro / Empire 1 Ledger API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("empire1")

# ============================================================
# SCHEMAS
# ============================================================

class RoyaltySplit(BaseModel):
    beat_maker: float = 0.50
    vocalist:   float = 0.30
    lyricist:   float = 0.20

class Stem(BaseModel):
    name: Literal["Raw Human Pipes", "Late-Pocket Drums", "Sub Bass / Acoustic Requinto", "Analog Melody"]
    level: float = 0.78
    peak:  float = 0.62
    src:   Optional[str] = None  # audio URL

class Biometrics(BaseModel):
    vulnerability_index: float
    phonation_type: str
    swing_delay_ms: int
    lung_capacity: float
    throat_resonance: float
    emotional_cracks: int
    aether_voice_map: str

class Track(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    dna_tag: str
    title: str
    creator: str
    cultural_matrix: str
    stems: List[Stem]
    biometrics: Biometrics
    splits: RoyaltySplit = Field(default_factory=RoyaltySplit)
    streams: int = 0
    flips: int = 0
    earnings_usd: float = 0.0
    stream_rate_usd: float = 0.004
    parent_dna: Optional[str] = None
    lml: Optional[str] = None
    cultural_subtext: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FlipRequest(BaseModel):
    new_title: str
    new_genre: str

class GenerateRequest(BaseModel):
    lyrics: str
    cultural_matrix: str
    title: Optional[str] = None
    ghost_audio_name: Optional[str] = None
    lung_capacity: float = 0.78
    throat_resonance: float = 0.66
    vocal_fry: float = 0.82
    emotional_cracks: float = 0.71

class LedgerEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    kind: Literal["mint", "flip", "stream", "payout"]
    dna_tag: str
    actor: str
    amount_usd: float = 0.0
    note: str = ""
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class RegisterReq(BaseModel):
    handle: str
    password: str

class LoginReq(BaseModel):
    handle: str
    password: str

# ============================================================
# AUTH
# ============================================================

def _wallet_for(handle: str) -> str:
    h = hashlib.sha256(handle.encode()).hexdigest()[:16]
    return f"0x{h}"

def _make_token(handle: str) -> str:
    payload = {"handle": handle, "exp": datetime.now(timezone.utc) + timedelta(days=14)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

async def current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict:
    if not creds:
        raise HTTPException(401, "Unauthenticated — Empire 1 Ledger access denied.")
    try:
        data = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid token.")
    user = await db.users.find_one({"handle": data["handle"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "Sovereign account not found.")
    return user

@api_router.post("/auth/register")
async def register(req: RegisterReq):
    handle = req.handle.strip().lower()
    if not re.match(r"^[a-z0-9_.-]{3,32}$", handle):
        raise HTTPException(400, "Handle must be 3-32 chars [a-z0-9_.-]")
    if len(req.password) < 6:
        raise HTTPException(400, "Password too short.")
    existing = await db.users.find_one({"handle": handle})
    if existing:
        raise HTTPException(409, "Handle already minted.")
    pwd_hash = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()
    wallet = _wallet_for(handle)
    doc = {
        "id": str(uuid.uuid4()),
        "handle": handle,
        "wallet": wallet,
        "password_hash": pwd_hash,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = _make_token(handle)
    return {"token": token, "handle": handle, "wallet": wallet}

@api_router.post("/auth/login")
async def login(req: LoginReq):
    handle = req.handle.strip().lower()
    user = await db.users.find_one({"handle": handle})
    if not user or not bcrypt.checkpw(req.password.encode(), user["password_hash"].encode()):
        raise HTTPException(401, "Invalid credentials.")
    token = _make_token(handle)
    return {"token": token, "handle": handle, "wallet": user["wallet"]}

@api_router.get("/auth/me")
async def me(user: Dict = Depends(current_user)):
    return user

# ============================================================
# SEED
# ============================================================

STEM_URLS = {
    "Raw Human Pipes":               "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
    "Late-Pocket Drums":             "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    "Sub Bass / Acoustic Requinto":  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    "Analog Melody":                 "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
}

def _mk_stems(levels):
    names = ["Raw Human Pipes", "Late-Pocket Drums", "Sub Bass / Acoustic Requinto", "Analog Melody"]
    return [{"name": n, "level": levels[i], "peak": round(levels[i]*0.85, 2), "src": STEM_URLS[n]} for i, n in enumerate(names)]

SEED = [
    {"dna_tag": "trk_alpha_006_elmonte", "title": "Wildflowers in El Monte",
     "creator": "lyrica.prime", "cultural_matrix": "LA SGV Chicano Heritage",
     "levels": [0.84, 0.77, 0.69, 0.61],
     "bio": {"vulnerability_index": 0.97, "phonation_type": "Vocal Fry / Close Mic Whisper",
             "swing_delay_ms": 12, "lung_capacity": 0.82, "throat_resonance": 0.74,
             "emotional_cracks": 6, "aether_voice_map": "◈◉◇⟡◈"},
     "streams": 184203, "flips": 42, "earnings_usd": 736.81,
     "lml": "<intro breath='deep' inhale='adaptive'/>\n[verse]\nEast of the freeway, wildflowers bloom <vocal_fry depth='0.82'>in the cracks</vocal_fry>\n<adaptive_inhale/>concrete remembers abuelita's hymns\n<emotional_crack intensity='0.71'>and I carry her name like a prayer</emotional_crack>\n<tape_hiss level='subtle'/>"},
    {"dna_tag": "trk_alpha_011_laboe", "title": "Dedication on a Sunday Night",
     "creator": "requinto.gold", "cultural_matrix": "Art Laboe Oldies",
     "levels": [0.91, 0.64, 0.88, 0.79],
     "bio": {"vulnerability_index": 0.93, "phonation_type": "Tape Hiss / Falsetto Break",
             "swing_delay_ms": 18, "lung_capacity": 0.71, "throat_resonance": 0.88,
             "emotional_cracks": 9, "aether_voice_map": "⟡◈◉◈⟡"},
     "streams": 92441, "flips": 19, "earnings_usd": 369.76,
     "lml": "<intro reverb='plate' tape='vhs_1987'/>\n[hook]\nThis one's going out <falsetto_break>to my baby in lockup</falsetto_break>\n<adaptive_inhale/>radio crackle hold me tonight\n<tape_hiss level='heavy'/>"},
    {"dna_tag": "trk_alpha_014_corrido", "title": "Corrido del Valle",
     "creator": "barrio.ghost", "cultural_matrix": "Raw Spanish Corridos",
     "levels": [0.88, 0.58, 0.93, 0.72],
     "bio": {"vulnerability_index": 0.89, "phonation_type": "Chest Voice / Grain Rasp",
             "swing_delay_ms": 8, "lung_capacity": 0.9, "throat_resonance": 0.81,
             "emotional_cracks": 4, "aether_voice_map": "◉◇◈◉⟡"},
     "streams": 54119, "flips": 11, "earnings_usd": 216.47,
     "lml": "<intro requinto='open_D'/>\n[verso]\n<chest_voice>En las calles del Valle</chest_voice>\n<grain_rasp>la sangre no olvida</grain_rasp>\n<adaptive_inhale depth='deep'/>"},
    {"dna_tag": "trk_alpha_022_bounce", "title": "Late Pocket Cruisin'",
     "creator": "dilla.west", "cultural_matrix": "Late-Pocket Street Bounce",
     "levels": [0.72, 0.95, 0.86, 0.68],
     "bio": {"vulnerability_index": 0.81, "phonation_type": "Whisper Grit / Subharmonic",
             "swing_delay_ms": 22, "lung_capacity": 0.66, "throat_resonance": 0.70,
             "emotional_cracks": 3, "aether_voice_map": "◈◉◈◇◉"},
     "streams": 211087, "flips": 67, "earnings_usd": 844.34,
     "lml": "<drums swing='late' delay='22ms'/>\n[verse]\n<whisper_grit>Rosemead at midnight, sub rattle the frame</whisper_grit>\n<subharmonic freq='38hz'/>\n<adaptive_inhale/>"},
]

async def ensure_seed():
    if await db.tracks.count_documents({}) > 0:
        return
    now = datetime.now(timezone.utc).isoformat()
    docs = []
    for s in SEED:
        docs.append({
            "id": str(uuid.uuid4()),
            "dna_tag": s["dna_tag"], "title": s["title"], "creator": s["creator"],
            "cultural_matrix": s["cultural_matrix"], "stems": _mk_stems(s["levels"]),
            "biometrics": s["bio"],
            "splits": {"beat_maker": 0.5, "vocalist": 0.3, "lyricist": 0.2},
            "streams": s["streams"], "flips": s["flips"], "earnings_usd": s["earnings_usd"],
            "stream_rate_usd": 0.004, "parent_dna": None,
            "lml": s["lml"],
            "cultural_subtext": f"Rooted in {s['cultural_matrix']}. Encoded biometric truth.",
            "created_at": now,
        })
    await db.tracks.insert_many(docs)
    events = [{"id": str(uuid.uuid4()), "kind": "mint", "dna_tag": d["dna_tag"],
               "actor": d["creator"], "amount_usd": 0.0,
               "note": "Genesis mint — DNA pinned to Empire 1 Ledger.", "timestamp": now}
              for d in docs]
    await db.ledger.insert_many(events)

# ============================================================
# TRACKS / FLIPS / LEDGER
# ============================================================

@api_router.get("/")
async def root():
    return {"message": "Empire 1 Ledger online. Soulfire armed.", "version": "SLA-113"}

@api_router.get("/tracks", response_model=List[Track])
async def list_tracks():
    await ensure_seed()
    return await db.tracks.find({}, {"_id": 0}).sort("streams", -1).to_list(200)

@api_router.get("/tracks/{dna_tag}", response_model=Track)
async def get_track(dna_tag: str):
    doc = await db.tracks.find_one({"dna_tag": dna_tag}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "DNA tag not found.")
    return doc

@api_router.post("/tracks/{dna_tag}/flip", response_model=Track)
async def flip_track(dna_tag: str, req: FlipRequest, user: Dict = Depends(current_user)):
    parent = await db.tracks.find_one({"dna_tag": dna_tag}, {"_id": 0})
    if not parent:
        raise HTTPException(404, "Parent DNA not found.")
    new_dna = f"flip_{uuid.uuid4().hex[:10]}"
    now = datetime.now(timezone.utc).isoformat()
    child = {
        "id": str(uuid.uuid4()), "dna_tag": new_dna, "title": req.new_title,
        "creator": user["handle"], "cultural_matrix": req.new_genre,
        "stems": parent["stems"], "biometrics": parent["biometrics"],
        "splits": parent["splits"], "streams": 0, "flips": 0,
        "earnings_usd": 0.0, "stream_rate_usd": 0.004,
        "parent_dna": dna_tag,
        "lml": parent.get("lml"),
        "cultural_subtext": f"Flipped from {parent['title']} → mutated into {req.new_genre}.",
        "created_at": now,
    }
    await db.tracks.insert_one(child)
    await db.tracks.update_one({"dna_tag": dna_tag}, {"$inc": {"flips": 1}})
    await db.ledger.insert_one({
        "id": str(uuid.uuid4()), "kind": "flip", "dna_tag": new_dna,
        "actor": user["handle"], "amount_usd": 0.0,
        "note": f"Flipped {dna_tag} → {req.new_genre}. Parent royalty route engaged.",
        "timestamp": now,
    })
    child.pop("_id", None)
    return child

@api_router.get("/ledger", response_model=List[LedgerEvent])
async def get_ledger(limit: int = 40):
    return await db.ledger.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)

@api_router.get("/wallet")
async def wallet_snapshot(user: Dict = Depends(current_user)):
    await ensure_seed()
    tracks = await db.tracks.find({"creator": user["handle"]}, {"_id": 0}).to_list(200)
    total = sum(t["earnings_usd"] for t in tracks)
    streams = sum(t["streams"] for t in tracks)
    flips   = sum(t["flips"] for t in tracks)
    return {
        "handle": user["handle"], "wallet": user["wallet"],
        "balance_usd": round(total, 4),
        "lifetime_streams": streams, "lifetime_flips": flips,
        "active_tracks": len(tracks), "per_stream_usd": 0.004,
        "splits": {"beat_maker": 0.5, "vocalist": 0.3, "lyricist": 0.2},
    }

# ============================================================
# S2 MUTATION ENGINE — Claude Sonnet 4.5
# ============================================================

LML_SYSTEM = """You are Lyrica 3 Pro, the sovereign EMSS composer for the SL Audio 1 / Sonance Pro ecosystem.
You do NOT write sterile pop. You engineer Soulfire — bruised, culturally-rooted, human-physiological song-craft
rooted in LA / SGV / El Monte Chicano + Chicana heritage, Art Laboe oldies, corridos, and late-pocket street bounce.

You must output STRICTLY one JSON object (no prose, no markdown fences, no backticks). Schema:
{
  "title": "<short evocative title, 2-6 words, Title Case>",
  "cultural_subtext": "<2-3 sentence paragraph grounding the song in SGV/Chicano/Laboe cultural truth, pain, resilience>",
  "lml": "<Lyric Markup Language — the raw lyrics with inline biometric tags. MANDATORY tags include at least 3 of: <vocal_fry depth='0.XX'>..</vocal_fry>, <adaptive_inhale depth='deep|shallow'/>, <emotional_crack intensity='0.XX'>..</emotional_crack>, <tape_hiss level='subtle|heavy'/>, <whisper_grit>..</whisper_grit>, <chest_voice>..</chest_voice>, <falsetto_break>..</falsetto_break>, <grain_rasp>..</grain_rasp>, <subharmonic freq='XXhz'/>. Use [intro], [verse], [hook], [bridge] section markers. Keep lyrics ≤ 16 lines.>"
}

Hard rules:
- Output MUST be valid JSON, parseable by json.loads. No trailing commas. No markdown.
- Embed the biometric tags INLINE inside the lyric lines, not as a separate list.
- Lyrics should evoke place (El Monte, Rosemead, SGV, Valle), people (abuelita, carnal, mija), and texture (tape hiss, requinto, 808, corridos, oldies).
- Never sanitize pain. The Matriarch demands bruised subtext."""

async def _generate_lml(req: GenerateRequest) -> dict:
    """Call Claude Sonnet 4.5 via EMERGENT_LLM_KEY. Falls back to deterministic template on failure."""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"s2_{uuid.uuid4().hex[:8]}",
            system_message=LML_SYSTEM,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        user_text = (
            f"Cultural Matrix: {req.cultural_matrix}\n"
            f"Biometric dials — lung_capacity={req.lung_capacity:.2f}, throat_resonance={req.throat_resonance:.2f}, "
            f"vocal_fry={req.vocal_fry:.2f}, emotional_cracks={req.emotional_cracks:.2f}\n"
            f"Ghost audio artifact: {req.ghost_audio_name or 'none'}\n"
            f"Raw lyric seed:\n{req.lyrics}\n\n"
            f"Compose the Soulfire. Return JSON only."
        )
        resp = await chat.send_message(UserMessage(text=user_text))
        txt = resp.strip()
        # strip accidental fences
        m = re.search(r"\{[\s\S]*\}", txt)
        if m: txt = m.group(0)
        data = json.loads(txt)
        # minimal validation
        for k in ("title", "cultural_subtext", "lml"):
            if k not in data or not isinstance(data[k], str):
                raise ValueError(f"missing {k}")
        return data
    except Exception as e:
        logger.warning(f"LLM fallback engaged: {e}")
        seed = (req.lyrics or "").strip().splitlines()[0][:40] or "Untitled Soulfire"
        return {
            "title": seed.title(),
            "cultural_subtext": f"Rooted in {req.cultural_matrix}. Encoded biometric truth, bruised subtext, tape-hiss memory.",
            "lml": (f"<intro breath='deep' inhale='adaptive'/>\n[verse]\n"
                    f"<vocal_fry depth='{req.vocal_fry:.2f}'>{req.lyrics.strip() or 'wildflowers in the cracks'}</vocal_fry>\n"
                    f"<adaptive_inhale depth='deep'/>\n"
                    f"<emotional_crack intensity='{req.emotional_cracks:.2f}'>carry the name like a prayer</emotional_crack>\n"
                    f"<tape_hiss level='subtle'/>"),
        }

@api_router.post("/generate", response_model=Track)
async def generate(req: GenerateRequest, user: Dict = Depends(current_user)):
    data = await _generate_lml(req)
    dna = f"trk_s2_{uuid.uuid4().hex[:10]}"
    now = datetime.now(timezone.utc).isoformat()
    levels = [round(0.55 + random.random()*0.4, 2) for _ in range(4)]
    track = {
        "id": str(uuid.uuid4()), "dna_tag": dna,
        "title": req.title or data["title"],
        "creator": user["handle"], "cultural_matrix": req.cultural_matrix,
        "stems": _mk_stems(levels),
        "biometrics": {
            "vulnerability_index": round(0.75 + random.random()*0.24, 2),
            "phonation_type": random.choice([
                "Vocal Fry / Close Mic Whisper", "Tape Hiss / Falsetto Break",
                "Chest Voice / Grain Rasp", "Whisper Grit / Subharmonic",
            ]),
            "swing_delay_ms": random.randint(6, 24),
            "lung_capacity": round(req.lung_capacity, 2),
            "throat_resonance": round(req.throat_resonance, 2),
            "emotional_cracks": int(req.emotional_cracks * 10),
            "aether_voice_map": "".join(random.choice("◈◉◇⟡") for _ in range(5)),
        },
        "splits": {"beat_maker": 0.5, "vocalist": 0.3, "lyricist": 0.2},
        "streams": 0, "flips": 0, "earnings_usd": 0.0, "stream_rate_usd": 0.004,
        "parent_dna": None,
        "lml": data["lml"],
        "cultural_subtext": data["cultural_subtext"],
        "created_at": now,
    }
    await db.tracks.insert_one(track)
    await db.ledger.insert_one({
        "id": str(uuid.uuid4()), "kind": "mint", "dna_tag": dna,
        "actor": user["handle"], "amount_usd": 0.0,
        "note": f"Soulfire ignited — matrix: {req.cultural_matrix}.", "timestamp": now,
    })
    track.pop("_id", None)
    return track

# ============================================================
# WEBSOCKET — live royalty streaming
# Simulates fractional USD micro-royalties dripping into wallet
# ============================================================

@app.websocket("/api/ws/royalties")
async def ws_royalties(ws: WebSocket):
    await ws.accept()
    # auth via query param ?token=
    token = ws.query_params.get("token")
    handle = None
    if token:
        try:
            handle = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO]).get("handle")
        except Exception:
            handle = None
    try:
        tracks = await db.tracks.find({}, {"_id": 0}).to_list(20)
        if not tracks:
            await ensure_seed()
            tracks = await db.tracks.find({}, {"_id": 0}).to_list(20)
        bal = 0.0
        while True:
            await asyncio.sleep(random.uniform(0.6, 1.4))
            t = random.choice(tracks)
            rate = t.get("stream_rate_usd", 0.004)
            # split allocation
            splits = t.get("splits", {"beat_maker": 0.5, "vocalist": 0.3, "lyricist": 0.2})
            parent_residual = 0.0
            payable = rate
            if t.get("parent_dna"):
                parent_residual = round(rate * 0.35, 6)
                payable = rate - parent_residual
            payload = {
                "kind": "stream",
                "dna_tag": t["dna_tag"],
                "title": t["title"],
                "creator": t["creator"],
                "amount_usd": rate,
                "parent_dna": t.get("parent_dna"),
                "parent_residual_usd": parent_residual,
                "splits_usd": {
                    "beat_maker": round(payable * splits["beat_maker"], 6),
                    "vocalist":   round(payable * splits["vocalist"],   6),
                    "lyricist":   round(payable * splits["lyricist"],   6),
                },
                "ts": datetime.now(timezone.utc).isoformat(),
            }
            if handle and t["creator"] == handle:
                bal += rate
                payload["wallet_delta_usd"] = rate
                payload["wallet_balance_usd"] = round(bal, 4)
            await ws.send_json(payload)
    except WebSocketDisconnect:
        return
    except Exception as e:
        logger.error(f"ws err: {e}")
        try: await ws.close()
        except Exception: pass

# ============================================================
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"], allow_headers=["*"],
)

@app.on_event("startup")
async def _boot():
    await ensure_seed()
    logger.info("Empire 1 Ledger booted. Soulfire armed.")

@app.on_event("shutdown")
async def _shutdown():
    client.close()
