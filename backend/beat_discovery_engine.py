"""Local, deterministic, creator-safe beat discovery for Lyrica 3."""
from __future__ import annotations

import hashlib
import math
import re
import unicodedata
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Iterable, Mapping, Sequence

_TOKEN_RE = re.compile(r"[a-z0-9]+")
_SYNONYMS = {
    "hiphop": {"hiphop", "rap", "boombap", "boom", "bap"},
    "rnb": {"rnb", "soul", "neosoul", "neo"},
    "oldies": {"oldies", "doo", "wop", "laboe", "lowrider"},
    "corrido": {"corrido", "corridos", "norteno", "banda"},
    "chicano": {"chicano", "chicana", "sgv", "eastla", "elmonte", "lowrider"},
    "latin": {"latin", "reggaeton", "cumbia", "salsa", "norteno", "banda"},
    "dark": {"dark", "menace", "moody", "night", "midnight"},
    "chill": {"chill", "calm", "cruising", "lofi", "soft"},
}


@dataclass(frozen=True)
class DiscoveryQuery:
    text: str = ""
    genre: str | None = None
    mood: str | None = None
    min_bpm: float | None = None
    max_bpm: float | None = None
    musical_key: str | None = None
    limit: int = 20
    diversity: float = 0.55
    seed: str = ""


@dataclass(frozen=True)
class _Features:
    tokens: frozenset[str]
    genre: frozenset[str]
    mood: frozenset[str]
    culture: frozenset[str]
    creator: str
    bpm: float | None
    key: str | None
    popularity: float
    flips: float
    freshness: float
    provenance: float
    completeness: float


def _norm(value: object) -> str:
    raw = unicodedata.normalize("NFKD", str(value or ""))
    return "".join(c for c in raw if not unicodedata.combining(c)).lower().strip()


def _tokens(*values: object) -> frozenset[str]:
    found: set[str] = set()
    for value in values:
        if isinstance(value, (list, tuple, set, frozenset)):
            found.update(_tokens(*value))
            continue
        words = _TOKEN_RE.findall(_norm(value))
        found.update(words)
        if len(words) > 1:
            found.add("".join(words))
    expanded = set(found)
    for canonical, group in _SYNONYMS.items():
        if found & group:
            expanded.add(canonical)
            expanded.update(group)
    return frozenset(expanded)


def _num(value: object) -> float | None:
    try:
        parsed = float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    return parsed if math.isfinite(parsed) else None


def _first_num(track: Mapping[str, Any], *keys: str) -> float | None:
    for source in (track, track.get("metadata")):
        if not isinstance(source, Mapping):
            continue
        for key in keys:
            value = _num(source.get(key))
            if value is not None:
                return value
    return None


def _first_text(track: Mapping[str, Any], *keys: str) -> str | None:
    for source in (track, track.get("metadata")):
        if not isinstance(source, Mapping):
            continue
        for key in keys:
            value = source.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    return None


def _jaccard(left: Iterable[str], right: Iterable[str]) -> float:
    a, b = set(left), set(right)
    return len(a & b) / len(a | b) if a and b else 0.0


def _freshness(value: object, now: datetime) -> float:
    if not isinstance(value, str):
        return 0.35
    try:
        created = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return 0.35
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    days = max(0.0, (now - created.astimezone(timezone.utc)).total_seconds() / 86400)
    return math.exp(-days / 365.0)


def _tempo(bpm: float | None, low: float | None, high: float | None) -> float:
    if low is None and high is None:
        return 0.5
    if bpm is None:
        return 0.0
    lo, hi = low if low is not None else bpm, high if high is not None else bpm
    if lo > hi:
        lo, hi = hi, lo
    if lo <= bpm <= hi:
        return 1.0
    return max(0.0, 1.0 - min(abs(bpm - lo), abs(bpm - hi)) / 35.0)


def _key(actual: str | None, requested: str | None) -> float:
    if not requested:
        return 0.5
    if not actual:
        return 0.0
    a, r = _norm(actual).replace(" ", ""), _norm(requested).replace(" ", "")
    if a == r:
        return 1.0
    tonic = lambda v: re.split(r"major|minor|maj|min|m$", v)[0]
    return 0.55 if tonic(a) and tonic(a) == tonic(r) else 0.0


def _spark(seed: str, identity: str) -> float:
    digest = hashlib.sha256(f"{seed}|{identity}".encode()).digest()
    return int.from_bytes(digest[:8], "big") / float(2**64 - 1)


def _audio(track: Mapping[str, Any]) -> str | None:
    for key in ("audio_url", "synth_source_url", "master_url", "preview_url"):
        value = track.get(key)
        if isinstance(value, str) and value.strip():
            return value
    stems = track.get("stems")
    if isinstance(stems, Sequence):
        for stem in stems:
            if isinstance(stem, Mapping) and isinstance(stem.get("src"), str):
                return stem["src"]
    return None


def _vics(track: Mapping[str, Any]) -> bool:
    proof = track.get("vics_proof")
    return isinstance(proof, Mapping) and bool(
        proof.get("proof_id") and proof.get("signature") and not proof.get("revoked")
    )


def _provenance(track: Mapping[str, Any]) -> float:
    dna = str(track.get("dna_tag") or "")
    return min(
        (0.25 if dna.startswith(("trk_", "flip_", "duet_")) else 0)
        + (0.20 if track.get("canonical_track_id") else 0)
        + (0.35 if _vics(track) else 0)
        + (0.20 if track.get("soulprint_hash") or track.get("soulprint") else 0),
        1.0,
    )


def _public(track: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "id": track.get("id"),
        "canonical_track_id": track.get("canonical_track_id"),
        "dna_tag": track.get("dna_tag"),
        "title": track.get("title") or "Untitled Beat",
        "creator": track.get("creator") or "unknown",
        "cultural_matrix": track.get("cultural_matrix") or track.get("genre"),
        "genre": track.get("genre") or track.get("cultural_matrix"),
        "mood": track.get("mood"),
        "bpm": _first_num(track, "bpm", "tempo"),
        "key": _first_text(track, "key", "key_scale", "musical_key"),
        "streams": int(_num(track.get("streams")) or 0),
        "flips": int(_num(track.get("flips")) or 0),
        "audio_url": _audio(track),
        "parent_dna": track.get("parent_dna"),
        "created_at": track.get("created_at"),
        "ownership": {
            "dna_tagged": bool(track.get("dna_tag")),
            "vics_proof_attached": _vics(track),
            "soulprint_present": bool(track.get("soulprint_hash") or track.get("soulprint")),
            "royalty_chain_present": bool(track.get("royalty_chain")),
        },
    }


class BeatDiscoveryEngine:
    VERSION = "beat-discovery.v1"

    def __init__(self, tracks: Sequence[Mapping[str, Any]], *, now: datetime | None = None):
        self.tracks = [dict(t) for t in tracks if t.get("dna_tag")]
        now = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
        max_streams = max((max(0.0, _num(t.get("streams")) or 0) for t in self.tracks), default=1)
        max_flips = max((max(0.0, _num(t.get("flips")) or 0) for t in self.tracks), default=1)
        sd, fd = math.log1p(max_streams) or 1, math.log1p(max_flips) or 1
        self.features: list[_Features] = []
        for t in self.tracks:
            genre = _first_text(t, "genre", "cultural_matrix") or ""
            mood = _first_text(t, "mood", "emotional_tone") or ""
            tags = t.get("tags") if isinstance(t.get("tags"), Sequence) else []
            instruments = t.get("instruments") if isinstance(t.get("instruments"), Sequence) else []
            fields = (t.get("title"), t.get("creator"), t.get("dna_tag"), genre, _audio(t), _first_num(t, "bpm", "tempo"))
            self.features.append(_Features(
                tokens=_tokens(t.get("title"), t.get("creator"), genre, mood, tags, instruments, t.get("description"), t.get("cultural_subtext")),
                genre=_tokens(genre), mood=_tokens(mood), culture=_tokens(t.get("cultural_matrix"), genre, tags),
                creator=_norm(t.get("creator")), bpm=_first_num(t, "bpm", "tempo"),
                key=_first_text(t, "key", "key_scale", "musical_key"),
                popularity=math.log1p(max(0.0, _num(t.get("streams")) or 0)) / sd,
                flips=math.log1p(max(0.0, _num(t.get("flips")) or 0)) / fd,
                freshness=_freshness(t.get("created_at"), now), provenance=_provenance(t),
                completeness=sum(bool(v) for v in fields) / 6.0,
            ))

    def discover(self, query: DiscoveryQuery) -> dict[str, Any]:
        limit, diversity = max(1, min(query.limit, 50)), max(0.0, min(query.diversity, 1.0))
        qt, qg, qm = _tokens(query.text), _tokens(query.genre), _tokens(query.mood)
        intent = bool(qt or qg or qm or query.min_bpm is not None or query.max_bpm is not None or query.musical_key)
        seed = query.seed or query.text or query.genre or query.mood or "lyrica-discovery"
        candidates = []
        for i, (track, f) in enumerate(zip(self.tracks, self.features)):
            tm, gm, mm = (_jaccard(qt, f.tokens) if qt else 0.5), (_jaccard(qg, f.genre) if qg else 0.5), (_jaccard(qm, f.mood) if qm else 0.5)
            tempo, key = _tempo(f.bpm, query.min_bpm, query.max_bpm), _key(f.key, query.musical_key)
            under, spark = 1.0 - f.popularity, _spark(seed, str(track.get("dna_tag") or i))
            if intent:
                score = .34*tm + .16*gm + .12*mm + .10*tempo + .06*key + .07*f.completeness + .05*f.popularity + .05*f.provenance + .03*under + .02*spark
            else:
                score = .31*f.popularity + .20*f.flips + .14*f.freshness + .10*f.provenance + .08*f.completeness + .10*under + .07*spark
            candidates.append({"index": i, "features": f, "score": score, "reasons": self._reasons(track, f, tm, gm, mm, tempo, key, under, intent)})
        chosen = self._diversify(candidates, limit, diversity)
        results = [{**_public(self.tracks[c["index"]]), "rank": rank, "discovery_score": round(c["score"]*100, 2), "match_reasons": c["reasons"]} for rank, c in enumerate(chosen, 1)]
        return {"engine": self.VERSION, "query": {"text": query.text, "genre": query.genre, "mood": query.mood, "min_bpm": query.min_bpm, "max_bpm": query.max_bpm, "key": query.musical_key, "diversity": diversity}, "count": len(results), "results": results}

    def similar(self, dna_tag: str, *, limit: int = 12, diversity: float = 0.55) -> dict[str, Any]:
        index = next((i for i, t in enumerate(self.tracks) if t.get("dna_tag") == dna_tag), None)
        if index is None:
            raise KeyError(dna_tag)
        t, f = self.tracks[index], self.features[index]
        payload = self.discover(DiscoveryQuery(" ".join(sorted(f.tokens)), _first_text(t, "genre", "cultural_matrix"), _first_text(t, "mood", "emotional_tone"), f.bpm-12 if f.bpm is not None else None, f.bpm+12 if f.bpm is not None else None, f.key, min(limit+1, 50), diversity, dna_tag))
        payload["results"] = [r for r in payload["results"] if r.get("dna_tag") != dna_tag][:limit]
        for rank, item in enumerate(payload["results"], 1): item["rank"] = rank
        payload["count"], payload["seed_track"] = len(payload["results"]), _public(t)
        return payload

    def _diversify(self, candidates: list[dict[str, Any]], limit: int, diversity: float) -> list[dict[str, Any]]:
        remaining, chosen = sorted(candidates, key=lambda c: c["score"], reverse=True), []
        while remaining and len(chosen) < limit:
            best = max(remaining, key=lambda c: c["score"] - diversity*.30*max((self._similarity(c, x) for x in chosen), default=0.0))
            chosen.append(best); remaining.remove(best)
        return chosen

    @staticmethod
    def _similarity(a: Mapping[str, Any], b: Mapping[str, Any]) -> float:
        x, y = a["features"], b["features"]
        return .50*(1.0 if x.creator and x.creator == y.creator else 0.0) + .30*_jaccard(x.culture, y.culture) + .20*_jaccard(x.tokens, y.tokens)

    @staticmethod
    def _reasons(track, f, tm, gm, mm, tempo, key, under, intent) -> list[str]:
        reasons = []
        if intent and tm >= .20: reasons.append("Matches the sound and words you searched")
        if intent and gm >= .35: reasons.append("Strong genre fit")
        if intent and mm >= .35: reasons.append("Strong mood fit")
        if intent and tempo >= .85 and f.bpm is not None: reasons.append(f"Tempo fits at {round(f.bpm)} BPM")
        if intent and key >= .95 and f.key: reasons.append(f"Key matches {f.key}")
        if f.flips >= .55: reasons.append("Creators are flipping this beat")
        elif f.popularity >= .65: reasons.append("Listeners are returning to this beat")
        if f.provenance >= .55: reasons.append("Ownership and provenance are attached")
        if under >= .72: reasons.append("Discovery pick from an underexposed creator")
        if not reasons: reasons.append(f"Fresh match from {track.get('cultural_matrix') or track.get('genre')}" if track.get("cultural_matrix") or track.get("genre") else "Fresh Lyrica discovery pick")
        return reasons[:4]
