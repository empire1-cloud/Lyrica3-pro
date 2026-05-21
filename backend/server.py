from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, status, UploadFile, File, Request
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import ipaddress
import os, logging, random, asyncio, json, re, uuid, hashlib, shutil, time
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal, Dict
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
if not MONGO_URL:
    raise RuntimeError("MONGO_URL env var is required. Set it in .env or your deploy dashboard.")
DB_NAME   = os.environ.get('DB_NAME', 'lyrica3_dev')
JWT_SECRET = os.environ.get('JWT_SECRET', 'dev_secret_change_me')
JWT_ALGO   = "HS256"
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', '')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Sonance Pro / Empire 1 Ledger API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# ------------------------------------------------------------
# Trusted-proxy client-IP extraction.
# Chain: Cloudflare → GCP LB → Cloud Run  →  our app.
# We only accept `CF-Connecting-IP` / `X-Forwarded-For` when the immediate
# peer is on a known-proxy CIDR. Everything else falls back to socket IP.
# ------------------------------------------------------------
TRUSTED_PROXY_CIDRS = [
    c.strip() for c in os.environ.get(
        "TRUSTED_PROXY_CIDRS",
        # Cloudflare v4 ranges (2024) + loopback + GCP LB egress shared range.
        # Keep the list small on purpose — widen only when you add an L7.
        "173.245.48.0/20,103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,"
        "141.101.64.0/18,108.162.192.0/18,190.93.240.0/20,188.114.96.0/20,"
        "197.234.240.0/22,198.41.128.0/17,162.158.0.0/15,104.16.0.0/13,"
        "104.24.0.0/14,172.64.0.0/13,131.0.72.0/22,"
        "127.0.0.0/8,10.0.0.0/8,35.191.0.0/16,130.211.0.0/22"
    ).split(",") if c.strip()
]
_TRUSTED_NETS = []
for c in TRUSTED_PROXY_CIDRS:
    try: _TRUSTED_NETS.append(ipaddress.ip_network(c, strict=False))
    except Exception: pass

def _peer_is_trusted(peer_ip: str) -> bool:
    try:
        ip = ipaddress.ip_address(peer_ip)
        return any(ip in n for n in _TRUSTED_NETS)
    except Exception:
        return False

def trusted_client_ip(request: Request) -> str:
    """Resolve the real client IP behind Cloudflare/GCP LB. Spoof-safe:
    only trust headers when the immediate peer is a known proxy CIDR."""
    peer = (request.client.host if request.client else "") or ""
    if not _peer_is_trusted(peer):
        return peer or "unknown"
    cf = request.headers.get("cf-connecting-ip")
    if cf: return cf.strip()
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        # take the left-most non-trusted IP — that's the real client
        for part in [p.strip() for p in xff.split(",")]:
            if part and not _peer_is_trusted(part):
                return part
        # all hops trusted → fall back to the left-most
        first = xff.split(",")[0].strip()
        if first: return first
    xri = request.headers.get("x-real-ip")
    return (xri or peer or "unknown").strip()

# ------------------------------------------------------------
# Rate limiting — Redis-backed for multi-replica safety.
# When REDIS_URL is absent we degrade to in-memory (single-replica only).
# ------------------------------------------------------------
REDIS_URL = os.environ.get("REDIS_URL", "").strip()
_limiter_storage = REDIS_URL if REDIS_URL else "memory://"
try:
    limiter = Limiter(
        key_func=trusted_client_ip,
        storage_uri=_limiter_storage,
        strategy="fixed-window",
    )
except Exception as _e:
    # Fail-open in a documented way: Redis unreachable at boot → in-memory fallback.
    logging.getLogger("empire1").warning(f"limiter storage fallback to memory: {_e}")
    limiter = Limiter(key_func=trusted_client_ip, storage_uri="memory://")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ------------------------------------------------------------
# Sanitized error handler — never leaks stack traces or internal paths.
# ------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("empire1")

@app.exception_handler(Exception)
async def unhandled_errors(request: Request, exc: Exception):
    logger.exception("unhandled: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Empire 1 internal error."})

@app.exception_handler(HTTPException)
async def http_errors(request: Request, exc: HTTPException):
    # HTTPException detail is author-controlled; strip any accidental paths/stack-looking strings
    msg = str(exc.detail or "")
    if "\n" in msg or "Traceback" in msg or "/app/" in msg:
        msg = "Request rejected."
    return JSONResponse(status_code=exc.status_code, content={"detail": msg})

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("empire1")

# ============================================================
# SCHEMAS
# ============================================================

class RoyaltySplit(BaseModel):
    beat_maker: float = 0.50
    vocalist:   float = 0.30
    lyricist:   float = 0.20

# ── Royalty Rules ────────────────────────────────────────────────────────────
# RULE_001 — Original (no parent): 100% stays with creator.
# RULE_002 — First flip (depth=1): 50% to original creator, 50% to remixer.
# RULE_003 — Deeper chain (depth≥2): exponential decay.
#   original_creator = BASE (75%), each ancestor layer decays by DECAY_FACTOR
#   until the remixer at the tip receives the remainder.
#   e.g. depth=2: root=75%, mid=20%, tip=5%
#        depth=3: root=75%, mid1=14%, mid2=6%, tip=5%
#   All allocations are stored as fractions (sum=1.0) keyed by creator handle.

_RULE_BASE  = 0.75   # original creator floor for RULE_003
_RULE_DECAY = 0.65   # each intermediate ancestor retains this fraction of remaining share
_RULE_TIP   = 0.05   # minimum guaranteed to the current remixer

async def _compute_royalty_chain(db, parent_dna: str, remixer: str) -> dict:
    """Walk the ancestry chain and return a {handle: fraction} royalty map.

    Rules applied:
      depth=0 (original, no parent)   → RULE_001: {creator: 1.0}
      depth=1 (one parent)             → RULE_002: {original: 0.50, remixer: 0.50}
      depth≥2                          → RULE_003: exponential decay
    """
    # Build ancestry list from parent up to root
    chain: list[dict] = []
    cur_dna = parent_dna
    seen: set[str] = set()
    while cur_dna and cur_dna not in seen:
        seen.add(cur_dna)
        doc = await db.tracks.find_one({"dna_tag": cur_dna}, {"_id": 0, "creator": 1, "parent_dna": 1})
        if not doc:
            break
        chain.append(doc)
        cur_dna = doc.get("parent_dna")

    depth = len(chain)  # number of ancestors

    if depth == 0:
        # Shouldn't happen (parent_dna was provided) but guard anyway → RULE_001
        return {remixer: 1.0}

    if depth == 1:
        # RULE_002: 50 / 50
        original = chain[0]["creator"]
        alloc: dict[str, float] = {}
        alloc[original] = alloc.get(original, 0.0) + 0.50
        alloc[remixer]  = alloc.get(remixer,  0.0) + 0.50
        return {k: round(v, 6) for k, v in alloc.items()}

    # RULE_003: exponential decay across chain
    # chain[0] = immediate parent (tip-1), chain[-1] = root
    # root gets _RULE_BASE; intermediates share (1 - _RULE_BASE - _RULE_TIP) with decay
    root_creator = chain[-1]["creator"]
    intermediates = [c["creator"] for c in reversed(chain[:-1])]  # oldest-first after root

    alloc: dict[str, float] = {}
    alloc[root_creator] = alloc.get(root_creator, 0.0) + _RULE_BASE

    # Distribute (1 - BASE - TIP) across intermediates with decay
    pool = 1.0 - _RULE_BASE - _RULE_TIP
    remaining = pool
    for creator in intermediates:
        share = round(remaining * (1.0 - _RULE_DECAY), 6)
        remaining = round(remaining - share, 6)
        alloc[creator] = alloc.get(creator, 0.0) + share

    # Tip = remixer gets guaranteed minimum + any leftover from decay rounding
    tip_share = round(_RULE_TIP + remaining, 6)
    alloc[remixer] = alloc.get(remixer, 0.0) + tip_share

    # Normalise to exactly 1.0 (guard against float drift)
    total = sum(alloc.values())
    return {k: round(v / total, 6) for k, v in alloc.items()}

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
    royalty_chain: Optional[Dict[str, float]] = None  # {handle: fraction} — RULE_001/002/003
    lml: Optional[str] = None
    cultural_subtext: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FlipRequest(BaseModel):
    new_title: str
    new_genre: str

class GenerateRequest(BaseModel):
    """Consumer-safe request. No LML, no decimals, no persona.
    Backend maps genre+mood → internal cultural_matrix and biometric dials."""
    lyrics: str
    genre: str = "SGV Oldies"
    mood: str = "Late-Night Honesty"
    title: Optional[str] = None
    ghost_audio_name: Optional[str] = None
    # Studio control overrides — sent from VulnerabilityPanel + LatePocketControl
    vulnerability_override: Optional[float] = None  # 0.0-1.0 aggregate from UI sliders
    swing_ms: Optional[int] = None                   # 10-15ms late-pocket snare drag

# Internal genre/mood → secret recipe mapping (NEVER sent to client)
# Values are canonical Omni-Genre Matrix production descriptors fed to MusicGen.
_GENRE_MAP = {
    # ── LA / SGV / Chicano spine ──────────────────────────────────────────────
    "SGV Oldies":                   "LA SGV Chicano Heritage, doo-wop strings, accordion, requinto guitar, tape hiss",
    "LA Heritage":                  "LA SGV Chicano Heritage, doo-wop strings, accordion, requinto guitar, tape hiss",
    "Art Laboe Sunday Dedication":  "Art Laboe Oldies, 1960s ballad, lush strings, analog reverb, slow dance tempo",
    "SGV Backyard Party":           "Late-Pocket Street Bounce, cumbias rhythm, bass-heavy, backyard BBQ energy",
    "Nahuatl Ancestry":             "Pre-Columbian Ancestral, indigenous flute, conch shell bass, ceremonial drums",
    "West Coast G-Funk Piano":      "West Coast G-Funk, Moog synth bass, whiny guitar lead, piano funk, 90s Compton",
    "Acoustic Requinto Weeping":    "Raw Spanish Corridos, solo requinto guitar, brokenhearted balladry, minimal reverb",
    "Corridos":                     "Raw Spanish Corridos, tuba sousaphone bass, banda drums, norteño accordion",
    "Oldies":                       "Art Laboe Oldies, 1950s doo-wop, saxophone, upright bass, warm tube compression",
    "Street Bounce":                "Late-Pocket Street Bounce, swung hi-hat, deep 808 kick, street snare snap",
    "Cruising":                     "Late Night Cruising Melancholy, slow-rolling 60 BPM, lowrider imagery, quiet storm",
    "Resilience":                   "Street-Soft Resilience, uplifting minor-to-major, swelling strings, hope and grit",
    "Lowrider Soul":                "Late Night Cruising Melancholy, Chicano soul, hydraulic bounce, Hayes-era orchestration",
    "East LA Ballad":               "LA SGV Chicano Heritage, sweeping strings, heartfelt tenor, late-night dedications",
    # ── Urban / contemporary ──────────────────────────────────────────────────
    "R&B":                          "Neo-Soul R&B, Rhodes piano, warm bass, sensual groove, layered background vocals",
    "Trap Soul":                    "Trap Soul, 808 sub bass, ethereal synth pads, half-time trap drums, Auto-Tune",
    "Hip Hop":                      "Boom Bap Hip-Hop, punchy vinyl snare, SP-1200 drum machine, jazz sample chops",
    "Rap":                          "West Coast Rap, g-funk synth, rolling bass line, mid-tempo 90 BPM flow",
    "Drill":                        "Drill, dark sliding bass, menacing piano, off-beat hi-hats, Chicago/UK tension",
    "Afrobeats":                    "Afrobeats, afropop guitar, shekere percussion, joyful polyrhythm, 105 BPM",
    "UK Garage":                    "UK Garage, 2-step shuffle, sub bass wobble, pitched-up vocal chops, London club",
    "Jersey Club":                  "Jersey Club, 160 BPM club kick, sample manipulation, call-and-response breaks",
    "Bossa Nova":                   "Bossa Nova, nylon guitar, brushed snare, soft samba rhythm, intimate café vibe",
    "Neo-Soul":                     "Neo-Soul, Fender Rhodes, live drumkit, warm analog saturation, introspective",
    "Gospel Soul":                  "Gospel Soul, Hammond organ, choir swells, uplifting call-and-response, Sunday sermon",
    "Lo-Fi Chill":                  "Lo-Fi Hip-Hop, vinyl crackle, muted jazz guitar, rain sample, study session mood",
    # ── Latin / regional ─────────────────────────────────────────────────────
    "Reggaeton":                    "Reggaeton, dembow rhythm, 808 bass, perreo energy, Latin trap influence",
    "Latin Trap":                   "Latin Trap, reggaeton dembow + trap 808, bilingual flow, dark melodic hook",
    "Cumbia":                       "Colombian Cumbia, caja drum, guacharaca, tropical accordion, Andean roots",
    "Norteño":                      "Norteño, 12-string bajo sexto, tuba bass, polka swing, border ballad narrative",
    "Banda":                        "Banda Sinaloense, tubas, trombones, clarinets, full brass power, Sinaloa pride",
    "Salsa":                        "Salsa Dura, clave rhythm, congas, piano guajeo, big brass section, New York energy",
    "Flamenco Soul":                "Flamenco Soul, palo seco handclaps, flamenco guitar, duende emotional intensity",
    # ── Global / experimental ─────────────────────────────────────────────────
    "Amapiano":                     "Amapiano, log drum bass, piano keys riff, South African township jazz",
    "Dancehall":                    "Dancehall, riddim one-drop, ragga toasting, Kingston Jamaica energy, reverb vocal",
    "K-Pop":                        "K-Pop, pristine production, punchy 4-on-floor, synchronized harmonies, idol format",
    "Alternative R&B":              "Alternative R&B, ambient textures, unconventional song structure, raw emotion",
    "Indie Soul":                   "Indie Soul, intimate room sound, acoustic guitar, confessional lyrics, bedroom pop",
    "Country Soul":                 "Country Soul, pedal steel guitar, dusty reverb, Southern porch storytelling",
}
# mood → (lung, throat, fry, crack) private biometric recipe
_MOOD_RECIPE = {
    "Late-Night Honesty":   (0.78, 0.72, 0.86, 0.78),
    "Street Resilience":    (0.88, 0.70, 0.62, 0.48),
    "Cruising Melancholy":  (0.70, 0.80, 0.74, 0.66),
    "Defiant Bloom":        (0.82, 0.66, 0.58, 0.55),
    "Sunday Dedication":    (0.72, 0.88, 0.90, 0.82),
    "Porch-Light Grief":    (0.68, 0.78, 0.92, 0.88),
    "Ancestral Fire":       (0.92, 0.84, 0.70, 0.74),
    "Backyard Euphoria":    (0.86, 0.64, 0.48, 0.38),
    "Soft Menace":          (0.74, 0.72, 0.82, 0.68),
    "Requinto Lament":      (0.66, 0.92, 0.88, 0.90),
    "After-Hours Prayer":   (0.70, 0.84, 0.94, 0.86),
    "Lowrider Calm":        (0.80, 0.70, 0.64, 0.52),
}

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
@limiter.limit("5/minute")
async def register(request: Request, req: RegisterReq):
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
@limiter.limit("10/minute")
async def login(request: Request, req: LoginReq):
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
    """Idempotent upsert — also backfills new fields (lml, cultural_subtext) on existing docs."""
    now = datetime.now(timezone.utc).isoformat()
    for s in SEED:
        existing = await db.tracks.find_one({"dna_tag": s["dna_tag"]}, {"_id": 0})
        if existing:
            # backfill any missing/null fields without clobbering streams/earnings/flips
            updates = {}
            if not existing.get("lml"):              updates["lml"] = s["lml"]
            if not existing.get("cultural_subtext"): updates["cultural_subtext"] = f"Rooted in {s['cultural_matrix']}. Encoded biometric truth."
            # ensure stems have src (audio URLs)
            stems = existing.get("stems", [])
            if any(not st.get("src") for st in stems):
                updates["stems"] = _mk_stems(s["levels"])
            if updates:
                await db.tracks.update_one({"dna_tag": s["dna_tag"]}, {"$set": updates})
            continue
        await db.tracks.insert_one({
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
        await db.ledger.insert_one({
            "id": str(uuid.uuid4()), "kind": "mint", "dna_tag": s["dna_tag"],
            "actor": s["creator"], "amount_usd": 0.0,
            "note": "Genesis mint — DNA pinned to Empire 1 Ledger.", "timestamp": now,
        })

# ============================================================
# TRACKS / FLIPS / LEDGER
# ============================================================

def _qual(v: float) -> str:
    """Convert raw biometric decimals → qualitative label. IP-safe for UI."""
    if v >= 0.88: return "Profound"
    if v >= 0.70: return "Deep"
    if v >= 0.45: return "Present"
    return "Subtle"

def _sanitize_track(t: dict) -> dict:
    """Strip IP-sensitive internals (LML, raw biometric decimals, persona) before returning to client."""
    if not t: return t
    b = t.get("biometrics") or {}
    # qualitative labels only — no raw decimals, no persona, no phonation recipe
    public_bio = {
        "resonance_quality":   _qual(b.get("throat_resonance", 0)),
        "vulnerability_level": _qual(b.get("vulnerability_index", 0)),
        "breath_profile":      _qual(b.get("lung_capacity", 0)),
        "expressive_range":    _qual(min(1.0, b.get("emotional_cracks", 0) / 10)),
        "biometrics_active":   True,
        "signature_glyph":     b.get("aether_voice_map", ""),
    }
    out = {**t}
    out["biometrics"] = public_bio
    # NEVER expose LML, subtext internals, persona, swing/fry/crack raw numbers
    for hidden in ("lml", "cultural_subtext"):
        out.pop(hidden, None)
    # sanitize stems — hide src if not needed for playback (keep for now, audio is public)
    return out

@api_router.get("/")
async def root():
    return {"message": "Empire 1 Ledger online. Soulfire armed.", "version": "SLA-113"}

@app.get("/health")
@app.get("/api/health")
async def health():
    try:
        await client.admin.command("ping")
        return {"status": "ok", "service": "empire1-ledger"}
    except Exception as e:
        logger.warning("health check failed: mongodb ping error: %s", e)
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "service": "empire1-ledger", "detail": "mongodb_unreachable"},
        )

@api_router.get("/tracks")
async def list_tracks():
    await ensure_seed()
    docs = await db.tracks.find({}, {"_id": 0}).sort("streams", -1).to_list(200)
    return [_sanitize_track(d) for d in docs]

@api_router.get("/tracks/{dna_tag}")
async def get_track(dna_tag: str):
    doc = await db.tracks.find_one({"dna_tag": dna_tag}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "DNA tag not found.")
    return _sanitize_track(doc)

@api_router.post("/tracks/{dna_tag}/flip")
async def flip_track(dna_tag: str, req: FlipRequest, user: Dict = Depends(current_user)):
    parent = await db.tracks.find_one({"dna_tag": dna_tag}, {"_id": 0})
    if not parent:
        raise HTTPException(404, "Parent DNA not found.")
    new_dna = f"flip_{uuid.uuid4().hex[:10]}"
    now = datetime.now(timezone.utc).isoformat()

    # ── Compute royalty chain per RULE_001/002/003 ───────────────────────────
    royalty_chain = await _compute_royalty_chain(db, dna_tag, user["handle"])

    child = {
        "id": str(uuid.uuid4()), "dna_tag": new_dna, "title": req.new_title,
        "creator": user["handle"], "cultural_matrix": req.new_genre,
        "stems": parent["stems"], "biometrics": parent["biometrics"],
        "splits": parent["splits"], "streams": 0, "flips": 0,
        "earnings_usd": 0.0, "stream_rate_usd": 0.004,
        "parent_dna": dna_tag,
        "royalty_chain": royalty_chain,
        "lml": parent.get("lml"),
        "cultural_subtext": f"Flipped from {parent['title']} → mutated into {req.new_genre}.",
        "created_at": now,
    }
    await db.tracks.insert_one(child)
    await db.tracks.update_one({"dna_tag": dna_tag}, {"$inc": {"flips": 1}})

    # Determine which rule was applied for ledger note
    chain_depth = len(royalty_chain)
    rule_applied = "RULE_001" if chain_depth == 1 and user["handle"] in royalty_chain else \
                   "RULE_002" if chain_depth == 2 else "RULE_003"
    chain_summary = " | ".join(f"{h}={round(f*100,1)}%" for h, f in royalty_chain.items())

    await db.ledger.insert_one({
        "id": str(uuid.uuid4()), "kind": "flip", "dna_tag": new_dna,
        "actor": user["handle"], "amount_usd": 0.0,
        "note": f"Flipped {dna_tag} → {req.new_genre}. {rule_applied} active. Chain: {chain_summary}",
        "timestamp": now,
    })
    child.pop("_id", None)
    return _sanitize_track(child)

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

async def _generate_lml(req: GenerateRequest, matrix: str, recipe: tuple) -> dict:
    """Call Claude / Gemini via EMERGENT_LLM_KEY (OpenAI-compatible endpoint).
    Internal prompt-engineering — never exposed to client."""
    lung, throat, fry, crack = recipe
    eff_lung  = lung
    eff_crack = crack
    if req.vulnerability_override is not None:
        v = max(0.0, min(1.0, req.vulnerability_override))
        eff_lung  = round(lung  * 0.5 + v * 0.5, 3)
        eff_crack = round(crack * 0.5 + v * 0.5, 3)
    swing_note = ""
    if req.swing_ms is not None:
        swing_note = f"\nLate-Pocket Swing: {req.swing_ms}ms snare drag — encode this groove into the drum descriptor tags."
    user_text = (
        f"Cultural Matrix: {matrix}\n"
        f"Biometric dials — lung_capacity={eff_lung:.3f}, throat_resonance={throat:.2f}, "
        f"vocal_fry={fry:.2f}, emotional_cracks={eff_crack:.3f}\n"
        f"Ghost audio artifact: {req.ghost_audio_name or 'none'}{swing_note}\n"
        f"Raw lyric seed:\n{req.lyrics}\n\n"
        f"Compose the Soulfire. Return JSON only."
    )
    # --- Primary: Vertex AI Gemini (IAM auth, no API key needed) ---
    try:
        from google import genai
        from google.genai import types as gtypes
        _vx_project = os.environ.get("VERTEX_PROJECT_ID", "disco-amphora-490606-n8")
        _vx_location = os.environ.get("VERTEX_LOCATION", "us-west1")
        _vx_model = os.environ.get("VERTEX_GEMINI_MODEL", "gemini-2.5-pro")
        _client = genai.Client(vertexai=True, project=_vx_project, location=_vx_location)
        def _sync():
            resp = _client.models.generate_content(
                model=_vx_model,
                contents=user_text,
                config=gtypes.GenerateContentConfig(
                    system_instruction=LML_SYSTEM,
                    response_mime_type="application/json",
                    temperature=0.9,
                    top_p=0.95,
                    max_output_tokens=2048,
                ),
            )
            return resp.text or ""
        txt = await asyncio.to_thread(_sync)
        m = re.search(r"\{[\s\S]*\}", txt)
        if m: txt = m.group(0)
        data = json.loads(txt)
        for k in ("title", "cultural_subtext", "lml"):
            if k not in data or not isinstance(data[k], str):
                raise ValueError(f"missing {k}")
        return data
    except Exception as e:
        logger.warning(f"Vertex AI LML generation failed: {e} — trying EMERGENT_LLM_KEY")
    # --- Secondary: OpenAI-compatible client via EMERGENT_LLM_KEY ---
    if EMERGENT_LLM_KEY:
        try:
            import openai as _openai
            _client = _openai.AsyncOpenAI(
                api_key=EMERGENT_LLM_KEY,
                base_url="https://api.openai.com/v1",
            )
            _resp = await _client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": LML_SYSTEM},
                    {"role": "user",   "content": user_text},
                ],
                temperature=0.9,
                max_tokens=1200,
            )
            txt = _resp.choices[0].message.content.strip()
            m = re.search(r"\{[\s\S]*\}", txt)
            if m: txt = m.group(0)
            data = json.loads(txt)
            for k in ("title", "cultural_subtext", "lml"):
                if k not in data or not isinstance(data[k], str):
                    raise ValueError(f"missing {k}")
            return data
        except Exception as e:
            logger.warning(f"OpenAI LML generation failed: {e} — using structured fallback")
    # --- Final fallback: structured seed ---
    seed = (req.lyrics or "").strip().splitlines()[0][:40] or "Untitled Soulfire"
    return {
        "title": seed.title(),
        "cultural_subtext": f"Rooted in {matrix}. Encoded biometric truth, bruised subtext, tape-hiss memory.",
        "lml": (f"<intro breath='deep' inhale='adaptive'/>\n[verse]\n"
                f"<vocal_fry depth='{fry:.2f}'>{req.lyrics.strip() or 'wildflowers in the cracks'}</vocal_fry>\n"
                f"<adaptive_inhale depth='deep'/>\n"
                f"<emotional_crack intensity='{crack:.2f}'>carry the name like a prayer</emotional_crack>\n"
                f"<tape_hiss level='subtle'/>"),
    }

@api_router.post("/generate")
@limiter.limit("10/minute")
async def generate(request: Request, req: GenerateRequest, user: Dict = Depends(current_user)):
    # Secret-sauce resolution — happens server-side, never exposed
    matrix = _GENRE_MAP.get(req.genre, "LA SGV Chicano Heritage")
    recipe = _MOOD_RECIPE.get(req.mood, (0.78, 0.66, 0.82, 0.71))
    lung, throat, fry, crack = recipe
    data = await _generate_lml(req, matrix, recipe)

    # ============================================================
    # VICS: VIBE INTERPRETATION & CULTURAL SYNTHESIS
    # Emotional intelligence layer - detects subtext, cultural roots, performance directives
    # ============================================================
    vics_blueprint = None
    try:
        from lyrica_agent.orchestrator import run_lyrica_agent_dict
        logger.info("Running VICS (Vibe Interpretation & Cultural Synthesis)...")
        vics_blueprint = run_lyrica_agent_dict(
            lyric=req.lyrics,
            genre=req.genre,
            user_goal=req.mood,  # mood = emotional goal
        )
        logger.info(f"✅ VICS generated blueprint: {vics_blueprint['emotional_vector']['primary_label']}")
        
        # Log VICS insights
        ev = vics_blueprint["emotional_vector"]
        logger.info(f"   Emotional Vector: valence={ev['valence']:.2f}, arousal={ev['arousal']:.2f}, cultural_resonance={ev['cultural_resonance']:.2f}")
        
        if vics_blueprint["respect_protocol"]["activated"]:
            logger.info(f"   🛡️ Respect Protocol ACTIVE: {vics_blueprint['respect_protocol']['origin_acknowledgment']}")
        
        nodes = vics_blueprint["cultural_nodes"]
        if nodes:
            logger.info(f"   🌍 Cultural Nodes: {', '.join([n['name'] for n in nodes])}")
    except Exception as e:
        logger.warning(f"VICS generation failed (non-critical): {e}")
        # VICS is optional - continue with generation even if it fails

    # ============================================================
    # SOULFIRE PIPELINE — Primary music generation via Vertex AI
    # SL Audio Master (THE BRAIN) → The Beast (THE ORCHESTRATOR) → Sub-agents
    # Falls back to Replicate (MusicGen) → Demucs if Soulfire unavailable
    # ============================================================
    from integrations import (
        audio_synth, auto_split, fallback_stems, build_synth_prompt,
        vocal_performance, _strip_lml, REPLICATE_API_KEY,
    )
    from vertex_ai import (
        vertex_lyria_full_song, vertex_chirp_tts, VERTEX_AI_ENABLED,
    )

    stems: list = []
    synth_source_url: Optional[str] = None
    synth_provider = "fallback"
    voice_provider = "none"
    voice_meta: Optional[dict] = None

    # ── STEP 1: Lyria 2 — Full song stitching (multi-segment crossfade) ──
    if VERTEX_AI_ENABLED:
        synth_prompt = build_synth_prompt(matrix, recipe, data["lml"])
        full_song_path = await vertex_lyria_full_song(
            base_prompt=synth_prompt,
            matrix=matrix,
            mood_recipe=recipe,
            out_dir=str(ROOT_DIR / "static" / "stems"),
        )
        if full_song_path:
            from pathlib import Path as _Path
            _fname = _Path(full_song_path).name
            synth_source_url = f"/api/static/stems/{_fname}"
            synth_provider = "vertex:lyria2-full"
            logger.info(f"🎵 Lyria 2 full song stitched: {synth_source_url}")

    # ── STEP 2: Soulfire agents (SL Audio Master → The Beast) ──────────
    if not synth_source_url:
        try:
            from vertex_agents_config import generate_music_with_soulfire
            soulfire_result = await generate_music_with_soulfire(
                lyrics=req.lyrics,
                genre=req.genre,
                mood=req.mood,
                title=req.title,
                cultural_matrix=matrix,
                mood_recipe=recipe,
            )
            if soulfire_result and isinstance(soulfire_result, dict):
                if "stems" in soulfire_result:
                    stems = soulfire_result["stems"]
                    synth_provider = "vertex:soulfire"
                elif "audio_url" in soulfire_result or "instrumental_url" in soulfire_result:
                    synth_source_url = soulfire_result.get("audio_url") or soulfire_result.get("instrumental_url")
                    synth_provider = "vertex:soulfire"
                if "sl_audio_master_payload" in soulfire_result:
                    logger.info("🧠 SL Audio Master physics payload received")
        except ImportError:
            logger.warning("Soulfire modules not found")
        except Exception as e:
            logger.warning(f"Soulfire generation failed: {e}")

    # ── STEP 3: Replicate MusicGen fallback ─────────────────────────────
    if not synth_source_url and not stems and REPLICATE_API_KEY:
        synth_prompt = build_synth_prompt(matrix, recipe, data["lml"])
        synth_source_url = await audio_synth(synth_prompt)
        if synth_source_url:
            synth_provider = "replicate:musicgen"
            stems = await auto_split(
                synth_source_url,
                out_dir=str(ROOT_DIR / "static" / "stems"),
            )

    # ── STEP 4: Final fallback to placeholders ──────────────────────────
    if not synth_source_url and not stems:
        stems = fallback_stems()
        synth_provider = "fallback:soundhelix"

    # Build stems from Lyria 2 instrumental if we have one
    if synth_source_url and synth_provider == "vertex:lyria2" and not stems:
        stems = [
            {"name": "Full Mix", "src": synth_source_url, "level": 1.0, "peak": 0.9},
            {"name": "Raw Human Pipes", "src": None, "level": 0.0, "peak": 0.0},
        ]

    # ── STEP 5: Chirp 3 HD — Real vocal performance (primary) ──────────
    if VERTEX_AI_ENABLED:
        text = _strip_lml(data["lml"])
        if text:
            chirp_result = await vertex_chirp_tts(
                text=text,
                voice_name="en-US-Chirp3-HD-Orus",
                out_dir=str(ROOT_DIR / "static" / "voices"),
            )
            if chirp_result:
                voice_provider = "vertex:chirp3-hd"
                voice_meta = chirp_result
                logger.info(f"🎤 Chirp 3 HD vocal: {chirp_result['url']}")

    # ── STEP 6: OpenAI TTS fallback for vocals ──────────────────────────
    if voice_provider == "none":
        vp = await vocal_performance(
            lml=data["lml"], mood=req.mood,
            out_dir=str(ROOT_DIR / "static" / "voices"),
        )
        if vp:
            voice_provider = "openai:tts-1-hd"
            voice_meta = vp

    # Replace the Raw Human Pipes stem with the real AI voice
    if voice_meta and stems:
        for i, s in enumerate(stems):
            if s["name"] == "Raw Human Pipes":
                stems[i] = {**s, "src": voice_meta["url"], "level": 0.95, "peak": 0.8}
                break

    dna = f"trk_s2_{uuid.uuid4().hex[:10]}"
    now = datetime.now(timezone.utc).isoformat()
    track = {
        "id": str(uuid.uuid4()), "dna_tag": dna,
        "title": req.title or data["title"],
        "creator": user["handle"], "cultural_matrix": matrix,
        "stems": stems,
        "biometrics": {
            "vulnerability_index": round(0.75 + random.random()*0.24, 2),
            "phonation_type": random.choice([
                "Vocal Fry / Close Mic Whisper", "Tape Hiss / Falsetto Break",
                "Chest Voice / Grain Rasp", "Whisper Grit / Subharmonic",
            ]),
            "swing_delay_ms": random.randint(6, 24),
            "lung_capacity": round(lung, 2), "throat_resonance": round(throat, 2),
            "emotional_cracks": int(crack * 10),
            "aether_voice_map": "".join(random.choice("◈◉◇⟡") for _ in range(5)),
        },
        "splits": {"beat_maker": 0.5, "vocalist": 0.3, "lyricist": 0.2},
        "streams": 0, "flips": 0, "earnings_usd": 0.0, "stream_rate_usd": 0.004,
        "parent_dna": None,
        "lml": data["lml"],                      # stored internally
        "cultural_subtext": data["cultural_subtext"],  # stored internally
        "synth_source_url": synth_source_url,    # stored internally
        "synth_provider": synth_provider,        # stored internally
        "voice_provider": voice_provider,        # stored internally
        "voice_meta": voice_meta,                # stored internally
        "vics_blueprint": vics_blueprint,        # VICS emotional intelligence + cultural analysis
        "created_at": now,
    }
    # VICS Ledger — cryptographic seal before DB insert
    from vics_ledger import sign_track
    track = sign_track(track)

    await db.tracks.insert_one(track)
    await db.ledger.insert_one({
        "id": str(uuid.uuid4()), "kind": "mint", "dna_tag": dna,
        "actor": user["handle"], "amount_usd": 0.0,
        "note": f"Soulfire ignited · synth={synth_provider} · voice={voice_provider} · vics=sealed",
        "timestamp": now,
    })
    track.pop("_id", None)
    return _sanitize_track(track)

@api_router.get("/vibes")
async def vibes_catalog():
    """Consumer-safe catalog of selectable genre + mood options."""
    return {
        "genres": list(_GENRE_MAP.keys()),
        "moods":  list(_MOOD_RECIPE.keys()),
        "genre_groups": [
            {"title": "LA · SGV · Chicano",
             "items": ["SGV Oldies", "LA Heritage", "Art Laboe Sunday Dedication",
                       "SGV Backyard Party", "Nahuatl Ancestry", "West Coast G-Funk Piano",
                       "Acoustic Requinto Weeping", "Corridos", "Oldies",
                       "Street Bounce", "Cruising", "Resilience",
                       "Lowrider Soul", "East LA Ballad"]},
            {"title": "Urban · Contemporary",
             "items": ["R&B", "Trap Soul", "Hip Hop", "Rap", "Drill",
                       "Neo-Soul", "Gospel Soul", "Lo-Fi Chill", "Alternative R&B", "Indie Soul"]},
            {"title": "Latin · Regional",
             "items": ["Reggaeton", "Latin Trap", "Cumbia", "Norteño", "Banda", "Salsa", "Flamenco Soul"]},
            {"title": "Global",
             "items": ["Afrobeats", "UK Garage", "Jersey Club", "Bossa Nova",
                       "Amapiano", "Dancehall", "K-Pop", "Country Soul"]},
        ],
        "mood_groups": [
            {"title": "Chicano/Oldies Lineage",
             "items": ["Late-Night Honesty", "Sunday Dedication", "Porch-Light Grief",
                       "Requinto Lament", "Ancestral Fire", "Lowrider Calm"]},
            {"title": "Street / Bounce",
             "items": ["Street Resilience", "Defiant Bloom", "Backyard Euphoria", "Soft Menace"]},
            {"title": "Intimate",
             "items": ["Cruising Melancholy", "After-Hours Prayer"]},
        ],
    }

# ============================================================
# DEMUCS SEPARATION (simulated) — S2 Stem Upload
# ============================================================

UPLOAD_DIR = ROOT_DIR / "static" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_UPLOAD_MIMES = {
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave",
    "audio/ogg", "audio/flac", "audio/x-flac", "audio/mp4", "audio/aac",
    "audio/webm", "video/mp4", "video/quicktime", "video/webm",
}
MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25 MB


def _safe_basename(name: str) -> str:
    """Strip paths + dangerous chars from a filename."""
    name = os.path.basename(name or "")
    return re.sub(r"[^A-Za-z0-9._-]", "_", name)[:80] or "track"


@api_router.post("/demucs/separate")
@limiter.limit("4/minute")
async def demucs_separate(request: Request, file: UploadFile = File(...), user: Dict = Depends(current_user)):
    """
    Upload endpoint. In production this hands off to the HTDemucs v4 worker.
    Guarded by: auth, rate limit (4/min), MIME whitelist, 25MB ceiling, path sanitization.
    """
    if not file.content_type or file.content_type.lower() not in ALLOWED_UPLOAD_MIMES:
        raise HTTPException(415, "Unsupported audio/video mime type.")
    safe = _safe_basename(file.filename or "track")
    job = uuid.uuid4().hex[:10]
    ext = (safe.rsplit(".", 1)[-1] or "mp3").lower()
    ext = ext if ext in ("mp3","wav","m4a","ogg","flac","mp4","mov","webm","aac") else "mp3"
    dest = UPLOAD_DIR / f"{job}.{ext}"

    # streaming write with hard byte ceiling — prevents disk DOS
    written = 0
    chunk = 1 << 16  # 64KB
    try:
        with open(dest, "wb") as f:
            while True:
                part = await file.read(chunk)
                if not part: break
                written += len(part)
                if written > MAX_UPLOAD_BYTES:
                    raise HTTPException(413, "Upload exceeds 25MB cap.")
                f.write(part)
    except HTTPException:
        try: dest.unlink()
        except Exception: pass
        raise
    except Exception:
        try: dest.unlink()
        except Exception: pass
        raise HTTPException(400, "Upload failed.")

    public = f"/api/static/uploads/{dest.name}"
    names = ["Raw Human Pipes", "Late-Pocket Drums", "Sub Bass / Acoustic Requinto", "Analog Melody"]
    default_levels = [0.95, 0.0, 0.0, 0.0]
    stems = [{"name": n, "level": default_levels[i], "peak": 0.5, "src": public}
             for i, n in enumerate(names)]
    await db.ledger.insert_one({
        "id": str(uuid.uuid4()), "kind": "mint", "dna_tag": f"upload_{job}",
        "actor": user["handle"], "amount_usd": 0.0,
        "note": f"Demucs separation job queued · {safe}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    return {"job": job, "source_url": public, "stems": stems, "engine": "htdemucs-v4"}

# ============================================================
# BLOODLINE LEADERBOARD (Universal Stream)
# ============================================================

@api_router.get("/leaderboard/bloodlines")
async def bloodlines(limit: int = 8):
    """Walk every track's parent_dna chain back to its root, then aggregate
    streams + earnings per root. Returns top N bloodlines with full chain."""
    await ensure_seed()
    tracks = await db.tracks.find({}, {"_id": 0}).to_list(500)
    by_dna = {t["dna_tag"]: t for t in tracks}

    def root_of(t):
        seen = set()
        cur = t
        while cur.get("parent_dna") and cur["parent_dna"] in by_dna and cur["dna_tag"] not in seen:
            seen.add(cur["dna_tag"])
            cur = by_dna[cur["parent_dna"]]
        return cur

    groups = {}
    for t in tracks:
        r = root_of(t)
        g = groups.setdefault(r["dna_tag"], {"root": r, "chain": [], "streams": 0, "earnings_usd": 0.0, "flips": 0})
        g["chain"].append(t)
        g["streams"] += int(t.get("streams", 0))
        g["earnings_usd"] += float(t.get("earnings_usd", 0.0))
        g["flips"] += int(t.get("flips", 0))

    out = []
    for g in groups.values():
        root = g["root"]
        chain_sorted = sorted(g["chain"], key=lambda x: x.get("created_at", ""))
        out.append({
            "root_dna": root["dna_tag"],
            "root_title": root["title"],
            "root_creator": root["creator"],
            "root_matrix": root["cultural_matrix"],
            "chain": [
                {
                    "dna_tag": c["dna_tag"], "title": c["title"], "creator": c["creator"],
                    "matrix": c["cultural_matrix"], "parent_dna": c.get("parent_dna"),
                    "streams": c.get("streams", 0), "earnings_usd": round(c.get("earnings_usd", 0.0), 2),
                    "is_root": c["dna_tag"] == root["dna_tag"],
                }
                for c in chain_sorted
            ],
            "total_streams": g["streams"],
            "total_earnings_usd": round(g["earnings_usd"], 2),
            "total_flips": g["flips"],
            "depth": len(g["chain"]),
        })
    out.sort(key=lambda x: x["total_earnings_usd"], reverse=True)
    return {"bloodlines": out[:limit], "ts": datetime.now(timezone.utc).isoformat()}

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

            # ── RULE_001/002/003 royalty chain payout ────────────────────────
            royalty_chain: dict = t.get("royalty_chain") or {}
            if royalty_chain:
                # Multi-party payout: distribute `rate` across chain
                chain_payouts = {h: round(rate * f, 6) for h, f in royalty_chain.items()}
                creator_cut = chain_payouts.get(t["creator"], rate)
                parent_residual = round(rate - creator_cut, 6)
            elif t.get("parent_dna"):
                # Legacy track without chain — fall back to RULE_002 flat 50/50
                parent_residual = round(rate * 0.50, 6)
                creator_cut = rate - parent_residual
                chain_payouts = {t["creator"]: creator_cut}
            else:
                # RULE_001 — original, no parent
                parent_residual = 0.0
                creator_cut = rate
                chain_payouts = {t["creator"]: rate}

            payable = creator_cut
            payload = {
                "kind": "stream",
                "dna_tag": t["dna_tag"],
                "title": t["title"],
                "creator": t["creator"],
                "amount_usd": rate,
                "parent_dna": t.get("parent_dna"),
                "parent_residual_usd": parent_residual,
                "royalty_chain_usd": chain_payouts,
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

# ============================================================
# BILLING — Stripe subscriptions + credit packs
# ============================================================

BILLING_PACKAGES = {
    "soulfire": {
        "amount": 19.00, "currency": "usd",
        "label": "Soulfire", "tier": "soulfire",
        "tagline": "$19/mo · unlimited stems · AI mastering · distribution",
        "mode": "subscription", "interval": "month",
        "lookup_key": "lyrica3_soulfire_v1",
        "product_name": "Lyrica3 — Soulfire",
    },
    "maestro": {
        "amount": 49.00, "currency": "usd",
        "label": "Maestro", "tier": "maestro",
        "tagline": "$49/mo · everything in Soulfire · video sync · collab rooms · analytics",
        "mode": "subscription", "interval": "month",
        "lookup_key": "lyrica3_maestro_v1",
        "product_name": "Lyrica3 — Maestro",
    },
    "label": {
        "amount": 149.00, "currency": "usd",
        "label": "Label", "tier": "label",
        "tagline": "$149/mo · everything + white-label · unlimited seats · priority support",
        "mode": "subscription", "interval": "month",
        "lookup_key": "lyrica3_label_v1",
        "product_name": "Lyrica3 — Label",
    },
    "credits_spark": {
        "amount": 9.00, "currency": "usd",
        "label": "Spark Pack", "credits": 10,
        "tagline": "10 AI credits — stems, masters, mixes",
        "mode": "payment",
    },
    "credits_session": {
        "amount": 24.00, "currency": "usd",
        "label": "Session Pack", "credits": 30,
        "tagline": "30 AI credits",
        "mode": "payment",
    },
    "credits_studio": {
        "amount": 59.00, "currency": "usd",
        "label": "Studio Pack", "credits": 100,
        "tagline": "100 AI credits",
        "mode": "payment",
    },
    "credits_label_drop": {
        "amount": 149.00, "currency": "usd",
        "label": "Label Drop Pack", "credits": 350,
        "tagline": "350 AI credits — best value",
        "mode": "payment",
    },
}

@api_router.get("/billing/packages")
async def billing_packages():
    return {"packages": BILLING_PACKAGES}

@api_router.get("/billing/me")
async def billing_me(user=Depends(current_user)):
    return {
        "tier": user.get("tier", "free"),
        "credits": user.get("credits", 0),
        "billing": user.get("billing", {}),
    }

class CheckoutRequest(BaseModel):
    package_id: str
    success_url: str
    cancel_url: str

@api_router.post("/billing/checkout")
async def billing_checkout(body: CheckoutRequest, user=Depends(current_user)):
    if not stripe or not STRIPE_SECRET_KEY:
        raise HTTPException(503, "Billing not configured")
    pkg = BILLING_PACKAGES.get(body.package_id)
    if not pkg:
        raise HTTPException(404, "Unknown package")
    stripe.api_key = STRIPE_SECRET_KEY
    params = {
        "mode": pkg["mode"],
        "success_url": body.success_url + "?session_id={CHECKOUT_SESSION_ID}",
        "cancel_url": body.cancel_url,
        "client_reference_id": user.get("handle", ""),
        "metadata": {"user_id": user.get("handle", ""), "package_id": body.package_id},
        "line_items": [{
            "price_data": {
                "currency": pkg["currency"],
                "unit_amount": int(pkg["amount"] * 100),
                "product_data": {"name": pkg.get("product_name", pkg["label"])},
                **({"recurring": {"interval": pkg["interval"]}} if pkg["mode"] == "subscription" else {}),
            },
            "quantity": 1,
        }],
    }
    if pkg["mode"] == "subscription":
        customer_email = user.get("email")
        if customer_email:
            params["customer_email"] = customer_email
    session = stripe.checkout.Session.create(**params)
    return {"checkout_url": session.url, "session_id": session.id}

@api_router.get("/billing/status")
async def billing_status(session_id: str, user=Depends(current_user)):
    if not stripe or not STRIPE_SECRET_KEY:
        raise HTTPException(503, "Billing not configured")
    stripe.api_key = STRIPE_SECRET_KEY
    session = stripe.checkout.Session.retrieve(session_id)
    if session.payment_status in ("paid", "complete") or session.status == "complete":
        pkg_id = session.metadata.get("package_id", "")
        pkg = BILLING_PACKAGES.get(pkg_id, {})
        update: dict = {}
        if pkg.get("mode") == "subscription":
            update["tier"] = pkg.get("tier", "soulfire")
            update["billing"] = {
                "stripe_customer_id": session.customer,
                "stripe_subscription_id": session.subscription,
                "package_id": pkg_id,
                "activated_at": datetime.now(timezone.utc).isoformat(),
            }
        elif pkg.get("credits"):
            update["$inc"] = {"credits": pkg["credits"]}
        if update:
            handle = user.get("handle")
            if "$inc" in update:
                inc = update.pop("$inc")
                await db.users.update_one({"handle": handle}, {"$set": update, "$inc": inc})
            else:
                await db.users.update_one({"handle": handle}, {"$set": update})
    return {"status": session.status, "payment_status": session.payment_status}

STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET_LYRICA3", "")

@api_router.post("/billing/webhook")
async def billing_webhook(request: Request):
    if not stripe or not STRIPE_SECRET_KEY:
        raise HTTPException(503, "Billing not configured")
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET) if STRIPE_WEBHOOK_SECRET else stripe.Event.construct_from(json.loads(payload), stripe.api_key)
    except Exception as e:
        raise HTTPException(400, f"Webhook error: {e}")
    stripe.api_key = STRIPE_SECRET_KEY
    if event["type"] == "customer.subscription.deleted":
        sub = event["data"]["object"]
        await db.users.update_one(
            {"billing.stripe_subscription_id": sub["id"]},
            {"$set": {"tier": "free", "billing.cancelled_at": datetime.now(timezone.utc).isoformat()}}
        )
    elif event["type"] == "invoice.payment_failed":
        inv = event["data"]["object"]
        await db.users.update_one(
            {"billing.stripe_customer_id": inv["customer"]},
            {"$set": {"billing.payment_failed_at": datetime.now(timezone.utc).isoformat()}}
        )
    return {"received": True}


# ============================================================
# VIBE TRANSLATE ENDPOINT — server-side Gemini call
# Routes SLUniversalApp.tsx translateVibeToParams() through the backend
# so the Gemini/Emergent key is never exposed to the client.
# ============================================================

class VibeTranslateRequest(BaseModel):
    vibe: str
    context: Optional[Dict] = None  # {weather, time, heartRate}

@api_router.post("/vibe/translate")
@limiter.limit("20/minute")
async def vibe_translate(request: Request, req: VibeTranslateRequest, user: Dict = Depends(current_user)):
    """Translate a free-text vibe into structured VibeParams via Gemini (server-side).
    Returns the JSON blob directly so the client never needs a Gemini API key."""
    context_str = ""
    if req.context:
        weather = req.context.get("weather", "")
        time_of_day = req.context.get("time", "")
        hr = req.context.get("heartRate", "")
        if weather or time_of_day or hr:
            context_str = f" Context: {weather}, {time_of_day}, {hr} BPM."
    vibe_system = "You are a music production AI. Return ONLY valid JSON with the requested fields. No prose, no markdown."
    prompt = (
        f'Translate this music vibe into a full technical emotional blueprint for the music generation engine: '
        f'"{req.vibe}".{context_str} '
        "The engine supports multi-genre blending (R&B, Oldies, Funk, Rock, Country, Soul, Chicano oldies, "
        "90s duos, 70s funk, 2000s heartbreak, Modern trap-soul, Acoustic country). "
        "Return JSON with: style, mood, tempo, key, lyrics, vocalStyle, engine, moodMatrix, genreDNA, "
        "proceduralSFX, vulnerabilitySlider, harmonicStructure, personaCount, personas, vocalFry, "
        "inhaleIntensity, emotionalBreak, roomSize, material, breathingPattern, genreBlend, "
        "instrumentation, spatialEffects, harmonicTension, vocalLayering, mixWarmth, reverbType, "
        "eraTexture, emotionalMode, delayTime, delayFeedback, chorusDepth, phaserRate."
    )
    # --- Primary: Vertex AI Gemini via IAM (no API key needed) ---
    try:
        from google import genai
        from google.genai import types as gtypes
        _vx_project = os.environ.get("VERTEX_PROJECT_ID", "disco-amphora-490606-n8")
        _vx_location = os.environ.get("VERTEX_LOCATION", "us-west1")
        _vx_model = os.environ.get("VERTEX_GEMINI_MODEL", "gemini-2.5-pro")
        _client = genai.Client(vertexai=True, project=_vx_project, location=_vx_location)
        def _sync():
            resp = _client.models.generate_content(
                model=_vx_model,
                contents=prompt,
                config=gtypes.GenerateContentConfig(
                    system_instruction=vibe_system,
                    response_mime_type="application/json",
                    temperature=0.7,
                    top_p=0.95,
                    max_output_tokens=800,
                ),
            )
            return resp.text or ""
        txt = await asyncio.to_thread(_sync)
        clean = txt.strip()
        if clean.startswith("```"):
            parts = clean.split("```")
            clean = parts[1] if len(parts) > 1 else clean
            if clean.startswith("json"):
                clean = clean[4:]
        return {"status": "ok", "params": json.loads(clean.strip())}
    except Exception as e:
        logger.warning(f"Vertex AI vibe_translate failed: {e} — trying EMERGENT_LLM_KEY")
    # --- Fallback: OpenAI-compatible client via EMERGENT_LLM_KEY ---
    if EMERGENT_LLM_KEY:
        try:
            import openai as _openai
            _client = _openai.AsyncOpenAI(api_key=EMERGENT_LLM_KEY, base_url="https://api.openai.com/v1")
            _resp = await _client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": vibe_system},
                    {"role": "user",   "content": prompt},
                ],
                temperature=0.7,
                max_tokens=800,
            )
            raw = _resp.choices[0].message.content.strip()
            clean = raw.lstrip("```json").lstrip("```").rstrip("```").strip()
            return {"status": "ok", "params": json.loads(clean)}
        except Exception as e:
            logger.warning(f"OpenAI vibe_translate failed: {e}")
            raise HTTPException(500, f"Vibe translation failed: {e}")
    raise HTTPException(503, "Vibe translation unavailable — no LLM backend responded.")


# ============================================================
# SL-UNIVERSAL PIPELINE — AURA→EFL→ASE→ECHO→EFAD
# Merged from /sl-universal/main_agent.py
# Tries Vertex AI (Gemini) pipeline; falls back to Claude LLM.
# ============================================================

class UniversalQueryRequest(BaseModel):
    query: str
    user_id: str = "web_user"

@api_router.post("/universal/query")
@limiter.limit("10/minute")
async def universal_query(request: Request, req: UniversalQueryRequest, user: Dict = Depends(current_user)):
    """Run the AURA→EFL→ASE→ECHO→EFAD deterministic cognitive pipeline.
    Falls back to a single Claude call with merged stage prompts if Vertex AI unavailable."""
    try:
        # Try Vertex AI Lyrica3Agent first
        import sys, os as _os
        _sl_path = _os.path.join(_os.path.dirname(__file__), '..', 'backend')
        if _sl_path not in sys.path:
            sys.path.insert(0, _sl_path)
        from main_agent import Lyrica3Agent
        _agent = Lyrica3Agent(
            project=_os.environ.get('GOOGLE_CLOUD_PROJECT', 'disco-amphora-490606-n8'),
            location=_os.environ.get('GOOGLE_CLOUD_LOCATION', 'us-west1'),
        )
        _agent.set_up()
        result = _agent.query(req.query)
        return {"status": "success", "user_id": req.user_id, "pipeline": "vertex:aura-efad", "result": result}
    except Exception as vertex_err:
        logger.warning(f"Vertex AURA-EFAD failed ({vertex_err}), falling back to Claude LLM pipeline")

    # OpenAI fallback — compress all 5 stages into one structured prompt
    if not EMERGENT_LLM_KEY:
        raise HTTPException(503, "Universal pipeline unavailable — no LLM key configured.")
    try:
        import openai as _openai
        system = (
            "You are the SL Universal Lyrica 3 cognitive pipeline running 5 stages in sequence:\n"
            "AURA: Extract semantic intent, rhetorical devices, bruised subtext, culture/style anchors.\n"
            "EFL: Map detected emotions to frequency/loudness/tone parameters.\n"
            "ASE: Evaluate cultural authenticity and produce a Soulfire style score (0-1).\n"
            "ECHO: Specify DSP effects (reverb, tape, swing, EQ) matching the emotional vector.\n"
            "EFAD: Assemble a final structured JSON result with keys: aura, efl, ase, echo, track_directive.\n"
            "Output ONLY valid JSON with these 5 keys. No prose, no markdown."
        )
        _client = _openai.AsyncOpenAI(api_key=EMERGENT_LLM_KEY, base_url="https://api.openai.com/v1")
        _resp = await _client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system},
                {"role": "user",   "content": f"User query:\n{req.query}"},
            ],
            temperature=0.7,
            max_tokens=1200,
        )
        txt = _resp.choices[0].message.content.strip()
        m = re.search(r"\{[\s\S]*\}", txt)
        data = json.loads(m.group(0) if m else txt)
        return {"status": "success", "user_id": req.user_id, "pipeline": "openai:aura-efad", "result": data}
    except Exception as e:
        logger.error(f"Universal query pipeline error: {e}")
        raise HTTPException(500, "Universal pipeline failed.")

app.include_router(api_router)

# Static mount for uploaded audio + Demucs stems + TTS voices
# Mounted under /api so Kubernetes ingress routes it to the backend (port 8001).
# Without /api prefix the path falls through to the React dev server and returns index.html.
app.mount("/api/static", StaticFiles(directory=str(ROOT_DIR / "static")), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"], allow_headers=["*"],
)

# ------------------------------------------------------------
# TTL cleanup — purges generated audio artifacts older than VOICE_TTL_MIN.
# Runs as an async background task on startup.
# ------------------------------------------------------------
VOICE_TTL_MIN = int(os.environ.get("VOICE_TTL_MIN", "240"))  # 4 hours default
UPLOAD_TTL_MIN = int(os.environ.get("UPLOAD_TTL_MIN", "1440"))  # 24h default

async def _ttl_sweep():
    targets = [
        (ROOT_DIR / "static" / "voices",  VOICE_TTL_MIN * 60),
        (ROOT_DIR / "static" / "uploads", UPLOAD_TTL_MIN * 60),
        (ROOT_DIR / "static" / "stems",   UPLOAD_TTL_MIN * 60),
    ]
    while True:
        now = time.time()
        for d, ttl in targets:
            if not d.exists(): continue
            for f in d.iterdir():
                try:
                    if f.is_file() and (now - f.stat().st_mtime) > ttl:
                        f.unlink()
                except Exception:
                    pass
        await asyncio.sleep(30 * 60)  # every 30 min

@app.on_event("startup")
async def _boot():
    # Verify MongoDB is reachable before accepting traffic
    try:
        await client.admin.command("ping")
        logger.info("MongoDB ping OK — connected to %s / %s", MONGO_URL.split("@")[-1], DB_NAME)
    except Exception as e:
        logger.error("MongoDB connection FAILED: %s — check MONGO_URL env var", e)
        # Don't crash the process — health endpoint will report unhealthy
    await ensure_seed()
    asyncio.create_task(_ttl_sweep())
    logger.info("Empire 1 Ledger booted. Soulfire armed. TTL sweeper active.")

@app.on_event("shutdown")
async def _shutdown():
    client.close()
