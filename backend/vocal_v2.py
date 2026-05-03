"""
Vocal v2 — LML-aware multi-span TTS (Soulfire performance layer).

Parses inline LML into text runs with active biometric tags, maps tags to
directives + optional TTS speed, renders one MP3 per span, stitches with pydub.

Falls back to single-pass integrations.vocal_performance if parsing yields
nothing usable or stitching fails.
"""
from __future__ import annotations

import re
import uuid
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

logger = logging.getLogger("empire1.vocal_v2")

# Tag base name (lowercase) → performance hint for the model + optional OpenAI TTS speed (0.25–4.0)
_TAG_PROSODY: Dict[str, Dict[str, Any]] = {
    "vocal_fry": {
        "directive": "Deliver with low gravel vocal fry, intimate close-mic, slightly restrained volume.",
        "speed": 0.92,
    },
    "emotional_crack": {
        "directive": "Voice nearly breaking on this phrase — cracked cry, slight waver, vulnerable.",
        "speed": 0.96,
    },
    "adaptive_inhale": {
        "directive": "Audible breath before this line — soft inhale, then intimate delivery.",
        "speed": 0.94,
    },
    "whisper_grit": {
        "directive": "Whisper-close, gritty texture, barely above silence.",
        "speed": 0.9,
    },
    "chest_voice": {
        "directive": "Chest-heavy resonance, grounded, full-bodied tone.",
        "speed": 0.98,
    },
    "falsetto_break": {
        "directive": "Thin head-voice lift on the edge of breaking — oldies falsetto ache.",
        "speed": 1.0,
    },
    "grain_rasp": {
        "directive": "Grainy rasp on consonants, tape-aged vocal texture.",
        "speed": 0.95,
    },
    "tape_hiss": {
        "directive": "Dry, slightly distant room tone — memory on cassette.",
        "speed": 0.97,
    },
    "subharmonic": {
        "directive": "Subharmonic undertone, low chest pressure.",
        "speed": 0.93,
    },
    "chest_resonance": {
        "directive": "Deep chest resonance, slow vowels.",
        "speed": 0.95,
    },
}


def _tag_base(raw: str) -> Optional[str]:
    """Opening or closing tag → canonical lowercase name."""
    s = raw.strip()
    if not s.startswith("<"):
        return None
    s = s[1:].split(">", 1)[0].strip()
    if s.startswith("/"):
        s = s[1:].strip()
    if s.endswith("/"):
        s = s[:-1].strip()
    name = s.split()[0].lower() if s else ""
    return name or None


def _is_self_closing(tag_full: str) -> bool:
    t = tag_full.strip()
    return t.endswith("/>") or "/>" in t or bool(re.match(r"^<[^>]+\s/>$", t))


def parse_lml_spans(lml: str) -> List[Dict[str, Any]]:
    """
    Tokenize LML into text runs with active tag stack.
    Each run gets tags from currently open paired tags + pending self-closing tags.
    """
    if not lml or not lml.strip():
        return []

    work = re.sub(
        r"\[(?:intro|verse|hook|bridge|verso|chorus|outro)[^\]]*\]\s*",
        "\n",
        lml,
        flags=re.I,
    )

    token_re = re.compile(r"<[^>]+>|[^<]+")
    active: Set[str] = set()
    pending: Set[str] = set()
    text_buf: List[str] = []
    segments: List[Dict[str, Any]] = []

    def flush() -> None:
        nonlocal text_buf, pending
        raw = "".join(text_buf).strip()
        text_buf = []
        if not raw:
            pending = set()
            return
        tags = sorted(set(active) | set(pending))
        pending = set()
        segments.append({"text": raw, "tags": tags})

    for m in token_re.finditer(work):
        tok = m.group(0)
        if not tok.startswith("<"):
            text_buf.append(tok)
            continue
        # tag — flush text before applying tag semantics
        flush()
        tag_full = tok.strip()
        inner = tag_full[1:-1].strip() if tag_full.startswith("<") and tag_full.endswith(">") else ""
        if not inner:
            continue
        if inner.startswith("/"):
            base = _tag_base(tag_full)
            if base:
                active.discard(base)
            continue
        if _is_self_closing(tag_full):
            base = _tag_base(tag_full)
            if base:
                pending.add(base)
            continue
        base = _tag_base(tag_full)
        if base:
            active.add(base)

    flush()

    merged: List[Dict[str, Any]] = []
    for seg in segments:
        if not seg["text"]:
            continue
        if merged and len(seg["text"]) < 3:
            prev = merged[-1]
            prev["text"] = (prev["text"] + " " + seg["text"]).strip()
            prev["tags"] = sorted(set(prev["tags"]) | set(seg["tags"]))
        else:
            merged.append({"text": seg["text"], "tags": seg["tags"][:]})
    return merged


def _prosody_for_tags(tags: List[str]) -> Tuple[str, float]:
    """Directive prefix for TTS + speed (clamped)."""
    if not tags:
        return "", 1.0
    parts: List[str] = []
    speed_acc: List[float] = []
    for t in tags:
        p = _TAG_PROSODY.get(t.lower())
        if not p:
            continue
        parts.append(str(p["directive"]))
        if isinstance(p.get("speed"), (int, float)):
            speed_acc.append(float(p["speed"]))
    if not parts:
        return "", 1.0
    directive = " ".join(parts) + " "
    # combine speeds: take min for heavier delivery
    sp = min(speed_acc) if speed_acc else 1.0
    sp = max(0.25, min(4.0, sp))
    return directive, sp


def _tts_prompt(text: str, tags: List[str]) -> str:
    prefix, _ = _prosody_for_tags(tags)
    body = re.sub(r"<[^>]+>", "", text).strip()
    if not body:
        return ""
    if prefix:
        return f"{prefix}\n\n{body}"
    return body


def _split_oversized(text: str, max_chars: int = 3500) -> List[str]:
    if len(text) <= max_chars:
        return [text]
    chunks: List[str] = []
    cur: List[str] = []
    cur_len = 0
    for sentence in re.split(r"(?<=[.!?])\s+", text):
        if cur_len + len(sentence) + 1 > max_chars and cur:
            chunks.append(" ".join(cur).strip())
            cur = []
            cur_len = 0
        cur.append(sentence)
        cur_len += len(sentence) + 1
    if cur:
        chunks.append(" ".join(cur).strip())
    return [c for c in chunks if c]


async def vocal_performance_v2(
    lml: str,
    mood: str,
    out_dir: str,
    public_base: str = "/api/static/voices",
    voice: Optional[str] = None,
    model: str = "tts-1-hd",
    mood_voice_map: Optional[Dict[str, str]] = None,
    max_segments: int = 48,
) -> Optional[Dict[str, Any]]:
    """
    Multi-span LML vocal: parse → N×TTS → stitch one MP3.
    Returns same shape as vocal_performance plus engine metadata, or None.
    """
    from integrations import EMERGENT_LLM_KEY, _MOOD_VOICE as _mv

    if not EMERGENT_LLM_KEY:
        return None

    mv = mood_voice_map or _mv
    chosen_voice = voice or mv.get(mood, "onyx")

    spans = parse_lml_spans(lml)
    if not spans:
        return None

    flat_chunks: List[Tuple[str, List[str]]] = []
    for sp in spans:
        for piece in _split_oversized(sp["text"]):
            t = piece.strip()
            if t:
                flat_chunks.append((t, sp["tags"]))

    if not flat_chunks:
        return None

    if len(flat_chunks) > max_segments:
        flat_chunks = flat_chunks[:max_segments]

    try:
        from emergentintegrations.llm.openai import OpenAITextToSpeech
    except Exception as e:
        logger.warning("vocal_v2 TTS import failed: %s", e)
        return None

    tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
    Path(out_dir).mkdir(parents=True, exist_ok=True)

    tmp_paths: List[Path] = []
    final_name = f"voice_v2_{uuid.uuid4().hex[:10]}.mp3"
    final_path = Path(out_dir) / final_name
    try:
        for idx, (raw_text, tags) in enumerate(flat_chunks):
            prompt = _tts_prompt(raw_text, tags)
            if not prompt or len(prompt) > 4090:
                prompt = (prompt or raw_text)[:4090]
            _, speed = _prosody_for_tags(tags)
            kwargs: Dict[str, Any] = {
                "text": prompt,
                "model": model,
                "voice": chosen_voice,
                "response_format": "mp3",
            }
            try:
                audio_bytes = await tts.generate_speech(**kwargs, speed=speed)
            except TypeError:
                audio_bytes = await tts.generate_speech(**kwargs)
            seg_path = Path(out_dir) / f"v2seg_{uuid.uuid4().hex[:10]}.mp3"
            seg_path.write_bytes(audio_bytes)
            tmp_paths.append(seg_path)

        if len(tmp_paths) == 1:
            first = tmp_paths[0]
            if first.resolve() != final_path.resolve():
                first.replace(final_path)
        else:
            from pydub import AudioSegment

            combined: Optional[AudioSegment] = None
            cross_ms = 40
            for p in tmp_paths:
                seg = AudioSegment.from_mp3(str(p))
                if combined is None:
                    combined = seg
                else:
                    cf = min(cross_ms, len(seg) // 2, len(combined) // 2)
                    combined = combined.append(seg, crossfade=max(0, cf))
            assert combined is not None
            combined.export(str(final_path), format="mp3", bitrate="192k")

        for p in tmp_paths:
            if p.exists() and p.resolve() != final_path.resolve():
                try:
                    p.unlink()
                except Exception:
                    pass

        return {
            "url": f"{public_base}/{final_name}",
            "voice": chosen_voice,
            "model": model,
            "engine": "vocal_v2",
            "segments": len(flat_chunks),
            "chars": sum(len(t[0]) for t in flat_chunks),
        }
    except Exception as e:
        logger.warning("vocal_v2 error: %s", e)
        for p in tmp_paths:
            try:
                if p.exists():
                    p.unlink()
            except Exception:
                pass
        try:
            if final_path.exists():
                final_path.unlink()
        except Exception:
            pass
        return None
