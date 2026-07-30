import wave

import pytest
from fastapi import HTTPException

from api.aether_voice import (
    AetherNote,
    AetherVoiceRequest,
    VoiceIdentityProof,
    _require_internal_token,
    engine_status,
    preflight_aether_voice,
    render_aether_voice,
)
from api.cultura_pronunciation import CulturaPronunciationPlan, PronunciationToken


def singing_request(**overrides):
    payload = {
        "project_id": "proj-1",
        "creator_id": "creator-1",
        "title": "Creator Song",
        "mode": "singing",
        "voice_profile_id": "aether_warm_alto",
        "performance_style": "intimate_confession",
        "notes": [
            AetherNote(midi_note=60, start_beat=0, duration_beats=1, syllable="stay"),
            AetherNote(midi_note=64, start_beat=1, duration_beats=1, syllable="close"),
        ],
    }
    payload.update(overrides)
    return AetherVoiceRequest(**payload)


def test_engine_is_multi_artist_and_luzaria_is_not_default():
    status = engine_status()
    assert status["truth_boundary"]["lyrica_is_multi_artist"] is True
    luzaria = next(item for item in status["voice_profiles"] if item["id"] == "luzaria_velvet_grit")
    assert luzaria["is_platform_default"] is False
    assert any(item["id"] == "aether_warm_alto" for item in status["voice_profiles"])


def test_singing_requires_notes():
    with pytest.raises(ValueError):
        AetherVoiceRequest(project_id="p", creator_id="c", title="x", mode="singing")


def test_speech_requires_text():
    with pytest.raises(ValueError):
        AetherVoiceRequest(project_id="p", creator_id="c", title="x", mode="speech")


def test_registered_artist_profile_requires_identity_proof():
    result = preflight_aether_voice(singing_request(voice_profile_id="luzaria_velvet_grit"))
    assert not result["eligible"]
    assert "registered_artist_voice_identity_proof_required" in result["blocks"]


def test_registered_artist_profile_accepts_authorized_identity():
    request = singing_request(
        voice_profile_id="luzaria_velvet_grit",
        voice_identity=VoiceIdentityProof(
            profile_id="luzaria_velvet_grit",
            owner_id="LZR-00000001",
            authorized=True,
            consent_id="consent-lzr-1",
            permission_reference="canon:luzaria",
        ),
    )
    result = preflight_aether_voice(request)
    assert result["eligible"] is True
    assert "luzaria_is_one_registered_profile_not_the_platform_default" in result["review_items"]


def test_release_requires_cultura_and_signing(monkeypatch):
    monkeypatch.delenv("VOCAL_FORGE_RECEIPT_SIGNING_KEY", raising=False)
    result = preflight_aether_voice(singing_request(release_intent="release"))
    assert "release_pronunciation_plan_required" in result["blocks"]
    assert "release_receipt_signing_key_missing_or_short" in result["blocks"]


def test_singing_render_writes_real_wav(tmp_path, monkeypatch):
    monkeypatch.setenv("VOCAL_FORGE_ARTIFACT_DIR", str(tmp_path))
    result = render_aether_voice(singing_request())
    path = tmp_path / f'{result["artifact_id"]}.wav'
    assert path.exists()
    with wave.open(str(path), "rb") as rendered:
        assert rendered.getnchannels() == 1
        assert rendered.getframerate() == 24000
        assert rendered.getnframes() > 1000
    assert result["receipt"]["mode"] == "singing"
    assert result["receipt"]["voice_profile_id"] == "aether_warm_alto"
    assert result["receipt"]["public_result"] == "Expressive vocal created."


def test_tts_and_singing_share_same_engine(tmp_path, monkeypatch):
    monkeypatch.setenv("VOCAL_FORGE_ARTIFACT_DIR", str(tmp_path))
    request = AetherVoiceRequest(
        project_id="p",
        creator_id="c",
        title="Spoken intro",
        mode="speech",
        text="Welcome to the session.",
        voice_profile_id="aether_clear_narrator",
        performance_style="neutral_studio",
    )
    result = render_aether_voice(request)
    assert result["receipt"]["mode"] == "speech"
    assert result["preflight"]["truth_boundary"]["multi_artist_engine"] is True


def test_release_render_can_sign_with_clear_plan(tmp_path, monkeypatch):
    monkeypatch.setenv("VOCAL_FORGE_ARTIFACT_DIR", str(tmp_path))
    monkeypatch.setenv("VOCAL_FORGE_RECEIPT_SIGNING_KEY", "k" * 40)
    plan = CulturaPronunciationPlan(
        lyric_line="stay close",
        tokens=[
            PronunciationToken(text="stay", language="english"),
            PronunciationToken(text="close", language="english"),
        ],
    )
    result = render_aether_voice(singing_request(release_intent="release", pronunciation_plan=plan))
    assert result["receipt"]["signature"]["status"] == "signed"


def test_internal_token_fails_closed(monkeypatch):
    monkeypatch.delenv("VOCAL_FORGE_INTERNAL_TOKEN", raising=False)
    with pytest.raises(HTTPException) as exc:
        _require_internal_token(None)
    assert exc.value.status_code == 503
