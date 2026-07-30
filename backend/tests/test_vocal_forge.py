import json
import wave
from pathlib import Path

from api.cultura_pronunciation import CulturaPronunciationPlan, PronunciationToken
from api.vocal_forge import (
    ProviderSelection,
    ScoreNote,
    VocalGuideRequest,
    VoiceConsent,
    preflight_vocal_guide,
    provider_preflight,
    render_vocal_guide,
)


def request_factory(**overrides):
    payload = {
        "project_id": "project-1",
        "creator_id": "creator-1",
        "title": "Guide One",
        "bpm": 120,
        "release_intent": "research",
        "notes": [
            ScoreNote(midi_note=60, start_beat=0, duration_beats=1, syllable="stay"),
            ScoreNote(midi_note=64, start_beat=1, duration_beats=1, syllable="close"),
        ],
    }
    payload.update(overrides)
    return VocalGuideRequest(**payload)


def test_score_overlap_is_blocked():
    request = request_factory(
        notes=[
            ScoreNote(midi_note=60, start_beat=0, duration_beats=2, syllable="one"),
            ScoreNote(midi_note=64, start_beat=1, duration_beats=1, syllable="two"),
        ]
    )
    result = preflight_vocal_guide(request)
    assert not result["eligible"]
    assert "note_1_overlaps_previous_note" in result["blocks"]


def test_reference_voice_requires_real_consent_hash():
    request = request_factory(
        voice_identity_mode="creator_authorized_reference",
        consent=VoiceConsent(
            subject_id="singer-1",
            consent_id="consent-1",
            authorized=True,
            scopes=["singing_voice_render"],
            permission_reference="contract:voice-1",
            reference_audio_sha256="not-a-hash",
        ),
    )
    result = preflight_vocal_guide(request)
    assert "valid_reference_audio_sha256_required" in result["blocks"]


def test_fish_release_requires_written_commercial_license():
    result = provider_preflight(
        ProviderSelection(
            provider_id="fish_speech",
            execution_mode="external_worker",
            data_retention_policy="no retention",
        ),
        "release",
    )
    assert not result["eligible"]
    assert "fish_commercial_license_required" in result["blocks"]


def test_release_requires_clear_cultura_gate_and_signing_key(monkeypatch):
    monkeypatch.delenv("VOCAL_FORGE_RECEIPT_SIGNING_KEY", raising=False)
    plan = CulturaPronunciationPlan(
        lyric_line="Mi corazón stays here",
        cultural_context="SGV Chicano first-person lyric",
        tokens=[PronunciationToken(text="Mi corazón stays here", language="spanglish")],
    )
    request = request_factory(release_intent="release", pronunciation_plan=plan)
    result = preflight_vocal_guide(request)
    assert not result["eligible"]
    assert "cultura_release_gate_not_clear" in result["blocks"]
    assert "release_receipt_signing_key_missing_or_short" in result["blocks"]


def test_research_render_writes_valid_wav_and_receipt(tmp_path, monkeypatch):
    monkeypatch.setenv("VOCAL_FORGE_ARTIFACT_DIR", str(tmp_path))
    monkeypatch.delenv("VOCAL_FORGE_RECEIPT_SIGNING_KEY", raising=False)
    result = render_vocal_guide(request_factory())

    wav_path = Path(result["audio_path"])
    receipt_path = Path(result["receipt_path"])
    assert wav_path.exists()
    assert receipt_path.exists()
    with wave.open(str(wav_path), "rb") as rendered:
        assert rendered.getnchannels() == 1
        assert rendered.getframerate() == 24000
        assert rendered.getnframes() > 0
    receipt = json.loads(receipt_path.read_text())
    assert receipt["audio_sha256"] == result["audio_sha256"]
    assert receipt["signature"]["status"] == "unsigned_research"
    assert receipt["truth_boundary"]["not_a_final_master"] is True


def test_same_score_produces_same_audio_hash(tmp_path, monkeypatch):
    monkeypatch.setenv("VOCAL_FORGE_ARTIFACT_DIR", str(tmp_path))
    first = render_vocal_guide(request_factory())
    second = render_vocal_guide(request_factory())
    assert first["audio_sha256"] == second["audio_sha256"]
    assert first["artifact_id"] == second["artifact_id"]


def test_release_receipt_is_signed_when_all_gates_clear(tmp_path, monkeypatch):
    monkeypatch.setenv("VOCAL_FORGE_ARTIFACT_DIR", str(tmp_path))
    monkeypatch.setenv("VOCAL_FORGE_RECEIPT_SIGNING_KEY", "x" * 40)
    plan = CulturaPronunciationPlan(
        lyric_line="Stay close",
        tokens=[
            PronunciationToken(text="Stay", language="english"),
            PronunciationToken(text="close", language="english"),
        ],
    )
    result = render_vocal_guide(request_factory(release_intent="release", pronunciation_plan=plan))
    assert result["receipt"]["signature"]["status"] == "signed"
    assert result["receipt"]["signature"]["algorithm"] == "hmac-sha256"
