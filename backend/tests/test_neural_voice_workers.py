from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from api import neural_voice_workers as module


def _asset(
    root: Path, payload: bytes, suffix: str = ".wav", kind: str = "reference_voice"
) -> tuple[str, str, Path]:
    digest = hashlib.sha256(payload).hexdigest()
    asset_id = f"nva_{digest[:24]}"
    target = root / "neural-assets" / f"{asset_id}{suffix}"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(payload)
    (target.parent / f"{asset_id}.json").write_text(
        json.dumps({"asset_id": asset_id, "kind": kind, "sha256": digest}),
        encoding="utf-8",
    )
    return asset_id, digest, target


def _request(reference_id: str, reference_hash: str, source_id: str | None = None, **overrides):
    payload = {
        "project_id": "project-1",
        "creator_id": "creator-1",
        "title": "Real worker test",
        "provider_id": "openvoice_v2_tts",
        "reference_asset_id": reference_id,
        "text": "This is Lyrica.",
        "consent": {
            "subject_id": "creator-1",
            "consent_id": "consent-1",
            "authorized": True,
            "scopes": ["voice_clone"],
            "permission_reference": "creator upload agreement",
            "reference_audio_sha256": reference_hash,
        },
    }
    if source_id:
        payload["source_asset_id"] = source_id
    payload.update(overrides)
    return module.NeuralVoiceRenderRequest.model_validate(payload)


@pytest.fixture(autouse=True)
def environment(monkeypatch, tmp_path):
    monkeypatch.setenv("VOCAL_FORGE_ARTIFACT_DIR", str(tmp_path))
    monkeypatch.setenv("VOCAL_FORGE_INTERNAL_TOKEN", "i" * 32)
    monkeypatch.setenv("LYRICA_AUDIO_WORKER_URL", "http://127.0.0.1:8787")
    monkeypatch.setenv("LYRICA_AUDIO_WORKER_TOKEN", "w" * 32)
    monkeypatch.setenv("VOCAL_FORGE_RECEIPT_SIGNING_KEY", "s" * 40)


def test_openvoice_preflight_accepts_matching_authorized_reference(tmp_path):
    reference_id, reference_hash, _ = _asset(tmp_path, b"reference voice")
    result = module.preflight_neural_voice(_request(reference_id, reference_hash))
    assert result["eligible"] is True
    assert result["provider_id"] == "openvoice_v2_tts"
    assert result["truth_boundary"]["openvoice_v2_is_tts_not_singing"] is True


def test_reference_hash_mismatch_blocks_clone(tmp_path):
    reference_id, _, _ = _asset(tmp_path, b"reference voice")
    request = _request(reference_id, "0" * 64)
    result = module.preflight_neural_voice(request)
    assert result["eligible"] is False
    assert "reference_audio_hash_mismatch" in result["blocks"]


def test_seed_vc_release_rejects_synthetic_tone_source(tmp_path):
    reference_id, reference_hash, _ = _asset(tmp_path, b"reference voice")
    source_id = "aev_" + "1" * 24
    (tmp_path / f"{source_id}.wav").write_bytes(b"synthetic guide")
    request = _request(
        reference_id,
        reference_hash,
        source_id,
        provider_id="seed_vc_singing",
        text=None,
        release_intent="release",
    )
    result = module.preflight_neural_voice(request)
    assert "release_requires_real_dry_singing_source" in result["blocks"]
    assert "synthetic_guide_source_may_not_contain_intelligible_lyrics" in result["review_items"]


@pytest.mark.parametrize(
    "url",
    [
        "http://audio-worker.example.test",
        "http://127.0.0.1.evil.example",
        "ftp://127.0.0.1:8787",
    ],
)
def test_worker_url_must_be_loopback_or_https(monkeypatch, tmp_path, url):
    reference_id, reference_hash, _ = _asset(tmp_path, b"reference voice")
    monkeypatch.setenv("LYRICA_AUDIO_WORKER_URL", url)
    result = module.preflight_neural_voice(_request(reference_id, reference_hash))
    assert "audio_worker_url_must_be_loopback_or_https" in result["blocks"]


def test_reference_asset_kind_is_enforced(tmp_path):
    reference_id, reference_hash, _ = _asset(
        tmp_path, b"wrongly tagged reference", kind="source_singing"
    )
    result = module.preflight_neural_voice(_request(reference_id, reference_hash))
    assert "reference_asset_must_be_uploaded_as_reference_voice" in result["blocks"]


def test_render_binds_worker_output_to_receipt(monkeypatch, tmp_path):
    reference_id, reference_hash, _ = _asset(tmp_path, b"reference voice")
    request = _request(reference_id, reference_hash)

    def fake_worker(endpoint, payload):
        assert endpoint == "/v1/openvoice-v2/tts"
        output = Path(payload["output_path"])
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_bytes(b"neural speech wav")
        digest = hashlib.sha256(output.read_bytes()).hexdigest()
        return module.WorkerResponse(
            status="rendered",
            output_path=str(output),
            audio_sha256=digest,
            provider_id="openvoice_v2_tts",
            model={"name": "OpenVoice V2"},
        )

    monkeypatch.setattr(module, "_worker_post", fake_worker)
    result = module.render_neural_voice(request)
    assert result["status"] == "rendered"
    assert result["receipt"]["provider_model"]["name"] == "OpenVoice V2"
    assert result["receipt"]["signature"]["status"] == "signed"
    assert (tmp_path / "neural-results" / f"{result['artifact_id']}.wav").is_file()
