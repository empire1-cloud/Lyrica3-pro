FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bookworm

RUN apt-get update \
    && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y --no-install-recommends \
        ffmpeg \
        libsndfile1 \
        python3 \
        python3-pip \
        python3-venv \
    && corepack enable \
    && corepack prepare yarn@1.22.22 --activate \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
