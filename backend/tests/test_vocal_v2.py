"""Vocal v2 LML span parser (no TTS)."""
from vocal_v2 import parse_lml_spans, _prosody_for_tags


def test_paired_tags_wrap_inner_text():
    lml = "<vocal_fry>East of the freeway</vocal_fry> static on the radio"
    spans = parse_lml_spans(lml)
    assert len(spans) >= 1
    fry = [s for s in spans if "East" in s["text"]]
    assert fry, spans
    assert "vocal_fry" in fry[0]["tags"]


def test_self_closing_inhale_applies_to_next_run():
    lml = "<adaptive_inhale depth='deep'/>hold me tonight"
    spans = parse_lml_spans(lml)
    assert spans
    assert "adaptive_inhale" in spans[0]["tags"] or any("adaptive_inhale" in s["tags"] for s in spans)


def test_nested_style_tags():
    lml = "<chest_voice><emotional_crack>brother's eyes</emotional_crack></chest_voice>"
    spans = parse_lml_spans(lml)
    assert spans
    inner = [s for s in spans if "brother" in s["text"]]
    assert inner
    t = set(inner[0]["tags"])
    assert "chest_voice" in t and "emotional_crack" in t


def test_prosody_speed_combines():
    d, sp = _prosody_for_tags(["vocal_fry", "emotional_crack"])
    assert "fry" in d.lower() or "gravel" in d.lower()
    assert 0.25 <= sp <= 1.0
