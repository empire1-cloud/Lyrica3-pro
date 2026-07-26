# Lyrica 3 Beat Discovery Engine

A deterministic, creator-safe discovery layer for Lyrica's persisted track catalog. It does not call Google, Gemini, or an outside recommendation API.

## What ships

- `GET /api/discovery/beats` — text, genre, mood, BPM, key, result-limit, and diversity controls.
- `GET /api/discovery/beats/{dna_tag}/similar` — DNA-seeded “sounds like this” discovery.
- `GET /api/discovery/trending` — trend ranking that balances streams, Flips, freshness, provenance, and underexposed creators.
- `POST /api/discovery/feedback` — authenticated play/save/skip/share/Flip-intent events for future personalization.
- Public result explanations and ownership indicators without leaking LML, raw biometrics, private cultural subtext, signing material, or internal recipes.

## Ranking contract

Search intent has more weight than raw popularity. The engine combines lexical/synonym fit, genre, mood, tempo, key, metadata completeness, engagement, provenance, freshness, and a deterministic exploration signal. Maximum-marginal-relevance re-ranking reduces creator and sound-cluster repetition.

Popularity is deliberately capped as a minority signal so the feed does not become a streams leaderboard.

## Example

```http
GET /api/discovery/beats?q=late%20night%20lowrider&genre=Chicano%20Oldies&min_bpm=65&max_bpm=82&diversity=0.7
```

```json
{
  "engine": "beat-discovery.v1",
  "count": 12,
  "results": [
    {
      "dna_tag": "trk_alpha_006_elmonte",
      "title": "Wildflowers in El Monte",
      "creator": "lyrica.prime",
      "discovery_score": 82.41,
      "match_reasons": [
        "Matches the sound and words you searched",
        "Strong genre fit",
        "Ownership and provenance are attached"
      ]
    }
  ]
}
```

## Production wiring

`backend/production_app.py` mounts the router into the existing Lyrica production app. The router reads the canonical `tracks` collection and writes feedback to `beat_discovery_feedback`; it does not create a second catalog or alter royalty behavior.

## Validation

Run:

```bash
pytest -q backend/tests/test_beat_discovery_engine.py
python -m py_compile backend/beat_discovery_engine.py api/beat_discovery.py backend/production_app.py
```
