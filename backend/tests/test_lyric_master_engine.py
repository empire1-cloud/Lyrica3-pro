from api.lyric_master_engine import LyricMasterEngine, LyricMasterRequest


def test_generate_full_song_is_deterministic_and_soulfire_compatible():
    engine = LyricMasterEngine()
    request = LyricMasterRequest(
        concept="learning to choose myself after a late-night breakup",
        genre="SGV Oldies / Contemporary R&B",
        mood="late-night honesty",
        language="bilingual",
        cultural_context=["San Gabriel Valley", "lowrider soul", "family dignity"],
        must_include=["I choose myself"],
        creator_id="cre_manda",
        seed=113,
    )

    first = engine.master(request)
    second = engine.master(request)

    assert first.lyric_id == second.lyric_id
    assert first.lyrics_text == second.lyrics_text
    assert len(first.sections) == len(request.structure)
    assert len(first.soulfire_lyrics) >= 24
    assert all("text" in line and "lml_tags" in line for line in first.soulfire_lyrics)
    assert first.ownership_manifest["external_api_used"] is False
    assert first.ownership_manifest["content_sha256"]


def test_chorus_has_repeatable_hook_and_lml_tags():
    result = LyricMasterEngine().master(
        LyricMasterRequest(concept="reclaiming my voice", structure=["verse_1", "chorus", "bridge"])
    )
    chorus = next(section for section in result.sections if section.name == "chorus")
    assert chorus.lines[0].text == chorus.lines[2].text
    assert "<double_vocal>" in chorus.lines[0].lml_tags
    assert result.scores.hook_strength >= 0.7


def test_avoid_phrases_are_removed_case_insensitively():
    result = LyricMasterEngine().master(
        LyricMasterRequest(
            concept="a neon breakup memory",
            avoid_phrases=["rearview", "borrow my name"],
            structure=["verse_1", "chorus"],
        )
    )
    lowered = result.lyrics_text.lower()
    assert "rearview" not in lowered
    assert "borrow my name" not in lowered


def test_analyze_requires_existing_lyrics():
    engine = LyricMasterEngine()
    try:
        engine.master(LyricMasterRequest(concept="analyze this", mode="analyze"))
    except ValueError as exc:
        assert "existing_lyrics is required" in str(exc)
    else:
        raise AssertionError("analyze mode must fail closed without lyrics")


def test_analyze_preserves_sections_and_returns_scores():
    result = LyricMasterEngine().master(
        LyricMasterRequest(
            concept="surviving grief without losing identity",
            mode="analyze",
            existing_lyrics="""[Verse 1]\nThe porch light waited by the phone\nI kept the last voicemail in a shoebox\n\n[Chorus]\nWhat I survived still belongs to me\nWhat I survived still belongs to me\n""",
            cultural_context=["family", "porch light"],
        )
    )
    assert result.status == "analyzed"
    assert [section.name for section in result.sections] == ["verse_1", "chorus"]
    assert result.scores.overall > 0
    assert result.lyrics_text.count("What I survived") == 2


def test_rewrite_replaces_weak_generic_lines_with_specific_detail():
    result = LyricMasterEngine().master(
        LyricMasterRequest(
            concept="starting over after betrayal",
            mode="rewrite",
            existing_lyrics="[Verse]\nLove hurts\nI feel pain\n",
            seed=7,
        )
    )
    assert "Love hurts" not in result.lyrics_text
    assert result.scores.specificity > 0.38


def test_second_person_changes_pronoun_surface():
    result = LyricMasterEngine().master(
        LyricMasterRequest(
            concept="reclaiming a voice",
            perspective="second_person",
            structure=["verse_1"],
            seed=1,
        )
    )
    assert any(line.text.startswith("You ") for line in result.sections[0].lines)
