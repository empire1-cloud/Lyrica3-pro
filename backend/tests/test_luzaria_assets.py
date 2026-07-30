from __future__ import annotations

import pytest

from api.luzaria_assets import (
    ASSET_PATHS,
    first_release_creative_snapshot,
    load_luzaria_asset,
    voice_system_snapshot,
)


def test_every_declared_asset_exists_and_binds_to_luzaria_when_applicable():
    for name, path in ASSET_PATHS.items():
        assert path.is_file(), name
        payload = load_luzaria_asset(name)
        if "artist_id" in payload:
            assert payload["artist_id"] == "LZR-00000001"


def test_voice_system_is_original_mathematical_velvet_grit():
    snapshot = voice_system_snapshot()

    assert snapshot["artist_id"] == "LZR-00000001"
    assert snapshot["voice_model_id"] == "LZR-VOICE-MATH-V0"
    assert snapshot["vocal_north_star"] == "Velvet Grit"
    assert snapshot["voice_model_digest"].startswith("lzr_voice_sha256_")
    assert snapshot["truth_boundary"]["original_mathematical_synthesis"] is True
    assert snapshot["truth_boundary"]["uses_human_voice_recordings"] is False
    assert snapshot["truth_boundary"]["uses_licensed_seed_voice"] is False
    assert snapshot["truth_boundary"]["celebrity_similarity_targeting"] is False
    assert snapshot["truth_boundary"]["release_master_approved"] is False


def test_voice_system_contains_90s_freestyle_and_modern_modes_without_persona_drift():
    snapshot = voice_system_snapshot()
    modes = snapshot["voice_model"]["performance_modes"]
    matrix = snapshot["genre_matrix"]["genre_matrix"]
    stack = snapshot["vocal_stack"]

    assert "velvet_90s_harmony" in modes
    assert "freestyle_electro_lift" in modes
    assert "modern_alt_rnb_pocket" in modes
    assert "playful_rap_sung_switch" in modes
    assert matrix["Chicano_Soul"]["role"] == "identity_anchor"
    assert matrix["Contemporary_Freestyle"]["role"] == "controlled_generational_bridge"
    assert stack["identity_rule"].startswith("Every lead, double, harmony")
    assert "retro parody" in stack["freestyle_generation"]["blocked"]


def test_first_release_creative_snapshot_is_fully_bound_and_not_falsely_complete():
    snapshot = first_release_creative_snapshot()

    assert snapshot["artist_id"] == "LZR-00000001"
    assert snapshot["release_id"] == "LZR-RC-0001"
    assert snapshot["title"] == "Sleep On The Floor"
    assert snapshot["release_digest"].startswith("lzr_release_sha256_")
    assert snapshot["arrangement_digest"].startswith("lzr_arrangement_sha256_")
    assert snapshot["arrangement"]["vocal_north_star"] == "Velvet Grit"
    assert snapshot["arrangement"]["status"]["arrangement_locked"] is True
    assert snapshot["arrangement"]["status"]["master_approval"] == "pending"
    assert snapshot["wardrobe"]["era_name"] == "Testimony Armor"
    assert snapshot["release"]["release_gates"]["final_audio_master"] == "pending"


def test_unknown_asset_fails_closed():
    with pytest.raises(KeyError):
        load_luzaria_asset("celebrity_voice_clone")
