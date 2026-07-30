from __future__ import annotations

from api.cultura_pronunciation import (
    CulturaPronunciationPlan,
    PronunciationSource,
    PronunciationToken,
    analyze_language_behavior,
    evaluate_pronunciation_plan,
)


def community_source() -> PronunciationSource:
    return PronunciationSource(
        kind="community_speaker",
        title="Community pronunciation review",
        locator="review:cultura-nahuatl-001",
        license_or_permission="Approved for this release",
    )


def approved_nahuatl_token(**overrides) -> PronunciationToken:
    payload = {
        "text": "xochitl",
        "language": "nahuatl",
        "ipa": "ˈʃoːtʃitɬ",
        "nahuatl_variant": "Classical Nahuatl",
        "vowel_length_handling": "marked",
        "saltillo_handling": "not_present",
        "source": community_source(),
        "human_pronunciation_review": "approved",
    }
    payload.update(overrides)
    return PronunciationToken(**payload)


def approved_plan(**overrides) -> CulturaPronunciationPlan:
    payload = {
        "lyric_line": "Carry the xochitl home",
        "tokens": [
            PronunciationToken(text="Carry", language="english"),
            PronunciationToken(text="the", language="english"),
            approved_nahuatl_token(),
            PronunciationToken(text="home", language="english"),
        ],
        "cultural_context": "The flower image is used as an attributed heritage reference, not as ceremonial language.",
        "sensitivity": "heritage",
        "community_review": "approved",
        "community_reviewer_reference": "reviewer:cultura-community-001",
        "attribution_note": "Pronunciation and cultural context reviewed with the named community contributor.",
        "training_data_status": "not_used",
    }
    payload.update(overrides)
    return CulturaPronunciationPlan(**payload)


def test_spanglish_is_preserved_and_not_treated_as_borrowing():
    tokens = [
        PronunciationToken(text="I", language="english"),
        PronunciationToken(text="remember", language="english"),
        PronunciationToken(text="mi barrio", language="spanish"),
        PronunciationToken(text="every night", language="spanglish"),
    ]
    result = analyze_language_behavior(tokens)

    assert result["code_switching_present"] is True
    assert result["linguistic_borrowing_present"] is False
    assert result["surface_forms_preserved"] is True


def test_linguistic_borrowing_is_recorded_separately():
    tokens = [
        PronunciationToken(
            text="puchando",
            language="calo",
            borrowed_form=True,
            preserve_surface_form=True,
        )
    ]
    result = analyze_language_behavior(tokens)

    assert result["code_switching_present"] is False
    assert result["linguistic_borrowing_present"] is True
    assert result["calo_present"] is True


def test_generic_nahuatl_and_reference_index_do_not_pass_release_gate():
    plan = approved_plan(
        tokens=[
            approved_nahuatl_token(
                nahuatl_variant="Nahuatl",
                source=PronunciationSource(
                    kind="reference_index",
                    title="Wikipedia category: Pages with Nahuatl languages IPA",
                    locator="https://en.wikipedia.org/wiki/Category:Pages_with_Nahuatl_languages_IPA",
                ),
            )
        ]
    )
    result = evaluate_pronunciation_plan(plan)

    assert result["release_eligible"] is False
    assert result["status"] == "review_required"
    assert "nahuatl_dialect_specificity" in result["failed_checks"]
    assert "source_traceability" in result["failed_checks"]
    assert result["truth_boundary"]["reference_index_is_not_release_evidence"] is True


def test_missing_ipa_length_saltillo_and_human_review_are_exposed():
    plan = approved_plan(
        tokens=[
            approved_nahuatl_token(
                ipa=None,
                vowel_length_handling="unspecified",
                saltillo_handling="unspecified",
                human_pronunciation_review="pending",
            )
        ]
    )
    result = evaluate_pronunciation_plan(plan)

    findings = set(result["token_findings"][0]["findings"])
    assert "ipa_required" in findings
    assert "vowel_length_handling_required" in findings
    assert "saltillo_handling_required" in findings
    assert "human_pronunciation_review_required" in findings
    assert result["status"] == "review_required"


def test_calo_is_not_automatically_normalized():
    plan = CulturaPronunciationPlan(
        lyric_line="We keep it firme in the barrio",
        tokens=[
            PronunciationToken(text="We keep it", language="english"),
            PronunciationToken(text="firme", language="calo", preserve_surface_form=True),
            PronunciationToken(text="in the barrio", language="spanglish", preserve_surface_form=True),
        ],
        cultural_context="SGV barrio language is intentionally preserved as the narrator's own voice.",
        community_review="not_required",
        attribution_note="Creator-authored Chicano language.",
        training_data_status="not_used",
    )
    result = evaluate_pronunciation_plan(plan)

    assert result["checks"]["code_switching_preserved"] is True
    assert result["checks"]["surface_forms_preserved"] is True
    assert result["release_eligible"] is True


def test_automatic_translation_of_code_switching_requires_review():
    plan = CulturaPronunciationPlan(
        lyric_line="I came home con todo mi corazon",
        tokens=[
            PronunciationToken(text="I came home", language="english"),
            PronunciationToken(text="con todo mi corazon", language="spanish"),
        ],
        cultural_context="Intentional bilingual confession.",
        attribution_note="Creator-authored bilingual line.",
        auto_translate_code_switching=True,
        training_data_status="not_used",
    )
    result = evaluate_pronunciation_plan(plan)

    assert result["release_eligible"] is False
    assert "code_switching_preserved" in result["failed_checks"]
    assert "automatic_code_switch_translation_requested" in result["review_items"]


def test_sacred_material_without_permission_is_blocked():
    plan = approved_plan(sensitivity="sacred", permission_reference=None)
    result = evaluate_pronunciation_plan(plan)

    assert result["status"] == "blocked"
    assert "ceremonial_or_sacred_permission_missing" in result["hard_blocks"]
    assert result["checks"]["sacred_or_ceremonial_permission"] is False


def test_training_asset_requires_rights_and_compensation():
    plan = approved_plan(
        reuse_mode="training_asset",
        training_data_status="unknown",
        contributor_compensation_plan=None,
    )
    result = evaluate_pronunciation_plan(plan)

    assert result["status"] == "blocked"
    assert "training_data_rights_unresolved" in result["hard_blocks"]
    assert result["checks"]["training_asset_compensation"] is False


def test_fully_reviewed_nahuatl_plan_can_pass():
    result = evaluate_pronunciation_plan(approved_plan())

    assert result["status"] == "release_eligible"
    assert result["release_eligible"] is True
    assert all(result["checks"].values())
    assert result["hard_blocks"] == []
    assert result["review_items"] == []
    assert result["plan_digest"].startswith("cultura_pronunciation_sha256_")
