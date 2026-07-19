# Lyrica 3 Pro / Soulfire — Origin Evidence Packet

**Exhibit date stated inside source:** May 23, 2026, 5:52:14 AM  
**Packet assembled:** 2026-07-19T21:18:39Z  
**Evidence status:** Supporting chronology record; not a legal conclusion.

## Purpose

This packet preserves an exact recoverable copy of an early Lyrica 3 Pro / Soulfire specification and records its cryptographic fingerprint. The source predates later product refinements and documents the combined vision for Soulfire, Sonance Pro / SL AUDIO Studio, SL Universal, DNA-based attribution, remix economics, creator royalties, cultural constraints, and studio-quality output.

## Contents

- `source/EXHIBIT_A_ORIGINAL_LYRICA3_SOULFIRE_2026-05-23.txt.b64.part-*` — Base64-encoded source split into ordered preservation parts.
- `source/reconstruct_source.py` — reconstructs the untouched UTF-8 source and verifies its SHA-256.
- `SHA256SUMS.txt` — expected hash for the reconstructed source.
- `record/EVIDENCE_MANIFEST.json` — machine-readable provenance and handling record.
- `record/CHRONOLOGY_ENTRY.md` — neutral chronology entry suitable for the Lyrica evidence index.
- `record/SOURCE_ANALYSIS.md` — source-backed inventory of concepts present in the historical record.
- `record/FINANCIAL_ASSERTIONS_AUDIT.md` — isolates later AI-generated projections that are not approved Empire-1 canon.
- `record/CHAIN_OF_CUSTODY.md` — preservation actions and verification results.

## Reconstruction and verification

From this directory, run:

```bash
python source/reconstruct_source.py
sha256sum -c SHA256SUMS.txt
```

Expected SHA-256:

```text
48c52e81aa578b7b00369fefd3aefb05384aca3baca1448d336f12089acce559
```

## Evidence discipline

The embedded timestamp is evidence of what the text states, not independent third-party timestamp verification. This packet supports chronology when combined with repository commits, message exports, cloud metadata, domain records, screenshots, generated assets, and implementation receipts. Preserve the encoded source parts and any reconstructed source without editing them.