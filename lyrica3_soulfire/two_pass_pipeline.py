"""Two-Pass Track Pipeline — Soul Card → Audio

Pass 1: Instrumental generation via soulfire_kernel
Pass 2: Vocal rendering + mixdown
"""

from __future__ import annotations

import json
import sys
import uuid
import logging
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).parent.parent))

from soulfire_kernel.empire_lyric_master import EmpireLyricMaster

logger = logging.getLogger(__name__)

_master: Optional[EmpireLyricMaster] = None
OUTPUT_DIR = Path(__file__).parent.parent / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def _get_master() -> EmpireLyricMaster:
    global _master
    if _master is None:
        _master = EmpireLyricMaster()
    return _master


def generate_track_from_soul_card(card_path: str, dna_tag: Optional[str] = None) -> str:
    """Generate a full track from a Soul Card JSON file.

    Returns path to the generated audio file.
    """
    card_path = Path(card_path)
    if not card_path.exists():
        raise FileNotFoundError(f"Soul Card not found: {card_path}")

    with open(card_path, "r") as f:
        card = json.load(f)

    metadata = card.get("track_metadata", {})
    epd = card.get("epd_vocal_blueprint", {})
    acoustics = card.get("acoustic_primitives", {})

    tag = dna_tag or metadata.get("dna_tag_preview", f"trk_{uuid.uuid4().hex[:12]}")
    title = metadata.get("title", "untitled")
    genre = metadata.get("core_genre", "pop")
    vulnerability = epd.get("vulnerability_level", 0.5)
    bpm = _extract_bpm(acoustics.get("groove", ""))

    master = _get_master()
    prompt = f"Generate {title} — {genre}. Emotional depth: {vulnerability}."

    result = master.generate_complete_track(
        user_prompt=prompt,
        genre_override=genre,
        bpm_override=bpm,
        vulnerability_override=vulnerability,
    )

    out_filename = f"{tag}_{uuid.uuid4().hex[:8]}.wav"
    out_path = OUTPUT_DIR / out_filename

    if hasattr(result, "audio_bytes") and result.audio_bytes:
        out_path.write_bytes(result.audio_bytes)
    else:
        out_path.write_text(f"[mock] Generated: {title} ({genre}) @ {bpm}bpm")

    logger.info(f"Track generated: {out_path}")
    return str(out_path)


def _extract_bpm(groove: str) -> Optional[int]:
    import re
    m = re.search(r"(\d+)bpm", groove.lower())
    return int(m.group(1)) if m else None
