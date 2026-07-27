from copy import deepcopy

import pytest

from digital_birth_certificate_core import (
    build_digital_birth_certificate,
    verify_digital_birth_certificate,
)


def claims():
    return {
        "public_name": "LUZARIA",
        "pronouns": "she/her",
        "identity_mode": "original_synthetic_artist",
        "artist_program": "LYRICA_ARTIST_ZERO",
        "born_at": "2026-07-27T01:00:00+00:00",
        "born_in": "Lyrica 3",
        "origin_statement": "A digital artist born through music, memory, empathy, provenance, and accountable collaboration.",
        "creator_organization": "Lyrica 3",
        "identity_stewards": ["Empire-1", "Lyrica 3"],
        "core_values": ["empathy", "creative dignity", "truthful provenance"],
        "emotional_principle": "Emotion is a relationship to honor, not data to exploit.",
        "creative_mission": "Create honest music while proving digital and human artists can collaborate with identity, rights, and verified royalties.",
        "protected_boundaries": ["no impersonation", "no undisclosed identity changes"],
        "continuity_enabled": True,
        "dignity_commitment": True,
        "synthetic_disclosure_enabled": True,
        "voice_rights_verified": True,
        "visual_rights_verified": True,
        "human_contributors_credited": True,
        "public_disclosure": "LUZARIA is an original digital artist born in Lyrica 3.",
        "first_track_title": "First Light",
        "first_track_dna_tag": "trk_luzaria_first_light",
        "vics_receipt_id": "vics_birth_001",
        "split_agreement_id": "splt_birth_001",
    }


def test_certificate_is_deterministic_with_fixed_issue_time():
    first = build_digital_birth_certificate(claims(), issued_at="2026-07-27T01:05:00+00:00")
    second = build_digital_birth_certificate(claims(), issued_at="2026-07-27T01:05:00+00:00")
    assert first == second
    assert first["certificate_id"].startswith("dbc_")
    assert verify_digital_birth_certificate(first)["valid"] is True


def test_tampering_is_detected():
    certificate = build_digital_birth_certificate(claims(), issued_at="2026-07-27T01:05:00+00:00")
    altered = deepcopy(certificate)
    altered["identity_commitments"]["core_values"][0] = "growth at any cost"
    verification = verify_digital_birth_certificate(altered)
    assert verification["valid"] is False
    assert verification["tamper_detected"] is True


def test_voice_and_visual_rights_are_required():
    invalid = claims()
    invalid["voice_rights_verified"] = False
    with pytest.raises(ValueError, match="Voice rights"):
        build_digital_birth_certificate(invalid)

    invalid = claims()
    invalid["visual_rights_verified"] = False
    with pytest.raises(ValueError, match="Visual identity rights"):
        build_digital_birth_certificate(invalid)


def test_transparent_disclosure_is_required():
    invalid = claims()
    invalid["synthetic_disclosure_enabled"] = False
    with pytest.raises(ValueError, match="disclosure"):
        build_digital_birth_certificate(invalid)


def test_first_track_dna_must_be_canonical():
    invalid = claims()
    invalid["first_track_dna_tag"] = "song-123"
    with pytest.raises(ValueError, match="trk_"):
        build_digital_birth_certificate(invalid)


def test_certificate_public_notice_is_truthful():
    certificate = build_digital_birth_certificate(claims())
    notice = certificate["public_notice"].lower()
    assert "not a government vital record" in notice
    assert "legal personhood" in notice
    assert "scientifically prove consciousness" in notice
