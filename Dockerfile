FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg fluidsynth fluid-soundfont-gs \
  && ln -sf /usr/share/sounds/sf2/FluidR3_GS.sf2 /usr/share/sounds/sf2/FluidR3_GM.sf2 \
  && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    LYRICA_PROVIDER_MODE=empire_local

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ /app/backend/

WORKDIR /app/backend

EXPOSE 8080

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8080} --workers ${WORKERS:-2} --proxy-headers"]
