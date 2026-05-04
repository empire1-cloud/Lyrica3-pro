"""
Intent Tokenizer — Phase 1
Converts a Soulfire Schema dict into a flat conditioning vector
suitable for ACE-Step 1.5 XL / AudioLDM2 / MusicGen2.

Conditioning dimensions:
  - emotion_vec:     16-D (vulnerability, grief, rage, joy, longing, …)
  - timbre_tokens:   8-D  (genre_id, subgenre_id, era, instrumentation_mask)
  - groove_tokens:   4-D  (bpm_norm, swing, pocket_offset, density)
  - vocal_tokens:    8-D  (voice_type, language, artifact_mask, vulnerability)
  - lyric_embedding: 768-D (sentence-transformer of lyrics_payload.body)

Total: 804-D conditioning vector per render call.
"""

from __future__ import annotations
import hashlib, json
from dataclasses import dataclass, field
from typing import Any


# ---------------------------------------------------------------------------
# Genre / emotion lookup tables (Phase 1 — symbolic; Phase 2 adds neural)
# ---------------------------------------------------------------------------

GENRE_IDS: dict[str, int] = {
    "SGV_SOULFUL_TRAP": 0,
    "CHICANO_RAP":      1,
    "CORRIDO_TUMBADO":  2,
    "SOUL_RNB":         3,
    "CUMBIA_FUSION":    4,
    "AMBIENT_TEXTURA":  5,
    "OTHER":            63,
}

EMOTION_DIMS = [
    "vulnerability", "grief", "rage", "joy",
    "longing", "nostalgia", "resilience", "tenderness",
    "anxiety", "defiance", "wonder", "shame",
    "pride", "desire", "peace", "awe",
]


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class ConditioningVector:
    """Flat conditioning payload sent to the Aural Core renderer."""
    emotion_vec:      list[float]   = field(default_factory=lambda: [0.0] * 16)
    timbre_tokens:    list[float]   = field(default_factory=lambda: [0.0] * 8)
    groove_tokens:    list[float]   = field(default_factory=lambda: [0.0] * 4)
    vocal_tokens:     list[float]   = field(default_factory=lambda: [0.0] * 8)
    lyric_embedding:  list[float]   = field(default_factory=lambda: [0.0] * 768)
    schema_hash:      str           = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "emotion_vec":     self.emotion_vec,
            "timbre_tokens":   self.timbre_tokens,
            "groove_tokens":   self.groove_tokens,
            "vocal_tokens":    self.vocal_tokens,
            "lyric_embedding": self.lyric_embedding,
            "schema_hash":     self.schema_hash,
        }


# ---------------------------------------------------------------------------
# Tokenizer
# ---------------------------------------------------------------------------

class SoulfireIntentTokenizer:
    """
    Phase 1: symbolic rule-based tokenizer.
    Phase 2: swap lyric_embedding with a real sentence-transformer call.
    """

    def tokenize(self, schema: dict[str, Any]) -> ConditioningVector:
        vec = ConditioningVector()
        vec.schema_hash = self._hash(schema)

        # --- emotion_vec from creative_intent_trace ---
        cit = schema.get("creative_intent_trace", {})
        emotional_arc = cit.get("emotional_arc", {})
        for i, dim in enumerate(EMOTION_DIMS):
            vec.emotion_vec[i] = float(emotional_arc.get(dim, 0.0))

        # Vulnerability is the master affect dial across all tracks
        vuln = schema.get("track_metadata", {}).get("vulnerability_level", 0.5)
        vec.emotion_vec[0] = float(vuln)

        # --- timbre_tokens from track_metadata ---
        tm = schema.get("track_metadata", {})
        genre_key = tm.get("genre", "OTHER").upper().replace(" ", "_")
        vec.timbre_tokens[0] = float(GENRE_IDS.get(genre_key, 63)) / 63.0
        subgenre = tm.get("subgenre", "")
        vec.timbre_tokens[1] = float(GENRE_IDS.get(subgenre.upper().replace(" ", "_"), 63)) / 63.0
        era_norm = max(0.0, min(1.0, (int(tm.get("era", 2020)) - 1950) / 80.0))
        vec.timbre_tokens[2] = era_norm

        # --- groove_tokens from acoustic_primitives ---
        ap = schema.get("acoustic_primitives", {})
        bpm = float(ap.get("bpm", 90))
        vec.groove_tokens[0] = max(0.0, min(1.0, (bpm - 40) / 160.0))   # norm to [0,1]
        vec.groove_tokens[1] = float(ap.get("swing", 0.5))
        vec.groove_tokens[2] = float(ap.get("late_pocket_offset_ms", 0)) / 30.0
        vec.groove_tokens[3] = float(ap.get("density", 0.5))

        # --- vocal_tokens from epd_vocal_blueprint ---
        evb = schema.get("epd_vocal_blueprint", {})
        voice_map = {"male": 0.0, "female": 1.0, "non_binary": 0.5, "ensemble": 0.75}
        vec.vocal_tokens[0] = voice_map.get(evb.get("voice_type", "male").lower(), 0.0)
        lang_map = {"english": 0.0, "spanish": 1.0, "bilingual": 0.5}
        vec.vocal_tokens[1] = lang_map.get(evb.get("language", "english").lower(), 0.0)
        vec.vocal_tokens[2] = float(evb.get("artifact_intensity", 0.0))
        vec.vocal_tokens[3] = float(evb.get("vulnerability_level", vuln))

        # --- lyric_embedding: Phase 1 = TF-IDF bag-of-words stub ---
        # Phase 2: replace with all-MiniLM-L6-v2 sentence embedding
        lyrics_body = schema.get("lyrics_payload", {}).get("body", "")
        vec.lyric_embedding = self._bag_of_words_stub(lyrics_body)

        return vec

    # ------------------------------------------------------------------
    def _hash(self, schema: dict[str, Any]) -> str:
        raw = json.dumps(schema, sort_keys=True, ensure_ascii=False).encode()
        return hashlib.sha256(raw).hexdigest()

    def _bag_of_words_stub(self, text: str) -> list[float]:
        """
        Phase 1 stub: hash-based pseudo-embedding.
        Replaced by real sentence-transformer in Phase 2.
        """
        words = text.lower().split()
        vec = [0.0] * 768
        for w in words:
            h = int(hashlib.md5(w.encode()).hexdigest(), 16)
            idx = h % 768
            vec[idx] = min(1.0, vec[idx] + 0.1)
        # L2 normalize
        norm = sum(x**2 for x in vec) ** 0.5 or 1.0
        return [x / norm for x in vec]
