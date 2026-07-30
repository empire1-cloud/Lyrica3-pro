from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from api.luzaria import (
    LuzariaIdentityCheck,
    LuzariaTrackRegistration,
    bootstrap_luzaria_identity,
    canonical_identity,
    digital_birth_certificate,
    evaluate_identity_drift,
    identity_digest,
    launch_readiness_from_counts,
    register_catalog_track,
)


class FakeCollection:
    def __init__(self):
        self.documents: list[dict] = []

    @staticmethod
    def _matches(document: dict, query: dict) -> bool:
        return all(document.get(key) == value for key, value in query.items())

    async def find_one(self, query, projection=None):
        for document in self.documents:
            if self._matches(document, query):
                result = deepcopy(document)
                result.pop("_id", None)
                return result
        return None

    async def insert_one(self, document):
        self.documents.append(deepcopy(document))
        return None

    async def update_one(self, query, update, upsert=False):
        for document in self.documents:
            if self._matches(document, query):
                document.update(deepcopy(update.get("$set", {})))
                return None
        if upsert:
            document = {**deepcopy(query), **deepcopy(update.get("$setOnInsert", {}))}
            document.update(deepcopy(update.get("$set", {})))
            self.documents.append(document)
        return None


class FakeDB:
    def __init__(self):
        self.artist_identities = FakeCollection()
        self.artist_catalog = FakeCollection()


def _now():
    return datetime(2026, 7, 28, 12, 0, 0, tzinfo=timezone.utc)


def _track(**overrides):
    payload = {
        "track_id": "trk_luzaria_001",
        "title": "First Light",
        "dna_tag": "dna_luzaria_001",
        "soulprint_hash": "sp_sha256_luzaria_001",
        "vics_proof_id": "vics_luzaria_001",
    }
    payload.update(overrides)
    return LuzariaTrackRegistration(**payload)


def test_canon_locks_one_identity_and_disables_multi_persona():
    canon = canonical_identity()

    assert canon["artist_id"] == "LZR-00000001"
    assert canon["name"] == "LUZARIA"
    assert canon["digital_birthdate"] == "2025-05-24"
    assert canon["identity_lock"]["single_identity"] is True
    assert canon["identity_lock"]["multi_persona_enabled"] is False
    assert canon["voice_identity"]["register"] == "Warm smoky alto"


def test_birth_certificate_has_stable_identity_digest():
    first = digital_birth_certificate()
    second = digital_birth_certificate()

    assert first == second
    assert first["identity_digest"] == identity_digest()
    assert first["identity_digest"].startswith("lzr_sha256_")
    assert first["rights"]["vics_proof_required_for_release"] is True


def test_identity_check_accepts_locked_identity():
    result = evaluate_identity_drift(
        LuzariaIdentityCheck(
            artist_id="LZR-00000001",
            name="LUZARIA",
            home="San Gabriel Valley, California",
            voice_register="Warm smoky alto",
            languages=["English", "Spanish"],
            multi_persona_enabled=False,
        )
    )

    assert result["accepted"] is True
    assert result["violations"] == []


def test_identity_check_rejects_multi_persona_and_voice_drift():
    result = evaluate_identity_drift(
        LuzariaIdentityCheck(
            name="Luzaria Blue",
            voice_register="Bright generic pop soprano",
            languages=["English"],
            multi_persona_enabled=True,
        )
    )

    assert result["accepted"] is False
    codes = {violation["code"] for violation in result["violations"]}
    assert "identity_drift" in codes
    assert "multi_persona_forbidden" in codes
    assert "language_identity_incomplete" in codes


@pytest.mark.asyncio
async def test_bootstrap_is_idempotent():
    db = FakeDB()

    first = await bootstrap_luzaria_identity(db, now_factory=_now)
    second = await bootstrap_luzaria_identity(db, now_factory=_now)

    assert first["artist_id"] == "LZR-00000001"
    assert second["identity_digest"] == first["identity_digest"]
    assert len(db.artist_identities.documents) == 1


@pytest.mark.asyncio
async def test_catalog_registration_is_idempotent_and_proof_bound():
    db = FakeDB()

    first = await register_catalog_track(db, _track(), now_factory=_now)
    second = await register_catalog_track(db, _track(), now_factory=_now)

    assert first == second
    assert first["proof_complete"] is True
    assert first["royalty_closed"] is False
    assert len(db.artist_catalog.documents) == 1

    with pytest.raises(HTTPException) as exc:
        await register_catalog_track(
            db,
            _track(vics_proof_id="vics_conflicting_proof"),
            now_factory=_now,
        )
    assert exc.value.status_code == 409


def test_launch_gate_requires_verified_and_receipted_catalog_track():
    not_ready = launch_readiness_from_counts(total_tracks=1, verified_tracks=1, receipted_tracks=0)
    ready = launch_readiness_from_counts(total_tracks=1, verified_tracks=1, receipted_tracks=1)

    assert not_ready["launch_ready"] is False
    assert not_ready["gates"]["first_archisynapse_receipt"] == "pending"
    assert ready["launch_ready"] is True
    assert ready["gates"]["first_vics_signed_track"] == "complete"
    assert ready["gates"]["first_archisynapse_receipt"] == "complete"
