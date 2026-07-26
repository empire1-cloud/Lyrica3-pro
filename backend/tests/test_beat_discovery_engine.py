from datetime import datetime, timezone

import pytest

from backend.beat_discovery_engine import BeatDiscoveryEngine, DiscoveryQuery


NOW = datetime(2026, 7, 26, tzinfo=timezone.utc)


def track(tag, title, creator, genre, *, mood="", bpm=None, streams=0, flips=0, proof=False):
    item = {
        "id": tag,
        "dna_tag": tag,
        "title": title,
        "creator": creator,
        "cultural_matrix": genre,
        "genre": genre,
        "mood": mood,
        "bpm": bpm,
        "streams": streams,
        "flips": flips,
        "audio_url": f"/audio/{tag}.mp3",
        "created_at": "2026-07-20T00:00:00+00:00",
        "lml": "must never leak",
        "cultural_subtext": "ranking-only private context",
    }
    if proof:
        item["canonical_track_id"] = f"canonical_{tag}"
        item["soulprint_hash"] = "sp_sha256_demo"
        item["vics_proof"] = {"proof_id": "vics_demo", "signature": "signed", "revoked": False}
    return item


@pytest.fixture
def corpus():
    return [
        track("trk_sgv", "Midnight on Valley", "manda", "SGV Chicano Oldies", mood="Lowrider Calm", bpm=72, streams=900, flips=35, proof=True),
        track("trk_trap", "Neon 808", "popular", "Trap Soul", mood="Soft Menace", bpm=142, streams=900000, flips=2),
        track("trk_oldies_2", "Sunday Dedication", "requinto", "Art Laboe Oldies", mood="Late-Night Honesty", bpm=68, streams=1200, flips=24),
        track("trk_oldies_3", "Boulevard Prayer", "requinto", "Art Laboe Oldies", mood="Late-Night Honesty", bpm=70, streams=1100, flips=21),
        track("trk_oldies_4", "Porch Light", "soulflower", "Chicano Soul", mood="Porch-Light Grief", bpm=74, streams=300, flips=8),
    ]


def test_relevance_beats_raw_popularity(corpus):
    result = BeatDiscoveryEngine(corpus, now=NOW).discover(
        DiscoveryQuery(text="SGV lowrider oldies", genre="Chicano Oldies", min_bpm=65, max_bpm=80)
    )
    assert result["results"][0]["dna_tag"] == "trk_sgv"


def test_tempo_filter_affects_ranking(corpus):
    result = BeatDiscoveryEngine(corpus, now=NOW).discover(
        DiscoveryQuery(text="night", min_bpm=135, max_bpm=150)
    )
    assert result["results"][0]["dna_tag"] == "trk_trap"


def test_high_diversity_avoids_creator_monopoly(corpus):
    result = BeatDiscoveryEngine(corpus, now=NOW).discover(
        DiscoveryQuery(text="oldies late night", limit=3, diversity=1.0)
    )
    creators = [item["creator"] for item in result["results"]]
    assert len(set(creators)) >= 2


def test_provenance_is_exposed_without_secret_fields(corpus):
    result = BeatDiscoveryEngine(corpus, now=NOW).discover(DiscoveryQuery(text="sgv", limit=1))
    item = result["results"][0]
    assert item["ownership"]["vics_verified"] is True
    assert "lml" not in item
    assert "cultural_subtext" not in item


def test_results_are_deterministic(corpus):
    engine = BeatDiscoveryEngine(corpus, now=NOW)
    query = DiscoveryQuery(text="late night soul", limit=4, seed="session-113")
    first = [item["dna_tag"] for item in engine.discover(query)["results"]]
    second = [item["dna_tag"] for item in engine.discover(query)["results"]]
    assert first == second


def test_similar_excludes_seed(corpus):
    result = BeatDiscoveryEngine(corpus, now=NOW).similar("trk_oldies_2", limit=3)
    assert all(item["dna_tag"] != "trk_oldies_2" for item in result["results"])
    assert result["seed_track"]["dna_tag"] == "trk_oldies_2"


def test_unknown_seed_fails_closed(corpus):
    with pytest.raises(KeyError):
        BeatDiscoveryEngine(corpus, now=NOW).similar("trk_missing")


def test_limit_is_capped(corpus):
    result = BeatDiscoveryEngine(corpus, now=NOW).discover(DiscoveryQuery(limit=500))
    assert result["count"] == len(corpus)
    assert result["engine"] == "beat-discovery.v1"
