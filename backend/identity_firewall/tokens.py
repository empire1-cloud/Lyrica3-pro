"""
SLA113 Identity Firewall — Shared Client Library
=================================================
Copy this file into every universe backend at:
    backend/identity_firewall/tokens.py

Or in future: publish as internal pip package `sla113-identity`.

All universe backends need:
  1. This file
  2. JWT_SECRET env var (same value as SLA113, from GCP Secret Manager)
  3. `pip install pyjwt bcrypt` (already in all requirements.txt)

GCP Secret Manager setup:
  # Create once:
  gcloud secrets create sla113-jwt-secret --replication-policy="automatic"
  python -c "import secrets; print(secrets.token_urlsafe(48))" | \
    gcloud secrets versions add sla113-jwt-secret --data-file=-

  # Mount into each Cloud Run service:
  gcloud run services update <service-name> \\
    --region us-central1 \\
    --set-secrets="JWT_SECRET=sla113-jwt-secret:latest"

  # Services to update:
  #   sla113-backend      (issues tokens)
  #   lyrica3-backend     (validates tokens)
  #   empire1-backend     (validates tokens)
  #   southern-backend    (validates tokens)
"""
from __future__ import annotations
import os, secrets, hashlib, logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
import jwt
import bcrypt

logger = logging.getLogger("sla113.identity")

JWT_SECRET   = os.environ.get("JWT_SECRET", "")
JWT_ALGO     = "HS256"
JWT_ISSUER   = "sla113.southernlifestyle.org"
JWT_AUDIENCE = [
    "sla113.southernlifestyle.org",
    "lyrica3.com",
    "empire1.cloud",
    "southernlifestyle.org",
]

ACCESS_TTL_MINUTES = 60
REFRESH_TTL_DAYS   = 30

VALID_UNIVERSES = {
    "factory", "foundry", "cultura", "southern",
    "empire", "omni", "arquitecto", "vault",
}

ROLES = ["user", "creator", "operator", "admin"]


def _require_secret() -> str:
    if not JWT_SECRET:
        raise RuntimeError(
            "JWT_SECRET is not set. "
            "Run: gcloud run services update <service> "
            "--set-secrets=JWT_SECRET=sla113-jwt-secret:latest"
        )
    return JWT_SECRET


def issue_access_token(
    user_id: str,
    handle: str,
    role: str = "user",
    universes: List[str] | None = None,
    universe_roles: Dict[str, str] | None = None,
) -> str:
    now = datetime.now(timezone.utc)
    payload: Dict[str, Any] = {
        "sub":            user_id,
        "handle":         handle,
        "role":           role,
        "universes":      universes or list(VALID_UNIVERSES),
        "universe_roles": universe_roles or {},
        "iss":            JWT_ISSUER,
        "aud":            JWT_AUDIENCE,
        "iat":            now,
        "exp":            now + timedelta(minutes=ACCESS_TTL_MINUTES),
        "jti":            secrets.token_urlsafe(16),
        "type":           "access",
    }
    return jwt.encode(payload, _require_secret(), algorithm=JWT_ALGO)


def issue_refresh_token(user_id: str, handle: str) -> tuple[str, str]:
    now = datetime.now(timezone.utc)
    payload: Dict[str, Any] = {
        "sub":    user_id,
        "handle": handle,
        "iss":    JWT_ISSUER,
        "aud":    JWT_AUDIENCE,
        "iat":    now,
        "exp":    now + timedelta(days=REFRESH_TTL_DAYS),
        "jti":    secrets.token_urlsafe(32),
        "type":   "refresh",
    }
    token = jwt.encode(payload, _require_secret(), algorithm=JWT_ALGO)
    return token, hashlib.sha256(token.encode()).hexdigest()


def verify_token(token: str, required_universe: str | None = None) -> Dict[str, Any]:
    """
    Verify a SLA113-issued JWT. Raises jwt.PyJWTError on failure.
    Used by ALL universe backends.
    """
    payload = jwt.decode(
        token,
        _require_secret(),
        algorithms=[JWT_ALGO],
        issuer=JWT_ISSUER,
        audience=JWT_AUDIENCE,
        options={"require": ["sub", "handle", "exp", "iat", "iss", "aud", "type"]},
    )
    if payload.get("type") != "access":
        raise jwt.InvalidTokenError("Not an access token")
    if required_universe and required_universe not in payload.get("universes", []):
        raise jwt.InvalidTokenError(
            f"Token does not grant access to universe '{required_universe}'"
        )
    return payload


def get_universe_role(payload: Dict[str, Any], universe: str) -> str:
    return payload.get("universe_roles", {}).get(universe, payload.get("role", "user"))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())
