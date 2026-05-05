"""
SongComposer Phase 1 — hierarchical structure planner for 4+ minute tracks.

LLM (or deterministic fallback) emits a JSON arrangement map: sections with
bars, BPM, energy, EMSS axis ids, vocal/rhyme-fracture flags. Downstream:
append arrangement to lyric seed → existing /api/generate (S2 + MMA + vocal v2).

Axis ids must match server AXIS_CATALOG.
"""
from __future__ import annotations

import json
import logging
import re
import uuid
from typing import Any, Dict, List, Literal, Optional

logger = logging.getLogger("empire1.song_planner")

VALID_RHYTHM = frozenset({
    "lowrider_cruise_76", "trap_corrido", "late_pocket_bounce", "laboe_sunday_68",
    "drill_uk_140", "g_funk_94", "afrobeat_105", "jersey_club_135", "bossa_cruise_82",
    "requinto_bolero",
})
VALID_MELODY = frozenset({
    "ranchera_belt", "souldies_6_9", "hurt_girl_mirror", "corrido_narration",
    "trap_soul_drip", "laboe_crooner", "drill_monotone", "afro_pentatonic", "ancestral_nahuatl",
})
VALID_INST = frozenset({
    "warm_souldies_analog", "70s_motown_live", "lo_fi_tape_hiss", "trap_808_heavy",
    "acoustic_requinto", "synthwave_analog", "gospel_chicano", "minimal_808", "orchestral_cinematic",
})
VALID_EMOTION = frozenset({
    "soulfire_hurt_girl", "playful_pain", "defiant_bloom", "lineal_lament", "lowrider_melancholy",
    "street_menace", "sunday_dedication", "ancestral_fire", "after_hours_prayer",
})

SONG_PLANNER_SYSTEM = """You are the Lyrica 3 Pro Structure Planner (Layer 5 — Master Arranger).
Output STRICTLY one JSON object (no markdown, no prose). Schema:
{
  "title": "<2-8 words Title Case, or empty string to use client title>",
  "target_bpm": <number 60-110 typical for soul/grief pocket>,
  "creative_intent_one_liner": "<one sentence: emotional + sonic intent>",
  "cultural_notes": "<one sentence: narrative grounding, avoid caricature>",
  "sections": [
    {
      "id": "<snake_case unique id e.g. intro, verse_1, chorus_1>",
      "label": "<human label e.g. Intro, Verse 1>",
      "bars": <4-32 integer>,
      "bpm": <number; may match target_bpm or drift slightly per section>,
      "energy": <0.0-1.0>,
      "rhythm_axis_id": "<one of the allowed rhythm ids OR empty string>",
      "melody_axis_id": "<one of allowed melody ids OR empty>",
      "instrumentation_axis_id": "<one of allowed instrumentation ids OR empty>",
      "emotion_axis_id": "<one of allowed emotion ids OR empty>",
      "has_vocal": <true|false>,
      "rhyme_fracture": <true|false — true when grief/psychological break justifies broken couplets>,
      "note": "<optional 1-line production note for S2>"
    }
  ]
}

Allowed rhythm_axis_id values (exact strings): lowrider_cruise_76, trap_corrido, late_pocket_bounce, laboe_sunday_68, drill_uk_140, g_funk_94, afrobeat_105, jersey_club_135, bossa_cruise_82, requinto_bolero
Allowed melody_axis_id: ranchera_belt, souldies_6_9, hurt_girl_mirror, corrido_narration, trap_soul_drip, laboe_crooner, drill_monotone, afro_pentatonic, ancestral_nahuatl
Allowed instrumentation_axis_id: warm_souldies_analog, 70s_motown_live, lo_fi_tape_hiss, trap_808_heavy, acoustic_requinto, synthwave_analog, gospel_chicano, minimal_808, orchestral_cinematic
Allowed emotion_axis_id: soulfire_hurt_girl, playful_pain, defiant_bloom, lineal_lament, lowrider_melancholy, street_menace, sunday_dedication, ancestral_fire, after_hours_prayer

Rules:
- Total sections: at least 6 for long-form; typical 8-14 for 4-8 minutes at 4/4.
- Use rhyme_fracture true only on 1-2 sections where narrative demands (grief arc).
- Vary energy across sections (intro low, chorus higher).
- Empty string for an axis id means inherit from global genre/mood defaults.
- Bars * (240/bpm) approximates section seconds in 4/4; aim total wall time near the requested target.
"""


def _clamp_axis(kind: str, val: str, fallback: str) -> str:
    v = (val or "").strip()
    if not v:
        return fallback
    sets = {
        "rhythm": VALID_RHYTHM,
        "melody": VALID_MELODY,
        "instrumentation": VALID_INST,
        "emotion": VALID_EMOTION,
    }
    if v in sets.get(kind, frozenset()):
        return v
    return fallback


def estimate_seconds_from_plan(plan: Dict[str, Any]) -> int:
    secs = 0.0
    for sec in plan.get("sections") or []:
        bars = int(sec.get("bars") or 8)
        bpm = float(sec.get("bpm") or plan.get("target_bpm") or 78)
        if bpm < 40:
            bpm = 78
        secs += bars * (240.0 / bpm)
    return max(60, int(round(secs)))


def _dominant_axes(sections: List[Dict[str, Any]]) -> Dict[str, Optional[str]]:
    """Pick most common non-empty axis id per dimension (fallback first section)."""
    def pick(key: str) -> Optional[str]:
        counts: Dict[str, int] = {}
        for s in sections:
            v = (s.get(key) or "").strip()
            if v:
                counts[v] = counts.get(v, 0) + 1
        if not counts:
            return None
        return max(counts, key=lambda k: counts[k])

    return {
        "rhythm": pick("rhythm_axis_id"),
        "melody": pick("melody_axis_id"),
        "instrumentation": pick("instrumentation_axis_id"),
        "emotion": pick("emotion_axis_id"),
    }


def arrangement_appendix(plan: Dict[str, Any]) -> str:
    """Human + machine readable block prepended context for S2 LML generation."""
    lines = [
        "# ARRANGEMENT_MAP (honor in LML: section markers [intro] [verse] [hook] [bridge] [outro]; match energy and rhyme_fracture notes)",
        json.dumps(plan, ensure_ascii=False, indent=2),
    ]
    return "\n".join(lines)


def fallback_plan(
    *,
    emotional_arc: str,
    target_duration_seconds: int,
    default_rhythm: str,
    default_melody: str,
    default_inst: str,
    default_emotion: str,
) -> Dict[str, Any]:
    """Deterministic long-form map when LLM unavailable."""
    bpm = {"grief": 72, "intimacy": 78, "defiance": 88, "neutral": 76}.get(emotional_arc, 76)
    rhythm = default_rhythm if default_rhythm in VALID_RHYTHM else "lowrider_cruise_76"
    melody = default_melody if default_melody in VALID_MELODY else "hurt_girl_mirror"
    inst = default_inst if default_inst in VALID_INST else "warm_souldies_analog"
    emo = default_emotion if default_emotion in VALID_EMOTION else "soulfire_hurt_girl"

    # Build sections until we approximate target duration
    template = [
        ("intro", "Intro", 8, 0.25, False, False),
        ("verse_1", "Verse 1", 16, 0.45, True, emotional_arc == "grief"),
        ("pre_chorus", "Pre-Chorus", 8, 0.55, True, False),
        ("chorus_1", "Chorus", 16, 0.85, True, False),
        ("verse_2", "Verse 2", 16, 0.5, True, emotional_arc == "grief"),
        ("bridge", "Bridge", 8, 0.6, True, False),
        ("chorus_2", "Chorus 2", 16, 0.9, True, False),
        ("outro", "Outro", 8, 0.3, True, False),
    ]
    sections: List[Dict[str, Any]] = []
    total = 0.0
    idx = 0
    # Always emit at least 8 sections for long-form arc; extend until ~85% of target wall time
    while (len(sections) < 8 or total < target_duration_seconds * 0.85) and idx < 24:
        tid, lab, bars, en, hv, rf = template[idx % len(template)]
        if idx >= len(template):
            tid, lab = f"verse_ext_{idx}", f"Extension {idx}"
            bars, en, hv, rf = 12, 0.55, True, False
        bar_count = bars + (4 if target_duration_seconds > 300 else 0)
        sections.append({
            "id": f"{tid}_{idx}" if idx >= len(template) else tid,
            "label": lab,
            "bars": bar_count,
            "bpm": bpm,
            "energy": en,
            "rhythm_axis_id": rhythm,
            "melody_axis_id": melody,
            "instrumentation_axis_id": inst,
            "emotion_axis_id": emo,
            "has_vocal": hv,
            "rhyme_fracture": rf,
            "note": "Late-pocket swing; humanized hat drift" if idx % 2 == 0 else "",
        })
        total += bar_count * (240.0 / bpm)
        idx += 1

    return {
        "title": "",
        "target_bpm": bpm,
        "creative_intent_one_liner": f"Soulfire long-form · arc={emotional_arc} · fallback planner",
        "cultural_notes": "Ground narrative in lived place and relationship; avoid flattening.",
        "sections": sections,
        "_planner": "fallback_v1",
    }


def _sanitize_plan(raw: Dict[str, Any], defaults: Dict[str, str]) -> Dict[str, Any]:
    out = {
        "title": str(raw.get("title") or "").strip(),
        "target_bpm": float(raw.get("target_bpm") or 78),
        "creative_intent_one_liner": str(raw.get("creative_intent_one_liner") or "")[:500],
        "cultural_notes": str(raw.get("cultural_notes") or "")[:500],
        "sections": [],
    }
    for i, s in enumerate(raw.get("sections") or []):
        if not isinstance(s, dict):
            continue
        sid = re.sub(r"[^a-z0-9_]+", "_", str(s.get("id") or f"sec_{i}").lower())[:48] or f"sec_{i}"
        out["sections"].append({
            "id": sid,
            "label": str(s.get("label") or sid)[:80],
            "bars": max(4, min(32, int(s.get("bars") or 8))),
            "bpm": max(40.0, min(200.0, float(s.get("bpm") or out["target_bpm"]))),
            "energy": max(0.0, min(1.0, float(s.get("energy") or 0.5))),
            "rhythm_axis_id": _clamp_axis("rhythm", str(s.get("rhythm_axis_id") or ""), defaults["rhythm"]),
            "melody_axis_id": _clamp_axis("melody", str(s.get("melody_axis_id") or ""), defaults["melody"]),
            "instrumentation_axis_id": _clamp_axis("instrumentation", str(s.get("instrumentation_axis_id") or ""), defaults["instrumentation"]),
            "emotion_axis_id": _clamp_axis("emotion", str(s.get("emotion_axis_id") or ""), defaults["emotion"]),
            "has_vocal": bool(s.get("has_vocal", True)),
            "rhyme_fracture": bool(s.get("rhyme_fracture", False)),
            "note": str(s.get("note") or "")[:200],
        })
    if not out["sections"]:
        raise ValueError("no sections")
    if raw.get("_planner"):
        out["_planner"] = raw["_planner"]
    return out


async def plan_structure_llm(
    *,
    narrative: str,
    genre: str,
    mood: str,
    emotional_arc: str,
    target_duration_seconds: int,
    emotion_weight: float,
    default_axes: Dict[str, str],
    emergent_key: str,
) -> Optional[Dict[str, Any]]:
    if not emergent_key:
        return None
    ew = max(0.0, min(1.0, emotion_weight))
    user = (
        f"EMOTION_TRAINING_WEIGHT={ew:.2f} (0=structure only, 1=max poetic/biometric vulnerability in planning).\n"
        f"TARGET_WALL_SECONDS≈{target_duration_seconds} (scale total bars across sections).\n"
        f"EMOTIONAL_ARC={emotional_arc}\n"
        f"GENRE={genre}\nMOOD={mood}\n"
        f"DEFAULT_AXES (use when section should inherit): rhythm={default_axes['rhythm']}, "
        f"melody={default_axes['melody']}, inst={default_axes['instrumentation']}, emotion={default_axes['emotion']}\n\n"
        f"SOUL_FRAGMENT / LYRIC_SEED (treat as sacred text, not a sterile prompt):\n{narrative.strip()[:8000]}\n\n"
        f"Return JSON only."
    )
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=emergent_key,
            session_id=f"song_{uuid.uuid4().hex[:8]}",
            system_message=SONG_PLANNER_SYSTEM,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        resp = await chat.send_message(UserMessage(text=user))
        txt = resp.strip()
        m = re.search(r"\{[\s\S]*\}", txt)
        if m:
            txt = m.group(0)
        data = json.loads(txt)
        if "sections" not in data:
            return None
        data["_planner"] = "llm_claude_sonnet_4_5"
        return _sanitize_plan(data, default_axes)
    except Exception as e:
        logger.warning("song planner LLM fallback: %s", e)
        return None


async def compose_song_phase1(
    *,
    narrative: str,
    genre: str,
    mood: str,
    title: Optional[str],
    ghost_audio_name: Optional[str],
    emotional_arc: Literal["grief", "defiance", "intimacy", "neutral"],
    target_duration_seconds: int,
    emotion_weight: float,
    axes_rhythm: str,
    axes_melody: str,
    axes_inst: str,
    axes_emotion: str,
    performer_dna: Optional[Dict[str, Any]],
    harmony_layers: List[Dict[str, Any]],
    subtextual_splicer: bool,
    bridge_enabled: bool,
    apply_arc_mood_hint: bool,
    emergent_key: str,
) -> Dict[str, Any]:
    """
    Full Phase 1: structure plan → lyrics bundle for S2 → soul_compose generate_request.
    """
    from soul_composer import compose as soul_compose_run, ccna_validate

    defaults = {
        "rhythm": _clamp_axis("rhythm", axes_rhythm, "lowrider_cruise_76"),
        "melody": _clamp_axis("melody", axes_melody, "hurt_girl_mirror"),
        "instrumentation": _clamp_axis("instrumentation", axes_inst, "warm_souldies_analog"),
        "emotion": _clamp_axis("emotion", axes_emotion, "soulfire_hurt_girl"),
    }

    plan = await plan_structure_llm(
        narrative=narrative,
        genre=genre,
        mood=mood,
        emotional_arc=emotional_arc,
        target_duration_seconds=target_duration_seconds,
        emotion_weight=emotion_weight,
        default_axes=defaults,
        emergent_key=emergent_key,
    )
    if not plan:
        plan = fallback_plan(
            emotional_arc=emotional_arc,
            target_duration_seconds=target_duration_seconds,
            default_rhythm=defaults["rhythm"],
            default_melody=defaults["melody"],
            default_inst=defaults["instrumentation"],
            default_emotion=defaults["emotion"],
        )

    est = estimate_seconds_from_plan(plan)
    target_out = max(target_duration_seconds, est)

    lyrics_bundle = (
        narrative.strip()
        + "\n\n"
        + arrangement_appendix(plan)
    )

    dom = _dominant_axes(plan["sections"])
    axes_dict = {
        "rhythm": axes_rhythm or dom["rhythm"],
        "melody": axes_melody or dom["melody"],
        "instrumentation": axes_inst or dom["instrumentation"],
        "emotion": axes_emotion or dom["emotion"],
    }
    for k, v in list(axes_dict.items()):
        if not v:
            axes_dict[k] = defaults[k]

    soul_out = soul_compose_run(
        narrative=lyrics_bundle,
        genre=genre,
        mood=mood,
        title=title or (plan.get("title") or None),
        ghost_audio_name=ghost_audio_name,
        target_duration_seconds=min(900, target_out),
        emotional_arc=emotional_arc,
        axes=axes_dict,
        performer_dna=performer_dna,
        harmony_layers=harmony_layers,
        subtextual_splicer=subtextual_splicer,
        bridge_enabled=bridge_enabled,
        apply_arc_mood_hint=apply_arc_mood_hint,
    )

    ccna = ccna_validate(narrative)
    return {
        "engine": "song_composer_phase1",
        "emotion_weight": emotion_weight,
        "estimated_duration_seconds": est,
        "target_duration_seconds": min(900, target_out),
        "song_plan": plan,
        "ccna": ccna,
        "soulcomposer": {k: v for k, v in soul_out.items() if k != "generate_request"},
        "generate_request": soul_out["generate_request"],
        "pipeline_notes": [
            "POST generate_request to /api/generate to mint audio.",
            "ARRANGEMENT_MAP in lyrics guides S2 section structure and rhyme_fracture intent.",
            "Phase 2: chunk-conditioned audio diffusion + continuity encoder.",
        ],
    }
