from __future__ import annotations

from copy import deepcopy

import pytest
from pydantic import ValidationError

from api.music_engines.models import MusicEngineRequest, MusicTask, QualityMode
from api.music_engines.routing import build_execution_plan
from api.music_engines.service import create_engine_job


class FakeCollection:
    def __init__(self):
        self.documents: list[dict] = []

    @staticmethod
    def _matches(document: dict, query: dict) -> bool:
        return all(document.get(key) == value for key, value in query.items())

    async def insert_one(self, document):
        self.documents.append(deepcopy(document))

    async def find_one(self, query, projection=None):
        for document in self.documents:
            if self._matches(document, query):
                result = deepcopy(document)
                result.pop("_id", None)
                return result
        return None

    async def update_one(self, query, update):
        for document in self.documents:
            if self._matches(document, query):
                document.update(deepcopy(update.get("$set", {})))
                if "$push" in update:
                    for key, value in update["$push"].items():
                        document.setdefault(key, []).append(deepcopy(value))
                return None


class FakeDB:
    def __init__(self):
        self.music_engine_jobs = FakeCollection()


def _full_song(**overrides):
    payload = {
        "title": "Sleep On The Floor",
        "task": MusicTask.FULL_SONG,
        "prompt": "SGV Chicano Soul, 90s R&B velvet, current-generation intimacy",
        "lyrics": "[Verse]\nAnother night, the window sings.",
        "artist_id": "LZR-00000001",
        "artist_name": "LUZARIA",
        "quality_mode": QualityMode.COUNCIL,
        "candidate_count": 3,
        "duration_seconds": 180,
    }
    payload.update(overrides)
    return MusicEngineRequest(**payload)


def test_council_routes_three_independent_full_song_candidates():
    plan = build_execution_plan(_full_song())
    candidate_stage = plan.stages[0]

    assert plan.primary_provider == "ace_step_1_5"
    assert candidate_stage.stage_id == "candidate_generation"
    assert candidate_stage.providers == ["ace_step_1_5", "yue", "heartmula"]
    assert set(candidate_stage.payloads) == set(candidate_stage.providers)
    assert candidate_stage.payloads["ace_step_1_5"]["artist_id"] == "LZR-00000001"
    assert plan.proof_handoff[-1] == "Archisynapse receipt"


def test_long_form_exact_lyrics_prefers_yue_and_excludes_duration_limited_heartmula():
    request = _full_song(
        task=MusicTask.LONG_FORM,
        duration_seconds=360,
        needs_exact_lyrics=True,
    )
    plan = build_execution_plan(request)

    assert plan.primary_provider == "yue"
    assert plan.excluded_providers["heartmula"] == "duration exceeds 240 seconds"
    assert plan.stages[0].payloads["yue"]["run_n_segments"] == 12


def test_precision_singing_routes_diffsinger_then_vevo2():
    request = MusicEngineRequest(
        title="Luzaria Precision Vocal",
        task=MusicTask.SINGING_VOICE,
        prompt="Warm smoky alto with velvet restraint",
        lyrics="I refuse to lose.",
        midi_url="s3://lyrica-scores/luzaria.mid",
        needs_exact_lyrics=True,
        needs_melody_control=True,
        voice_identity_ref="lyrica://artist/LZR-00000001/voice/LZR-VOICE-V1",
        consent_assertion_id="vics_consent_luzaria_001",
    )
    plan = build_execution_plan(request)
    precision = plan.stages[0]

    assert plan.primary_provider == "openvpi_diffsinger"
    assert precision.stage_id == "voice_precision"
    assert precision.providers == ["openvpi_diffsinger", "amphion_vevo2"]
    assert precision.payloads["openvpi_diffsinger"]["phoneme_control"] is True
    assert precision.payloads["amphion_vevo2"]["preserve_locked_identity"] is True


def test_voice_reference_fails_closed_without_consent_assertion():
    with pytest.raises(ValidationError) as exc:
        _full_song(
            voice_identity_ref="lyrica://artist/LZR-00000001/voice/LZR-VOICE-V1",
            reference_audio_url="s3://lyrica-voices/luzaria-reference.wav",
        )
    assert "require a consent assertion" in str(exc.value)


def test_fast_mode_uses_one_provider():
    plan = build_execution_plan(_full_song(quality_mode=QualityMode.FAST, candidate_count=8))
    assert plan.stages[0].providers == ["ace_step_1_5"]


@pytest.mark.asyncio
async def test_unconfigured_workers_create_truthful_blocked_job(monkeypatch):
    for key in (
        "LYRICA_ACE_STEP_URL",
        "LYRICA_YUE_URL",
        "LYRICA_HEARTMULA_URL",
        "LYRICA_DIFFSINGER_URL",
        "LYRICA_VEVO2_URL",
    ):
        monkeypatch.delenv(key, raising=False)

    db = FakeDB()
    job = await create_engine_job(db, _full_song())

    assert job.status == "blocked_configuration"
    assert len(job.dispatches) == 3
    assert {item["status"] for item in job.dispatches} == {"blocked_configuration"}
    assert len(db.music_engine_jobs.documents) == 1
