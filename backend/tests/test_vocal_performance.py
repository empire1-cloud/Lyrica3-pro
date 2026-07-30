import json
from pathlib import Path

from api.cultura_pronunciation import CulturaPronunciationPlan, PronunciationToken
from api.vocal_expression import (
    PerformanceDirection,
    PerformanceMoment,
    capabilities,
    resolve_performance_plan,
)
from api.vocal_forge import ScoreNote, VocalGuideRequest
from api.vocal_performance import (
    PerformanceRenderRequest,
    preflight_performance_render,
    render_performance,
)


def guide_factory(**overrides):
    payload = {
        "project_id": "project-performance-1",
        "creator_id": "creator-performance-1",
        "title": "Performance Guide",
        "bpm": 110,
        "release_intent": "research",
        "notes": [
            ScoreNote(midi_note=60, start_beat=0, duration_beats=1, syllable="stay"),
            ScoreNote(midi_note=64, start_beat=1, duration_beats=1, syllable="close"),
        ],
    }
    payload.update(overrides)
    return VocalGuideRequest(**payload)


def render_request(style="natural", moments=None, **guide_overrides):
    return PerformanceRenderRequest(
        guide=guide_factory(**guide_overrides),
        performance=PerformanceDirection(
            style=style,
            intensity=0.8,
            moments=moments or [],
        ),
    )


def test_creator_facing_styles_and_controls_are_exposed():
    result = capabilities()
    style_names = {item["name"] for item in result["styles"]}
    control_labels = {item["label"] for item in result["moment_controls"]}
    assert {"Natural", "Intimate", "Gritty", "Soaring", "Corrido"} <= style_names
    assert {
        "Add breath",
        "Let the voice crack",
        "Add vocal fry",
        "Push harder",
        "Hold back",
        "Add a melodic run",
        "Add hesitation",
    } <= control_labels


def test_out_of_range_performance_moment_is_blocked():
    request = render_request(
        moments=[PerformanceMoment(note_index=9, effect="crack", amount=0.8)]
    )
    result = preflight_performance_render(request)
    assert not result["eligible"]
    assert "note_9_performance_target_out_of_range" in result["blocks"]


def test_duplicate_performance_moment_is_blocked():
    direction = PerformanceDirection(
        style="gritty",
        moments=[
            PerformanceMoment(note_index=0, effect="fry", amount=0.4),
            PerformanceMoment(note_index=0, effect="fry", amount=0.8),
        ],
    )
    result = resolve_performance_plan(direction, 2)
    assert not result["eligible"]
    assert "note_0_fry_duplicate" in result["findings"]


def test_same_performance_produces_same_audio_hash(tmp_path, monkeypatch):
    monkeypatch.setenv("VOCAL_FORGE_ARTIFACT_DIR", str(tmp_path))
    request = render_request(
        style="intimate",
        moments=[PerformanceMoment(note_index=1, effect="breath", amount=0.75)],
    )
    first = render_performance(request)
    second = render_performance(request)
    assert first["artifact_id"] == second["artifact_id"]
    assert first["audio_sha256"] == second["audio_sha256"]


def test_performance_styles_change_the_audio(tmp_path, monkeypatch):
    monkeypatch.setenv("VOCAL_FORGE_ARTIFACT_DIR", str(tmp_path))
    intimate = render_performance(render_request(style="intimate"))
    soaring = render_performance(render_request(style="soaring"))
    assert intimate["audio_sha256"] != soaring["audio_sha256"]
    assert intimate["public_summary"]["style"] == "Intimate"
    assert soaring["public_summary"]["style"] == "Soaring"


def test_timeline_moment_changes_audio_and_receipt(tmp_path, monkeypatch):
    monkeypatch.setenv("VOCAL_FORGE_ARTIFACT_DIR", str(tmp_path))
    plain = render_performance(render_request(style="natural"))
    cracked = render_performance(
        render_request(
            style="natural",
            moments=[PerformanceMoment(note_index=1, effect="crack", amount=1.0)],
        )
    )
    assert plain["audio_sha256"] != cracked["audio_sha256"]
    assert cracked["receipt"]["performance_moments"] == [
        {"note_index": 1, "effect": "crack", "amount": 1.0}
    ]
    assert cracked["receipt"]["performance_plan_digest"].startswith(
        "vocal_expression_sha256_"
    )


def test_release_receipt_preserves_performance_and_signing(tmp_path, monkeypatch):
    monkeypatch.setenv("VOCAL_FORGE_ARTIFACT_DIR", str(tmp_path))
    monkeypatch.setenv("VOCAL_FORGE_RECEIPT_SIGNING_KEY", "p" * 40)
    plan = CulturaPronunciationPlan(
        lyric_line="Stay close",
        tokens=[
            PronunciationToken(text="Stay", language="english"),
            PronunciationToken(text="close", language="english"),
        ],
    )
    guide = guide_factory(
        release_intent="release",
        pronunciation_plan=plan,
        notes=[
            ScoreNote(
                midi_note=60,
                start_beat=0,
                duration_beats=1,
                syllable="stay",
                pronunciation_token_index=0,
            ),
            ScoreNote(
                midi_note=64,
                start_beat=1,
                duration_beats=1,
                syllable="close",
                pronunciation_token_index=1,
            ),
        ],
    )
    result = render_performance(
        PerformanceRenderRequest(
            guide=guide,
            performance=PerformanceDirection(
                style="gritty",
                moments=[PerformanceMoment(note_index=0, effect="hold_back", amount=0.5)],
            ),
        )
    )
    assert result["receipt"]["signature"]["status"] == "signed"
    assert result["receipt"]["performance_public_name"] == "Gritty"
    receipt_path = Path(tmp_path) / f"{result['artifact_id']}.receipt.json"
    persisted = json.loads(receipt_path.read_text())
    assert persisted["audio_sha256"] == result["audio_sha256"]
