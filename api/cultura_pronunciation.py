from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path
from typing import Any, Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field


ROOT_DIR = Path(__file__).resolve().parents[1]
POLICY_PATH = ROOT_DIR / "canon" / "cultura" / "pronunciation_policy_v1.json"

LanguageKind = Literal["english", "spanish", "spanglish", "calo", "nahuatl"]
ReviewStatus = Literal["not_required", "pending", "approved", "rejected"]
SourceKind = Literal[
    "community_speaker",
    "linguistic_reference",
    "dictionary",
    "artist_declaration",
    "reference_index",
]
Sensitivity = Literal["ordinary", "heritage", "ceremonial", "sacred"]
ReuseMode = Literal["single_release", "evaluation_only", "training_asset"]
TrainingDataStatus = Literal["not_used", "licensed", "community_approved", "unlicensed", "unknown"]


class PronunciationSource(BaseModel):
    kind: SourceKind
    title: str = Field(min_length=1, max_length=300)
    locator: str = Field(min_length=1, max_length=1000)
    license_or_permission: str | None = Field(default=None, max_length=500)


class PronunciationToken(BaseModel):
    text: str = Field(min_length=1, max_length=300)
    language: LanguageKind
    ipa: str | None = Field(default=None, max_length=300)
    nahuatl_variant: str | None = Field(default=None, max_length=160)
    vowel_length_handling: Literal["unspecified", "not_present", "marked", "dialect_specific"] = "unspecified"
    saltillo_handling: Literal["unspecified", "not_present", "ipa_glottal_stop", "ipa_h", "dialect_specific"] = "unspecified"
    borrowed_form: bool = False
    preserve_surface_form: bool = True
    source: PronunciationSource | None = None
    human_pronunciation_review: ReviewStatus = "not_required"


class CulturaPronunciationPlan(BaseModel):
    lyric_line: str = Field(min_length=1, max_length=4000)
    tokens: list[PronunciationToken] = Field(min_length=1, max_length=300)
    cultural_context: str = Field(default="", max_length=4000)
    sensitivity: Sensitivity = "ordinary"
    community_review: ReviewStatus = "not_required"
    community_reviewer_reference: str | None = Field(default=None, max_length=500)
    permission_reference: str | None = Field(default=None, max_length=1000)
    attribution_note: str | None = Field(default=None, max_length=2000)
    auto_translate_code_switching: bool = False
    reuse_mode: ReuseMode = "single_release"
    training_data_status: TrainingDataStatus = "not_used"
    contributor_compensation_plan: str | None = Field(default=None, max_length=2000)


def _load_policy() -> dict[str, Any]:
    try:
        payload = json.loads(POLICY_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError("Cultura pronunciation policy is unavailable or invalid.") from exc
    if not isinstance(payload, dict):
        raise RuntimeError("Cultura pronunciation policy must be a JSON object.")
    return payload


def _digest(payload: dict[str, Any]) -> str:
    body = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return f"cultura_pronunciation_sha256_{hashlib.sha256(body).hexdigest()}"


def _is_specific_nahuatl_variant(value: str | None) -> bool:
    normalized = (value or "").strip().casefold().replace("-", "_").replace(" ", "_")
    return bool(normalized) and normalized not in {
        "nahuatl",
        "nahuatl_language",
        "nahuatl_languages",
        "generic_nahuatl",
        "unspecified",
        "unknown",
    }


def _source_is_release_evidence(source: PronunciationSource | None) -> bool:
    return bool(source and source.kind != "reference_index" and source.locator.strip())


def analyze_language_behavior(tokens: list[PronunciationToken]) -> dict[str, Any]:
    languages = [token.language for token in tokens]
    language_set = set(languages)
    code_switching_present = "spanglish" in language_set or (
        "english" in language_set and "spanish" in language_set
    )
    return {
        "languages": sorted(language_set),
        "code_switching_present": code_switching_present,
        "linguistic_borrowing_present": any(token.borrowed_form for token in tokens),
        "calo_present": "calo" in language_set,
        "nahuatl_present": "nahuatl" in language_set,
        "surface_forms_preserved": all(token.preserve_surface_form for token in tokens),
        "principle": (
            "Code-switching and linguistic borrowing are distinct creative behaviors; "
            "neither is automatically treated as an error."
        ),
    }


def evaluate_pronunciation_plan(plan: CulturaPronunciationPlan) -> dict[str, Any]:
    token_findings: list[dict[str, Any]] = []
    hard_blocks: list[str] = []
    review_items: list[str] = []

    for index, token in enumerate(plan.tokens):
        findings: list[str] = []
        if token.language == "nahuatl":
            if not _is_specific_nahuatl_variant(token.nahuatl_variant):
                findings.append("nahuatl_variant_required")
            if not (token.ipa or "").strip():
                findings.append("ipa_required")
            if token.vowel_length_handling == "unspecified":
                findings.append("vowel_length_handling_required")
            if token.saltillo_handling == "unspecified":
                findings.append("saltillo_handling_required")
            if not _source_is_release_evidence(token.source):
                findings.append("release_grade_source_required")
            if token.human_pronunciation_review != "approved":
                findings.append("human_pronunciation_review_required")
            if token.human_pronunciation_review == "rejected":
                hard_blocks.append(f"token_{index}_pronunciation_rejected")

        if token.language in {"spanglish", "calo"} and not token.preserve_surface_form:
            findings.append("surface_form_normalization_requires_review")

        if findings:
            review_items.extend(f"token_{index}:{finding}" for finding in findings)
        token_findings.append(
            {
                "index": index,
                "text": token.text,
                "language": token.language,
                "findings": findings,
                "accepted": not findings,
            }
        )

    language_behavior = analyze_language_behavior(plan.tokens)
    has_cultural_language = any(token.language in {"spanglish", "calo", "nahuatl"} for token in plan.tokens)
    has_nahuatl = language_behavior["nahuatl_present"]

    checks = {
        "cultural_context_documented": bool(plan.cultural_context.strip()) if has_cultural_language else True,
        "code_switching_preserved": not plan.auto_translate_code_switching,
        "surface_forms_preserved": language_behavior["surface_forms_preserved"],
        "nahuatl_dialect_specificity": all(
            _is_specific_nahuatl_variant(token.nahuatl_variant)
            for token in plan.tokens
            if token.language == "nahuatl"
        ),
        "nahuatl_ipa_complete": all(
            bool((token.ipa or "").strip())
            and token.vowel_length_handling != "unspecified"
            and token.saltillo_handling != "unspecified"
            for token in plan.tokens
            if token.language == "nahuatl"
        ),
        "source_traceability": all(
            _source_is_release_evidence(token.source)
            for token in plan.tokens
            if token.language == "nahuatl"
        ),
        "human_pronunciation_review": all(
            token.human_pronunciation_review == "approved"
            for token in plan.tokens
            if token.language == "nahuatl"
        ),
        "community_review": (
            plan.community_review == "approved"
            if has_nahuatl or plan.sensitivity in {"heritage", "ceremonial", "sacred"}
            else plan.community_review in {"not_required", "approved"}
        ),
        "community_reviewer_traceable": (
            bool((plan.community_reviewer_reference or "").strip())
            if plan.community_review == "approved"
            else not (has_nahuatl or plan.sensitivity in {"heritage", "ceremonial", "sacred"})
        ),
        "sacred_or_ceremonial_permission": (
            bool((plan.permission_reference or "").strip())
            if plan.sensitivity in {"ceremonial", "sacred"}
            else True
        ),
        "attribution_present": bool((plan.attribution_note or "").strip()) if has_cultural_language else True,
        "training_data_rights": plan.training_data_status in {"not_used", "licensed", "community_approved"},
        "training_asset_compensation": (
            bool((plan.contributor_compensation_plan or "").strip())
            if plan.reuse_mode == "training_asset"
            else True
        ),
    }

    if plan.training_data_status in {"unlicensed", "unknown"}:
        hard_blocks.append("training_data_rights_unresolved")
    if plan.community_review == "rejected":
        hard_blocks.append("community_review_rejected")
    if plan.sensitivity in {"ceremonial", "sacred"} and not plan.permission_reference:
        hard_blocks.append("ceremonial_or_sacred_permission_missing")
    if plan.auto_translate_code_switching:
        review_items.append("automatic_code_switch_translation_requested")

    failed_checks = [name for name, passed in checks.items() if not passed]
    all_clear = not hard_blocks and not review_items and not failed_checks
    status = "release_eligible" if all_clear else "blocked" if hard_blocks else "review_required"

    canonical = plan.model_dump(mode="json")
    return {
        "status": status,
        "release_eligible": status == "release_eligible",
        "language_behavior": language_behavior,
        "checks": checks,
        "failed_checks": failed_checks,
        "hard_blocks": sorted(set(hard_blocks)),
        "review_items": sorted(set(review_items)),
        "token_findings": token_findings,
        "plan_digest": _digest(canonical),
        "truth_boundary": {
            "ipa_is_not_community_permission": True,
            "reference_index_is_not_release_evidence": True,
            "code_switching_is_not_automatically_corrected": True,
            "release_requires_human_review_for_nahuatl": has_nahuatl,
        },
    }


def capabilities() -> dict[str, Any]:
    policy = _load_policy()
    return {
        "name": "Cultura Vocal Forge Pronunciation Gate",
        "policy_version": policy["schema_version"],
        "supported_language_behaviors": copy.deepcopy(policy["supported_language_behaviors"]),
        "nahuatl_requirements": copy.deepcopy(policy["nahuatl_requirements"]),
        "release_gates": copy.deepcopy(policy["release_gates"]),
        "reference_index": copy.deepcopy(policy["reference_index"]),
        "policy_digest": _digest(policy),
    }


def create_cultura_pronunciation_router() -> APIRouter:
    router = APIRouter(tags=["cultura-pronunciation"])

    @router.get("/cultura/pronunciation/capabilities")
    async def get_capabilities():
        return capabilities()

    @router.post("/cultura/pronunciation/validate")
    async def validate_pronunciation(plan: CulturaPronunciationPlan):
        return evaluate_pronunciation_plan(plan)

    @router.post("/cultura/release-language-gate")
    async def release_language_gate(plan: CulturaPronunciationPlan):
        return evaluate_pronunciation_plan(plan)

    return router
