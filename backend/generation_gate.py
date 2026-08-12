"""
Verified-generation gate
========================

A track may only be persisted and minted when a genuine provider produced the
audio. When every real generation route fails, the pipeline currently falls back
to fixed SoundHelix demo assets. Those are placeholders. Persisting one creates a
track record, a `kind: "mint"` ledger event, and downstream attribution and payout
references for audio that no provider generated.

This module is the choke point that refuses that. It is deliberately pure: no
database, no network, no FastAPI. It takes the values the generation handler
already computed and answers one question — is this real output? — so it can be
tested directly and called immediately before the authoritative writes.

Detection does not trust a single signal. `synth_provider` is refused when it is
tagged as a fallback, and stem sources are refused when they resolve to a known
placeholder host, so a mislabelled provider cannot carry placeholder audio through
and a stripped stem list cannot carry a fallback tag through.
"""

from __future__ import annotations

from typing import Any, Iterable, Mapping, Sequence
from urllib.parse import urlparse

# Providers whose output is not genuine generated audio. Matched as a prefix so
# that any future "fallback:<something>" tag is refused by default rather than
# needing to be added here.
UNVERIFIED_PROVIDER_PREFIXES: tuple[str, ...] = ("fallback:",)

# Hosts that only ever serve placeholder/demo audio.
PLACEHOLDER_AUDIO_HOSTS: frozenset[str] = frozenset(
    {"soundhelix.com", "www.soundhelix.com"}
)


class UnverifiedGenerationError(RuntimeError):
    """Raised when a track would be persisted without genuine generated audio.

    Carries a machine-readable `code` and the offending evidence so the caller can
    return a structured refusal instead of an opaque server error.
    """

    def __init__(self, code: str, reason: str, evidence: Any = None) -> None:
        super().__init__(reason)
        self.code = code
        self.reason = reason
        self.evidence = evidence


def _host_of(url: Any) -> str:
    if not isinstance(url, str) or not url:
        return ""
    try:
        return (urlparse(url).hostname or "").lower()
    except ValueError:
        return ""


def is_placeholder_url(url: Any) -> bool:
    """True when a URL points at a host that only serves placeholder audio."""
    return _host_of(url) in PLACEHOLDER_AUDIO_HOSTS


def is_unverified_provider(synth_provider: Any) -> bool:
    """True when the provider tag marks the audio as non-genuine."""
    if not isinstance(synth_provider, str):
        return False
    tag = synth_provider.strip().lower()
    return any(tag.startswith(p) for p in UNVERIFIED_PROVIDER_PREFIXES)


def _placeholder_stem_sources(stems: Any) -> list[str]:
    """Stem sources that resolve to a placeholder host.

    Tolerates None, non-sequences, and non-mapping members, because this runs on
    the failure path where upstream values are least trustworthy.
    """
    if not isinstance(stems, Sequence) or isinstance(stems, (str, bytes)):
        return []
    found: list[str] = []
    for stem in stems:
        if not isinstance(stem, Mapping):
            continue
        src = stem.get("src")
        if is_placeholder_url(src):
            found.append(src)
    return found


def assert_generation_verified(
    synth_provider: Any,
    stems: Any = None,
    synth_source_url: Any = None,
) -> None:
    """Refuse the write when the audio was not genuinely generated.

    Raises `UnverifiedGenerationError` and returns None otherwise. Call this
    immediately before any track persistence, mint-ledger insert, attribution
    record, or payout reference is created.
    """
    if is_unverified_provider(synth_provider):
        raise UnverifiedGenerationError(
            code="UNVERIFIED_GENERATION_PROVIDER",
            reason=(
                "No genuine instrumental provider produced audio for this request; "
                f"synth_provider is {synth_provider!r}. Refusing to persist or mint."
            ),
            evidence={"synth_provider": synth_provider},
        )

    if is_placeholder_url(synth_source_url):
        raise UnverifiedGenerationError(
            code="PLACEHOLDER_SOURCE_AUDIO",
            reason=(
                "The generated source URL points at placeholder demo audio. "
                "Refusing to persist or mint."
            ),
            evidence={"synth_source_url": synth_source_url},
        )

    placeholder_stems = _placeholder_stem_sources(stems)
    if placeholder_stems:
        raise UnverifiedGenerationError(
            code="PLACEHOLDER_STEM_AUDIO",
            reason=(
                "Stem sources point at placeholder demo audio. "
                "Refusing to persist or mint."
            ),
            evidence={"stems": placeholder_stems},
        )


def generation_refusal_payload(err: UnverifiedGenerationError) -> dict[str, Any]:
    """Structured body for an API refusal.

    `persisted` and `minted` are stated explicitly so a client, a log reader, or an
    evidence record can see that the refusal happened before any write, rather than
    inferring it from a status code.
    """
    return {
        "error": "unverified_generation",
        "code": err.code,
        "reason": err.reason,
        "evidence": err.evidence,
        "persisted": False,
        "minted": False,
    }
