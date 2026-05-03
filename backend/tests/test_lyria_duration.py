"""Lyria segment math for long-form targets."""
from vertex_ai import lyria_segments_for_target_seconds


def test_four_minutes_needs_enough_segments():
    # 240s target with 30s segments and 1.5s crossfade → ceil((240+1.5)/(30-1.5)) ≈ 9
    n = lyria_segments_for_target_seconds(240)
    assert n >= 8


def test_default_cap_respects_max():
    n = lyria_segments_for_target_seconds(3600)
    assert n <= 24
