from __future__ import annotations

from copy import deepcopy

import pytest

from api.luzaria import first_release_snapshot, load_first_release, release_digest


class FakeCatalog:
    def __init__(self, documents=None):
        self.documents = [deepcopy(document) for document in (documents or [])]

    async def find_one(self, query, projection=None):
        for document in self.documents:
            if all(document.get(key) == value for key, value in query.items()):
                result = deepcopy(document)
                result.pop("_id", None)
                return result
        return None


class FakeDB:
    def __init__(self, documents=None):
        self.artist_catalog = FakeCatalog(documents)


def test_release_candidate_is_bound_to_luzaria_and_corrected_woman_narrator():
    release = load_first_release()

    assert release["release_id"] == "LZR-RC-0001"
    assert release["artist_id"] == "LZR-00000001"
    assert release["artist_name"] == "LUZARIA"
    assert release["title"] == "Sleep On The Floor"
    assert release["epd_vocal_blueprint"]["luzaria_voice_alignment"]["identity_drift"] is False
    assert any(
        row["line"] == "And in their eyes, I see the woman I'm supposed to be."
        for row in release["lyrics_payload"]
    )
    assert release_digest(release).startswith("lzr_release_sha256_")


@pytest.mark.asyncio
async def test_unrendered_release_stays_honestly_pending():
    snapshot = await first_release_snapshot(FakeDB())

    assert snapshot["release_status"] == "candidate"
    assert snapshot["release_ready"] is False
    assert snapshot["release_gates"]["identity_alignment"] == "complete"
    assert snapshot["release_gates"]["final_audio_master"] == "pending"
    assert snapshot["release_gates"]["vics_proof"] == "pending"
    assert snapshot["release_gates"]["archisynapse_receipt"] == "pending"


@pytest.mark.asyncio
async def test_registered_track_closes_only_the_proof_it_really_has():
    snapshot = await first_release_snapshot(
        FakeDB(
            [
                {
                    "artist_id": "LZR-00000001",
                    "track_id": "trk_luzaria_001",
                    "title": "Sleep On The Floor",
                    "dna_tag": "dna_luzaria_001",
                    "soulprint_hash": "sp_sha256_luzaria_001",
                    "vics_proof_id": "vics_luzaria_001",
                    "audio_url": "/api/static/music/luzaria/sleep-on-the-floor.mp3",
                    "proof_complete": True,
                    "royalty_closed": False,
                    "archisynapse_receipt_id": None,
                }
            ]
        )
    )

    assert snapshot["release_status"] == "registered"
    assert snapshot["release_ready"] is False
    assert snapshot["release_gates"]["final_audio_master"] == "complete"
    assert snapshot["release_gates"]["vics_proof"] == "complete"
    assert snapshot["release_gates"]["catalog_registration"] == "complete"
    assert snapshot["release_gates"]["archisynapse_receipt"] == "pending"


@pytest.mark.asyncio
async def test_receipted_release_closes_every_gate():
    snapshot = await first_release_snapshot(
        FakeDB(
            [
                {
                    "artist_id": "LZR-00000001",
                    "track_id": "trk_luzaria_001",
                    "title": "Sleep On The Floor",
                    "dna_tag": "dna_luzaria_001",
                    "soulprint_hash": "sp_sha256_luzaria_001",
                    "vics_proof_id": "vics_luzaria_001",
                    "audio_url": "/api/static/music/luzaria/sleep-on-the-floor.mp3",
                    "proof_complete": True,
                    "royalty_closed": True,
                    "archisynapse_receipt_id": "rcp_luzaria_001",
                }
            ]
        )
    )

    assert snapshot["release_status"] == "royalty_closed"
    assert snapshot["release_ready"] is True
    assert all(value == "complete" for value in snapshot["release_gates"].values())
