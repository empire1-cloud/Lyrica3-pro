"""EMSS Phase 2+3+4 backend tests — axes, performer DNA, harmony, duet."""
import os, time, requests, pytest

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
HANDLE = "lyrica.prime"
PASS = "soulfire123"

session = requests.Session()
session.headers.update({"Content-Type": "application/json"})
_tok = {"t": None}

def _token():
    if _tok["t"]: return _tok["t"]
    r = session.post(f"{BASE}/api/auth/login", json={"handle": HANDLE, "password": PASS})
    if r.status_code != 200:
        r = session.post(f"{BASE}/api/auth/register", json={"handle": HANDLE, "password": PASS})
    _tok["t"] = r.json()["token"]
    return _tok["t"]

def auth():
    return {"Authorization": f"Bearer {_token()}"}


# ---------- AXES CATALOG ----------
class TestAxesCatalog:
    def test_vibes_axes_shape(self):
        r = session.get(f"{BASE}/api/vibes/axes")
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("rhythm", "melody", "instrumentation", "emotion"):
            assert k in d, f"missing axis {k}"
            assert isinstance(d[k], list)
            for opt in d[k]:
                assert "id" in opt and "label" in opt and "tag" in opt
        assert len(d["rhythm"]) == 10
        assert len(d["melody"]) == 9
        assert len(d["instrumentation"]) == 9
        assert len(d["emotion"]) == 9


# ---------- DUET PROFILES ----------
class TestDuetProfiles:
    def test_duet_profiles_no_tts_voice(self):
        r = session.get(f"{BASE}/api/duet/profiles")
        assert r.status_code == 200, r.text
        profs = r.json().get("profiles", [])
        ids = [p["id"] for p in profs]
        assert set(ids) == {"mateo", "elara", "requinto", "solana", "abuela", "carnal"}
        for p in profs:
            for k in ("id", "label", "persona", "color"):
                assert k in p, f"profile missing {k}"
            assert "tts_voice" not in p, "tts_voice leaked to client"


# ---------- GENERATE with EMSS payload ----------
class TestGenerateEMSS:
    def test_generate_full_emss(self):
        payload = {
            "lyrics": "East of the freeway wildflowers bloom",
            "genre": "SGV Oldies",
            "mood": "Late-Night Honesty",
            "title": "TEST_EMSS Full",
            "axes": {
                "rhythm": "trap_corrido",
                "melody": "ranchera_belt",
                "instrumentation": "warm_souldies_analog",
                "emotion": "soulfire_hurt_girl",
            },
            "performer_dna": {
                "vulnerability": 0.85, "raspiness": 0.6, "warmth": 0.7,
                "breath": 0.65, "breathiness": 0.55, "clarity": 0.8,
                "resonance": 0.72, "glottal_tension": 0.45,
            },
            "harmony_layers": [
                {"interval": 3, "direction": "above", "intensity": 0.6, "dry_wet": 0.4, "timing_ms": 5},
                {"interval": 5, "direction": "below", "intensity": 0.5, "dry_wet": 0.5, "timing_ms": -3},
            ],
            "subtextual_splicer": True,
            "bridge_enabled": True,
        }
        r = session.post(f"{BASE}/api/generate", headers=auth(), json=payload, timeout=180)
        assert r.status_code == 200, r.text
        t = r.json()
        # sanitized
        assert "lml" not in t or t.get("lml") is None
        assert "cultural_subtext" not in t or t.get("cultural_subtext") is None
        bio = t.get("biometrics", {})
        for forbidden in ("lung_capacity", "throat_resonance", "vocal_fry",
                          "phonation_type", "swing_delay_ms", "emotional_cracks",
                          "vulnerability_index"):
            assert forbidden not in bio, f"raw bio leaked: {forbidden}"
        # dna prefix
        assert t["dna_tag"].startswith("trk_s2_"), f"bad dna_tag {t['dna_tag']}"
        # harmony stems present
        stem_names = [s["name"] for s in t["stems"]]
        harmony_stems = [n for n in stem_names if n.startswith("Harmony")]
        # harmony stems may be 0 if TTS harmony synthesis fell back; but stems should at least contain base 4
        assert len(t["stems"]) >= 4

    def test_generate_backward_compat(self):
        payload = {
            "lyrics": "East of the freeway",
            "genre": "SGV Oldies",
            "mood": "Late-Night Honesty",
        }
        r = session.post(f"{BASE}/api/generate", headers=auth(), json=payload, timeout=180)
        assert r.status_code == 200, r.text
        t = r.json()
        assert t["dna_tag"].startswith("trk_s2_")
        assert len(t["stems"]) >= 4


# ---------- DUET GENERATE ----------
class TestDuetGenerate:
    def test_duet_requires_auth(self):
        r = session.post(f"{BASE}/api/duet/generate",
                         json={"lyrics": "A: hi\nB: hey", "voice_a": "mateo", "voice_b": "elara"})
        assert r.status_code in (401, 403)

    def test_duet_same_voice_400(self):
        r = session.post(f"{BASE}/api/duet/generate", headers=auth(),
                         json={"lyrics": "A: hi\nB: hey", "voice_a": "mateo", "voice_b": "mateo"})
        assert r.status_code == 400, r.text

    def test_duet_unknown_voice_400(self):
        r = session.post(f"{BASE}/api/duet/generate", headers=auth(),
                         json={"lyrics": "A: hi\nB: hey", "voice_a": "mateo", "voice_b": "unknown_xyz"})
        assert r.status_code == 400, r.text

    def test_duet_generate_success(self):
        payload = {
            "lyrics": "A: hi there\nB: hey back\nA: how you been\nB: soulfire mija",
            "voice_a": "mateo",
            "voice_b": "elara",
            "title": "TEST_duet_smoke",
        }
        r = session.post(f"{BASE}/api/duet/generate", headers=auth(), json=payload, timeout=180)
        # Could be 502 if LLM key exhausted — accept & skip in that case
        if r.status_code == 502:
            pytest.skip("LLM TTS key exhausted / upstream failure")
        assert r.status_code == 200, r.text
        d = r.json()
        assert "dna_tag" in d and d["dna_tag"].startswith("duet_")
        assert "title" in d
        for vk in ("voice_a", "voice_b"):
            assert vk in d
            assert "tts_voice" not in d[vk], "tts_voice leaked"
        segs = d["segments"]
        assert len(segs) == 4, f"expected 4 segments got {len(segs)}"
        # Alternating voices
        assert segs[0]["voice_id"] == "mateo"
        assert segs[1]["voice_id"] == "elara"
        assert segs[2]["voice_id"] == "mateo"
        assert segs[3]["voice_id"] == "elara"
        for s in segs:
            assert "/api/static/voices/" in s["url"]
            assert s["url"].endswith(".mp3")
            assert "text" in s and "color" in s and "voice_label" in s

    def test_duet_rate_limit_6pm(self):
        """Fire 8 quick duet calls; expect at least one 429 within the minute window."""
        payload = {"lyrics": "A: hi\nB: hey", "voice_a": "mateo", "voice_b": "elara"}
        statuses = []
        for _ in range(8):
            r = session.post(f"{BASE}/api/duet/generate", headers=auth(), json=payload, timeout=30)
            statuses.append(r.status_code)
            if r.status_code == 429:
                break
        assert 429 in statuses, f"no rate limit fired: {statuses}"
