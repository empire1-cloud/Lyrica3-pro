# ============================================================
# Lyrica 3 Pro · Empire 1 — FastAPI + Demucs v4 backend image
# ------------------------------------------------------------
# Multi-stage build. Ship a lean production container to
# Render / Railway / Fly / AWS ECS / GCP Cloud Run.
# ============================================================

FROM python:3.11-slim AS base

# System deps: libsndfile + ffmpeg required for demucs audio IO
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg libsndfile1 git curl \
  && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    TORCH_HOME=/opt/torch \
    DEMUCS_MODEL=htdemucs

WORKDIR /app

# ------------------------------------------------------------
# Python deps — pin torch CPU wheels explicitly so the image
# isn't 5GB with CUDA. Swap to the CUDA wheel if your host has a GPU.
# ------------------------------------------------------------
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --extra-index-url https://download.pytorch.org/whl/cpu \
      "torch==2.3.1+cpu" "torchaudio==2.3.1+cpu" && \
    pip install -r /app/requirements.txt && \
    pip install "demucs==4.0.1" "soundfile>=0.12.1"

# Pre-download the htdemucs model weights so first request is fast
RUN python - <<'PY'
from demucs.pretrained import get_model
m = get_model('htdemucs')
print("demucs weights cached:", m.sources)
PY

# ------------------------------------------------------------
# Application code
# ------------------------------------------------------------
COPY backend /app/backend
COPY frontend/src/lib/schema.ts /app/backend/schema.ts

WORKDIR /app/backend

EXPOSE 8001
ENV PORT=8001

# Uvicorn with 2 workers — adjust per host RAM
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT} --workers 2 --proxy-headers"]
