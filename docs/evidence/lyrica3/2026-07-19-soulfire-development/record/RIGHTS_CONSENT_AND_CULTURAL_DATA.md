# Rights, Consent, and Cultural Data Boundary

## Voice profiles

Use two separate modes:

### Acoustic Profile Synthesis

Extract broad performance features and map them to a new synthetic persona. Do not retain or reproduce identity embeddings unless separately authorized. Similarity evaluation must include a maximum identity-likeness threshold and human review.

### Authorized Voice Identity Model

Allowed only when the speaker or authorized rights holder supplies explicit consent. Store:

- subject/rights-holder identity;
- consent artifact hash;
- allowed purposes and territories;
- expiration and revocation state;
- prohibited content classes;
- model/version and training-source hashes;
- every generation receipt.

## Corpus ingestion

Approved source classes:

- original Empire-1 commissioned material;
- creator-contributed material under explicit training license;
- public-domain material;
- properly licensed datasets whose terms allow the intended training and commercial use;
- community-authored annotations with contributor agreements.

Do not ingest full copyrighted lyrics merely because they are visible online. Metadata, short factual annotations, human-authored cultural matrices, and licensed excerpts should be separated from protected full text.

## Cultural Matrix governance

Each matrix needs named contributors, provenance, version, geographic and historical scope, stereotypes to avoid, contested terms, review dates, and a community-benefit policy. “Universal” must mean plural, governed matrices—not one model claiming automatic authority over every culture.
