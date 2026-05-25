"""
Empire 1 Ledger — FastAPI Microservice
Exposes the Empire1Ledger as a REST + lightweight GraphQL API.

Routes:
  POST /entries           — record a new ledger entry
  GET  /entries/{asset_id} — get all entries for an asset
  POST /royalty/compute   — compute micro-royalty split for a revenue event
  GET  /health            — liveness probe

Deployed as Cloud Run service: empire1-ledger
"""

from __future__ import annotations
import os, sys, time
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Resolve soulfire_kernel from sibling directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from soulfire_kernel.empire1_ledger.ledger import Empire1Ledger, RoyaltySplit

app = FastAPI(
    title="Empire 1 Ledger",
    description="Immutable provenance + royalty ledger for the Empire 1 creative ecosystem",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ledger = Empire1Ledger()


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class RoyaltySplitIn(BaseModel):
    artist_uid:         str
    artist_pct:         float = 0.70
    platform_pct:       float = 0.15
    model_owners_pct:   float = 0.10
    infrastructure_pct: float = 0.05


class RecordEntryRequest(BaseModel):
    asset_id:      str
    schema:        dict[str, Any]
    creator_uid:   str
    render_tier:   str = "DRAFT"
    royalty_split: RoyaltySplitIn | None = None
    territory:     str = "GLOBAL"
    tags:          list[str] = Field(default_factory=list)


class ComputeRoyaltyRequest(BaseModel):
    asset_id:          str
    gross_revenue_usd: float


class LedgerEntryOut(BaseModel):
    entry_id:       str
    asset_id:       str
    schema_hash:    str
    metadata_hash:  str
    creator_uid:    str
    royalty_split:  dict[str, Any]
    timestamp_utc:  float
    render_tier:    str
    territory:      str
    tags:           list[str]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "service": "empire1-ledger", "ts": time.time()}


@app.post("/entries", response_model=LedgerEntryOut, status_code=201)
def record_entry(req: RecordEntryRequest):
    rs = None
    if req.royalty_split:
        rs = RoyaltySplit(
            artist_uid=req.royalty_split.artist_uid,
            artist_pct=req.royalty_split.artist_pct,
            platform_pct=req.royalty_split.platform_pct,
            model_owners_pct=req.royalty_split.model_owners_pct,
            infrastructure_pct=req.royalty_split.infrastructure_pct,
        )
    try:
        entry = ledger.record(
            asset_id=req.asset_id,
            schema=req.schema,
            creator_uid=req.creator_uid,
            render_tier=req.render_tier,
            royalty_split=rs,
            territory=req.territory,
            tags=req.tags,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return LedgerEntryOut(
        entry_id=entry.entry_id,
        asset_id=entry.asset_id,
        schema_hash=entry.schema_hash,
        metadata_hash=entry.metadata_hash,
        creator_uid=entry.creator_uid,
        royalty_split={
            "artist_uid":         entry.royalty_split.artist_uid,
            "artist_pct":         entry.royalty_split.artist_pct,
            "platform_pct":       entry.royalty_split.platform_pct,
            "model_owners_pct":   entry.royalty_split.model_owners_pct,
            "infrastructure_pct": entry.royalty_split.infrastructure_pct,
        },
        timestamp_utc=entry.timestamp_utc,
        render_tier=entry.render_tier,
        territory=entry.territory,
        tags=entry.tags,
    )


@app.get("/entries/{asset_id}", response_model=list[LedgerEntryOut])
def get_entries(asset_id: str):
    entries = ledger.get_by_asset(asset_id)
    return [
        LedgerEntryOut(
            entry_id=e.entry_id,
            asset_id=e.asset_id,
            schema_hash=e.schema_hash,
            metadata_hash=e.metadata_hash,
            creator_uid=e.creator_uid,
            royalty_split={
                "artist_uid":         e.royalty_split.artist_uid,
                "artist_pct":         e.royalty_split.artist_pct,
                "platform_pct":       e.royalty_split.platform_pct,
                "model_owners_pct":   e.royalty_split.model_owners_pct,
                "infrastructure_pct": e.royalty_split.infrastructure_pct,
            },
            timestamp_utc=e.timestamp_utc,
            render_tier=e.render_tier,
            territory=e.territory,
            tags=e.tags,
        )
        for e in entries
    ]


@app.post("/royalty/compute")
def compute_royalty(req: ComputeRoyaltyRequest):
    entries = ledger.get_by_asset(req.asset_id)
    if not entries:
        raise HTTPException(status_code=404, detail=f"No ledger entries for asset_id={req.asset_id}")
    # Use the most recent entry for the split
    entry = sorted(entries, key=lambda e: e.timestamp_utc)[-1]
    splits = ledger.compute_micro_royalty(entry, req.gross_revenue_usd)
    return {
        "asset_id":          req.asset_id,
        "entry_id":          entry.entry_id,
        "gross_revenue_usd": req.gross_revenue_usd,
        "splits":            splits,
    }
