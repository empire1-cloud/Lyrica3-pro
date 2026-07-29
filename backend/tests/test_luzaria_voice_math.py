from __future__ import annotations

import wave

import numpy as np
import pytest

from api.luzaria_voice_math import (
    VoiceEvent,
    load_genre_matrix,
    load_voice_profile,
    render_score,
    voice_profile_digest,
    write_pcm24_wav,
)
from api.luzaria_voice_performance import apply_performance_mode, render_performance


def _score():
    return [
        VoiceEvent(57, 0.18, "a", 0.70, "<adaptive_inhale>", 0.01),
        VoiceEvent(60, 0.18, "o", 0.74, "<vocal_fry>", 0.01),
        VoiceEvent(62, 0.18, "e", 0.76, "<emotional_crack>", 0.01),
        VoiceEvent(57, 0.22, "u", 0.72, "<chest_resonance>", 0.0),
    ]


def test_voice_profile_is_original_mathematical_and_identity_locked():
    profile = load_voice_profile()
    matrix = load_genre_matrix()

    assert profile["voice_model_id"] == "LZR-VOICE-MATH-V0"
    assert profile["artist_id"] == "LZR-00000001"
    assert profile["ownership"]["source"] == "original mathematical synthesis"
    assert profile["ownership"]["uses_human_voice_recordings"] is False
    assert profile["ownership"]["uses_licensed_seed_voice"] is False
    assert profile["ownership"]["celebrity_similarity_targeting"] is False
    assert profile["fundamental"]["extension_high_hz"] > profile["fundamental"]["comfortable_high_hz"]
    assert matrix["genre_matrix"]["Chicano_Soul"]["role"] == "identity_anchor"
    assert matrix["genre_matrix"]["Corrido_Tumbado"]["role"] == "controlled_cultural_extension"


def test_voice_profile_digest_is_stable():
    assert voice_profile_digest() == voice_profile_digest()
    assert voice_profile_digest().startswith("lzr_voice_sha256_")


def test_mathematical_render_is_deterministic_non_silent_and_finite():
    first, first_metadata = render_score(_score())
    second, second_metadata = render_score(_score())

    assert np.array_equal(first, second)
    assert first_metadata["render_float_sha256"] == second_metadata["render_float_sha256"]
    assert first_metadata["sample_rate_hz"] == 48000
    assert first_metadata["bit_depth"] == 24
    assert first_metadata["voice_model_id"] == "LZR-VOICE-MATH-V0"
    assert np.isfinite(first).all()
    assert float(np.max(np.abs(first))) > 0.2


def test_performance_modes_change_expression_without_changing_identity():
    testimony_audio, testimony_meta = render_performance(
        _score(),
        mode="testimony_grit",
        genre_weights={"Chicano_Soul": 0.8, "Corrido_Tumbado": 0.2},
    )
    lift_audio, lift_meta = render_performance(
        _score(),
        mode="soul_funk_upper_lift",
        genre_weights={"Chicano_Soul": 0.9, "Phonk": 0.1},
    )

    assert not np.array_equal(testimony_audio, lift_audio)
    assert testimony_meta["artist_id"] == lift_meta["artist_id"] == "LZR-00000001"
    assert testimony_meta["voice_model_id"] == lift_meta["voice_model_id"] == "LZR-VOICE-MATH-V0"
    assert testimony_meta["identity_preserved"] is True
    assert lift_meta["identity_preserved"] is True
    assert testimony_meta["celebrity_similarity_targeting"] is False
    assert lift_meta["celebrity_similarity_targeting"] is False
    assert lift_meta["event_count"] >= testimony_meta["event_count"]


def test_upper_lift_moves_pitch_and_can_split_long_notes_for_melisma():
    event = VoiceEvent(57, 0.5, "a", 0.8, "", 0.0)
    transformed, profile = apply_performance_mode([event], mode="soul_funk_upper_lift")

    assert len(transformed) == 2
    assert transformed[0].midi_note == pytest.approx(62.0)
    assert transformed[1].midi_note == pytest.approx(64.0)
    assert profile["fundamental"]["vibrato_rate_hz"] > load_voice_profile()["fundamental"]["vibrato_rate_hz"]


def test_pcm24_writer_creates_real_48khz_wave(tmp_path):
    audio, _ = render_performance(_score(), mode="home")
    destination = write_pcm24_wav(tmp_path / "luzaria.wav", audio, sample_rate=48000)

    with wave.open(str(destination), "rb") as handle:
        assert handle.getnchannels() == 1
        assert handle.getsampwidth() == 3
        assert handle.getframerate() == 48000
        assert handle.getnframes() > 1000


def test_unknown_performance_mode_fails_closed():
    with pytest.raises(ValueError):
        apply_performance_mode(_score(), mode="celebrity_clone")
