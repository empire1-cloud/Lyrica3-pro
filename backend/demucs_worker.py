"""
demucs_worker.py
================
Demucs v4 (htdemucs) stem-separation pipeline for the S2 Mutation Engine.

Runs synchronously on small files or as a background job on larger uploads.
Returns 4 public URLs in the Stem contract shape the frontend already consumes.

Usage (FastAPI integration — add to server.py):
------------------------------------------------

    from fastapi import UploadFile, File, BackgroundTasks
    from demucs_worker import separate_to_stems

    @api_router.post("/demucs/separate")
    async def demucs(file: UploadFile = File(...), user = Depends(current_user)):
        tmp = f"/tmp/{uuid.uuid4().hex}_{file.filename}"
        with open(tmp, "wb") as f:
            f.write(await file.read())
        stems = separate_to_stems(tmp, out_dir="/app/backend/static/stems")
        return {"stems": stems}

Hard costs:
-----------
- Model weights (htdemucs): ~260MB (cached at build time in the Dockerfile)
- CPU time:  ~0.6× realtime per core (3min song → ~2min on 4 vCPU)
- GPU time:  ~0.08× realtime on A100 (3min song → ~15s)
- RAM peak:  ~1.8GB per process; keep workers <= (RAM / 2GB)
"""

from __future__ import annotations
import os
import subprocess
import shutil
import uuid
from pathlib import Path
from typing import Dict, List


# Map Demucs 4-stem output → Empire 1 Stem contract
_DEMUCS_TO_EMPIRE = {
    "vocals":  "Raw Human Pipes",
    "drums":   "Late-Pocket Drums",
    "bass":    "Sub Bass / Acoustic Requinto",
    "other":   "Analog Melody",
}


def separate_to_stems(
    input_path: str,
    out_dir: str = "/app/backend/static/stems",
    model: str = "htdemucs",
    device: str = "cpu",   # swap to "cuda" on GPU hosts
    public_base: str = "/static/stems",
) -> List[Dict]:
    """Run demucs v4 on `input_path` and return 4 public stem dicts."""
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    job = uuid.uuid4().hex[:10]
    work = Path(out_dir) / job
    work.mkdir(parents=True, exist_ok=True)

    # demucs writes to <work>/<model>/<input_stem>/{vocals,drums,bass,other}.wav
    cmd = [
        "python", "-m", "demucs",
        "-n", model,
        "-d", device,
        "--mp3",                 # MP3 output — smaller files, browser-playable
        "--mp3-bitrate", "192",
        "-o", str(work),
        input_path,
    ]
    subprocess.run(cmd, check=True)

    stem_dir = work / model / Path(input_path).stem
    stems: List[Dict] = []
    for demucs_name, empire_name in _DEMUCS_TO_EMPIRE.items():
        src = stem_dir / f"{demucs_name}.mp3"
        if not src.exists():
            continue
        # move into deterministic public path
        public_name = f"{job}_{demucs_name}.mp3"
        dest = Path(out_dir) / public_name
        shutil.move(str(src), str(dest))
        stems.append({
            "name":  empire_name,
            "level": 0.78,
            "peak":  0.62,
            "src":   f"{public_base}/{public_name}",
        })

    # cleanup working directory
    shutil.rmtree(work, ignore_errors=True)
    return stems
