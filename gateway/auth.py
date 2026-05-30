import uuid
import hashlib
import logging
import re
from datetime import datetime, timezone

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

import jwt as pyjwt

from gateway.config import settings
from gateway.identity_firewall.tokens import (
    issue_access_token,
    issue_refresh_token,
    verify_token,
    hash_password,
    verify_password,
)

logger = logging.getLogger("gateway.auth")

HANDLE_RE = re.compile(r"^[a-z0-9_.-]{3,32}$")


def _wallet_for(handle: str) -> str:
    h = hashlib.sha256(handle.encode()).hexdigest()[:16]
    return f"0x{h}"


async def register(db: AsyncIOMotorDatabase, handle: str, password: str) -> dict:
    handle = handle.strip().lower()
    if not HANDLE_RE.match(handle):
        raise HTTPException(400, "Handle must be 3-32 chars [a-z0-9_.-]")
    if len(password) < 6:
        raise HTTPException(400, "Password too short")

    existing = await db.users.find_one({"handle": handle})
    if existing:
        raise HTTPException(409, "Handle already minted")

    user_id = str(uuid.uuid4())
    pwd_hash = hash_password(password)
    wallet = _wallet_for(handle)

    doc = {
        "id": user_id,
        "handle": handle,
        "wallet": wallet,
        "password_hash": pwd_hash,
        "tier": "free",
        "credits": 5,
        "role": "creator",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)

    access = issue_access_token(user_id, handle)
    refresh, refresh_hash = issue_refresh_token(user_id, handle)

    await db.refresh_tokens.insert_one({
        "user_id": user_id,
        "handle": handle,
        "hash": refresh_hash,
        "created_at": datetime.now(timezone.utc),
    })

    return {"access_token": access, "refresh_token": refresh, "handle": handle, "wallet": wallet}


async def login(db: AsyncIOMotorDatabase, handle: str, password: str) -> dict:
    handle = handle.strip().lower()
    user = await db.users.find_one({"handle": handle})
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")

    access = issue_access_token(user["id"], handle, role=user.get("role", "creator"))
    refresh, refresh_hash = issue_refresh_token(user["id"], handle)

    await db.refresh_tokens.insert_one({
        "user_id": user["id"],
        "handle": handle,
        "hash": refresh_hash,
        "created_at": datetime.now(timezone.utc),
    })

    return {"access_token": access, "refresh_token": refresh, "handle": handle, "wallet": user["wallet"]}


async def refresh_access(db: AsyncIOMotorDatabase, refresh_token: str) -> dict:
    try:
        payload = pyjwt.decode(
            refresh_token,
            settings.jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except Exception as e:
        raise HTTPException(401, f"Invalid refresh token: {e}")

    if payload.get("type") != "refresh":
        raise HTTPException(401, "Not a refresh token")

    user_id = payload["sub"]
    handle = payload["handle"]
    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()

    stored = await db.refresh_tokens.find_one({"user_id": user_id, "hash": token_hash})
    if not stored:
        raise HTTPException(401, "Refresh token has been revoked")

    await db.refresh_tokens.delete_one({"_id": stored["_id"]})

    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(401, "User not found")

    new_access = issue_access_token(user_id, handle, role=user.get("role", "creator"))
    new_refresh, new_hash = issue_refresh_token(user_id, handle)

    await db.refresh_tokens.insert_one({
        "user_id": user_id,
        "handle": handle,
        "hash": new_hash,
        "created_at": datetime.now(timezone.utc),
    })

    return {"access_token": new_access, "refresh_token": new_refresh, "handle": handle, "wallet": user["wallet"]}


async def logout(db: AsyncIOMotorDatabase, refresh_token: str) -> None:
    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    await db.refresh_tokens.delete_many({"hash": token_hash})


async def get_current_user(db: AsyncIOMotorDatabase, token: str) -> dict:
    try:
        payload = verify_token(token)
    except Exception as e:
        raise HTTPException(401, f"Invalid token: {e}")

    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user
