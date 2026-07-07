"""
Benchmark #1: determinism — the flagship claim.

Runs the Soulfire pipeline twice on the same payload (fixed seed) and compares
SHA-256 hashes of all output artifacts. Identical hashes = the anti-drift
architecture claim is TRUE and demonstrable live.

This is the claim competitors cannot copy with marketing.

Usage:
    python benchmarks/bench_determinism.py --payload path/to/payload.json \
        [--runner "python -m soulfire_kernel.render_from_blueprint {payload} {outdir}"]

The --runner template is invoked twice with fresh output dirs. Default assumes
soulfire_kernel's render entrypoint; adjust to your actual pipeline command.
"""

import argparse
import hashlib
import json
import os
import shlex
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def hash_dir(outdir: str) -> dict:
    result = {}
    for root, _, files in os.walk(outdir):
        for name in sorted(files):
            p = os.path.join(root, name)
            result[os.path.relpath(p, outdir)] = sha256_file(p)
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--payload", required=True)
    parser.add_argument(
        "--runner",
        default="python -m soulfire_kernel.render_from_blueprint {payload} {outdir}",
        help="command template with {payload} and {outdir} placeholders",
    )
    args = parser.parse_args()

    runs = []
    for i in (1, 2):
        outdir = tempfile.mkdtemp(prefix=f"determinism_run{i}_")
        cmd = args.runner.format(payload=shlex.quote(args.payload), outdir=shlex.quote(outdir))
        t0 = time.perf_counter()
        proc = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        elapsed = time.perf_counter() - t0
        if proc.returncode != 0:
            print(json.dumps({
                "benchmark": "determinism", "pass": False,
                "error": f"run {i} failed", "stderr": proc.stderr[-2000:],
            }, indent=2))
            return 1
        runs.append({"outdir": outdir, "hashes": hash_dir(outdir), "seconds": round(elapsed, 1)})

    identical = runs[0]["hashes"] == runs[1]["hashes"]
    mismatched = sorted(
        k for k in set(runs[0]["hashes"]) | set(runs[1]["hashes"])
        if runs[0]["hashes"].get(k) != runs[1]["hashes"].get(k)
    )

    try:
        sha = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], text=True).strip()
    except Exception:
        sha = "unknown"

    report = {
        "benchmark": "determinism",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "git_sha": sha,
        "payload": args.payload,
        "artifact_count": len(runs[0]["hashes"]),
        "run_seconds": [r["seconds"] for r in runs],
        "identical": identical,
        "mismatched_files": mismatched,
        "pass": identical and len(runs[0]["hashes"]) > 0,
    }

    results_dir = os.path.join(os.path.dirname(__file__), "results")
    os.makedirs(results_dir, exist_ok=True)
    with open(os.path.join(results_dir, f"determinism_{int(time.time())}.json"), "w") as f:
        json.dump(report, f, indent=2)
    print(json.dumps(report, indent=2))
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
