"""FastAPI routes for the Lyrica 3 Beat Discovery Engine."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field

try:
    from beat_discovery_engine import BeatDiscoveryEngine, DiscoveryQuery
except ImportError:  # repo-root test/import path
    from backend.beat_discovery_engine import BeatDiscoveryEngine, DiscoveryQuery


class DiscoveryFeedback(BaseModel):
    model_config = ConfigDict(extra="ignore")

    dna_tag: str = Field(min_length=3, max_length=128)
    event: Literal["impression", "play", "complete", "save", "skip", "share", "flip_opened"]
    query: Optional[str] = Field(default=None, max_length=240)
    position: Optional[int] = Field(default=None, ge=1, le=100)
    session_id: Optional[str] = Field(default=None, max_length=128)


def create_beat_discovery_router(
    *,
    context_provider: Callable[[], tuple[Any, Callable[[], Any] | None]],
    user_dependency: Callable[..., Any] | None = None,
) -> APIRouter:
    router = APIRouter(prefix="/api/discovery", tags=["beat-discovery"])

    async def load_tracks() -> tuple[Any, list[dict[str, Any]]]:
        db, ensure_seed = context_provider()
        if ensure_seed is not None:
            result = ensure_seed()
            if hasattr(result, "__await__"):
                await result
        tracks = await db.tracks.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)
        return db, tracks

    @router.get("/beats")
    async def discover_beats(
        q: str = Query(default="", max_length=240),
        genre: str | None = Query(default=None, max_length=80),
        mood: str | None = Query(default=None, max_length=80),
        min_bpm: float | None = Query(default=None, ge=35, le=240),
        max_bpm: float | None = Query(default=None, ge=35, le=240),
        musical_key: str | None = Query(default=None, alias="key", max_length=24),
        limit: int = Query(default=20, ge=1, le=50),
        diversity: float = Query(default=0.55, ge=0.0, le=1.0),
    ):
        _, tracks = await load_tracks()
        engine = BeatDiscoveryEngine(tracks)
        return engine.discover(
            DiscoveryQuery(
                text=q,
                genre=genre,
                mood=mood,
                min_bpm=min_bpm,
                max_bpm=max_bpm,
                musical_key=musical_key,
                limit=limit,
                diversity=diversity,
            )
        )

    @router.get("/beats/{dna_tag}/similar")
    async def similar_beats(
        dna_tag: str,
        limit: int = Query(default=12, ge=1, le=50),
        diversity: float = Query(default=0.55, ge=0.0, le=1.0),
    ):
        _, tracks = await load_tracks()
        try:
            return BeatDiscoveryEngine(tracks).similar(dna_tag, limit=limit, diversity=diversity)
        except KeyError:
            raise HTTPException(status_code=404, detail="Beat DNA tag not found.") from None

    @router.get("/trending")
    async def trending_beats(
        limit: int = Query(default=20, ge=1, le=50),
        diversity: float = Query(default=0.65, ge=0.0, le=1.0),
    ):
        _, tracks = await load_tracks()
        return BeatDiscoveryEngine(tracks).discover(
            DiscoveryQuery(limit=limit, diversity=diversity, seed="trending")
        )

    if user_dependency is not None:

        @router.post("/feedback", status_code=202)
        async def record_feedback(
            body: DiscoveryFeedback,
            user: dict[str, Any] = Depends(user_dependency),
        ):
            db, _ = context_provider()
            exists = await db.tracks.find_one({"dna_tag": body.dna_tag}, {"_id": 1})
            if not exists:
                raise HTTPException(status_code=404, detail="Beat DNA tag not found.")
            event = {
                "id": f"bdf_{uuid.uuid4().hex[:20]}",
                "schema_version": "1.0",
                "creator": user.get("handle"),
                "dna_tag": body.dna_tag,
                "event": body.event,
                "query": body.query,
                "position": body.position,
                "session_id": body.session_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.beat_discovery_feedback.insert_one(dict(event))
            return {"accepted": True, "event_id": event["id"]}

    return router
