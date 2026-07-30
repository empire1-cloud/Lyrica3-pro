# Lyrica 3 Vocal Forge — Score-Locked Guide v1

This slice turns an approved monophonic score into a deterministic WAV guide vocal and binds the result to a receipt. It is intentionally useful before any third-party singing model is connected.

## What is real

- MIDI-note pitch control from note 24 through 108
- beat-accurate start and duration control
- one required lyric syllable or vocal unit per note event
- required note-to-pronunciation-token mapping for release renders
- monophonic overlap rejection
- memory-bounded note-by-note 16-bit mono WAV rendering
- stable SHA-256 audio and request bindings
- creator-reference voice consent preflight
- Cultura pronunciation and release-gate integration
- provider and model-license preflight
- HMAC-SHA256 receipt signing when `VOCAL_FORGE_RECEIPT_SIGNING_KEY` is configured
- fail-closed release behavior when the Cultura plan or signing configuration is incomplete
- fail-closed render and download access through `VOCAL_FORGE_INTERNAL_TOKEN`
- no internal artifact or receipt filesystem paths in API responses

## What is not claimed

The enabled renderer is a synthetic guide tone with a vowel-like harmonic profile. It is not a natural singer, voice clone, final mix, final master, or proof that an external model is commercially licensed.

Fish Speech, so-vits-svc, Stable Audio Tools, and Vocos are represented only as replaceable provider contracts. They are not executed in this slice.

## Routes

Mounted beneath the existing `/duo-soul` application:

- `GET /duo-soul/vocal-forge/capabilities`
- `POST /duo-soul/vocal-forge/provider-preflight`
- `POST /duo-soul/vocal-forge/guide/preflight`
- `POST /duo-soul/vocal-forge/guide/render`
- `GET /duo-soul/vocal-forge/artifacts/{artifact_id}`

The render and artifact routes require:

```text
Authorization: Bearer <VOCAL_FORGE_INTERNAL_TOKEN>
```

The token must be configured and contain at least 24 characters. Missing configuration returns `503`; missing or invalid credentials are rejected.

## Minimal research request

```json
{
  "project_id": "project-1",
  "creator_id": "creator-1",
  "title": "Guide One",
  "bpm": 120,
  "release_intent": "research",
  "voice_identity_mode": "synthetic_neutral",
  "notes": [
    {
      "midi_note": 60,
      "start_beat": 0,
      "duration_beats": 1,
      "syllable": "stay"
    },
    {
      "midi_note": 64,
      "start_beat": 1,
      "duration_beats": 1,
      "syllable": "close"
    }
  ]
}
```

## Release requirements

A release-bound request additionally requires:

1. a Cultura pronunciation plan that returns `release_eligible=true`;
2. every score note to provide a valid `pronunciation_token_index` into that approved plan;
3. a receipt signing key of at least 32 characters;
4. authorized reference-voice consent when creator voice identity is used;
5. a connected provider whose code, checkpoint, training data, and deployment terms are cleared for the intended use.

The current connected renderer is the Empire-owned deterministic guide. External providers remain blocked from execution until their workers and evidence contracts are implemented.
