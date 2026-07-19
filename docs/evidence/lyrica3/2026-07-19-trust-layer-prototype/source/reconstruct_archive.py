#!/usr/bin/env python3
"""Reconstruct and verify the Exhibit C evidence archive."""

from __future__ import annotations

import base64
import hashlib
from pathlib import Path

EXPECTED_SHA256 = "52613af0efa752ab793bf908ea36343dd545ae24c2c091633a1273e07271d978"
SOURCE = Path(__file__).with_name("LYRICA3_TRUST_LAYER_EVIDENCE_2026-07-19_C.zip.b64")
OUTPUT = Path(__file__).with_name("LYRICA3_TRUST_LAYER_EVIDENCE_2026-07-19_C.zip")


def main() -> None:
    raw = base64.b64decode(SOURCE.read_text(encoding="utf-8").strip(), validate=True)
    digest = hashlib.sha256(raw).hexdigest()
    if digest != EXPECTED_SHA256:
        raise SystemExit(
            f"Integrity failure: expected {EXPECTED_SHA256}, reconstructed {digest}"
        )
    OUTPUT.write_bytes(raw)
    print(f"Verified {OUTPUT.name}: {digest}")


if __name__ == "__main__":
    main()
