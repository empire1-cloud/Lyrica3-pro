from __future__ import annotations

import base64
import hashlib
from pathlib import Path

EXPECTED_SHA256 = "48c52e81aa578b7b00369fefd3aefb05384aca3baca1448d336f12089acce559"
OUTPUT_NAME = "EXHIBIT_A_ORIGINAL_LYRICA3_SOULFIRE_2026-05-23.txt"
PART_GLOB = OUTPUT_NAME + ".b64.part-*"


def main() -> None:
    source_dir = Path(__file__).resolve().parent
    parts = sorted(source_dir.glob(PART_GLOB))
    if not parts:
        raise SystemExit(f"No preservation parts found for {PART_GLOB}")

    encoded = "".join(part.read_text(encoding="ascii").strip() for part in parts)
    try:
        source_bytes = base64.b64decode(encoded, validate=True)
    except Exception as exc:
        raise SystemExit(f"Base64 reconstruction failed: {exc}") from exc

    actual_sha256 = hashlib.sha256(source_bytes).hexdigest()
    if actual_sha256 != EXPECTED_SHA256:
        raise SystemExit(
            "SHA-256 mismatch: "
            f"expected {EXPECTED_SHA256}, reconstructed {actual_sha256}"
        )

    output_path = source_dir / OUTPUT_NAME
    output_path.write_bytes(source_bytes)
    print(f"Reconstructed: {output_path}")
    print(f"SHA-256: {actual_sha256}")
    print(f"Parts: {len(parts)}")
    print(f"Bytes: {len(source_bytes)}")


if __name__ == "__main__":
    main()
