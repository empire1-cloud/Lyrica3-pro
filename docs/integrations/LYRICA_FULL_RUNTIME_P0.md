# Lyrica 3 Full Runtime — Phase 1

## Purpose

Complete one truthful creation path without replacing the existing Lyrica, SLA113, Soulfire, VICS, SL Universal, or Archisynapse boundaries.

## Runtime flow

1. Authenticated creator submits `POST /api/v2/tracks`.
2. The runtime records a job and advances through explicit states.
3. Soulfire produces a local creative blueprint.
4. The Empire-local renderer creates one master and four distinct WAV stems.
5. The backend measures the actual files: hashes, duration, sample rate, peak, RMS, channels, and bit depth.
6. A deterministic `trk_` DNA identity is created from the creator, title, and master hash.
7. The production VICS bridge signs the real audio binding when its signing key is configured.
8. A durable `TRACK_REGISTERED` request is written to `track_registration_outbox` for Archisynapse.
9. The existing Make Music screen polls the job and saves the completed track.

## Truth rules

- A file hash is not called a verified watermark.
- A queued Archisynapse request is not called a receipt or settlement.
- A missing VICS signing key returns `UNAVAILABLE`.
- The new production path accepts only `LYRICA_PROVIDER_MODE=empire_local`.
- The local one-second browser tone remains an unregistered interface preview and receives no DNA, Soulprint, VICS, or ledger-looking identifiers.

## API

- `POST /api/v2/tracks`
- `GET /api/v2/jobs/{job_id}`
- `GET /api/v2/tracks/{dna_tag}`
- `GET /api/v2/tracks/{dna_tag}/proof`

Job states:

`REQUESTED → APPROVED → BLUEPRINT_READY → RENDERING → MASTERING → MEASURING → PROOF_PENDING → COMPLETE`

Any unrecoverable error ends in `FAILED`.

## Activation

Backend:

```bash
LYRICA_FULL_RUNTIME_V1_ENABLED=true
LYRICA_PROVIDER_MODE=empire_local
LYRICA_VICS_PROOF_SIGNING_KEY=<random value, at least 32 characters>
```

Frontend:

```bash
VITE_LYRICA_FULL_RUNTIME_V1=true
```

The existing Archisynapse v2 Flip cutover remains separately controlled by `LYRICA_ARCHISYNAPSE_V2_ENABLED`.

## Focused verification

```bash
cd backend
PYTHONPATH=. python -m unittest -v tests/test_full_runtime.py
```

The focused suite verifies:

- four distinct stems and a separate master;
- measurements derived from real WAV files;
- idempotent job creation;
- fail-closed provider selection;
- no false Soulprint, VICS, ledger, or payout verification;
- durable pending Archisynapse registration state.

## Current boundary

Phase 1 creates instrumental audio. Lyrics and voice-consent references are preserved, but voice rendering remains behind the consent-gated next lane. Archisynapse track registration is durably queued; it remains `PENDING` until a real external receipt is returned and stored.
