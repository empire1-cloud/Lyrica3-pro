"""Production entrypoint for Lyrica 3.

Preserves the existing server. The proof-first, persist-first Archisynapse v2
Flip route replaces the legacy route only after an explicit deployment flag is
enabled, so merging this code cannot accidentally block live Flips before keys
and service URLs are installed.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict

from fastapi import Depends, HTTPException
from fastapi.routing import APIRoute
from starlette.routing import Mount

import server
from api.aether_voice import create_aether_voice_router
from api.cultura_pronunciation import create_cultura_pronunciation_router
from api.neural_voice_workers import create_neural_voice_worker_router
from api.royalty_dispatch import (
    create_safe_royalty_outbox_router,
    safe_send_outbox_event,
)
from api.royalty_outbox import ROYALTY_AMOUNT, queue_flip_obligation
from api.vics_bridge import create_vics_router, issue_track_proof


logger = logging.getLogger("lyrica3.production")
app = server.app
ROYALTY_INTEGRATION_ENABLED = (
    os.getenv("LYRICA_ARCHISYNAPSE_V2_ENABLED", "false").strip().lower() == "true"
)


def _context():
    return server.db, Path(server.ROOT_DIR), Path(server.MUSIC_OUTPUT_DIR)


# In a full source checkout server.py may already mount api.main at /duo-soul.
# The production Docker image copies focused integration and voice modules, so
# register the guarded routes directly when that optional app is absent.
_has_duo_soul_mount = any(
    isinstance(route, Mount) and route.path == "/duo-soul"
    for route in app.router.routes
)
if not _has_duo_soul_mount:
    app.include_router(create_vics_router(context_provider=_context), prefix="/duo-soul")
    app.include_router(
        create_safe_royalty_outbox_router(context_provider=_context),
        prefix="/duo-soul",
    )
    app.include_router(create_cultura_pronunciation_router(), prefix="/duo-soul")
    app.include_router(create_aether_voice_router(), prefix="/duo-soul")
    app.include_router(create_neural_voice_worker_router(), prefix="/duo-soul")


def _remove_original_flip_route() -> None:
    for route in list(app.router.routes):
        if (
            isinstance(route, APIRoute)
            and route.path == "/api/tracks/{dna_tag}/flip"
            and "POST" in (route.methods or set())
        ):
            app.router.routes.remove(route)


def _royalty_summary(outbox: dict) -> dict:
    receipt = outbox.get("receipt") if isinstance(outbox, dict) else None
    receipt = receipt if isinstance(receipt, dict) else {}
    decision = receipt.get("decision") if isinstance(receipt.get("decision"), dict) else {}
    amounts = receipt.get("amounts") if isinstance(receipt.get("amounts"), dict) else {}
    return {
        "event_id": outbox.get("event_id"),
        "state": outbox.get("state", "pending"),
        "amount": amounts.get("net", ROYALTY_AMOUNT),
        "currency": amounts.get("currency", "USD"),
        "platform_fee": amounts.get("platform_fee", "0.0000"),
        "receipt_id": receipt.get("receipt_id"),
        "receipt_status": receipt.get("status"),
        "decision": decision.get("policy"),
        "payouts": receipt.get("payouts", []),
        "last_error": outbox.get("last_error"),
    }


async def production_flip_track(
    dna_tag: str,
    req: server.FlipRequest,
    user: Dict = Depends(server.current_user),
):
    """Create a Flip only after its parent can produce real ownership proof.

    The creative child is committed by the existing canonical route logic.
    Immediately afterward, the royalty promise is persisted to the outbox
    before any Archisynapse network call. The response surfaces receipt truth,
    not a guessed paid flag.
    """
    parent = await server.db.tracks.find_one({"dna_tag": dna_tag}, {"_id": 0})
    if not parent:
        raise HTTPException(status_code=404, detail="Parent DNA not found.")

    parent_reference = str(
        parent.get("id") or parent.get("canonical_track_id") or parent.get("dna_tag")
    )
    # Preflight before creating the derivative: no verifiable parent means no
    # royalty-bearing Flip can be promised.
    await issue_track_proof(
        db=server.db,
        track_id=parent_reference,
        root_dir=Path(server.ROOT_DIR),
        music_output_dir=Path(server.MUSIC_OUTPUT_DIR),
    )

    child = await server.flip_track(dna_tag, req, user)
    child_reference = str(
        child.get("id") or child.get("canonical_track_id") or child.get("dna_tag")
    )

    try:
        queued = await queue_flip_obligation(
            db=server.db,
            child_track_reference=child_reference,
            root_dir=Path(server.ROOT_DIR),
            music_output_dir=Path(server.MUSIC_OUTPUT_DIR),
        )
        outbox = await safe_send_outbox_event(
            db=server.db,
            event_id=queued["event_id"],
        )
    except Exception as exc:  # noqa: BLE001 - preserve a durable repair record
        failure = {
            "child_track_reference": child_reference,
            "parent_dna": dna_tag,
            "creator": user.get("handle"),
            "state": "queue_failed",
            "error_type": type(exc).__name__,
            "error": str(exc)[:300],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        try:
            await server.db.royalty_outbox_failures.insert_one(dict(failure))
        except Exception:
            logger.exception("Could not persist royalty outbox failure")
        logger.exception("Flip created but royalty obligation needs repair")
        return {
            **child,
            "royalty": {
                "state": "queue_failed",
                "amount": ROYALTY_AMOUNT,
                "currency": "USD",
                "platform_fee": "0.0000",
                "receipt_id": None,
                "receipt_status": None,
                "last_error": {
                    "code": "queue_failed",
                    "message": "Royalty obligation requires operator repair.",
                },
            },
        }

    return {**child, "royalty": _royalty_summary(outbox)}


if ROYALTY_INTEGRATION_ENABLED:
    _remove_original_flip_route()
    app.post("/api/tracks/{dna_tag}/flip")(production_flip_track)
    logger.info("Archisynapse v2 Flip cutover ENABLED")
else:
    logger.warning(
        "Archisynapse v2 Flip cutover disabled; original Flip route remains active"
    )
