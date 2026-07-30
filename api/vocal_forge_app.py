from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .cultura_pronunciation import create_cultura_pronunciation_router
from .vocal_forge import create_vocal_forge_router
from .vocal_performance import create_vocal_performance_router

app = FastAPI(
    title="Lyrica 3 Vocal Forge",
    version="performance-v1",
    description="Score, pronunciation, performance and receipt service for Lyrica 3.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(create_cultura_pronunciation_router())
app.include_router(create_vocal_forge_router())
app.include_router(create_vocal_performance_router())


@app.get("/healthz", tags=["system"])
async def healthz():
    return {
        "status": "ok",
        "service": "lyrica3-vocal-forge",
        "runtime_version": "performance-v1",
        "enabled_renderer": "lyrica_deterministic_performance_guide",
    }
