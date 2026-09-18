# Lyrica Ubuntu Studio Neural Voice Workers

## What this closes

Lyrica now has a real connection contract for the founder-controlled Ubuntu Studio machine:

- **Seed-VC** converts a dry sung performance into an explicitly authorized reference voice while preserving the source performance's pitch and timing.
- **OpenVoice V2** creates multilingual cloned speech from text and an explicitly authorized reference recording.
- **Demucs v4** separates vocals and accompaniment when a clean source or stem is needed.

The worker listens only on `127.0.0.1`, requires a bearer token, and can only read or write inside the configured Lyrica audio root.

## Honest product boundary

Seed-VC is a singing **conversion** model. It does not invent sung lyrics from a MIDI tone. The source must already contain the words and melody, normally from:

1. a creator's scratch vocal;
2. an authorized session singer;
3. a future text-to-singing model connected through the same worker contract.

Aether-Voice and the older deterministic guide remain useful for score planning and proof, but release-bound Seed-VC jobs reject those synthetic guide artifacts as the final source because they do not guarantee intelligible lyrics.

OpenVoice V2 is a real TTS cloning model. It is not the singing renderer.

## Install on the Ubuntu Studio host

From the Lyrica repository:

```bash
bash scripts/install_ubuntu_neural_workers.sh
```

The installer:

- creates isolated Python 3.10 and 3.9 environments;
- checks out pinned Seed-VC, OpenVoice, and MeloTTS code revisions;
- downloads pinned official model-weight revisions;
- verifies the Seed-VC and OpenVoice checkpoint SHA-256 values;
- installs Demucs;
- writes an installed-model receipt;
- generates a random worker token;
- creates and starts a user-level `systemd` service;
- verifies `/health`.

Python 3.10 and Python 3.9 must already be available. Override their locations with `PYTHON310` and `PYTHON39`.

## Connect Lyrica

The installer writes:

```text
~/LyricaStudio/config/lyrica-client.env
```

Load it before starting Lyrica:

```bash
set -a
source ~/LyricaStudio/config/lyrica-client.env
set +a
```

Keep the existing Lyrica internal token and receipt signing key configured as well:

```bash
export VOCAL_FORGE_INTERNAL_TOKEN='at-least-24-characters'
export VOCAL_FORGE_RECEIPT_SIGNING_KEY='at-least-32-characters'
```

## Lyrica routes

Mounted under `/duo-soul`:

- `GET /duo-soul/vocal-forge/neural/status`
- `POST /duo-soul/vocal-forge/neural/assets`
- `POST /duo-soul/vocal-forge/neural/preflight`
- `POST /duo-soul/vocal-forge/neural/render`
- `GET /duo-soul/vocal-forge/neural/artifacts/{artifact_id}`

### Singing conversion flow

1. Upload an authorized reference recording as `reference_voice`.
2. Upload a dry sung source as `source_singing`.
3. Submit a `seed_vc_singing` render request with consent scope `singing_voice_clone` or `voice_clone`.
4. Lyrica verifies the exact reference SHA-256, calls the local worker, verifies the output SHA-256, and writes a signed receipt.

### TTS flow

1. Upload an authorized reference recording as `reference_voice`.
2. Submit an `openvoice_v2_tts` request with text, language, and consent scope `tts_voice_clone` or `voice_clone`.
3. Lyrica returns a cloned speech artifact and receipt.

## Operations

```bash
systemctl --user status lyrica-audio-worker
journalctl --user -u lyrica-audio-worker -f
curl http://127.0.0.1:8787/health
```

Installed repository commits, model revisions, and checkpoint hashes are recorded at:

```text
~/LyricaStudio/config/installed-models.json
```

## Security and rights

Only clone a voice owned by the creator or covered by explicit permission. Consent is bound to the exact uploaded reference hash. Uploaded reference and source roles are enforced. The worker rejects paths outside the Lyrica audio root, and the main API rejects non-loopback plain HTTP worker URLs.
