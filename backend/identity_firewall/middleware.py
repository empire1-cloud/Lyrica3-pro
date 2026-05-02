"""
SLA113 Identity Firewall — Universe Middleware
===============================================
Drop this into any universe backend (Lyrica3, Empire1, Southern, etc.)
to accept SLA113-issued tokens.

Usage in any universe backend's server.py:

    from identity_firewall.middleware import (
        UniverseAuthMiddleware,
        require_universe_token,
        get_token_payload,
    )

    # 1. Add middleware (checks all requests have valid SLA113 token)
    app.add_middleware(UniverseAuthMiddleware, universe="foundry")

    # 2. Or use as a FastAPI dependency on individual routes:
    @router.get("/generate")
    async def generate(payload: dict = Depends(require_universe_token("foundry"))):
        handle = payload["handle"]
        ...

Environment required (same secret as SLA113):
    JWT_SECRET=<from GCP Secret Manager: sla113-jwt-secret>
"""
from __future__ import annotations
import logging
from typing import Callable, Optional

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from identity_firewall.tokens import verify_token, get_universe_role

logger = logging.getLogger("sla113.identity.middleware")

security = HTTPBearer(auto_error=False)

# Paths that bypass auth entirely
PUBLIC_PATHS = {
    "/",
    "/api/",
    "/health",
    "/api/health",
    "/api/identity/login",
    "/api/identity/register",
    "/api/identity/refresh",
    "/api/identity/verify",
}


class UniverseAuthMiddleware(BaseHTTPMiddleware):
    """
    Starlette middleware that validates SLA113 JWTs on every request.
    Attaches decoded payload to request.state.token_payload.

    Args:
        universe: partition key (e.g. "foundry") — token must grant access to this.
    """
    def __init__(self, app, universe: str):
        super().__init__(app)
        self.universe = universe

    async def dispatch(self, request: Request, call_next: Callable):
        # Skip public paths
        if request.url.path in PUBLIC_PATHS:
            return await call_next(request)

        # OPTIONS preflight — skip
        if request.method == "OPTIONS":
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"detail": "Not authenticated — SLA113 token required"},
            )

        token = auth_header.split(" ", 1)[1]
        try:
            payload = verify_token(token, required_universe=self.universe)
            request.state.token_payload = payload
        except Exception as e:
            logger.warning("token rejected for universe '%s': %s", self.universe, e)
            return JSONResponse(
                status_code=401,
                content={"detail": f"Token invalid: {e}"},
            )

        return await call_next(request)


# ── FastAPI dependency versions (for per-route use) ───────────────────────────

def require_universe_token(universe: Optional[str] = None) -> Callable:
    """
    FastAPI dependency factory.

    Usage:
        @router.post("/generate")
        async def generate(payload: dict = Depends(require_universe_token("foundry"))):
            ...
    """
    async def _dep(
        credentials: HTTPAuthorizationCredentials = Depends(security),
    ) -> dict:
        if not credentials:
            raise HTTPException(status_code=401, detail="Not authenticated")
        try:
            payload = verify_token(credentials.credentials, required_universe=universe)
            return payload
        except Exception as e:
            raise HTTPException(status_code=401, detail=str(e))
    return _dep


async def get_token_payload(request: Request) -> Optional[dict]:
    """Get already-decoded payload attached by UniverseAuthMiddleware."""
    return getattr(request.state, "token_payload", None)


def require_role(*roles: str) -> Callable:
    """
    Dependency: require a minimum role within the universe.

    Usage:
        @router.delete("/engine/{id}")
        async def delete(payload: dict = Depends(require_role("operator", "admin"))):
            ...
    """
    async def _dep(
        credentials: HTTPAuthorizationCredentials = Depends(security),
    ) -> dict:
        if not credentials:
            raise HTTPException(status_code=401, detail="Not authenticated")
        try:
            payload = verify_token(credentials.credentials)
        except Exception as e:
            raise HTTPException(status_code=401, detail=str(e))

        user_role = payload.get("role", "user")
        if user_role not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Role '{user_role}' not permitted. Required: {list(roles)}",
            )
        return payload
    return _dep
