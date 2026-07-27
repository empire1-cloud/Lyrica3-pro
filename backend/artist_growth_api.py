"""Integrated Lyrica 3 API entrypoint with the Artist Growth engine enabled.

Run locally with:
    uvicorn artist_growth_api:app --reload

This preserves every existing ``server.py`` route and adds ``/api/growth/*``.
"""

from server import app
from artist_growth_engine import router as artist_growth_router


if not any(
    getattr(route, "path", "").startswith("/api/growth")
    for route in app.routes
):
    app.include_router(artist_growth_router)
