"""
Test: verified-generation gate
------------------------------------------------------------------------
Covers the rule that a track may only be persisted and minted when a genuine
provider produced the audio.

The cases that matter most are the ones where the pipeline arrives at the write
boundary in a degraded state: a fallback provider tag with no stems (what happens
when the integrations import fails and the stub returns None), and placeholder
stems carrying a provider tag that does not admit to being a fallback.

Run:  python3 backend/test_generation_gate.py
Exits non-zero on failure so this can be wired into CI as-is.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from generation_gate import (  # noqa: E402
    UnverifiedGenerationError,
    assert_generation_verified,
    generation_refusal_payload,
    is_placeholder_url,
    is_unverified_provider,
)

SOUNDHELIX = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3"
REAL_AUDIO = "https://replicate.delivery/pbxt/abc123/out.mp3"

_failures: list[str] = []


def check(label: str, condition: bool) -> None:
    if condition:
        print(f"  PASS  {label}")
    else:
        print(f"  FAIL  {label}")
        _failures.append(label)


def refuses(label: str, expected_code: str, **kwargs) -> None:
    """Assert the gate refuses, with the expected machine-readable code."""
    try:
        assert_generation_verified(**kwargs)
    except UnverifiedGenerationError as err:
        check(f"{label} -> {err.code}", err.code == expected_code)
        payload = generation_refusal_payload(err)
        check(
            f"{label} payload states nothing was written",
            payload["persisted"] is False and payload["minted"] is False,
        )
        return
    check(f"{label} (expected refusal, none raised)", False)


def allows(label: str, **kwargs) -> None:
    try:
        assert_generation_verified(**kwargs)
    except UnverifiedGenerationError as err:
        check(f"{label} (unexpected refusal: {err.code})", False)
        return
    check(label, True)


print("\n" + "=" * 78)
print("  VERIFIED-GENERATION GATE")
print("=" * 78 + "\n")

print("Refuses fallback providers:")
refuses(
    "explicit soundhelix fallback tag",
    "UNVERIFIED_GENERATION_PROVIDER",
    synth_provider="fallback:soundhelix",
    stems=[{"name": "Analog Melody", "src": SOUNDHELIX}],
)
refuses(
    "fallback tag with NO stems (integrations import stub returned None)",
    "UNVERIFIED_GENERATION_PROVIDER",
    synth_provider="fallback:soundhelix",
    stems=None,
)
refuses(
    "an unrecognised future fallback:* tag",
    "UNVERIFIED_GENERATION_PROVIDER",
    synth_provider="fallback:some_new_placeholder",
    stems=None,
)
refuses(
    "fallback tag with differing case and whitespace",
    "UNVERIFIED_GENERATION_PROVIDER",
    synth_provider="  Fallback:SoundHelix  ",
    stems=None,
)

print("\nRefuses placeholder audio even when the provider tag does not admit it:")
refuses(
    "mislabelled provider carrying placeholder stems",
    "PLACEHOLDER_STEM_AUDIO",
    synth_provider="vertex:lyria3",
    stems=[
        {"name": "Late-Pocket Drums", "src": REAL_AUDIO},
        {"name": "Analog Melody", "src": SOUNDHELIX},
    ],
)
refuses(
    "mislabelled provider with a placeholder source url",
    "PLACEHOLDER_SOURCE_AUDIO",
    synth_provider="vertex:lyria3",
    synth_source_url=SOUNDHELIX,
)
refuses(
    "bare soundhelix host without www",
    "PLACEHOLDER_SOURCE_AUDIO",
    synth_provider="replicate:musicgen",
    synth_source_url="http://soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
)

print("\nAllows genuine generation:")
allows(
    "vertex lyria3 with real stems",
    synth_provider="vertex:lyria3",
    stems=[{"name": "Analog Melody", "src": REAL_AUDIO}],
    synth_source_url=REAL_AUDIO,
)
allows(
    "replicate musicgen with real source",
    synth_provider="replicate:musicgen",
    synth_source_url=REAL_AUDIO,
)
allows(
    "procedural python generation",
    synth_provider="procedural:python",
    stems=[{"name": "Late-Pocket Drums", "src": "/api/static/stems/x.wav"}],
)
allows(
    "local musicgen with no stems yet",
    synth_provider="local:musicgen",
    stems=None,
)

print("\nSurvives malformed input on the failure path:")
allows("stems as a non-sequence", synth_provider="vertex:lyria3", stems=object())
allows("stems containing non-mappings", synth_provider="vertex:lyria3", stems=[None, "x", 42])
allows("stem missing a src key", synth_provider="vertex:lyria3", stems=[{"name": "no src"}])
allows("stem src is not a string", synth_provider="vertex:lyria3", stems=[{"src": 12345}])
allows("provider is None", synth_provider=None)

print("\nHelper predicates:")
check("is_placeholder_url on soundhelix", is_placeholder_url(SOUNDHELIX) is True)
check("is_placeholder_url on real audio", is_placeholder_url(REAL_AUDIO) is False)
check("is_placeholder_url on None", is_placeholder_url(None) is False)
check(
    "host match is exact, not substring",
    is_placeholder_url("https://notsoundhelix.com.evil.test/a.mp3") is False,
)
check("is_unverified_provider on fallback", is_unverified_provider("fallback:soundhelix") is True)
check("is_unverified_provider on vertex", is_unverified_provider("vertex:lyria3") is False)

print("\n" + "=" * 78)
if _failures:
    print(f"  FAILED — {len(_failures)} check(s) did not pass")
    for f in _failures:
        print(f"    - {f}")
    print("=" * 78 + "\n")
    sys.exit(1)

print("  ALL CHECKS PASSED")
print("=" * 78 + "\n")
sys.exit(0)
