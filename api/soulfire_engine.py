import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from soulfire_kernel.empire_lyric_master import EmpireLyricMaster
from .lyric_master_engine import LyricMasterEngine, LyricMasterRequest

_master = None
_lyric_master = None


def _get_master():
    global _master
    if _master is None:
        _master = EmpireLyricMaster()
    return _master


def _get_lyric_master():
    global _lyric_master
    if _lyric_master is None:
        _lyric_master = LyricMasterEngine()
    return _lyric_master


def generate_soulfire(prompt: str, persona: str, dna: dict, use_neural: bool = True) -> dict:
    """Generate a full lyric master, then enrich it with track metadata.

    Lyric generation is local-first and does not depend on the legacy full-track
    orchestrator succeeding. This prevents empty lyric responses while keeping
    the existing rhythm/mastering blueprint path intact.
    """
    vulnerability = float(dna.get("vulnerability", 0.5))
    warmth = float(dna.get("warmth", 0.5))
    mood = "vulnerable" if vulnerability >= 0.7 else "honest"
    lyric_result = _get_lyric_master().master(
        LyricMasterRequest(
            concept=prompt,
            genre=str(dna.get("genre", "Contemporary R&B")),
            mood=mood,
            language="en",
            cultural_context=[persona] if persona else [],
            creator_id=persona or None,
            seed=int(dna.get("seed", 113)),
        )
    )

    track_status = "lyric_master_only"
    generation_time_ms = 0.0
    genre = str(dna.get("genre", "Contemporary R&B"))
    bpm = int(dna.get("bpm", 90))
    track_warnings = []

    try:
        track_result = _get_master().generate_complete_track(
            user_prompt=prompt,
            genre_override=None,
            bpm_override=None,
            vulnerability_override=vulnerability,
        )
        track_status = track_result.status
        generation_time_ms = track_result.generation_time_ms
        genre = track_result.track_metadata.get("genre") or genre
        bpm = track_result.track_metadata.get("bpm") or bpm
        track_warnings = list(track_result.warnings)
    except Exception as exc:
        track_warnings.append(f"Legacy track blueprint unavailable: {type(exc).__name__}")

    dna_tag = f"duo_{persona}_vuln{vulnerability:.2f}_warm{warmth:.2f}"
    return {
        "lyrics": lyric_result.lyrics_text,
        "dna_tag": dna_tag,
        "persona": persona,
        "dna": dna,
        "use_neural": use_neural,
        "status": "success" if lyric_result.status in {"mastered", "needs_revision"} else track_status,
        "generation_time_ms": generation_time_ms,
        "genre": genre,
        "bpm": bpm,
        "lyric_master": {
            "lyric_id": lyric_result.lyric_id,
            "status": lyric_result.status,
            "scores": lyric_result.scores.model_dump(),
            "revision_notes": lyric_result.revision_notes,
            "ownership_manifest": lyric_result.ownership_manifest,
            "soulfire_lyrics": lyric_result.soulfire_lyrics,
        },
        "warnings": lyric_result.warnings + track_warnings,
    }
