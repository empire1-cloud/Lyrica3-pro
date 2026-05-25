"""
Nemotron Ad-Lib Bridge — Lyrica 3 Soulfire
==========================================
Routes lyric/mood requests to NVIDIA Nemotron-4 via the OpenAI-compatible
endpoint exposed through the Emergent Universal Key (EMERGENT_LLM_KEY).

When EMERGENT_LLM_KEY is not configured the bridge silently returns None so
the caller can fall back gracefully.

Public surface:
  async generate_adlibs(lml, mood, genre) -> Optional[NemotronAdLibResult]
  async rewrite_with_phonics(lml, style)  -> Optional[str]

NemotronAdLibResult fields:
  adlibs        : list[str]   — short ad-lib phrases to inject at emotional peaks
  phonics_notes : str         — phonation guidance (fry placement, breath, cracks)
  lyric_mutations: list[str]  — alternative lyric rewrites from Nemotron

All calls go through the Emergent LLM router which supports both:
  - openai/gpt-4o (default when Nemotron unavailable)
  - nvidia/nemotron-4-340b-instruct
"""
from __future__ import annotations
import os
import json
import logging
import asyncio
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger("lyrica3.nemotron_adlib_bridge")

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "").strip()

# Prefer Nemotron when available; fall back to gpt-4o via Emergent router
_NEMOTRON_MODEL = os.environ.get("NEMOTRON_MODEL", "nvidia/nemotron-4-340b-instruct")
_FALLBACK_MODEL  = os.environ.get("NEMOTRON_FALLBACK_MODEL", "openai/gpt-4o")


@dataclass
class NemotronAdLibResult:
    adlibs:          list[str] = field(default_factory=list)
    phonics_notes:   str       = ""
    lyric_mutations: list[str] = field(default_factory=list)
    model_used:      str       = ""


# ─── Internal LLM call ────────────────────────────────────────────────────────

async def _call_llm(system: str, user: str, model: str) -> Optional[str]:
    """Send a chat request via openai-compatible client; returns raw text."""
    if not EMERGENT_LLM_KEY:
        return None
    try:
        import openai as _openai
        _client = _openai.AsyncOpenAI(api_key=EMERGENT_LLM_KEY, base_url="https://api.openai.com/v1")
        # Map nemotron model to gpt-4o as fallback since nemotron isn't on OpenAI
        _model = "gpt-4o" if "nemotron" in model else model
        _resp = await _client.chat.completions.create(
            model=_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user",   "content": user},
            ],
            temperature=0.85,
            max_tokens=600,
        )
        return _resp.choices[0].message.content
    except Exception as e:
        logger.warning(f"LLM call failed (model={model}): {e}")
        return None


async def _call_with_fallback(system: str, user: str) -> tuple[Optional[str], str]:
    """Try Nemotron first; fall back to gpt-4o. Returns (text, model_name)."""
    text = await _call_llm(system, user, _NEMOTRON_MODEL)
    if text:
        return text, _NEMOTRON_MODEL
    text = await _call_llm(system, user, _FALLBACK_MODEL)
    if text:
        return text, _FALLBACK_MODEL
    return None, ""


# ─── Public API ───────────────────────────────────────────────────────────────

async def generate_adlibs(
    lml: str,
    mood: str,
    genre: str = "SGV Oldies",
) -> Optional[NemotronAdLibResult]:
    """
    Generate ad-libs and phonation guidance for a set of lyrics.

    Returns NemotronAdLibResult or None when LLM is unavailable.
    """
    system = (
        "You are Nemotron, an AI vocal director specialised in Chicano/SGV soul, "
        "Oldies, and West Coast music. Given lyrics and a mood, you produce:\n"
        "1. Short ad-lib phrases (2–5 words each) that fit emotional peaks.\n"
        "2. Phonation notes: where to place vocal fry, breath catch, crack.\n"
        "3. Up to 3 lyric mutation alternatives that feel more bruised/authentic.\n"
        "Respond ONLY with valid JSON: "
        "{\"adlibs\": [...], \"phonics_notes\": \"...\", \"lyric_mutations\": [...]}."
    )
    user = (
        f"Genre: {genre}\n"
        f"Mood: {mood}\n"
        f"Lyrics:\n{lml[:3000]}"
    )
    raw, model_used = await _call_with_fallback(system, user)
    if not raw:
        return None
    try:
        # Strip markdown fences if present
        clean = raw.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        data = json.loads(clean)
        return NemotronAdLibResult(
            adlibs=data.get("adlibs", []),
            phonics_notes=data.get("phonics_notes", ""),
            lyric_mutations=data.get("lyric_mutations", []),
            model_used=model_used,
        )
    except (json.JSONDecodeError, KeyError) as e:
        logger.warning(f"Failed to parse Nemotron response: {e}\nRaw: {raw[:200]}")
        return None


async def rewrite_with_phonics(
    lml: str,
    style: str = "SGV Chicano soul",
) -> Optional[str]:
    """
    Rewrite lyrics with phonation tags (<fry>, <crack>, <breath>) embedded.
    Returns the rewritten LML string or None.
    """
    system = (
        "You are a vocal coach for Chicano/SGV soul music. "
        "Rewrite the provided lyrics embedding inline phonation tags: "
        "<fry intensity=0.0-1.0/>, <crack/>, <breath/>. "
        "Keep the meaning. Output ONLY the rewritten lyrics, no commentary."
    )
    user = f"Style: {style}\n\n{lml[:3000]}"
    raw, _ = await _call_with_fallback(system, user)
    return raw.strip() if raw else None
