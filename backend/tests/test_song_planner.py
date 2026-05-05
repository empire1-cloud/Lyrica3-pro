"""Song planner deterministic paths (no LLM)."""
from song_planner import (
    arrangement_appendix,
    estimate_seconds_from_plan,
    fallback_plan,
)


def test_fallback_plan_reaches_duration():
    p = fallback_plan(
        emotional_arc="grief",
        target_duration_seconds=240,
        default_rhythm="laboe_sunday_68",
        default_melody="hurt_girl_mirror",
        default_inst="warm_souldies_analog",
        default_emotion="soulfire_hurt_girl",
    )
    assert p.get("_planner") == "fallback_v1"
    assert len(p["sections"]) >= 8
    est = estimate_seconds_from_plan(p)
    assert est >= 180


def test_arrangement_appendix_contains_json():
    p = fallback_plan(
        emotional_arc="neutral",
        target_duration_seconds=180,
        default_rhythm="lowrider_cruise_76",
        default_melody="souldies_6_9",
        default_inst="lo_fi_tape_hiss",
        default_emotion="lowrider_melancholy",
    )
    ax = arrangement_appendix(p)
    assert "ARRANGEMENT_MAP" in ax
    assert "sections" in ax

