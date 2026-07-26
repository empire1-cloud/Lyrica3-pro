from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from starlette.requests import Request

from api.vics_bridge import (
    VicsProofRequest,
    _require_archisynapse,
    issue_track_proof,
    verify_track_proof,
)


class FakeTracks:
    def __init__(self, document):
        self.document = deepcopy(document)
        self.update_calls = 0

    async def find_one(self, query, projection=None):
        clauses = query.get("$or", [query])
        for clause in clauses:
            if all(self.document.get(key) == value for key, value in clause.items()):
                result = deepcopy(self.document)
                result.pop("_id", None)
                return result
        return None

    async def update_one(self, query, update):
        if self.document.get("id") != query.get("id"):
            return None
        self.document.update(deepcopy(update.get("$set", {})))
        self.update_calls += 1
        return None


class FakeDB:
    def __init__(self, document):
        self.tracks = FakeTracks(document)


@pytest.fixture(autouse=True)
def configured_keys(monkeypatch):
    monkeypatch.setenv("LYRICA_VICS_PROOF_SIGNING_KEY", "vics-proof-signing-key-at-least-32-bytes")
    monkeypatch.setenv("LYRICA_VICS_SERVICE_TOKEN", "service-token-for-tests")


@pytest.fixture
def track_document():
    return {
        "id": "trk_test_001",
        "dna_tag": "dna_v2_test_001",
        "creator": "manda.mora",
        "title": "Proof Track",
    }


@pytest.mark.asyncio
async def test_issue_binds_proof_to_real_audio_bytes(tmp_path, track_document):
    music_output = tmp_path / "music_output"
    track_dir = music_output / track_document["id"]
    track_dir.mkdir(parents=True)
    (track_dir / "master.mp3").write_bytes(b"real-audio-bytes")
    db = FakeDB(track_document)

    proof = await issue_track_proof(
        db=db,
        track_id=track_document["id"],
        root_dir=tmp_path,
        music_output_dir=music_output,
    )

    assert proof["track_id"] == track_document["id"]
    assert proof["dna_tag"] == track_document["dna_tag"]
    assert proof["soulprint_hash"].startswith("sp_sha256_")
    assert proof["proof_id"].startswith("vics_")
    assert proof["creator_id"].startswith("cre_")
    assert proof["signature"].startswith("vics_hmac_sha256_")
    assert db.tracks.document["vics_proof"] == proof
    assert db.tracks.update_calls == 1


@pytest.mark.asyncio
async def test_issue_is_stable_and_does_not_reissue_valid_proof(tmp_path, track_document):
    music_output = tmp_path / "music_output"
    track_dir = music_output / track_document["id"]
    track_dir.mkdir(parents=True)
    (track_dir / "master.wav").write_bytes(b"stable-audio")
    db = FakeDB(track_document)

    first = await issue_track_proof(
        db=db,
        track_id=track_document["id"],
        root_dir=tmp_path,
        music_output_dir=music_output,
    )
    second = await issue_track_proof(
        db=db,
        track_id=track_document["id"],
        root_dir=tmp_path,
        music_output_dir=music_output,
    )

    assert second == first
    assert db.tracks.update_calls == 1


@pytest.mark.asyncio
async def test_issue_fails_closed_when_audio_is_missing(tmp_path, track_document):
    db = FakeDB(track_document)
    with pytest.raises(HTTPException) as exc:
        await issue_track_proof(
            db=db,
            track_id=track_document["id"],
            root_dir=tmp_path,
            music_output_dir=tmp_path / "music_output",
        )
    assert exc.value.status_code == 422


async def _issued_db(tmp_path, track_document):
    music_output = tmp_path / "music_output"
    track_dir = music_output / track_document["id"]
    track_dir.mkdir(parents=True)
    (track_dir / "master.mp3").write_bytes(b"verification-audio")
    db = FakeDB(track_document)
    proof = await issue_track_proof(
        db=db,
        track_id=track_document["id"],
        root_dir=tmp_path,
        music_output_dir=music_output,
    )
    request = VicsProofRequest(
        track_id=proof["track_id"],
        dna_tag=proof["dna_tag"],
        soulprint_hash=proof["soulprint_hash"],
        vics_proof_id=proof["proof_id"],
        creator_id=proof["creator_id"],
    )
    return db, proof, request


@pytest.mark.asyncio
async def test_verify_returns_exact_archisynapse_contract(tmp_path, track_document):
    db, proof, request = await _issued_db(tmp_path, track_document)
    result = await verify_track_proof(db=db, request=request)

    assert result == {
        "verified": True,
        "revoked": False,
        "track_id": proof["track_id"],
        "dna_tag": proof["dna_tag"],
        "soulprint_hash": proof["soulprint_hash"],
        "vics_proof_id": proof["proof_id"],
        "creator_id": proof["creator_id"],
        "issued_at": proof["issued_at"],
        "expires_at": None,
    }


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("field", "wrong_value"),
    [
        ("track_id", "trk_wrong"),
        ("dna_tag", "dna_wrong"),
        ("soulprint_hash", "sp_sha256_wrong"),
        ("vics_proof_id", "vics_wrong"),
        ("creator_id", "cre_wrong"),
    ],
)
async def test_verify_rejects_every_binding_mismatch(tmp_path, track_document, field, wrong_value):
    db, _, request = await _issued_db(tmp_path, track_document)
    payload = request.model_dump()
    payload[field] = wrong_value

    with pytest.raises(HTTPException) as exc:
        await verify_track_proof(db=db, request=VicsProofRequest(**payload))
    assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_verify_rejects_tampered_signature(tmp_path, track_document):
    db, _, request = await _issued_db(tmp_path, track_document)
    db.tracks.document["vics_proof"]["signature"] = "vics_hmac_sha256_tampered"

    with pytest.raises(HTTPException) as exc:
        await verify_track_proof(db=db, request=request)
    assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_verify_rejects_revoked_proof(tmp_path, track_document):
    db, _, request = await _issued_db(tmp_path, track_document)
    db.tracks.document["vics_proof"]["revoked"] = True

    with pytest.raises(HTTPException) as exc:
        await verify_track_proof(db=db, request=request)
    assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_verify_rejects_expired_proof(tmp_path, track_document):
    db, _, request = await _issued_db(tmp_path, track_document)
    db.tracks.document["vics_proof"]["expires_at"] = (
        datetime.now(timezone.utc) - timedelta(minutes=1)
    ).isoformat()

    with pytest.raises(HTTPException) as exc:
        await verify_track_proof(db=db, request=request)
    assert exc.value.status_code == 422


def _request(headers):
    raw_headers = [(key.lower().encode(), value.encode()) for key, value in headers.items()]
    return Request({"type": "http", "method": "POST", "path": "/", "headers": raw_headers})


def test_service_auth_accepts_only_archisynapse_with_matching_token():
    request = _request(
        {
            "X-Empire1-Service": "archisynapse-v2",
            "Authorization": "Bearer service-token-for-tests",
        }
    )
    _require_archisynapse(request)


@pytest.mark.parametrize(
    "headers",
    [
        {},
        {"X-Empire1-Service": "wrong", "Authorization": "Bearer service-token-for-tests"},
        {"X-Empire1-Service": "archisynapse-v2", "Authorization": "Bearer wrong"},
    ],
)
def test_service_auth_rejects_missing_or_wrong_credentials(headers):
    with pytest.raises(HTTPException) as exc:
        _require_archisynapse(_request(headers))
    assert exc.value.status_code in (401, 403)
