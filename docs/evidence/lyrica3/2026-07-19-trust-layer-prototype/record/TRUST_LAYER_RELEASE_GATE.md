# Trust-Layer Release Gate

A release may be labeled production-ready only after all gates below pass with receipts.

## 1. Identity and rights

- Consent artifact and permitted-use scope exist for every identity-bearing voice.
- Revocation and expiration are enforced before generation.
- Acoustic-profile synthesis and authorized identity modeling remain separate modes.
- Input, model, consent, request, output, and export hashes are linked in one receipt chain.

## 2. Persona and cultural alignment

- Vocal stems are evaluated separately from accompaniment.
- Every detector has a labeled benchmark set and published precision/recall targets.
- Cultural Matrix checks are human-governed and cannot be reduced to an emotion classifier.
- Validator model IDs, thresholds, matrix versions, and code commit are recorded per result.
- A failed or uncertain validation blocks release rather than silently passing.

## 3. VICS provenance

- Signed manifest includes content hash, lineage, contributor roles, rights references, model versions, and timestamp.
- Audio watermark is treated as a locator/evidence channel, not proof by itself.
- Watermark key is stored in a secrets system with rotation and per-environment separation.
- Robustness suite covers WAV/FLAC/MP3/AAC, resampling, gain, EQ, compression, reverb, cropping, transcoding, noise, time stretch, and pitch shift.
- False-positive and false-negative rates are measured on clean and attacked corpora.

## 4. Ledger

- Append-only double-entry journal uses integer minor units or fixed decimals.
- Every usage event has a unique idempotency key and signed source receipt.
- Contract/version determines splits, rates, territory, currency, reserves, and effective dates.
- Settlement is separate from accrual; payout state changes only after processor confirmation.
- Reversals, disputes, fraud holds, reconciliation, tax/KYC requirements, and audit exports exist.
- Invariants are tested: journal balances, splits total 100%, no negative payable without authorized reversal, and replay produces no duplicate accrual.

## 5. Operations and security

- Durable queue, retries, cancellation, timeouts, and dead-letter handling.
- Authentication, tenant authorization, rate limits, upload limits, file validation, and path/subprocess hardening.
- Structured logs, metrics, traces, model/GPU admission controls, and incident runbooks.
- Clean-checkout end-to-end test produces a signed generation, validation, watermark-detection, accrual, and reconciliation receipt.
