import logging
from typing import Optional

import httpx
from fastapi import Request, Response, HTTPException
from starlette.background import BackgroundTask

from gateway.identity_firewall.tokens import verify_token
from gateway.config import settings
from gateway.models import ProxyTarget

logger = logging.getLogger("gateway.proxy")

TARGETS: dict[str, ProxyTarget] = {
    "txn": ProxyTarget(settings.transaction_api_url, strip_prefix="/api/txn"),
    "customers": ProxyTarget(settings.customer_api_url, strip_prefix="/api/customers"),
    "default": ProxyTarget(settings.lyrica_backend_url, strip_prefix=None),
}


def _pick_target(path: str) -> tuple[ProxyTarget, str] | None:
    if path.startswith("/api/txn"):
        target = TARGETS["txn"]
        path = target.strip_prefix + path[len(target.strip_prefix):] if target.strip_prefix else path
        return target, path
    if path.startswith("/api/customers"):
        target = TARGETS["customers"]
        path = target.strip_prefix + path[len(target.strip_prefix):] if target.strip_prefix else path
        return target, path
    if path.startswith("/api") or path == "/" or path.startswith("/health"):
        return TARGETS["default"], path
    return None


async def proxy_request(request: Request, path: str) -> Response:
    picked = _pick_target(f"/{path}" if not path.startswith("/") else path)
    if not picked:
        raise HTTPException(404, "No target configured for this path")

    target, resolved_path = picked
    url = f"{target.base_url}{resolved_path}"

    token: Optional[str] = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]

    if token:
        try:
            payload = verify_token(token)
        except Exception as e:
            raise HTTPException(401, f"Invalid token: {e}")

        user_id = payload.get("sub", "")
        handle = payload.get("handle", "")
        role = payload.get("role", "creator")

    body = await request.body()
    headers = dict(request.headers)

    headers.pop("host", None)
    headers.pop("content-length", None)

    if token:
        headers["X-User-Id"] = user_id
        headers["X-User-Handle"] = handle
        headers["X-User-Role"] = role
        headers["X-Internal-Key"] = settings.internal_key

    query_string = request.url.query
    full_url = f"{url}?{query_string}" if query_string else url

    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            resp = await client.request(
                method=request.method,
                url=full_url,
                headers=headers,
                content=body,
                follow_redirects=True,
            )
        except httpx.ConnectError:
            raise HTTPException(502, f"Could not connect to upstream service at {target.base_url}")
        except httpx.TimeoutException:
            raise HTTPException(504, "Upstream service timed out")

    response_headers = dict(resp.headers)
    response_headers.pop("transfer-encoding", None)
    response_headers.pop("content-encoding", None)
    response_headers.pop("content-length", None)

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=response_headers,
        media_type=resp.headers.get("content-type"),
    )
