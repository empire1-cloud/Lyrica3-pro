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

## First release candidate

- Release ID: `LZR-RC-0001`
- Title: `Sleep On The Floor`
- Mode: Testimony
- Narrator: woman / mother
- Groove: 78 BPM late-pocket Chicano Soul / Trap fusion
- Voice performance: 98% vulnerability, warm smoky alto, adaptive inhales, vocal fry, emotional cracks, and chest resonance
- Cross-platform evidence: the Suno video is preserved as proof that another system treated the structured payload as lyrics instead of separating instructions, metadata, creative intent, and lyric content
- Canon file: `canon/luzaria/releases/sleep_on_the_floor_v1.json`

The release candidate is locked, but its final audio and proof fields remain `pending` until real artifacts exist.

## What this branch adds

1. A machine-readable identity canon at `canon/luzaria/identity_v1.json`.
2. A stable SHA-256 identity digest and public digital birth certificate.
3. Identity-drift validation that rejects name, voice, home, language, or multi-persona conflicts.
4. A first-release canon with its own stable digest and track-level proof gates.
5. An idempotent artist catalog registry bound to DNA, Soulprint, and VICS proof.
6. Append-only Archisynapse receipt closure sourced only from Lyrica's verified royalty outbox.
7. A public `/luzaria` artist profile with identity, release, and launch-readiness surfaces.
8. A hard launch gate: LUZARIA cannot report `launch_ready=true` without a public catalog track, VICS proof, and an Archisynapse receipt.

## Public routes

The Duo-Soul app is mounted by the main backend at `/duo-soul`.

- `GET /duo-soul/artist/luzaria`
- `GET /duo-soul/artist/luzaria/birth-certificate`
- `GET /duo-soul/artist/luzaria/releases/first`
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
- `POST /duo-soul/internal/v1/artist/luzaria/catalog/{track_id}/receipt`

### Register the final master

```json
{
  "track_id": "trk_luzaria_001",
  "title": "Sleep On The Floor",
  "dna_tag": "<final DNA tag after render>",
  "soulprint_hash": "<audio-bound Soulprint hash>",
  "vics_proof_id": "<persisted VICS proof ID>",
  "audio_url": "<persisted final master URL>",
  "release_status": "registered"
}
```

Do not provide a receipt during initial registration. The first real Flip must complete through the normal Lyrica → Archisynapse royalty outbox.

### Close the royalty gate

After the outbox state is `receipted`, send only the verified event ID:

```json
{
  "event_id": "<receipted royalty outbox event ID>"
}
```

The closure route loads the persisted outbox record and refuses to close unless:

- the outbox state is `receipted`;
- the receipt is bound to the same track and event;
- status is `paid`;
- gross and net are both `$1.2500`;
- platform fee is `$0.0000`; and
- the catalog track already has complete DNA, Soulprint, and VICS proof.

Once stored, a different receipt cannot replace the original one.

## Remaining release work

The identity and release candidate are built. The artist is not yet honestly launch-ready until these evidence gates close:

1. Render and persist LUZARIA's first final master.
2. Issue the audio-bound DNA, Soulprint, and VICS proof.
3. Register the track in LUZARIA's catalog through the protected endpoint.
4. Complete one real Flip royalty event through Archisynapse.
5. Attach the already-verified outbox receipt to the catalog record.
6. Publish the artist page and first track together.

The API intentionally reports the remaining gates as `pending` rather than fabricating a completed artist launch.
