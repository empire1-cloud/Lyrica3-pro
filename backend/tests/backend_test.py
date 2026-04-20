"""Backend test suite for Empire 1 Ledger / Lyrica 3 Pro / Sonance Pro."""
import os, time, json, asyncio, pytest, requests, websockets

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://can-cant-builder.preview.emergentagent.com").rstrip("/")
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
    else:
        pass
    data = r.json()
    _token["t"] = data["token"]
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
        assert d["handle"] == handle
        assert d["token"]
        assert d["wallet"].startswith("0x")

    def test_register_duplicate(self):
        _ensure_user()
        r = session.post(f"{BASE}/api/auth/register", json={"handle": HANDLE, "password": PASS})
        assert r.status_code == 409

    def test_login_success(self):
        _ensure_user()
        r = session.post(f"{BASE}/api/auth/login", json={"handle": HANDLE, "password": PASS})
        assert r.status_code == 200
        assert r.json()["token"]

    def test_login_invalid(self):
        r = session.post(f"{BASE}/api/auth/login", json={"handle": HANDLE, "password": "wrong"})
        assert r.status_code == 401

    def test_me_with_token(self):
        r = session.get(f"{BASE}/api/auth/me", headers=auth_headers())
        assert r.status_code == 200
        assert r.json()["handle"] == HANDLE

    def test_me_without_token(self):
        r = session.get(f"{BASE}/api/auth/me")
        assert r.status_code in (401, 403)

# ---------- TRACKS ----------
class TestTracks:
    def test_list_tracks_seeded(self):
        r = session.get(f"{BASE}/api/tracks")
        assert r.status_code == 200
        tracks = r.json()
        assert len(tracks) >= 4
        titles = [t["title"] for t in tracks]
        for needed in ["Wildflowers in El Monte", "Dedication on a Sunday Night",
                        "Corrido del Valle", "Late Pocket Cruisin'"]:
            assert needed in titles, f"missing {needed}"

    def test_get_track_by_dna(self):
        r = session.get(f"{BASE}/api/tracks/trk_alpha_006_elmonte")
        assert r.status_code == 200
        t = r.json()
        assert t["title"] == "Wildflowers in El Monte"
        assert len(t["stems"]) == 4
        assert "vulnerability_index" in t["biometrics"]
        assert t["lml"]

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
        # parent flips incremented
        after = session.get(f"{BASE}/api/tracks/{parent_dna}").json()
        assert after["flips"] == before["flips"] + 1
        # ledger has flip event
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

# ---------- GENERATE (LLM) ----------
class TestGenerate:
    def test_generate_llm(self):
        payload = {
            "lyrics": "East of the freeway wildflowers bloom",
            "cultural_matrix": "LA SGV Chicano Heritage",
            "lung_capacity": 0.8, "throat_resonance": 0.7,
            "vocal_fry": 0.82, "emotional_cracks": 0.7,
        }
        r = session.post(f"{BASE}/api/generate", headers=auth_headers(), json=payload, timeout=90)
        assert r.status_code == 200, r.text
        t = r.json()
        assert t["lml"] and len(t["lml"]) > 20
        assert t["cultural_subtext"]
        assert t["creator"] == HANDLE
        assert t["dna_tag"].startswith("trk_s2_")
        # Verify persistence
        g = session.get(f"{BASE}/api/tracks/{t['dna_tag']}")
        assert g.status_code == 200

    def test_generate_requires_auth(self):
        r = session.post(f"{BASE}/api/generate", json={"lyrics": "x", "cultural_matrix": "y"})
        assert r.status_code in (401, 403)

# ---------- WEBSOCKET ----------
class TestWebSocket:
    def test_ws_streams_royalties(self):
        token = _ensure_user()
        url = f"{WS_BASE}/api/ws/royalties?token={token}"
        async def run():
            async with websockets.connect(url, open_timeout=10) as ws:
                msg = await asyncio.wait_for(ws.recv(), timeout=8)
                data = json.loads(msg)
                assert "amount_usd" in data
                assert "dna_tag" in data
                assert "title" in data
                assert "splits_usd" in data
                return data
        data = asyncio.get_event_loop().run_until_complete(run()) if False else asyncio.run(run())
        assert data["kind"] == "stream"
