# Lyrica 3 Vocal Performance Controls

This layer turns creator language into repeatable vocal behavior without exposing internal DSP terms on the product surface.

## Public controls

### Styles

- **Natural** — balanced and clear.
- **Intimate** — close, vulnerable and slightly breathy.
- **Gritty** — rougher, heavier and more defiant.
- **Soaring** — open, lifted and built for emotional peaks.
- **Corrido** — direct, rhythmic and story-forward.

### Timeline moments

- Add breath
- Let the voice crack
- Add vocal fry
- Push harder
- Hold back
- Add a melodic run
- Add hesitation

The public principle is:

> Choose the feeling, then shape the moments that matter.

## Runtime behavior

The performance planner creates deterministic per-note controls for vibrato, breath, grit, fry, gain, onset movement, voice cracks, melodic movement and hesitation. The performance renderer applies those controls to the score-locked guide and produces a new WAV plus a bound receipt.

The same score and performance plan produce the same audio hash. A changed style or changed timeline moment produces a different audio hash and a different performance-plan digest.

## Routes

Mounted under `/duo-soul`:

- `GET /duo-soul/vocal-forge/performance/styles`
- `POST /duo-soul/vocal-forge/performance/plan`
- `POST /duo-soul/vocal-forge/performance/preflight`
- `POST /duo-soul/vocal-forge/performance/render`
- `GET /duo-soul/vocal-forge/performance/artifacts/{artifact_id}`

Render and artifact download require the same fail-closed `VOCAL_FORGE_INTERNAL_TOKEN` used by the score-locked guide.

## Tracker reconciliation

The historical project tracker listed several modules as complete or in progress. This implementation does not inherit those percentages as proof. Capability is considered implemented only when it is present in the runtime, changes the generated artifact, appears in the receipt and passes the focused test gate.

The current verified scope covers deterministic vibrato shaping, breath, fry, grit, voice-crack movement, melodic-run movement, hesitation gating, style-specific gain and onset movement. It does not claim a natural final singer, celebrity imitation, completed model training or cleared use of historical training datasets.
