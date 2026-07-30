# Lyrica 3 Aether-Voice — Multi-Artist Vocal Runtime

## Public product promise

**Turn your words and melody into an expressive vocal.**

Creators should not have to understand voice workers, phoneme engines, formants, consent receipts, or model adapters. Those systems remain underneath the product.

## What this slice changes

Aether-Voice is now the shared Lyrica vocal runtime for:

- singing from lyrics plus melody;
- expressive text-to-speech;
- spoken hooks and radio voices;
- chant and rhythmic delivery;
- reusable platform voices;
- creator-owned or registered artist voices;
- future local neural voice and vocoder workers.

Luzaria is registered as one optional artist profile. She is not the platform default and does not define the engine.

## Tracker mapping

The runtime registry preserves the four workstreams from the AI Lyricist & Vocal Synthesis Engine tracker:

1. **Thematic lyric intelligence** — heartbreak, struggle and triumph, and cross-cultural themes.
2. **Genre and vernacular intelligence** — regional language, AAVE, corrido narrative, modern Mexican Spanish, Spanglish, and Caló.
3. **Performance styles** — Grit & Gravel, Soaring Passion, Intimate Confession, Corrido Narrative, and Neutral Studio.
4. **Emotional nuance** — cracks, breath, hesitation, vibrato, fry, and melodic runs.

The registry records implementation status and rights requirements rather than pretending every dataset or neural model is complete.

## Runtime routes

Mounted under `/duo-soul`:

- `GET /duo-soul/vocal-forge/engine`
- `POST /duo-soul/vocal-forge/voice/preflight`
- `POST /duo-soul/vocal-forge/voice/render`
- `POST /duo-soul/vocal-forge/tts/render`
- `GET /duo-soul/vocal-forge/voice/artifacts/{artifact_id}`

Render and download routes require `VOCAL_FORGE_INTERNAL_TOKEN`.

## Voice architecture

The platform includes reusable Empire-owned profiles such as Warm Alto, Soul Tenor, Deep Baritone, and Clear Narrator. Registered artist profiles require identity authorization and remain isolated from platform defaults.

The same source-filter performance engine handles singing and speech. It applies:

- pitch and timing;
- vowel formants;
- consonant attacks;
- breath and chest resonance;
- grit and saturation;
- vibrato and micro-jitter;
- emotional cracks;
- performance-style timing;
- deterministic receipts and audio hashes.

## Honest boundary

This is a real deterministic multi-artist audio runtime and produces WAV vocals now. It is not yet a state-of-the-art neural singer or fully intelligible production TTS model. Neural TTS, singing conversion, vocoders, lyric verification, and instrumental generators remain replaceable workers that will connect to this shared engine rather than becoming separate products.

Release-bound output continues to require Cultura review, voice authorization where applicable, and signed receipts.
