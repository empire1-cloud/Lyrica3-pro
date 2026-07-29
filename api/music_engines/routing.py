from __future__ import annotations

import hashlib
import json
from typing import Any

from .models import EngineExecutionPlan, EngineStage, MusicEngineRequest, MusicTask, QualityMode
from .payloads import build_provider_payload
from .registry import load_registry, provider_registry


_FULL_SONG_TASKS = {
    MusicTask.FULL_SONG,
    MusicTask.LYRICS_TO_SONG,
    MusicTask.INSTRUMENTAL,
    MusicTask.LONG_FORM,
    MusicTask.REMIX,
    MusicTask.AUDIO_EDIT,
}

_PRECISION_VOICE_TASKS = {
    MusicTask.SINGING_VOICE,
    MusicTask.VOICE_EDIT,
    MusicTask.VOICE_CONVERSION,
    MusicTask.SINGING_STYLE_CONVERSION,
}


def _request_fingerprint(request: MusicEngineRequest) -> str:
    canonical = json.dumps(request.model_dump(mode="json"), sort_keys=True, separators=(",", ":"))
    return f"lyrica_req_sha256_{hashlib.sha256(canonical.encode('utf-8')).hexdigest()}"


def _task_capability(request: MusicEngineRequest) -> str:
    return request.task.value


def _eligible(provider_id: str, spec: dict[str, Any], request: MusicEngineRequest) -> tuple[bool, str]:
    capabilities = set(spec.get("capabilities", []))
    required = _task_capability(request)

    if required not in capabilities:
        if request.task == MusicTask.LONG_FORM and {"full_song", "lyrics_to_song"}.intersection(capabilities):
            pass
        else:
            return False, f"does not support {required}"

    constraints = spec.get("constraints", {})
    maximum = constraints.get("max_duration_seconds")
    if maximum is not None and request.duration_seconds > int(maximum):
        return False, f"duration exceeds {maximum} seconds"

    if request.reference_audio_url and "reference_audio" not in capabilities:
        return False, "reference audio requested but unsupported"

    if request.needs_melody_control and not {
        "melody_control",
        "exact_melody",
        "midi_control",
    }.intersection(capabilities):
        return False, "melody control requested but unsupported"

    if request.task == MusicTask.SINGING_VOICE and constraints.get("requires_score_or_midi"):
        if not (request.midi_url or request.melody_url):
            return False, "score or MIDI is required"

    return True, ""


def _score_provider(provider_id: str, spec: dict[str, Any], request: MusicEngineRequest) -> int:
    capabilities = set(spec.get("capabilities", []))
    score = int(spec.get("priority", 0))

    if request.preferred_provider == provider_id:
        score += 1000
    if request.task == MusicTask.LONG_FORM and "long_form" in capabilities:
        score += 60
    if request.needs_exact_lyrics:
        if provider_id == "yue":
            score += 45
        if provider_id == "openvpi_diffsinger":
            score += 55
        if "lyrics_to_song" in capabilities:
            score += 10
    if request.reference_audio_url and "reference_audio" in capabilities:
        score += 35
    if request.needs_personalization and {
        "lora_personalization",
        "personalized_singer",
    }.intersection(capabilities):
        score += 35
    if request.needs_melody_control and {
        "melody_control",
        "exact_melody",
        "midi_control",
    }.intersection(capabilities):
        score += 55
    if request.voice_identity_ref and provider_id in {
        "ace_step_1_5",
        "openvpi_diffsinger",
        "amphion_vevo2",
        "yue",
    }:
        score += 18
    if request.task == MusicTask.INSTRUMENTAL and provider_id == "ace_step_1_5":
        score += 35
    if request.quality_mode == QualityMode.FAST and provider_id == "ace_step_1_5":
        score += 80
    if request.quality_mode == QualityMode.COUNCIL and provider_id in {
        "ace_step_1_5",
        "heartmula",
        "yue",
    }:
        score += 20
    return score


def _provider_limit(request: MusicEngineRequest) -> int:
    if request.quality_mode == QualityMode.FAST:
        return 1
    if request.quality_mode == QualityMode.BALANCED:
        return min(2, request.candidate_count)
    if request.quality_mode == QualityMode.STUDIO:
        return min(2, request.candidate_count)
    return min(3, request.candidate_count)


def _ranked_candidates(request: MusicEngineRequest) -> tuple[list[str], dict[str, str]]:
    providers = provider_registry()
    ranked: list[tuple[int, str]] = []
    excluded: dict[str, str] = {}
    for provider_id, spec in providers.items():
        eligible, reason = _eligible(provider_id, spec, request)
        if not eligible:
            excluded[provider_id] = reason
            continue
        ranked.append((_score_provider(provider_id, spec, request), provider_id))
    ranked.sort(key=lambda item: (-item[0], item[1]))
    return [provider_id for _, provider_id in ranked], excluded


def _refinement_providers(request: MusicEngineRequest) -> list[str]:
    providers = provider_registry()
    candidates: list[tuple[int, str]] = []
    for provider_id in ("openvpi_diffsinger", "amphion_vevo2"):
        spec = providers[provider_id]
        capabilities = set(spec["capabilities"])
        useful = False
        if request.needs_melody_control and {
            "melody_control",
            "exact_melody",
            "midi_control",
        }.intersection(capabilities):
            useful = True
        if request.needs_exact_lyrics and "phoneme_control" in capabilities:
            useful = True
        if request.task in _PRECISION_VOICE_TASKS:
            useful = True
        if request.voice_identity_ref and {
            "personalized_singer",
            "voice_edit",
            "singing_style_conversion",
        }.intersection(capabilities):
            useful = True
        if useful:
            eligible, _ = _eligible(provider_id, spec, request)
            if eligible:
                candidates.append((_score_provider(provider_id, spec, request), provider_id))
    candidates.sort(key=lambda item: (-item[0], item[1]))
    return [provider_id for _, provider_id in candidates]


def build_execution_plan(request: MusicEngineRequest) -> EngineExecutionPlan:
    registry = load_registry()
    ranked, excluded = _ranked_candidates(request)
    if not ranked:
        raise ValueError("No registered Lyrica music engine can satisfy this request.")

    if request.preferred_provider and request.preferred_provider not in provider_registry():
        raise ValueError(f"Unknown preferred provider: {request.preferred_provider}")

    warnings: list[str] = []
    if request.voice_identity_ref:
        warnings.append(
            "The voice identity is Lyrica-controlled; provider output must pass identity verification before release."
        )
    if request.reference_audio_url:
        warnings.append(
            "Reference conditioning is permitted only for the scope represented by the consent assertion."
        )

    stages: list[EngineStage] = []
    if request.task in _FULL_SONG_TASKS:
        selected = ranked[: _provider_limit(request)]
        stages.append(
            EngineStage(
                stage_id="candidate_generation",
                purpose="Generate independent candidates without surrendering Lyrica identity or proof ownership.",
                providers=selected,
                selection_rule="Lyrica Quality Gate ranks adherence, cultural cohesion, lyric accuracy, originality, and audio quality.",
                payloads={provider_id: build_provider_payload(provider_id, request) for provider_id in selected},
            )
        )
        stages.append(
            EngineStage(
                stage_id="candidate_selection",
                purpose="Select or combine the strongest candidate under Lyrica canon.",
                providers=["lyrica_quality_gate"],
                selection_rule="No provider self-declares the release master.",
                payloads={},
            )
        )
    else:
        selected = ranked[:1]

    refiners = _refinement_providers(request)
    if request.task in _PRECISION_VOICE_TASKS and selected[0] not in refiners:
        refiners.insert(0, selected[0])
    if refiners:
        stages.append(
            EngineStage(
                stage_id="voice_precision",
                purpose="Refine melody, phonemes, timing, identity, or performance without replacing the artist.",
                providers=refiners,
                selection_rule="The locked artist identity and consent scope override provider style transfer.",
                payloads={provider_id: build_provider_payload(provider_id, request) for provider_id in refiners},
            )
        )

    stages.append(
        EngineStage(
            stage_id="proof_and_catalog",
            purpose="Bind the approved audio to Lyrica ownership and revenue records.",
            providers=["lyrica_proof", "vics", "archisynapse"],
            selection_rule="Audio bytes must exist before DNA finalization, Soulprint hashing, VICS issuance, catalog registration, or payment receipt closure.",
            payloads={},
        )
    )

    all_selected = [provider_id for stage in stages for provider_id in stage.providers]
    for provider_id in all_selected:
        spec = provider_registry().get(provider_id)
        if spec and spec.get("constraints", {}).get("commercial_license_review_required"):
            warnings.append(f"{provider_id} requires a deployment-specific commercial license review.")

    primary = selected[0]
    fallback = [provider_id for provider_id in ranked if provider_id != primary]
    return EngineExecutionPlan(
        registry_id=registry["registry_id"],
        request_fingerprint=_request_fingerprint(request),
        primary_provider=primary,
        fallback_providers=fallback,
        stages=stages,
        excluded_providers=excluded,
        proof_handoff=[
            "final audio bytes",
            "final DNA tag",
            "audio-bound Soulprint",
            "VICS proof",
            "catalog registration",
            "Flip lineage",
            "Archisynapse receipt",
        ],
        warnings=warnings,
    )
