# LUZARIA Launch Readiness

LUZARIA is Empire-1's original synthetic female artist and the first persistent artist identity built on Lyrica 3.

## Canon locked

- Artist ID: `LZR-00000001`
- Name: `LUZARIA` (`loo-ZAR-ee-ah`)
- Digital birthdate: `2025-05-24`
- Creator: `EMPIRE-1`
- Version: `1.0.0`
- Home: San Gabriel Valley, California
- Voice: warm smoky alto
- Musical foundation: Chicano Soul, modern R&B, oldies warmth, late-night honesty
- Language behavior: English-first with natural Spanish
- Single identity: locked
- Multi-persona mode: disabled
- Voice, visual, story, and rights canon: locked

## What this branch adds

1. A machine-readable identity canon at `canon/luzaria/identity_v1.json`.
2. A stable SHA-256 identity digest and public digital birth certificate.
3. Identity-drift validation that rejects name, voice, home, language, or multi-persona conflicts.
4. An idempotent artist catalog registry bound to DNA, Soulprint, and VICS proof.
5. Archisynapse receipt tracking for royalty closure.
6. A public `/luzaria` artist profile and launch-readiness surface.
7. A hard launch gate: LUZARIA cannot report `launch_ready=true` without a public catalog track, VICS proof, and an Archisynapse receipt.

## Public routes

The Duo-Soul app is mounted by the main backend at `/duo-soul`.

- `GET /duo-soul/artist/luzaria`
- `GET /duo-soul/artist/luzaria/birth-certificate`
- `POST /duo-soul/artist/luzaria/validate-identity`
- `GET /duo-soul/artist/luzaria/catalog`
- `GET /duo-soul/artist/luzaria/launch-readiness`

## Protected routes

Set `LUZARIA_INTERNAL_TOKEN` and send both headers:

```http
Authorization: Bearer <LUZARIA_INTERNAL_TOKEN>
X-Empire1-Service: empire1-cofounder
```

Routes:

- `POST /duo-soul/internal/v1/artist/luzaria/bootstrap`
- `POST /duo-soul/internal/v1/artist/luzaria/catalog`

Example catalog registration:

```json
{
  "track_id": "trk_luzaria_001",
  "title": "Sleep On The Floor",
  "dna_tag": "<final DNA tag after render>",
  "soulprint_hash": "<audio-bound Soulprint hash>",
  "vics_proof_id": "<persisted VICS proof ID>",
  "archisynapse_receipt_id": "<signed receipt ID after royalty closure>",
  "release_status": "registered"
}
```

## Remaining release work

The identity is built. The artist is not yet honestly launch-ready until these evidence gates close:

1. Render and persist LUZARIA's first final master.
2. Issue the audio-bound DNA, Soulprint, and VICS proof.
3. Register the track in LUZARIA's catalog through the protected endpoint.
4. Complete one real Flip royalty event through Archisynapse.
5. Store the signed Archisynapse receipt on the catalog record.
6. Publish the artist page and first track together.

The API intentionally reports the remaining gates as `pending` rather than fabricating a completed artist launch.
