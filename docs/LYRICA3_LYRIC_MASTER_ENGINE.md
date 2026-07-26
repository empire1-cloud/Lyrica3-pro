# Lyrica 3 Lyric Master Engine v2

## Purpose

The existing Empire Lyric Master remains the complete track-blueprint orchestrator. This v2 module is the dedicated lyric intelligence layer beneath it: write, rewrite, polish, analyze, score, structure, and seal lyrics before Soulfire rendering.

## Runtime contract

- Local and deterministic; no Google/Gemini or other external API is required.
- Produces complete song sections instead of a four-line draft.
- Returns line-level syllable counts, rhyme keys, section/bar positions, and LML performance tags.
- Returns an EFL/Soulfire-compatible `soulfire_lyrics` list.
- Produces a SHA-256 content manifest for later VICS proof issuance. It does not falsely claim that a VICS proof has already been issued.

## API

The app is mounted by `backend/server.py` at `/duo-soul`, so the public paths are:

- `GET /duo-soul/lyrics/capabilities`
- `POST /duo-soul/lyrics/master`

### Generate

```json
{
  "concept": "choosing myself after a late-night breakup",
  "genre": "SGV Oldies / Contemporary R&B",
  "mood": "late-night honesty",
  "language": "bilingual",
  "cultural_context": ["San Gabriel Valley", "lowrider soul", "family dignity"],
  "must_include": ["I choose myself"],
  "creator_id": "cre_example",
  "seed": 113
}
```

### Analyze or revise an existing lyric

Set `mode` to `analyze`, `polish`, or `rewrite` and provide `existing_lyrics` with optional headings such as `[Verse 1]`, `[Chorus]`, and `[Bridge]`.

## Quality gates

The engine scores hook strength, cohesion, specificity, singability, rhyme consistency, emotional arc, originality, and cultural grounding. A draft is marked `mastered` at an overall score of 0.72 or higher; otherwise it returns `needs_revision` with exact notes.

## Ownership boundary

`ownership_manifest.content_sha256` binds the returned text to a stable digest. The manifest says “creator-controlled draft” because ownership/provenance becomes authoritative only when the existing Lyrica DNA/Soulprint/VICS flow seals it.
