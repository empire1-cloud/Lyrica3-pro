# Empire Sub-Agents (SL Audio 1)

Saved instruction packs for direct copy/paste into your pod:

- `PFA_Vocal_Biometrics.md`
- `MMA_Late_Pocket_Groove.md`
- `PDA_Texture_and_Mastering.md`

These are formatted as pod-ready instruction documents with:
- Agent name
- Purpose
- Full instruction block
- Strict JSON output schema

## Runtime Wiring

`../vertex_agent_class.py` now auto-loads these files at runtime and registers:
- PFA as vocal biometrics specialist
- MMA as late-pocket groove specialist
- PDA as texture/mastering specialist

## Production

Use `../.env.production.example` as the baseline for Cloud Run env variables.
