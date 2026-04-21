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

class AxisSelection(BaseModel):
    """EMSS 4-axis multi-dimensional musical control.
    Each axis is independent — stack Trap Corrido rhythm + Ranchera melody + Soulfire delivery."""
    rhythm: Optional[str]          = None   # e.g. "Trap Corrido", "Lowrider Cruise 76 BPM"
    melody: Optional[str]          = None   # e.g. "Ranchera Belt", "Souldies 6th/9th"
    instrumentation: Optional[str] = None   # e.g. "Warm Souldies Analog", "70s Motown Live Band"
    emotion: Optional[str]         = None   # e.g. "Hurt-Girl Mirror", "Playful-Pain (Broken Smile)"

class PerformerDNA(BaseModel):
    """Performer DNA sliders — all 0.0-1.0. Routed into Claude prompt + TTS style."""
    vulnerability:   float = 0.75
    raspiness:       float = 0.50
    warmth:          float = 0.60
    breath:          float = 0.60
    breathiness:     float = 0.50
    clarity:         float = 0.70
    resonance:       float = 0.65
    glottal_tension: float = 0.40

class HarmonyLayer(BaseModel):
    """A stacked harmony take rendered alongside the lead vocal."""
    interval:  int   = 3                     # semitones
    direction: Literal["above", "below"] = "above"
    intensity: float = 0.50                  # 0-1 loudness relative to lead
    dry_wet:   float = 0.50                  # 0=fully dry, 1=fully wet (reverb/space)
    timing_ms: int   = 0                     # micro-offset (−50..+50 ms)
    voice:     Optional[str] = None          # optional TTS voice override

class GenerateRequest(BaseModel):
    """Consumer-safe request. No LML, no decimals, no persona.
    Backend maps genre+mood → internal cultural_matrix and biometric dials.
    EMSS extension: axes / performer_dna / harmony_layers stack on top."""
    lyrics: str
    genre: str = "SGV Oldies"
    mood: str = "Late-Night Honesty"
    title: Optional[str] = None
    ghost_audio_name: Optional[str] = None
    axes:            Optional[AxisSelection] = None
    performer_dna:   Optional[PerformerDNA]  = None
    harmony_layers:  List[HarmonyLayer]      = Field(default_factory=list)
    subtextual_splicer: bool = False         # "Broken Smile" — never say the pain directly
    bridge_enabled:     bool = False         # instrumental bridge section

class DuetRequest(BaseModel):
    """Duo-Soul Engine — alternating-line duet between 2 voice profiles.
    `lyrics` uses `A: ...` / `B: ...` line-prefix convention."""
    lyrics: str
    voice_a: str = "mateo"
    voice_b: str = "elara"
    title: Optional[str] = None
    axes: Optional[AxisSelection] = None
    performer_dna: Optional[PerformerDNA] = None

# Internal genre/mood → secret recipe mapping (NEVER sent to client)
_GENRE_MAP = {
    # LA / SGV / Chicano spine
    "SGV Oldies":                     "LA SGV Chicano Heritage",
    "LA Heritage":                    "LA SGV Chicano Heritage",
    "Art Laboe Sunday Dedication":    "Art Laboe Oldies",
    "SGV Backyard Party":             "Late-Pocket Street Bounce",
    "Nahuatl Ancestry":               "Pre-Columbian Ancestral",
    "West Coast G-Funk Piano":        "West Coast G-Funk",
    "Acoustic Requinto Weeping":      "Raw Spanish Corridos",
    "Corridos":                       "Raw Spanish Corridos",
    "Oldies":                         "Art Laboe Oldies",
    "Street Bounce":                  "Late-Pocket Street Bounce",
    "Cruising":                       "Late Night Cruising Melancholy",
    "Resilience":                     "Street-Soft Resilience",
    # Urban / contemporary
    "R&B":                            "Neo-Soul R&B",
    "Trap Soul":                      "Trap Soul",
    "Hip Hop":                        "Boom Bap Hip-Hop",
    "Rap":                            "West Coast Rap",
    "Drill":                          "Drill",
    "Afrobeats":                      "Afrobeats",
    "UK Garage":                      "UK Garage",
    "Jersey Club":                    "Jersey Club",
    "Bossa Nova":                     "Bossa Nova",
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

# ============================================================
# EMSS Multi-Axis Catalogs — independent musical dimensions.
# These overlay on genre+mood so you can stack e.g. Trap Corrido rhythm
# + Ranchera melody + Warm Souldies instruments + Hurt-Girl emotion.
# ============================================================
AXIS_CATALOG = {
    "rhythm": [
        {"id": "lowrider_cruise_76",  "label": "Lowrider Cruise · 76 BPM",         "tag": "72-84 BPM, lazy swing, snare dragged 12-15ms behind the grid"},
        {"id": "trap_corrido",        "label": "Trap Corrido",                      "tag": "808s + acoustic bajo quinto, triplet hats, 140 BPM half-time feel"},
        {"id": "late_pocket_bounce",  "label": "Late-Pocket SGV Bounce",            "tag": "85 BPM, dilla-swing, fat kick, snare pushed late"},
        {"id": "laboe_sunday_68",     "label": "Laboe Sunday · 68 BPM",             "tag": "slow-jam swing, brushed snare, tape-warped kick"},
        {"id": "drill_uk_140",        "label": "UK Drill · 140",                    "tag": "sliding 808s, syncopated hats, rim-click snare"},
        {"id": "g_funk_94",           "label": "West Coast G-Funk · 94",            "tag": "TR-808 kicks, live snare, head-nod pocket"},
        {"id": "afrobeat_105",        "label": "Afrobeat · 105",                    "tag": "log drum, agogo, off-beat open hat"},
        {"id": "jersey_club_135",     "label": "Jersey Club · 135",                 "tag": "bed-squeak kicks, 5-stroke pattern, pitched vocal chops"},
        {"id": "bossa_cruise_82",     "label": "Bossa Cruise · 82",                 "tag": "brush snare, rim clave, upright bass walks"},
        {"id": "requinto_bolero",     "label": "Requinto Bolero Free",              "tag": "rubato rhythm, no click, breath-timed"},
    ],
    "melody": [
        {"id": "ranchera_belt",       "label": "Ranchera Belt",                     "tag": "wide interval jumps, sustained belts, ranchera vibrato"},
        {"id": "souldies_6_9",        "label": "Souldies 6th/9th Phrasing",         "tag": "Major 7th, Minor 9th chord-tones, bluesy bends"},
        {"id": "hurt_girl_mirror",    "label": "Hurt-Girl Mirror Melody",           "tag": "closed-mouth resonance, stepwise descending phrases, tears at end"},
        {"id": "corrido_narration",   "label": "Corrido Narrative",                 "tag": "story-arc phrasing, octave lifts on climactic lines"},
        {"id": "trap_soul_drip",      "label": "Trap Soul Drip",                    "tag": "melismatic runs, pitched ad-libs, pentatonic cascades"},
        {"id": "laboe_crooner",       "label": "Laboe Crooner",                     "tag": "doo-wop thirds, falsetto break on refrain, vibrato on final word"},
        {"id": "drill_monotone",      "label": "Drill Monotone Chant",              "tag": "3-note chant, emphasis on off-beats, menacing stillness"},
        {"id": "afro_pentatonic",     "label": "Afro Pentatonic",                   "tag": "5-note phrases, call-and-response, melismatic turns"},
        {"id": "ancestral_nahuatl",   "label": "Ancestral Nahuatl",                 "tag": "pre-Columbian modal scales, throat drone overtones"},
    ],
    "instrumentation": [
        {"id": "warm_souldies_analog","label": "Warm Souldies Analog",              "tag": "tape saturation, 200-500Hz wood-and-wire bump, fender rhodes, warm bass"},
        {"id": "70s_motown_live",     "label": "70s Motown Live Band",              "tag": "live drums, tambourine, horn stabs, strings, walking bass"},
        {"id": "lo_fi_tape_hiss",     "label": "Lo-Fi Tape Hiss",                   "tag": "4-track cassette, pitch wobble, vinyl crackle, muted piano"},
        {"id": "trap_808_heavy",      "label": "Trap 808 Heavy",                    "tag": "sub 808, detuned synth bass, triplet hats, vocal chops"},
        {"id": "acoustic_requinto",   "label": "Acoustic Requinto Ensemble",         "tag": "requinto, bajo sexto, accordion, spanish guitar, light percussion"},
        {"id": "synthwave_analog",    "label": "Synthwave Analog",                  "tag": "Juno-6 pads, gated reverb snare, saw bass, arpeggios"},
        {"id": "gospel_chicano",      "label": "Gospel Chicano Choir",              "tag": "live Hammond B3, upright piano, choir stacks, tambourine"},
        {"id": "minimal_808",         "label": "Minimal 808 + Voice",               "tag": "just 808 sub, clap, hat; vocal carries the song"},
        {"id": "orchestral_cinematic","label": "Orchestral Cinematic",              "tag": "strings, cello, french horns, timpani, bells"},
    ],
    "emotion": [
        {"id": "soulfire_hurt_girl",  "label": "Soulfire · Hurt-Girl",              "tag": "closed-mouth intimacy, internal singing, pain-in-the-eyes delivery"},
        {"id": "playful_pain",        "label": "Playful-Pain (Broken Smile)",       "tag": "bright harmony + sad lyrics, glottal tension on optimistic lines, audible smile-cracks"},
        {"id": "defiant_bloom",       "label": "Defiant Bloom",                     "tag": "chest-voice belt, survival energy, rising dynamics"},
        {"id": "abuela_lament",       "label": "Abuela Lament",                     "tag": "requinto grief, long breaths, generational mourning"},
        {"id": "lowrider_melancholy", "label": "Lowrider Melancholy",               "tag": "cruising reflection, late-night honesty, half-smile nostalgia"},
        {"id": "street_menace",       "label": "Street Menace · Soft",              "tag": "whisper-grit, subharmonic undercurrent, controlled rage"},
        {"id": "sunday_dedication",   "label": "Sunday Dedication",                  "tag": "Laboe-style longing, caller-to-lockup tenderness, falsetto breaks"},
        {"id": "ancestral_fire",      "label": "Ancestral Fire",                     "tag": "pre-Columbian invocation, throat resonance, conjuring energy"},
        {"id": "after_hours_prayer",  "label": "After-Hours Prayer",                 "tag": "whisper, tape hiss, candlelit confession at 4am"},
    ],
}

# Duo-Soul voice profiles — paired to OpenAI TTS voices server-side
DUET_PROFILES = [
    {"id": "mateo",    "label": "Mateo",    "tts_voice": "onyx",    "persona": "Deep chest voice · SGV carnal", "color": "#f5a524"},
    {"id": "elara",    "label": "Elara",    "tts_voice": "nova",    "persona": "Bright airy female · defiant bloom", "color": "#ff5eac"},
    {"id": "requinto", "label": "Requinto", "tts_voice": "echo",    "persona": "Warm mid-range · oldies crooner", "color": "#ffd88a"},
    {"id": "solana",   "label": "Solana",   "tts_voice": "shimmer", "persona": "Airy breath · hurt-girl mirror", "color": "#59d3ff"},
    {"id": "abuela",   "label": "Abuela",   "tts_voice": "sage",    "persona": "Gentle generational · prayer", "color": "#c9bfae"},
    {"id": "carnal",   "label": "Carnal",   "tts_voice": "ash",     "persona": "Raspy grain · street resilience", "color": "#6a8cff"},
]
_DUET_VOICE_BY_ID = {p["id"]: p for p in DUET_PROFILES}

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
    """Call Claude Sonnet 4.5 via EMERGENT_LLM_KEY. Internal prompt-engineering — never exposed."""
    lung, throat, fry, crack = recipe

    # --- EMSS multi-axis overlay --------------------------------------
    axes = req.axes
    axis_lines: list = []
    if axes:
        cat = AXIS_CATALOG
        def _lookup(axis_key, sel_id):
            if not sel_id: return None
            for opt in cat.get(axis_key, []):
                if opt["id"] == sel_id: return opt
            return None
        for key, lbl in (("rhythm","Rhythm/Structure"), ("melody","Melody"),
                         ("instrumentation","Instrumentation"), ("emotion","Emotional Delivery")):
            sel = _lookup(key, getattr(axes, key, None))
            if sel:
                axis_lines.append(f"- {lbl}: {sel['label']} — {sel['tag']}")
    axis_block = "\n".join(axis_lines) if axis_lines else "- (using genre+mood defaults)"

    # --- Performer DNA overlay ---------------------------------------
    dna = req.performer_dna
    dna_block = "(default performer DNA)"
    if dna:
        dna_block = (
            f"vulnerability={dna.vulnerability:.2f} raspiness={dna.raspiness:.2f} "
            f"warmth={dna.warmth:.2f} breath={dna.breath:.2f} breathiness={dna.breathiness:.2f} "
            f"clarity={dna.clarity:.2f} resonance={dna.resonance:.2f} "
            f"glottal_tension={dna.glottal_tension:.2f}"
        )

    # --- Broken Smile subtextual splicer + bridge directive ----------
    splicer_rule = ""
    if req.subtextual_splicer:
        splicer_rule = (
            "\n- BROKEN SMILE RULE: The pain must be FELT but never spoken directly. "
            "For every sad line, swap 20% of the sad words with 'soft-street' slang or phonetic breaks "
            "(vocal fry, sighs, half-laughs). Pair sad lyrics with bright harmonic implication (irony)."
        )
    bridge_rule = ""
    if req.bridge_enabled:
        bridge_rule = (
            "\n- BRIDGE MANDATORY: Include a [bridge] section that shifts instrumental focus, "
            "explores a contrasting harmonic texture, and returns cleanly to the main theme."
        )
    harmony_rule = ""
    if req.harmony_layers:
        lyr = ", ".join(
            f"{h.direction[:1]}{h.interval}@{h.intensity:.1f}" for h in req.harmony_layers
        )
        harmony_rule = f"\n- Harmony layers planned externally: [{lyr}]. Keep lead vocal arrangement clean to accommodate stacking."

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"s2_{uuid.uuid4().hex[:8]}",
            system_message=LML_SYSTEM,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        user_text = (
            f"Cultural Matrix: {matrix}\n"
            f"Biometric dials — lung_capacity={lung:.2f}, throat_resonance={throat:.2f}, "
            f"vocal_fry={fry:.2f}, emotional_cracks={crack:.2f}\n"
            f"EMSS Multi-Axis Overlay:\n{axis_block}\n"
            f"Performer DNA: {dna_block}"
            f"{splicer_rule}{bridge_rule}{harmony_rule}\n"
            f"Ghost audio artifact: {req.ghost_audio_name or 'none'}\n"
            f"Raw lyric seed:\n{req.lyrics}\n\n"
            f"Compose the Soulfire. Return JSON only."
        )
        resp = await chat.send_message(UserMessage(text=user_text))
        txt = resp.strip()
        m = re.search(r"\{[\s\S]*\}", txt)
        if m: txt = m.group(0)
        data = json.loads(txt)
        for k in ("title", "cultural_subtext", "lml"):
            if k not in data or not isinstance(data[k], str):
                raise ValueError(f"missing {k}")
        return data
    except Exception as e:
        logger.warning(f"LLM fallback engaged: {e}")
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
    # LIVE AUDIO PIPELINE — engines chosen by env flags:
    #   1. Vertex Lyria 2  (if VERTEX_AI_ENABLED)     — real music, GCP-native
    #   2. Replicate MusicGen (if REPLICATE_API_KEY)  — real music, pay-per-use
    #   3. Fallback SoundHelix placeholders           — investor demo
    # Vocal: Vertex Chirp 3 HD → OpenAI TTS → none
    # ============================================================
    from integrations import (
        audio_synth, auto_split, fallback_stems, build_synth_prompt,
        vocal_performance, REPLICATE_API_KEY,
    )
    from vertex_ai import (
        vertex_lyria_full_song, vertex_chirp_tts, _available as vertex_available,
    )
    stems: list = []
    synth_source_url: Optional[str] = None
    synth_provider = "fallback"

    # ---- Instrumental ------------------------------------------------
    if vertex_available():
        lyria_prompt = build_synth_prompt(matrix, recipe, data["lml"])
        lyria_path = await vertex_lyria_full_song(
            lyria_prompt, matrix, recipe,
            out_dir=str(ROOT_DIR / "static" / "stems"),
        )
        if lyria_path:
            public_url = f"/api/static/stems/{Path(lyria_path).name}"
            synth_source_url = public_url
            synth_provider = "vertex:lyria-2-full"
            stems = await auto_split(public_url,
                                     out_dir=str(ROOT_DIR / "static" / "stems"))
    if not stems and REPLICATE_API_KEY:
        synth_prompt = build_synth_prompt(matrix, recipe, data["lml"])
        synth_source_url = await audio_synth(synth_prompt)
        if synth_source_url:
            synth_provider = "replicate:musicgen"
            stems = await auto_split(synth_source_url,
                                     out_dir=str(ROOT_DIR / "static" / "stems"))
    if not stems:
        stems = fallback_stems()
        synth_provider = "fallback" if synth_provider == "fallback" else f"fallback:{synth_provider}_error"

    # ---- AI Vocal Performance ---------------------------------------
    voice_provider = "none"
    voice_meta: Optional[dict] = None
    # Prefer Vertex Chirp; fall back to OpenAI TTS via Universal Key
    from integrations import _strip_lml
    clean_lyrics = _strip_lml(data["lml"])
    if vertex_available():
        vp = await vertex_chirp_tts(clean_lyrics,
                                     out_dir=str(ROOT_DIR / "static" / "voices"))
        if vp:
            voice_provider = "vertex:chirp-3-hd"
            voice_meta = vp
    if not voice_meta:
        vp = await vocal_performance(
            lml=data["lml"], mood=req.mood,
            out_dir=str(ROOT_DIR / "static" / "voices"),
        )
        if vp:
            voice_provider = "openai:tts-1-hd"
            voice_meta = vp
    if voice_meta:
        for i, s in enumerate(stems):
            if s["name"] == "Raw Human Pipes":
                stems[i] = {**s, "src": voice_meta["url"], "level": 0.95, "peak": 0.8}
                break

    # ---- Harmony layers (EMSS) --------------------------------------
    # Render each requested harmony layer as an additional TTS take with an
    # alternate voice. Stored as extra stems alongside the 4 base stems so the
    # Stem Deck can surface them. Pitch-shift to exact interval is a future
    # DSP step — for now each layer is an independent take with its own voice.
    harmony_meta: list = []
    if req.harmony_layers and voice_meta and EMERGENT_LLM_KEY:
        harmony_voice_pool = ["nova", "shimmer", "sage", "fable", "echo", "ash", "coral"]
        layers = req.harmony_layers[:4]   # cap at 4
        # Fan out in parallel — cuts 4-layer render from ~30s → ~8s
        async def _render_one(idx: int, h: "HarmonyLayer"):
            hv = h.voice or harmony_voice_pool[idx % len(harmony_voice_pool)]
            try:
                return idx, h, hv, await vocal_performance(
                    lml=data["lml"], mood=req.mood,
                    out_dir=str(ROOT_DIR / "static" / "voices"),
                    voice=hv,
                )
            except Exception as e:
                logger.warning(f"harmony layer {idx} failed: {e}")
                return idx, h, hv, None
        results = await asyncio.gather(*[_render_one(i, h) for i, h in enumerate(layers)])
        for idx, h, hv, hv_meta in results:
            if not hv_meta:
                continue
            harmony_meta.append({
                "url": hv_meta["url"], "voice": hv,
                "interval": h.interval, "direction": h.direction,
                "intensity": h.intensity, "dry_wet": h.dry_wet,
                "timing_ms": h.timing_ms,
            })
            stems.append({
                "name": f"Harmony {h.direction[:1].upper()}{h.interval}",
                "level": max(0.2, min(1.0, h.intensity)),
                "peak":  round(h.intensity * 0.8, 2),
                "src":   hv_meta["url"],
            })

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
        "created_at": now,
    }
    await db.tracks.insert_one(track)
    await db.ledger.insert_one({
        "id": str(uuid.uuid4()), "kind": "mint", "dna_tag": dna,
        "actor": user["handle"], "amount_usd": 0.0,
        "note": f"Soulfire ignited · synth={synth_provider} · voice={voice_provider}",
        "timestamp": now,
    })
    track.pop("_id", None)
    return _sanitize_track(track)

@api_router.get("/vibes/axes")
async def vibes_axes():
    """EMSS Multi-Axis catalog — 4 independent musical dimensions.
    Each axis can be freely stacked with genre+mood to produce hybrid outputs."""
    return {
        "rhythm":          AXIS_CATALOG["rhythm"],
        "melody":          AXIS_CATALOG["melody"],
        "instrumentation": AXIS_CATALOG["instrumentation"],
        "emotion":         AXIS_CATALOG["emotion"],
    }

@api_router.get("/duet/profiles")
async def duet_profiles():
    """Public Duo-Soul voice profiles. `tts_voice` is stored but never exposed client-side
    beyond the id — we don't want consumers poking at OpenAI voice names directly."""
    return {
        "profiles": [
            {k: v for k, v in p.items() if k != "tts_voice"}
            for p in DUET_PROFILES
        ],
    }

@api_router.post("/duet/generate")
@limiter.limit("6/minute")
async def duet_generate(request: Request, req: DuetRequest, user: Dict = Depends(current_user)):
    """Duo-Soul Engine — split conversational lyrics by `A:` / `B:` prefixes, synthesize
    each line with the assigned voice profile, return an ordered segment list.
    Mixing into a single audio file is deferred to the frontend (sequential Web Audio
    playback) until ffmpeg is wired for server-side concat."""
    prof_a = _DUET_VOICE_BY_ID.get(req.voice_a.lower())
    prof_b = _DUET_VOICE_BY_ID.get(req.voice_b.lower())
    if not prof_a or not prof_b:
        raise HTTPException(400, "Unknown voice profile.")
    if prof_a["id"] == prof_b["id"]:
        raise HTTPException(400, "Pick two distinct voices.")

    # Parse conversational lyrics: `A: ... / B: ...`
    lines = []
    for raw in (req.lyrics or "").splitlines():
        s = raw.strip()
        if not s: continue
        m = re.match(r"^\s*([ABab12])\s*[:|\-]\s*(.+)$", s)
        if m:
            tag = m.group(1).upper()
            who = prof_a if tag in ("A", "1") else prof_b
            txt = m.group(2).strip()
        else:
            # No prefix → alternate starting with A for the first unprefixed line
            who = prof_a if (len(lines) % 2 == 0) else prof_b
            txt = s
        if txt:
            lines.append({"who": who, "text": txt})
    if not lines:
        raise HTTPException(400, "No lyric lines parsed.")
    if len(lines) > 24:
        lines = lines[:24]   # safety cap

    # Synthesize each line via OpenAI TTS (Universal Key)
    segments: list = []
    if not EMERGENT_LLM_KEY:
        raise HTTPException(503, "Vocal engine offline (no LLM key).")
    try:
        from emergentintegrations.llm.openai import OpenAITextToSpeech
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
    except Exception as e:
        logger.warning(f"TTS init failed: {e}")
        raise HTTPException(503, "Vocal engine unavailable.")

    out_dir = ROOT_DIR / "static" / "voices"
    out_dir.mkdir(parents=True, exist_ok=True)
    for idx, ln in enumerate(lines):
        try:
            audio_bytes = await tts.generate_speech(
                text=ln["text"], model="tts-1-hd",
                voice=ln["who"]["tts_voice"], response_format="mp3",
            )
            fname = f"duet_{uuid.uuid4().hex[:10]}.mp3"
            (out_dir / fname).write_bytes(audio_bytes)
            segments.append({
                "index": idx,
                "voice_id": ln["who"]["id"],
                "voice_label": ln["who"]["label"],
                "color": ln["who"]["color"],
                "text": ln["text"],
                "url": f"/api/static/voices/{fname}",
            })
        except Exception as e:
            logger.warning(f"duet tts line {idx} failed: {e}")
            continue

    if not segments:
        raise HTTPException(502, "Duet synthesis failed — try again.")

    dna = f"duet_{uuid.uuid4().hex[:10]}"
    now = datetime.now(timezone.utc).isoformat()
    title = req.title or f"Duet · {prof_a['label']} × {prof_b['label']}"
    await db.ledger.insert_one({
        "id": str(uuid.uuid4()), "kind": "mint", "dna_tag": dna,
        "actor": user["handle"], "amount_usd": 0.0,
        "note": f"Duo-Soul duet minted · {prof_a['label']} × {prof_b['label']} · {len(segments)} segments",
        "timestamp": now,
    })
    return {
        "dna_tag": dna,
        "title": title,
        "voice_a": {k: v for k, v in prof_a.items() if k != "tts_voice"},
        "voice_b": {k: v for k, v in prof_b.items() if k != "tts_voice"},
        "segments": segments,
        "created_at": now,
    }

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
                       "Street Bounce", "Cruising", "Resilience"]},
            {"title": "Urban · Contemporary",
             "items": ["R&B", "Trap Soul", "Hip Hop", "Rap", "Drill"]},
            {"title": "Global",
             "items": ["Afrobeats", "UK Garage", "Jersey Club", "Bossa Nova"]},
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
    await ensure_seed()
    asyncio.create_task(_ttl_sweep())
    logger.info("Empire 1 Ledger booted. Soulfire armed. TTL sweeper active.")

@app.on_event("shutdown")
async def _shutdown():
    client.close()
