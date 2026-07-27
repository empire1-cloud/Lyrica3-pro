"""Integrated Lyrica 3 API entrypoint with growth, paid media, and Artist Zero.

Run locally with:
    uvicorn artist_growth_api:app --reload

This preserves every existing ``server.py`` route and adds:
- ``/api/growth/*`` for artist operations, CRM, royalties, and analytics
- ``/api/growth/paid/*`` for approval-gated advertising execution
- ``/api/artist-zero/*`` for Lyrica's original AI artist and strategy engine
"""

from server import app
from artist_growth_engine import router as artist_growth_router
from paid_growth_engine import router as paid_growth_router
from artist_zero_engine import router as artist_zero_router


if not any(
    getattr(route, "path", "").startswith("/api/growth")
    for route in app.routes
):
    app.include_router(artist_growth_router)

if not any(
    getattr(route, "path", "").startswith("/api/growth/paid")
    for route in app.routes
):
    app.include_router(paid_growth_router)

if not any(
    getattr(route, "path", "").startswith("/api/artist-zero")
    for route in app.routes
):
    app.include_router(artist_zero_router)
