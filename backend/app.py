"""Production ASGI entrypoint with the Phase 1 full runtime mounted.

The legacy server remains intact. This entrypoint evolves it by adding the new
versioned routes after the existing API has been constructed.
"""
from server import ROOT_DIR, app, current_user, db, logger
from full_runtime_router import build_full_runtime_router

if not getattr(app.state, "lyrica_full_runtime_v1_mounted", False):
    app.include_router(
        build_full_runtime_router(
            db=db,
            current_user=current_user,
            root_dir=ROOT_DIR,
            logger=logger,
        )
    )
    app.state.lyrica_full_runtime_v1_mounted = True
