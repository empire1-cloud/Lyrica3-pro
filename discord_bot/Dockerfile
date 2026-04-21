# ============================================================
# Lyrica 3 Pro · Empire 1 — Discord Bot (Cloud Run worker)
# Run as a min-instances=1 Cloud Run service so the gateway
# WebSocket stays connected 24/7.
# ============================================================
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8080

WORKDIR /bot

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Cloud Run expects a listener on $PORT even for "workers" — we spawn a
# tiny health endpoint alongside the discord client.
EXPOSE 8080
CMD ["python", "bot.py"]
