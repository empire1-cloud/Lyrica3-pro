# ============================================================
# Lyrica 3 Pro · Empire 1 — FastAPI + Demucs v4 backend image
# ------------------------------------------------------------
# Multi-stage build. Ship a lean production container to
# Render / Railway / Fly / AWS ECS / GCP Cloud Run.
# ============================================================

FROM python:3.11-slim AS builder

# System deps: libsndfile + ffmpeg required for demucs audio IO
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg libsndfile1 git curl && \
    rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1 \
    TORCH_HOME=/opt/torch DEMUCS_MODEL=htdemucs

WORKDIR /app
COPY backend/requirements.txt /app/requirements.txt

RUN pip install --extra-index-url https://download.pytorch.org/whl/cpu \
      "torch==2.3.1+cpu" "torchaudio==2.3.1+cpu" && \
    pip install -r /app/requirements.txt && \
    pip install "demucs==4.0.1" "soundfile>=0.12.1"

RUN python -c "from demucs.pretrained import get_model; m = get_model('htdemucs'); print('demucs weights cached:', m.sources)"

# --- Final Stage ---
FROM python:3.11-slim AS final

RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg libsndfile1 \
  && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    TORCH_HOME=/opt/torch \
    DEMUCS_MODEL=htdemucs \
    PORT=8001

WORKDIR /app

# Copy installed packages and weights from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /opt/torch /opt/torch

COPY backend /app/backend
# Syncing the Soulfire Schema for type-safe coordination
COPY frontend/src/lib/schema.ts /app/backend/schema.ts

# Security: Run as non-root user
RUN useradd -m appuser && \
    mkdir -p /app/backend/output /opt/torch && \
    chown -R appuser:appuser /app /opt/torch && \
    chmod -R 755 /app /opt/torch /usr/local/lib/python3.11/site-packages /usr/local/bin

USER appuser

WORKDIR /app/backend

EXPOSE ${PORT}

# Use exec form for CMD to handle signals correctly
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT} --workers ${WORKERS:-2} --proxy-headers"]
