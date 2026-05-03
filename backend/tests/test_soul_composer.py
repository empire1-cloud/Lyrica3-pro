"""Unit tests for SoulComposer (no HTTP, no Mongo)."""
import pytest

from soul_composer import (
    build_generate_payload,
    ccna_validate,
    compose,
    epd_build_vocal_blueprint,
    mma_heartbeat_acoustic,
)


def test_ccna_pass_short_narrative():
    r = ccna_validate("East of the freeway, wildflowers in the cracks.")
    assert r["validation_status"] == "pass"
    assert r["issues"] == []


def test_ccna_review_too_short():
    r = ccna_validate("hi")
    assert r["validation_status"] == "review"
    assert "narrative_too_short" in r["issues"]


def test_mma_grief_has_bpm_and_swing():
    m = mma_heartbeat_acoustic("grief")
    assert m["bpm_center"] == 72
    assert m["swing_delay_ms"] == 16
    assert m["rhythm_axis_id"] == "laboe_sunday_68"


def test_mma_override_rhythm():
    m = mma_heartbeat_acoustic("grief", rhythm_axis_id_override="trap_corrido")
    assert m["rhythm_axis_id"] == "trap_corrido"
    assert m.get("user_overrode_rhythm") is True


def test_build_generate_injects_rhythm_for_grief():
    body, arc = build_generate_payload(
        narrative="I see my brother's eyes goin distant",
        genre="SGV Oldies",
        mood="Late-Night Honesty",
        title=None,
        emotional_arc="grief",
        axes=None,
        performer_dna=None,
        harmony_layers=[],
        subtextual_splicer=False,
        bridge_enabled=False,
        apply_arc_mood_hint=True,
    )
    assert arc == "grief"
    assert body["axes"]["rhythm"] == "laboe_sunday_68"
    assert body["mood"] == "Porch-Light Grief"


def test_build_generate_respects_explicit_rhythm():
    body, arc = build_generate_payload(
        narrative="Still standing on the line",
        genre="SGV Oldies",
        mood="Street Resilience",
        title=None,
        emotional_arc="defiance",
        axes={"rhythm": "g_funk_94", "melody": None, "instrumentation": None, "emotion": None},
        performer_dna=None,
        harmony_layers=[],
        subtextual_splicer=False,
        bridge_enabled=False,
        apply_arc_mood_hint=False,
    )
    assert body["axes"]["rhythm"] == "g_funk_94"


def test_compose_end_to_end_keys():
    out = compose(
        narrative="The static on the radio holds me tonight",
        emotional_arc="grief",
        apply_arc_mood_hint=True,
    )
    assert out["orchestrator"] == "soul_composer_v1"
    assert "ccna" in out and "epd" in out and "mma" in out
    assert out["resolved_emotional_arc"] == "grief"
    assert "generate_request" in out
    assert out["generate_request"]["axes"]["rhythm"] == "laboe_sunday_68"
    triggers = out["epd"]["line_triggers"]
    assert len(triggers) >= 1
    assert any("emotional_crack" in " ".join(t["suggested_tags"]) for t in triggers)


def test_epd_empty_lines():
    bp = epd_build_vocal_blueprint("", "neutral", lines_for_triggers=[])
    assert bp["line_triggers"] == []
