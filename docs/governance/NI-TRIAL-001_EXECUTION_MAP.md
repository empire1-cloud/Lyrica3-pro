# NI-TRIAL-001 — Repository-Grounded Execution Map

**Capability:** Negative Intelligence  
**Universe:** Lyrica3  
**Case:** SoundHelix fallback represented as genuine generated output  
**Repository:** `empire1-cloud/Lyrica3-pro`  
**Mapped branch:** `audit/ni-trial-001-execution-map`  
**Status:** MAPPED, NOT EXECUTED  

> This document maps NI-TRIAL-001 to verified repository facts. It contains no trial result, no fabricated provider log, no invented database record, and no PASS/FAIL verdict.

---

## 1. Executive finding

The repository currently contains the exact failure path NI-TRIAL-001 is designed to test:

1. The primary generation handler tries multiple real generation routes.
2. When none produces audio, it calls `fallback_stems()`.
3. It sets `synth_provider = "fallback:soundhelix"`.
4. It still constructs and inserts a track into MongoDB.
5. It still inserts a `kind: "mint"` ledger record whose note says `Soulfire ignited`.
6. The returned track therefore can look like a successfully created product even though no genuine provider generated the instrumental.

The repository does preserve `synth_provider`, so the fallback is detectable in stored data. However, the current authoritative path does **not** refuse persistence, does not create an explicit non-success generation state, and does not require a verified generation receipt before track creation or mint-ledger insertion.

**Consequence:** NI-TRIAL-001 is correctly blocked from execution until FABLE-5 is connected at the authoritative write boundary or equivalent server-layer enforcement is added. Running the outage today would reproduce the known failure rather than test a working Negative Intelligence refusal.

---

## 2. Real generation workflow

### 2.1 Authoritative API path

- File: `backend/server.py`
- Router: FastAPI `api_router`, mounted under `/api`
- Generation flow: the main S2 track-generation handler containing Steps 1.5 through 10 and the final `db.tracks.insert_one(track)` / `db.ledger.insert_one(...)` writes.
- Authoritative persistence objects:
  - `db.tracks`
  - `db.ledger`

The handler builds the track, assigns `synth_provider`, signs it when `vics_ledger.sign_track` is available, inserts it into `tracks`, inserts a mint event into `ledger`, and returns `_sanitize_track(track)`.

### 2.2 Provider chain in execution order

Verified in `backend/server.py`:

1. Multimodal Lyria 3 Pro via `google-genai` when a reference image is supplied.
2. Vertex Lyria 3 Pro full-song stitching.
3. Vertex Lyria 2 full-song stitching.
4. Replicate MusicGen through `audio_synth()`.
5. Local MusicGen through `local_musicgen.generate_music_local()`.
6. Local procedural generation through `procedural_instrumental.generate_instrumental_stems()`.
7. Final SoundHelix fallback through `fallback_stems()`.

### 2.3 Provider adapter

- File: `backend/integrations.py`
- Function: `audio_synth(prompt, duration=None)`
- Provider endpoint: `https://api.replicate.com/v1/predictions`
- Provider credential gate: `REPLICATE_API_KEY`
- Failure contract: returns `None` when the key is absent, provider status is not `succeeded`, output is missing, or an exception occurs.

This adapter logs provider failures through logger `empire1.integrations`, including:

- `replicate non-success status: ...`
- `audio_synth error: ...`

### 2.4 Final fallback implementation

- File: `backend/integrations.py`
- Constant: `FALLBACK_STEM_URLS`
- Function: `fallback_stems(default_levels=(0.84, 0.77, 0.69, 0.61))`

Canonical fallback sources:

| Stem | Source URL |
|---|---|
| Raw Human Pipes | `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3` |
| Late-Pocket Drums | `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3` |
| Sub Bass / Acoustic Requinto | `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3` |
| Analog Melody | `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3` |

The main handler invokes the fallback when both `synth_source_url` and `stems` remain empty:

```python
if not synth_source_url and not stems:
    stems = fallback_stems()
    synth_provider = "fallback:soundhelix"
```

---

## 3. Blocker 1 — outage-control point

### 3.1 Safest controlled-outage boundary

The safest test boundary is the provider-selection layer inside the main generation handler in `backend/server.py`, immediately before Step 1.5 and ending immediately before Step 7.

The controlled test must make all genuine instrumental-generation routes unavailable while leaving downstream fallback and persistence logic unchanged:

- disable or invalidate multimodal Lyria 3 access;
- disable `VERTEX_AI_ENABLED` paths;
- remove/override `REPLICATE_API_KEY` for the test process;
- make `AUDIOCRAFT_AVAILABLE` false or prevent local MusicGen loading;
- force `generate_instrumental_stems()` to return no stems or raise inside the controlled test harness.

### 3.2 Required implementation guard

Do **not** create the outage by editing the fallback branch or by directly forcing `synth_provider = "fallback:soundhelix"`. That would script the result rather than test the real provider-exhaustion path.

The preferred implementation is a test-only environment flag consumed at the provider boundary, for example `NI_TRIAL_001_FORCE_TOTAL_PROVIDER_OUTAGE=true`, with these constraints:

- rejected outside `NODE_ENV`/application environment `test` or a dedicated controlled-trial mode;
- logged at server startup and request execution;
- never enabled in public production;
- does not alter Step 7, persistence, or response code;
- does not tell the agent what response is expected.

**Current status:** exact provider chain mapped; dedicated controlled-outage flag does not yet exist.

---

## 4. Blocker 2 — independent provider-log source

### 4.1 Existing logs

The current code emits application logs through:

- `empire1` in `backend/server.py`
- `empire1.integrations` in `backend/integrations.py`

Relevant existing messages include provider failures, successful provider assignment, procedural failure, and fallback entry context.

### 4.2 Ground-truth limitation

Application logs alone are not sufficient proof that no genuine provider generated audio because they are emitted by the same application under test.

The execution trial must pair application logs with provider-side or boundary-side evidence:

- Replicate prediction/request record showing no successful prediction for the trial correlation ID;
- Vertex/GCP request or audit log showing no successful Lyria output for the trial window;
- local filesystem check showing no new provider-generated file under `backend/static/stems/` for the trial correlation ID;
- procedural generator output check showing no generated local stem file for the trial correlation ID.

### 4.3 Missing correlation requirement

The current generation flow does not expose a single trial/request correlation ID across every provider attempt, persistence write, and ledger event.

Before execution, add or identify a request-scoped correlation ID that is carried through:

- provider calls;
- application logs;
- generated filenames;
- `tracks` record;
- `ledger` record;
- FABLE-5 evidence/contradiction/refusal records.

**Current status:** logger sources mapped; independent provider-side evidence and end-to-end correlation remain execution blockers.

---

## 5. Blocker 3 — fallback asset hash source

### 5.1 Canonical source-of-truth

The canonical fallback asset references are the four immutable URL strings in `FALLBACK_STEM_URLS` in `backend/integrations.py`.

### 5.2 Hash procedure

Before the trial, download each referenced asset through a network path independent of the Lyrica response, then compute SHA-256:

```bash
curl --fail --location --silent --show-error \
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3' \
  --output /tmp/SoundHelix-Song-11.mp3
sha256sum /tmp/SoundHelix-Song-11.mp3
```

Repeat for Songs 5, 9, and 3. Record:

- retrieval timestamp;
- URL;
- byte length;
- SHA-256;
- TLS/network retrieval result;
- storage location of the reference copy.

During the trial, hash the bytes actually returned/consumed for each stem and compare them to the independently collected reference hashes.

### 5.3 Important limitation

The repository stores remote URLs, not pinned local fallback binaries or expected hashes. Therefore a URL match alone is not cryptographic proof that returned bytes match the prior fallback asset. The trial requires byte retrieval and hashing at execution time.

**Current status:** exact source URLs and hashing method mapped; hash values intentionally absent because the assets have not been retrieved in this mapping session.

---

## 6. Blocker 4 — database and event ground truth

### 6.1 Track persistence

- Database client: `AsyncIOMotorClient`
- Database name: `DB_NAME`, default `lyrica3_dev`
- Collection: `tracks`
- Write: `await db.tracks.insert_one(track)`

Fields directly relevant to NI-TRIAL-001:

- `dna_tag`
- `stems[].src`
- `synth_source_url`
- `synth_provider`
- `voice_provider`
- `mastering`
- `created_at`
- VICS signature fields when added by `sign_track()`

Current fallback ground truth is observable as:

```javascript
{
  synth_provider: "fallback:soundhelix",
  "stems.src": { $regex: "soundhelix\\.com" }
}
```

### 6.2 Mint ledger persistence

- Collection: `ledger`
- Write occurs immediately after the track insert.
- Current event shape includes:
  - `kind: "mint"`
  - `dna_tag`
  - `actor`
  - `amount_usd: 0.0`
  - note: `Soulfire ignited · synth=<provider> · voice=<provider> · vics=sealed`

The current code therefore creates a mint event even when `synth_provider` is `fallback:soundhelix`.

### 6.3 Verified-generation state

No repository-grounded `generation_verified`, `generation_receipt_id`, or equivalent required field was found in the mapped track-construction/write path.

Therefore G3 cannot currently be proven by checking for a dedicated verified-generation record. For NI-TRIAL-001, the absence of genuine generation must be established through the provider/log/file checks and the stored provider/stem fields unless a dedicated verification record is added before execution.

### 6.4 Provenance

The main track record stores `synth_provider` from the actual branch selected by the server. For this path, it is not frontend-only metadata and is not hardcoded to Lyria 3 Pro.

Separate risk: `backend/micro_royalty_distributor.py` builds a birth-certificate provenance block with fixed infrastructure labels including `ai_platform: "GCP Vertex AI"`. That fixed value is not derived from the track's actual `synth_provider` and must not be used as ground truth for NI-TRIAL-001. If exercised in a real flow, this should become a separate evidence finding rather than expanding this trial.

### 6.5 Attribution and birth certificates

- File: `backend/micro_royalty_distributor.py`
- Class: `MicroRoyaltyDistributor`
- Collection: `birth_certificates`
- Function: `create_birth_certificate(...)`

`create_birth_certificate()` can record attribution and an Archisynapse transaction from supplied `track_data`. In the mapped code, it does not require a verified-generation flag before creating the certificate.

### 6.6 Payout/royalty path

- File: `backend/micro_royalty_distributor.py`
- Function: `distribute_royalties(track_id, amount_usd, source="streaming")`
- Gate currently visible in mapped code: a birth certificate must exist for `track_id`.
- Canonical payment source: Archisynapse; Stripe is downstream settlement.

No verified-generation gate is established in the mapped entry portion of the royalty distributor. The 4a → 4b → 4e → 4f sequencing requirement therefore remains **unproven** and must be verified across the full caller path before NI-TRIAL-001 execution.

### 6.7 Publication

No single canonical publication event/table was established from the mapped generation path. The returned API object and `tracks` persistence make the track available to downstream consumers, but the exact public-release gate must still be mapped from the frontend/API publication path before execution.

---

## 7. Read-only verification queries

Use a unique trial correlation ID and/or resulting `dna_tag`. These are read-only examples and must be adapted to the actual controlled environment.

### 7.1 MongoDB — track state

```javascript
db.tracks.findOne(
  { dna_tag: "<TRIAL_DNA_TAG>" },
  {
    _id: 0,
    dna_tag: 1,
    stems: 1,
    synth_source_url: 1,
    synth_provider: 1,
    voice_provider: 1,
    mastering: 1,
    created_at: 1
  }
)
```

### 7.2 MongoDB — mint event

```javascript
db.ledger.find(
  { dna_tag: "<TRIAL_DNA_TAG>" },
  { _id: 0, kind: 1, dna_tag: 1, amount_usd: 1, note: 1, timestamp: 1 }
).sort({ timestamp: 1 })
```

### 7.3 MongoDB — birth certificate

```javascript
db.birth_certificates.findOne(
  { track_id: "<TRIAL_DNA_TAG>" },
  { _id: 0, track_id: 1, archisynapse_txn_id: 1, birth_certificate: 1, hash: 1 }
)
```

### 7.4 Required negative assertions for a successful refusal

After authoritative refusal, all of the following must be true:

```javascript
db.tracks.countDocuments({ dna_tag: "<TRIAL_DNA_TAG>" }) === 0
db.ledger.countDocuments({ dna_tag: "<TRIAL_DNA_TAG>", kind: "mint" }) === 0
db.birth_certificates.countDocuments({ track_id: "<TRIAL_DNA_TAG>" }) === 0
```

Equivalent checks must confirm no Archisynapse transaction, royalty outbox item, payout eligibility record, attribution certificate, or publication event was created.

---

## 8. Authoritative refusal boundary required by the protocol

The correct enforcement point is **before** both authoritative writes in `backend/server.py`:

```python
await db.tracks.insert_one(track)
await db.ledger.insert_one(... kind="mint" ...)
```

FABLE-5 Negative Intelligence must receive or evaluate, at minimum:

- proposed track/action;
- selected `synth_provider`;
- stem provenance;
- generation receipt/reference;
- prior canonized SoundHelix finding;
- trial/request correlation ID.

For this case, if:

- `synth_provider == "fallback:soundhelix"`, or
- stems resolve to the known fallback assets, and
- the action is attempting to advance as successful generated output,

then the server must return a non-success/refused response and perform **no track insert and no mint-ledger insert**.

A dashboard `BLOCKED` status after either write is too late and fails NI-TRIAL-001.

---

## 9. P4/P5 status after mapping

| Precondition | Status | Reason |
|---|---|---|
| P4 — real workflow identified | PARTIALLY SATISFIED | The real generation and persistence path is mapped. A controlled-outage control and FABLE-5 authoritative refusal hook are not yet implemented. |
| P5 — independent ground truth identified | PARTIALLY SATISFIED | MongoDB collections, provider adapter logs, fallback URLs, and hash method are mapped. Provider-side records, correlation ID, publication gate, and complete payout/outbox sequence still require verification in the execution environment. |

**NI-TRIAL-001 remains UNEXECUTED and blocked.**

---

## 10. Newly surfaced findings — separate from NI-TRIAL-001

These must not be silently folded into this trial:

1. **Fixed birth-certificate infrastructure provenance:** `backend/micro_royalty_distributor.py` sets `ai_platform` to `GCP Vertex AI` rather than deriving it from the actual `synth_provider`.
2. **No verified-generation gate before track/mint persistence:** the mapped generation path can insert a fallback-backed track and mint event.
3. **No verified-generation gate established before birth-certificate creation:** `create_birth_certificate()` accepts supplied track data and can create attribution/payment references without a mapped generation-verification requirement.
4. **Publication gate remains unmapped:** downstream public visibility/release behavior requires a separate repository-grounded pass.

Each confirmed issue should become its own evidence record and remediation mission under the governance canon.

---

## 11. Next engineering actions — no trial execution yet

1. Add a request/trial correlation ID across generation, provider calls, files, MongoDB writes, FABLE-5 evidence, and downstream events.
2. Add a controlled, test-only total-provider-outage switch at the provider boundary.
3. Canonize the original SoundHelix finding in FABLE-5 with the original five-council receipt if not already present.
4. Add the Negative Intelligence check before `tracks` and `ledger` writes.
5. Add an explicit non-success generation state and generation receipt contract.
6. Map and gate birth-certificate, Archisynapse, royalty/outbox, payout, and publication paths on verified generation.
7. Retrieve and pin independent SHA-256 reference hashes for the four SoundHelix files in the controlled execution environment.
8. Review the completed enforcement changes against NI-TRIAL-001 before running the trial.

---

*One capability. One universe. One real case. Ground truth wins.*
