# Lyrica VICS Proof Bridge

## Purpose

This bridge gives Archisynapse v2 an authenticated, read-only way to verify that a royalty event is bound to a real Lyrica track, its creative DNA tag, the actual audio bytes, the creator identity, and a persisted VICS proof.

The proof-signing secret never leaves Lyrica. Archisynapse receives only the verification result and exact public bindings.

## Mounted routes

`backend/server.py` already mounts `api.main` at `/duo-soul`, so the routes are:

- `POST /duo-soul/internal/v1/vics/issue/{track_id}`
- `POST /duo-soul/internal/v1/vics/verify`

Both routes require:

```http
Authorization: Bearer <LYRICA_VICS_SERVICE_TOKEN>
X-Empire1-Service: archisynapse-v2
```

## Required Lyrica environment variables

```bash
LYRICA_VICS_SERVICE_TOKEN=<long random service token>
LYRICA_VICS_PROOF_SIGNING_KEY=<separate random secret, at least 32 characters>
```

The service token authenticates Archisynapse. The proof-signing key signs Lyrica's persisted proof record. These must be different secrets.

Do not reuse `JWT_SECRET`, expose either value to the frontend, commit either value, or copy the proof-signing key into Archisynapse.

## Archisynapse v2 configuration

After the matching Archisynapse verifier PR is deployed:

```bash
LYRICA_VICS_VERIFIER_ENABLED=true
LYRICA_VICS_VERIFY_URL=https://<lyrica-backend>/duo-soul/internal/v1/vics/verify
LYRICA_VICS_SERVICE_TOKEN=<same service token as Lyrica>
LYRICA_VICS_VERIFY_TIMEOUT_SECONDS=5
```

The Archisynapse royalty loop must remain disabled or fail-closed until both sides are deployed and the tenant keys are registered.

## Issuance behavior

Issuance:

1. Loads the persisted track by stable track ID or DNA tag.
2. Locates the actual MP3/WAV or an existing local `/api/static/` asset.
3. Hashes the audio bytes with SHA-256 and stores an `sp_sha256_...` Soulprint hash.
4. Derives a stable creator ID from the creator handle when no canonical creator ID exists yet.
5. Creates a stable VICS proof ID from the track, DNA, Soulprint, and creator bindings.
6. Signs the canonical proof record with HMAC-SHA256 using Lyrica's private proof-signing key.
7. Persists the proof before it can be referenced by a royalty obligation.

Issuance fails closed when the track, audio, identity, DNA tag, service authentication, or signing configuration is missing.

## Verification behavior

Verification succeeds only when all of these are true:

- service authentication is valid;
- the persisted track exists;
- the proof schema is supported;
- the proof is not revoked or expired;
- the proof signature verifies;
- `track_id`, `dna_tag`, `soulprint_hash`, `vics_proof_id`, and `creator_id` exactly match the request.

A boolean field alone is never accepted as proof.

## Key rotation

Rotating `LYRICA_VICS_SERVICE_TOKEN` requires updating both services together.

Rotating `LYRICA_VICS_PROOF_SIGNING_KEY` invalidates existing HMAC proofs. Use a controlled re-issuance migration before removing the old key. A later schema version should support key IDs and an overlap window; v1 intentionally has one active signing key and fails closed.

## Current boundary

This bridge closes the ownership-verification seam. It does not yet emit the `$1.2500` royalty obligation. The next additive slice is the durable Lyrica outbox and signed event client described in Lyrica issue #36.
