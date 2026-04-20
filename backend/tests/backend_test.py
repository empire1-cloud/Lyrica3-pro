"""Backend test suite — Empire 1 Ledger / Lyrica 3 Pro (iter 2, sanitized IP)."""
import os, time, json, asyncio, pytest, requests, websockets

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
WS_BASE = BASE.replace("https://", "wss://").replace("http://", "ws://")

HANDLE = "lyrica.prime"
PASS = "soulfire123"

session = requests.Session()
session.headers.update({"Content-Type": "application/json"})

_token = {"t": None}

def _ensure_user():
    if _token["t"]:
        return _token["t"]
    r = session.post(f"{BASE}/api/auth/login", json={"handle": HANDLE, "password": PASS})
    if r.status_code != 200:
        r = session.post(f"{BASE}/api/auth/register", json={"handle": HANDLE, "password": PASS})
        assert r.status_code in (200, 201), f"register failed: {r.status_code} {r.text}"
    _token["t"] = r.json()["token"]
    return _token["t"]

def auth_headers():
    return {"Authorization": f"Bearer {_ensure_user()}"}

# ---------- AUTH ----------
class TestAuth:
    def test_register_new_user(self):
        handle = f"test_{int(time.time()*1000)%1000000}"
        r = session.post(f"{BASE}/api/auth/register", json={"handle": handle, "password": "abc123"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["handle"] == handle and d["token"] and d["wallet"].startswith("0x")

    def test_register_duplicate(self):
        _ensure_user()
        r = session.post(f"{BASE}/api/auth/register", json={"handle": HANDLE, "password": PASS})
        assert r.status_code == 409

    def test_login_success(self):
        _ensure_user()
        r = session.post(f"{BASE}/api/auth/login", json={"handle": HANDLE, "password": PASS})
        assert r.status_code == 200 and r.json()["token"]

    def test_login_invalid(self):
        r = session.post(f"{BASE}/api/auth/login", json={"handle": HANDLE, "password": "wrong"})
        assert r.status_code == 401

    def test_me_with_token(self):
        r = session.get(f"{BASE}/api/auth/me", headers=auth_headers())
        assert r.status_code == 200 and r.json()["handle"] == HANDLE

    def test_me_without_token(self):
        r = session.get(f"{BASE}/api/auth/me")
        assert r.status_code in (401, 403)

# ---------- SANITIZATION (critical for iter 2) ----------
FORBIDDEN_TRACK_KEYS = {"lml", "cultural_subtext"}
FORBIDDEN_BIO_KEYS = {"lung_capacity", "throat_resonance", "vocal_fry",
                     "emotional_cracks", "phonation_type", "swing_delay_ms",
                     "vulnerability_index"}
EXPECTED_BIO_KEYS = {"resonance_quality", "vulnerability_level", "breath_profile",
                    "expressive_range", "biometrics_active", "signature_glyph"}
QUAL_VALUES = {"Subtle", "Present", "Deep", "Profound"}

def _assert_sanitized(t):
    for k in FORBIDDEN_TRACK_KEYS:
        assert k not in t or t.get(k) is None, f"track leaks {k}: {t.get(k)}"
    bio = t.get("biometrics", {}) or {}
    for k in FORBIDDEN_BIO_KEYS:
        assert k not in bio, f"biometrics leaks {k}: {bio.get(k)}"
    for k in EXPECTED_BIO_KEYS:
        assert k in bio, f"biometrics missing {k}"
    for qk in ("resonance_quality", "vulnerability_level", "breath_profile", "expressive_range"):
        assert bio[qk] in QUAL_VALUES, f"{qk}={bio[qk]!r} not qualitative"
    assert bio["biometrics_active"] is True

class TestTracks:
    def test_list_tracks_seeded_and_sanitized(self):
        r = session.get(f"{BASE}/api/tracks")
        assert r.status_code == 200
        tracks = r.json()
        assert len(tracks) >= 4
        titles = [t["title"] for t in tracks]
        for needed in ["Wildflowers in El Monte", "Dedication on a Sunday Night",
                        "Corrido del Valle", "Late Pocket Cruisin'"]:
            assert needed in titles
        # sanitization applies to every track
        for t in tracks:
            _assert_sanitized(t)

    def test_get_track_sanitized(self):
        r = session.get(f"{BASE}/api/tracks/trk_alpha_006_elmonte")
        assert r.status_code == 200
        t = r.json()
        assert t["title"] == "Wildflowers in El Monte"
        assert len(t["stems"]) == 4
        _assert_sanitized(t)

    def test_get_track_404(self):
        r = session.get(f"{BASE}/api/tracks/nonexistent_dna")
        assert r.status_code == 404

# ---------- FLIP ----------
class TestFlip:
    def test_flip_creates_child(self):
        parent_dna = "trk_alpha_014_corrido"
        before = session.get(f"{BASE}/api/tracks/{parent_dna}").json()
        r = session.post(f"{BASE}/api/tracks/{parent_dna}/flip",
                         headers=auth_headers(),
                         json={"new_title": "TEST_Flip Child", "new_genre": "Glitch Corrido"})
        assert r.status_code == 200, r.text
        child = r.json()
        assert child["parent_dna"] == parent_dna
        assert child["title"] == "TEST_Flip Child"
        assert child["creator"] == HANDLE
        _assert_sanitized(child)  # flip response also sanitized
        after = session.get(f"{BASE}/api/tracks/{parent_dna}").json()
        assert after["flips"] == before["flips"] + 1
        led = session.get(f"{BASE}/api/ledger").json()
        assert any(e["kind"] == "flip" and e["dna_tag"] == child["dna_tag"] for e in led)

    def test_flip_requires_auth(self):
        r = session.post(f"{BASE}/api/tracks/trk_alpha_014_corrido/flip",
                         json={"new_title": "x", "new_genre": "y"})
        assert r.status_code in (401, 403)

# ---------- LEDGER ----------
class TestLedger:
    def test_ledger_sorted_desc(self):
        r = session.get(f"{BASE}/api/ledger")
        assert r.status_code == 200
        events = r.json()
        assert len(events) >= 4
        timestamps = [e["timestamp"] for e in events]
        assert timestamps == sorted(timestamps, reverse=True)

# ---------- WALLET ----------
class TestWallet:
    def test_wallet_auth(self):
        r = session.get(f"{BASE}/api/wallet", headers=auth_headers())
        assert r.status_code == 200
        d = r.json()
        for k in ("balance_usd", "wallet", "splits", "handle"):
            assert k in d
        assert d["splits"]["beat_maker"] == 0.5

    def test_wallet_no_auth(self):
        r = session.get(f"{BASE}/api/wallet")
        assert r.status_code in (401, 403)

# ---------- VIBES CATALOG (new in iter 2) ----------
class TestVibes:
    def test_vibes(self):
        r = session.get(f"{BASE}/api/vibes")
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d.get("genres"), list) and isinstance(d.get("moods"), list)
        assert len(d["genres"]) == 7, f"expected 7 genres got {len(d['genres'])}"
        assert len(d["moods"])  == 6, f"expected 6 moods got {len(d['moods'])}"
        assert "SGV Oldies" in d["genres"]
        assert "Late-Night Honesty" in d["moods"]

# ---------- GENERATE (LLM) — new consumer schema ----------
class TestGenerate:
    def test_generate_new_schema(self):
        payload = {
            "lyrics": "East of the freeway wildflowers bloom",
            "genre": "SGV Oldies",
            "mood": "Late-Night Honesty",
            "title": "TEST_Wildflowers Echo",
        }
        r = session.post(f"{BASE}/api/generate", headers=auth_headers(), json=payload, timeout=120)
        assert r.status_code == 200, r.text
        t = r.json()
        _assert_sanitized(t)  # no lml/persona leaked
        assert t["creator"] == HANDLE
        assert t["dna_tag"].startswith("trk_s2_")
        assert t["title"]  # honors provided or generated title
        # Persisted
        g = session.get(f"{BASE}/api/tracks/{t['dna_tag']}")
        assert g.status_code == 200
        _assert_sanitized(g.json())

    def test_generate_requires_auth(self):
        r = session.post(f"{BASE}/api/generate",
                         json={"lyrics": "x", "genre": "SGV Oldies", "mood": "Late-Night Honesty"})
        assert r.status_code in (401, 403)

    def test_generate_missing_lyrics(self):
        r = session.post(f"{BASE}/api/generate", headers=auth_headers(),
                         json={"genre": "SGV Oldies", "mood": "Late-Night Honesty"})
        assert r.status_code == 422, r.text

    def test_generate_ignores_old_schema_fields(self):
        """Old schema (cultural_matrix, lung_capacity, …) should be ignored; request still succeeds if lyrics present."""
        payload = {
            "lyrics": "late night mija",
            "cultural_matrix": "LEAKED",
            "lung_capacity": 0.9,
            "throat_resonance": 0.9,
            "vocal_fry": 0.9,
            "emotional_cracks": 0.9,
        }
        r = session.post(f"{BASE}/api/generate", headers=auth_headers(), json=payload, timeout=120)
        assert r.status_code == 200, r.text
        t = r.json()
        _assert_sanitized(t)

# ---------- PWA manifest ----------
class TestManifest:
    def test_manifest(self):
        r = requests.get(f"{BASE}/manifest.json", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["start_url"] == "/deck"
        assert d["theme_color"] == "#030303"

# ---------- WEBSOCKET ----------
class TestWebSocket:
    def test_ws_streams_royalties(self):
        token = _ensure_user()
        url = f"{WS_BASE}/api/ws/royalties?token={token}"
        async def run():
            async with websockets.connect(url, open_timeout=10) as ws:
                msg = await asyncio.wait_for(ws.recv(), timeout=8)
                return json.loads(msg)
        data = asyncio.run(run())
        assert data["kind"] == "stream"
        for k in ("amount_usd", "dna_tag", "title", "splits_usd"):
            assert k in data
