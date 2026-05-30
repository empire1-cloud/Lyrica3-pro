"""
Gateway API — Authentication proxy + reverse proxy for Lyrica3 Pro.

Routes:
  /auth/*          → handled directly (register, login, refresh, logout, me)
  /api/txn/*       → proxied to Transaction API
  /api/customers/* → proxied to Customer API
  /api/*           → proxied to Lyrica Backend
"""
from __future__ import annotations
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException, Depends, Header
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from gateway.config import settings
from gateway.models import RegisterRequest, LoginRequest, RefreshRequest, AuthResponse, ErrorResponse
from gateway.auth import register, login, refresh_access, logout, get_current_user
from gateway.identity_firewall.tokens import verify_token
from gateway.proxy import proxy_request

logger = logging.getLogger("gateway")

# ── Global MongoDB handle ──
client: AsyncIOMotorClient | None = None


def get_db():
    global client
    if client is None:
        raise RuntimeError("MongoDB not connected")
    return client[settings.db_name]


@asynccontextmanager
async def lifespan(app: FastAPI):
    global client
    try:
        client = AsyncIOMotorClient(settings.mongo_url, serverSelectionTimeoutMS=3000)
        await client.admin.command("ping")
        logger.info("Gateway: MongoDB connected")
    except Exception as e:
        logger.error("Gateway: MongoDB connection failed: %s", e)
        client = None
    yield
    if client:
        client.close()


app = FastAPI(
    title="Lyrica3 Gateway",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Auth handlers ──

@app.post("/auth/register", response_model=AuthResponse, responses={409: {"model": ErrorResponse}})
async def register_route(body: RegisterRequest):
    db = get_db()
    return await register(db, body.handle, body.password)


@app.post("/auth/login", response_model=AuthResponse, responses={401: {"model": ErrorResponse}})
async def login_route(body: LoginRequest):
    db = get_db()
    return await login(db, body.handle, body.password)


@app.post("/auth/refresh", response_model=AuthResponse, responses={401: {"model": ErrorResponse}})
async def refresh_route(body: RefreshRequest):
    db = get_db()
    return await refresh_access(db, body.refresh_token)


@app.post("/auth/logout")
async def logout_route(body: RefreshRequest):
    db = get_db()
    await logout(db, body.refresh_token)
    return {"ok": True}


@app.get("/auth/me")
async def me_route(authorization: str = Header("")):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing authorization header")
    token = authorization[7:]
    db = get_db()
    return await get_current_user(db, token)


# ── Health ──

@app.get("/health")
async def health():
    return {"status": "ok", "service": "gateway"}


# ── Reverse proxy catch-all ──
# Handles every path not matched above.

@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
async def catch_all(request: Request, path: str = ""):
    db = get_db()

    full_path = f"/{path}" if path else "/"
    if full_path.rstrip("/") in settings.public_paths:
        return await proxy_request(request, path)

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid Authorization header")

    token = auth_header[7:]
    try:
        verify_token(token)
    except Exception as e:
        raise HTTPException(401, f"Invalid token: {e}")

    return await proxy_request(request, path)
