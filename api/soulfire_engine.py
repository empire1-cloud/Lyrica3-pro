import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from soulfire_kernel.empire_lyric_master import EmpireLyricMaster

_master = None

def _get_master():
    global _master
    if _master is None:
        _master = EmpireLyricMaster()
    return _master

def generate_soulfire(prompt: str, persona: str, dna: dict, use_neural: bool = True) -> dict:
    master = _get_master()
    dna_tag = f"duo_{persona}_vuln{dna.get('vulnerability', 0.5):.2f}_warm{dna.get('warmth', 0.5):.2f}"
    result = master.generate_complete_track(
        user_prompt=prompt,
        genre_override=None,
        bpm_override=None,
        vulnerability_override=dna.get("vulnerability", 0.5)
    )
    lyrics_text = "\n".join(
        line.get("text", "") for line in result.lyrics
    )
    return {
        "lyrics": lyrics_text or f"[{persona}] {prompt}",
        "dna_tag": dna_tag,
        "persona": persona,
        "dna": dna,
        "use_neural": use_neural,
        "status": result.status,
        "generation_time_ms": result.generation_time_ms,
        "genre": result.track_metadata.get("genre"),
        "bpm": result.track_metadata.get("bpm"),
    }
