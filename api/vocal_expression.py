from __future__ import annotations

import hashlib
import json
from typing import Any, Literal

from pydantic import BaseModel, Field

PerformanceStyleId = Literal["natural", "intimate", "gritty", "soaring", "corrido"]
PerformanceEffect = Literal["breath", "crack", "fry", "push", "hold_back", "run", "hesitate"]


class PerformanceMoment(BaseModel):
    note_index: int = Field(ge=0, le=1999)
    effect: PerformanceEffect
    amount: float = Field(default=0.65, ge=0.0, le=1.0)


class PerformanceDirection(BaseModel):
    style: PerformanceStyleId = "natural"
    intensity: float = Field(default=0.65, ge=0.0, le=1.0)
    moments: list[PerformanceMoment] = Field(default_factory=list, max_length=2000)


STYLE_PRESETS: dict[str, dict[str, Any]] = {
    "natural": {
        "public_name": "Natural",
        "public_description": "Balanced and clear without forcing a dramatic delivery.",
        "vibrato_rate_hz": 5.4,
        "vibrato_depth_multiplier": 1.0,
        "breath_mix": 0.02,
        "fry_mix": 0.0,
        "grit_mix": 0.02,
        "gain_multiplier": 1.0,
        "onset_scoop_cents": 0.0,
    },
    "intimate": {
        "public_name": "Intimate",
        "public_description": "Close, vulnerable and slightly breathy.",
        "vibrato_rate_hz": 4.8,
        "vibrato_depth_multiplier": 0.72,
        "breath_mix": 0.20,
        "fry_mix": 0.02,
        "grit_mix": 0.01,
        "gain_multiplier": 0.84,
        "onset_scoop_cents": -8.0,
    },
    "gritty": {
        "public_name": "Gritty",
        "public_description": "Rougher, heavier and more defiant.",
        "vibrato_rate_hz": 5.1,
        "vibrato_depth_multiplier": 0.88,
        "breath_mix": 0.05,
        "fry_mix": 0.18,
        "grit_mix": 0.30,
        "gain_multiplier": 0.98,
        "onset_scoop_cents": -18.0,
    },
    "soaring": {
        "public_name": "Soaring",
        "public_description": "Open, lifted and built for emotional peaks.",
        "vibrato_rate_hz": 6.1,
        "vibrato_depth_multiplier": 1.55,
        "breath_mix": 0.04,
        "fry_mix": 0.0,
        "grit_mix": 0.04,
        "gain_multiplier": 1.08,
        "onset_scoop_cents": -5.0,
    },
    "corrido": {
        "public_name": "Corrido",
        "public_description": "Direct, rhythmic and story-forward.",
        "vibrato_rate_hz": 5.7,
        "vibrato_depth_multiplier": 1.10,
        "breath_mix": 0.03,
        "fry_mix": 0.05,
        "grit_mix": 0.12,
        "gain_multiplier": 1.0,
        "onset_scoop_cents": -14.0,
    },
}

EFFECT_PUBLIC_COPY: dict[str, str] = {
    "breath": "Add breath",
    "crack": "Let the voice crack",
    "fry": "Add vocal fry",
    "push": "Push harder",
    "hold_back": "Hold back",
    "run": "Add a melodic run",
    "hesitate": "Add hesitation",
}


def _canonical_json(payload: Any) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, float(value)))


def validate_performance_direction(direction: PerformanceDirection, note_count: int) -> list[str]:
    findings: list[str] = []
    seen: set[tuple[int, str]] = set()
    for moment in direction.moments:
        if moment.note_index >= note_count:
            findings.append(f"note_{moment.note_index}_performance_target_out_of_range")
        key = (moment.note_index, moment.effect)
        if key in seen:
            findings.append(f"note_{moment.note_index}_{moment.effect}_duplicate")
        seen.add(key)
    return sorted(set(findings))


def resolve_performance_plan(direction: PerformanceDirection, note_count: int) -> dict[str, Any]:
    findings = validate_performance_direction(direction, note_count)
    preset = dict(STYLE_PRESETS[direction.style])
    intensity = float(direction.intensity)
    note_controls: list[dict[str, Any]] = []

    moment_map: dict[int, list[PerformanceMoment]] = {}
    for moment in direction.moments:
        moment_map.setdefault(moment.note_index, []).append(moment)

    for note_index in range(note_count):
        controls = {
            "vibrato_rate_hz": float(preset["vibrato_rate_hz"]),
            "vibrato_depth_multiplier": 1.0 + (float(preset["vibrato_depth_multiplier"]) - 1.0) * intensity,
            "breath_mix": float(preset["breath_mix"]) * intensity,
            "fry_mix": float(preset["fry_mix"]) * intensity,
            "grit_mix": float(preset["grit_mix"]) * intensity,
            "gain_multiplier": 1.0 + (float(preset["gain_multiplier"]) - 1.0) * intensity,
            "onset_scoop_cents": float(preset["onset_scoop_cents"]) * intensity,
            "crack_cents": 0.0,
            "run_cents": 0.0,
            "hesitation_amount": 0.0,
            "effects": [],
        }
        for moment in moment_map.get(note_index, []):
            amount = float(moment.amount)
            controls["effects"].append(moment.effect)
            if moment.effect == "breath":
                controls["breath_mix"] += 0.34 * amount
            elif moment.effect == "crack":
                controls["crack_cents"] = max(controls["crack_cents"], 62.0 * amount)
            elif moment.effect == "fry":
                controls["fry_mix"] += 0.34 * amount
            elif moment.effect == "push":
                controls["gain_multiplier"] += 0.28 * amount
                controls["grit_mix"] += 0.16 * amount
            elif moment.effect == "hold_back":
                controls["gain_multiplier"] -= 0.30 * amount
                controls["breath_mix"] += 0.12 * amount
            elif moment.effect == "run":
                controls["run_cents"] = max(controls["run_cents"], 190.0 * amount)
            elif moment.effect == "hesitate":
                controls["hesitation_amount"] = max(controls["hesitation_amount"], amount)

        controls["breath_mix"] = _clamp(controls["breath_mix"], 0.0, 0.65)
        controls["fry_mix"] = _clamp(controls["fry_mix"], 0.0, 0.55)
        controls["grit_mix"] = _clamp(controls["grit_mix"], 0.0, 0.55)
        controls["gain_multiplier"] = _clamp(controls["gain_multiplier"], 0.45, 1.35)
        controls["effects"] = sorted(set(controls["effects"]))
        note_controls.append({"note_index": note_index, **controls})

    canonical = {
        "style": direction.style,
        "intensity": direction.intensity,
        "moments": [moment.model_dump(mode="json") for moment in direction.moments],
        "note_controls": note_controls,
    }
    return {
        "eligible": not findings,
        "findings": findings,
        "style": direction.style,
        "public_name": preset["public_name"],
        "public_description": preset["public_description"],
        "intensity": direction.intensity,
        "note_controls": note_controls,
        "plan_digest": f"vocal_expression_sha256_{hashlib.sha256(_canonical_json(canonical)).hexdigest()}",
    }


def capabilities() -> dict[str, Any]:
    return {
        "name": "Vocal Performance Controls",
        "styles": [
            {"id": style_id, "name": preset["public_name"], "description": preset["public_description"]}
            for style_id, preset in STYLE_PRESETS.items()
        ],
        "moment_controls": [
            {"id": effect_id, "label": label}
            for effect_id, label in EFFECT_PUBLIC_COPY.items()
        ],
        "public_principle": "Choose the feeling, then shape the moments that matter.",
        "truth_boundary": {
            "style_names_are_creator_controls": True,
            "celebrity_voice_imitation_is_not_a_style": True,
            "performance_controls_do_not_replace_voice_consent": True,
        },
    }
