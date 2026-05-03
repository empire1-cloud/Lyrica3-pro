"""
SoulComposer — top-level orchestration scaffold for EMSS / Soulfire.

Coordinates (stub → full) agent stages:
  CCNA — cultural validation notes (heuristic stub; replace with LLM + policy contract)
  EPD  — vocal blueprint: lyric-line → biometric LML triggers
  MMA  — rhythmic pocket from emotional arc ("heartbeat" tempo / swing hints)

This module is intentionally free of FastAPI imports so it can be unit-tested in isolation.
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Literal, Optional, Tuple

EmotionalArc = Literal["grief", "defiance", "intimacy", "neutral"]

# When the client does not pick a rhythm axis, map emotional arc → EMSS rhythm id (see server AXIS_CATALOG).
_HEARTBEAT_RHYTHM: Dict[EmotionalArc, Dict[str, Any]] = {
    "grief": {
        "rhythm_axis_id": "laboe_sunday_68",
        "bpm_center": 72,
        "swing_delay_ms": 16,
        "pocket_note": "Heavy late pocket; snare 14–18 ms behind; resting-heart feel.",
    },
    "intimacy": {
        "rhythm_axis_id": "lowrider_cruise_76",
        "bpm_center": 78,
        "swing_delay_ms": 14,
        "pocket_note": "Between walk and rest heart-rate; lazy swing for embodied empathy.",
    },
    "defiance": {
        "rhythm_axis_id": "late_pocket_bounce",
        "bpm_center": 88,
        "swing_delay_ms": 10,
        "pocket_note": "Harder kick, shorter late-snare; forward lean without losing pocket.",
    },
    "neutral": {
        "rhythm_axis_id": None,
        "bpm_center": None,
        "swing_delay_ms": None,
        "pocket_note": "Use genre/mood defaults; no arc-specific MMA override.",
    },
}

# Optional mood hints when the arc is set (consumer can ignore).
_ARC_MOOD_HINT: Dict[EmotionalArc, Optional[str]] = {
    "grief": "Porch-Light Grief",
    "defiance": "Defiant Bloom",
    "intimacy": "Late-Night Honesty",
    "neutral": None,
}

_GRIEF_LEX = re.compile(
    r"\b(gone|lost|goodbye|grave|brother|mother|father|cry|tears|"
    r"grief|ache|distant|gray|grey|alone|empty|last time|never again)\b",
    re.I,
)
_DEFIANCE_LEX = re.compile(
    r"\b(still stand|won't|never back|rise|fight|survive|steel|"
    r"crown|run it|no surrender)\b",
    re.I,
)
_INTIMACY_LEX = re.compile(
    r"\b(whisper|close|hold me|your skin|tonight|bedroom|"
    r"secret|only you)\b",
    re.I,
)


def _lines_from_seed(text: str) -> List[str]:
    raw = (text or "").strip()
    if not raw:
        return []
    # Strip simple LML tags for analysis
    deTagged = re.sub(r"<[^>]+>", " ", raw)
    out: List[str] = []
    for ln in deTagged.splitlines():
        s = ln.strip()
        if not s or s.startswith("[") and s.endswith("]"):
            continue
        out.append(s)
    return out if out else [deTagged]


def _detect_arc_from_text(narrative: str, fallback: EmotionalArc) -> EmotionalArc:
    if fallback != "neutral":
        return fallback
    t = narrative or ""
    scores = {
        "grief": len(_GRIEF_LEX.findall(t)),
        "defiance": len(_DEFIANCE_LEX.findall(t)),
        "intimacy": len(_INTIMACY_LEX.findall(t)),
    }
    best = max(scores, key=lambda k: scores[k])
    if scores[best] == 0:
        return "neutral"
    return best  # type: ignore[return-value]


def ccna_validate(narrative: str) -> Dict[str, Any]:
    """Heuristic cultural-validation stub. Swap for CCNA agent + policy JSON."""
    text = (narrative or "").strip()
    issues: List[str] = []
    if len(text) < 8:
        issues.append("narrative_too_short")
    if len(text) > 6000:
        issues.append("narrative_too_long")
    # Surface-level caricature flags (expand with real classifier)
    if re.search(r"\b(chicano|chicana|latino|latina)\b.*\b(all the same|they all)\b", text, re.I):
        issues.append("possible_flattening_language")

    status = "pass" if not issues else "review"
    return {
        "validation_status": status,
        "issues": issues,
        "cultural_notes": [
            "Treat place and relationship as lived context, not costume.",
            "Slang and code-switching are allowed when anchored to narrative truth.",
        ],
    }


def epd_build_vocal_blueprint(
    narrative_seed: str,
    emotional_arc: EmotionalArc,
    lines_for_triggers: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Map narrative lines → biometric LML triggers + poetic-divergence hints."""
    lines = lines_for_triggers or _lines_from_seed(narrative_seed)
    triggers: List[Dict[str, Any]] = []

    for i, line in enumerate(lines[:24]):
        low = line.lower()
        tags: List[str] = []
        reason_parts: List[str] = []

        if emotional_arc == "grief" or _GRIEF_LEX.search(line):
            frag = line[:48] + ("…" if len(line) > 48 else "")
            tags.append(f"<emotional_crack intensity='0.72'>{frag}</emotional_crack>")
            reason_parts.append("grief-weight on phrase")
        if "breath" in low or "inhale" in low or emotional_arc == "intimacy":
            tags.append("<adaptive_inhale depth='deep'/>")
            reason_parts.append("breath as performance")
        if emotional_arc == "defiance" or _DEFIANCE_LEX.search(line):
            frag = line[:48] + ("…" if len(line) > 48 else "")
            tags.append(f"<chest_voice>{frag}</chest_voice>")
            reason_parts.append("defiance → chest resonance")
        if any(w in low for w in ("static", "radio", "tape", "cassette", "4am")):
            tags.append("<tape_hiss level='subtle'/>")
            reason_parts.append("memory texture")
        if not tags:
            frag = line[:48] + ("…" if len(line) > 48 else "")
            if emotional_arc == "intimacy":
                tags.append(f"<whisper_grit>{frag}</whisper_grit>")
                reason_parts.append("intimate proximity")
            else:
                tags.append(f"<vocal_fry depth='0.68'>{frag}</vocal_fry>")
                reason_parts.append("default physiological weight")

        triggers.append({
            "line_index": i,
            "sample_text": line[:120],
            "suggested_tags": tags,
            "reason": "; ".join(reason_parts) or "line-level vocal architecture",
        })

    poetic_div = (
        "Keep rhyme friction in verse two if the arc is grief — fracture mirrors psychological break."
        if emotional_arc == "grief"
        else "Maintain forward phrasing; allow asymmetry when emotionally justified."
    )

    return {
        "emotional_arc": emotional_arc,
        "poetic_divergence_hint": poetic_div,
        "line_triggers": triggers,
        "synthesis_targets": {
            "vocal_fry": {"f0": "low_stable", "breathiness": 0.62},
            "emotional_crack": {"pitch_break_cents": 35, "formant_jitter": 0.08},
            "adaptive_inhale": {"breath_noise_db": -18},
        },
    }


def mma_heartbeat_acoustic(
    emotional_arc: EmotionalArc,
    rhythm_axis_id_override: Optional[str] = None,
) -> Dict[str, Any]:
    """MMA emotional pocket profile + optional rhythm axis id."""
    base = dict(_HEARTBEAT_RHYTHM[emotional_arc])
    if rhythm_axis_id_override:
        base = {**base, "rhythm_axis_id": rhythm_axis_id_override, "user_overrode_rhythm": True}
    return base


def build_generate_payload(
    *,
    narrative: str,
    genre: str,
    mood: str,
    title: Optional[str],
    emotional_arc: EmotionalArc,
    axes: Optional[Dict[str, Optional[str]]],
    performer_dna: Optional[Dict[str, Any]],
    harmony_layers: List[Dict[str, Any]],
    subtextual_splicer: bool,
    bridge_enabled: bool,
    apply_arc_mood_hint: bool,
) -> Tuple[Dict[str, Any], EmotionalArc]:
    """
    Returns (generate_request_dict, resolved_arc).
    `axes` is a plain dict with optional keys rhythm, melody, instrumentation, emotion.
    """
    resolved_arc = _detect_arc_from_text(narrative, emotional_arc)

    ax = dict(axes or {})
    user_rhythm = ax.get("rhythm")
    mma = mma_heartbeat_acoustic(resolved_arc, rhythm_axis_id_override=user_rhythm)
    if not user_rhythm and mma.get("rhythm_axis_id"):
        ax["rhythm"] = mma["rhythm_axis_id"]

    mood_out = mood
    hint = _ARC_MOOD_HINT.get(resolved_arc)
    if apply_arc_mood_hint and hint:
        mood_out = hint

    gen: Dict[str, Any] = {
        "lyrics": narrative.strip(),
        "genre": genre,
        "mood": mood_out,
        "title": title,
        "axes": ax if any(ax.get(k) for k in ("rhythm", "melody", "instrumentation", "emotion")) else None,
        "performer_dna": performer_dna,
        "harmony_layers": harmony_layers or [],
        "subtextual_splicer": subtextual_splicer,
        "bridge_enabled": bridge_enabled,
    }
    # Drop empty axes key for cleaner JSON
    if not gen["axes"]:
        gen.pop("axes")

    return gen, resolved_arc


def compose(
    *,
    narrative: str,
    genre: str = "SGV Oldies",
    mood: str = "Late-Night Honesty",
    title: Optional[str] = None,
    emotional_arc: EmotionalArc = "neutral",
    axes: Optional[Dict[str, Optional[str]]] = None,
    performer_dna: Optional[Dict[str, Any]] = None,
    harmony_layers: Optional[List[Dict[str, Any]]] = None,
    subtextual_splicer: bool = False,
    bridge_enabled: bool = False,
    apply_arc_mood_hint: bool = True,
) -> Dict[str, Any]:
    """Full SoulComposer output: CCNA + EPD + MMA + ready-to-post /api/generate body."""
    ccna = ccna_validate(narrative)
    gen_req, resolved_arc = build_generate_payload(
        narrative=narrative,
        genre=genre,
        mood=mood,
        title=title,
        emotional_arc=emotional_arc,
        axes=axes,
        performer_dna=performer_dna,
        harmony_layers=harmony_layers or [],
        subtextual_splicer=subtextual_splicer,
        bridge_enabled=bridge_enabled,
        apply_arc_mood_hint=apply_arc_mood_hint,
    )
    lines = _lines_from_seed(narrative)
    epd = epd_build_vocal_blueprint(narrative, resolved_arc, lines_for_triggers=lines)
    mma = mma_heartbeat_acoustic(
        resolved_arc,
        rhythm_axis_id_override=(axes or {}).get("rhythm"),
    )

    return {
        "orchestrator": "soul_composer_v1",
        "ccna": ccna,
        "epd": epd,
        "mma": mma,
        "resolved_emotional_arc": resolved_arc,
        "generate_request": gen_req,
        "pipeline_notes": [
            "POST generate_request to /api/generate (auth required) to mint audio + ledger.",
            "EPD triggers are suggestions; Claude still authors final LML in S2.",
            "VICS / DNA tag is assigned only after /api/generate persists the track.",
        ],
    }
