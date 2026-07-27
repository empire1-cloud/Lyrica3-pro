"""Lyrica 3 Artist Growth + Royalty Engine API.

The first vertical slice unifies release operations, smart links, campaigns,
fan CRM, conversion attribution, royalty statement audits, split agreements,
brand-deal tracking, recovery claims, and non-binding royalty-access previews.

External DSP, ad-network, PRO, collection-society, banking, and payment-provider
connectors remain explicit seams. No endpoint in this module moves money.
"""

from __future__ import annotations

import re
import uuid
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field

from artist_growth_core import (
    audit_statement_rows,
    calculate_roas,
    contact_fingerprint,
    fan_score,
    fan_stage,
    preview_royalty_advance,
    validate_split_bps,
)
from server import current_user, db

router = APIRouter(prefix="/api/growth", tags=["artist-growth"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


def _slug(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
    return cleaned[:64] or uuid.uuid4().hex[:10]


def _owned(handle: str) -> dict[str, Any]:
    return {"artist_handle": handle}


class ReleaseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    primary_artist: str = Field(min_length=1, max_length=120)
    track_dna_tags: List[str] = Field(min_length=1, max_length=100)
    release_date: date
    release_type: Literal["single", "ep", "album", "mixtape", "live"] = "single"
    upc: Optional[str] = None
    isrc_by_dna: Dict[str, str] = Field(default_factory=dict)
    territories: List[str] = Field(default_factory=lambda: ["WORLDWIDE"])
    distribution_status: Literal[
        "draft", "metadata_ready", "submitted", "delivered", "live", "takedown_requested"
    ] = "draft"
    marketing_notes: Optional[str] = None


class SmartLinkCreate(BaseModel):
    release_id: str
    slug: Optional[str] = None
    headline: Optional[str] = None
    destination_urls: Dict[str, str] = Field(default_factory=dict)
    pixel_ids: Dict[str, str] = Field(default_factory=dict)


class CampaignCreate(BaseModel):
    release_id: str
    name: str = Field(min_length=1, max_length=160)
    objective: Literal[
        "awareness", "presave", "streams", "fan_capture", "tickets", "merch", "remix", "brand_deal"
    ]
    channels: List[Literal["instagram", "facebook", "tiktok", "youtube", "email", "sms", "discord", "organic"]]
    budget_usd: float = Field(default=0, ge=0)
    starts_at: datetime
    ends_at: datetime
    smart_link_id: Optional[str] = None
    status: Literal["draft", "scheduled", "active", "paused", "completed"] = "draft"


class FanEventCreate(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    anonymous_id: Optional[str] = None
    event_type: Literal[
        "link_click",
        "presave",
        "follow",
        "email_signup",
        "sms_signup",
        "stream",
        "repeat_stream",
        "share",
        "remix",
        "ticket_purchase",
        "merch_purchase",
        "download_purchase",
        "tip",
    ]
    source: str = Field(default="direct", max_length=120)
    campaign_id: Optional[str] = None
    release_id: Optional[str] = None
    value_usd: float = Field(default=0, ge=0)
    consent_email: bool = False
    consent_sms: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ConversionCreate(BaseModel):
    conversion_type: Literal[
        "ticket", "merch", "download", "subscription", "tip", "brand_deal", "royalty", "remix"
    ]
    value_usd: float = Field(ge=0)
    campaign_id: Optional[str] = None
    release_id: Optional[str] = None
    fan_id: Optional[str] = None
    external_reference: Optional[str] = None
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SplitParticipant(BaseModel):
    payee: str = Field(min_length=1, max_length=160)
    role: str = Field(min_length=1, max_length=80)
    share_bps: int = Field(ge=0, le=10000)
    payment_handle: Optional[str] = None


class SplitAgreementCreate(BaseModel):
    track_dna_tag: str
    participants: List[SplitParticipant] = Field(min_length=1, max_length=100)
    effective_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: Literal["draft", "pending_signatures", "signed", "superseded"] = "draft"
    notes: Optional[str] = None


class StatementRow(BaseModel):
    source: str
    period: str
    isrc: Optional[str] = None
    territory: str = ""
    usage_type: str = "stream"
    units: float = 0
    gross_usd: float = 0
    fees_usd: float = 0
    net_usd: Optional[float] = None
    external_reference: Optional[str] = None


class StatementAuditCreate(BaseModel):
    statement_name: str
    provider: str
    rows: List[StatementRow] = Field(min_length=1, max_length=50000)
    expected_rate_usd_by_isrc: Dict[str, float] = Field(default_factory=dict)
    variance_tolerance_pct: float = Field(default=0.10, ge=0, le=1)


class RoyaltyClaimCreate(BaseModel):
    audit_id: str
    provider: str
    finding_indexes: List[int] = Field(min_length=1, max_length=1000)
    status: Literal["draft", "ready_to_submit", "submitted", "disputed", "recovered", "closed"] = "draft"
    notes: Optional[str] = None


class AdvancePreviewCreate(BaseModel):
    verified_receivables_usd: float = Field(ge=0)
    advance_rate_bps: int = Field(default=7000, ge=0, le=7000)
    fee_bps: int = Field(default=500, ge=0, le=2500)


class BrandDealCreate(BaseModel):
    brand_name: str = Field(min_length=1, max_length=160)
    campaign_name: str = Field(min_length=1, max_length=160)
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    stage: Literal[
        "lead", "qualified", "pitched", "negotiating", "contracted", "active", "completed", "lost"
    ] = "lead"
    proposed_value_usd: float = Field(default=0, ge=0)
    contracted_value_usd: float = Field(default=0, ge=0)
    deliverables: List[str] = Field(default_factory=list)
    due_at: Optional[datetime] = None
    notes: Optional[str] = None


@router.post("/releases", status_code=201)
async def create_release(body: ReleaseCreate, user: Dict = Depends(current_user)):
    missing_dna = [dna for dna in body.track_dna_tags if not dna.startswith("trk_")]
    if missing_dna:
        raise HTTPException(400, f"Every track must use a canonical trk_ DNA tag: {missing_dna[:3]}")

    release = jsonable_encoder(body)
    release.update(
        {
            "id": _id("rel"),
            "artist_handle": user["handle"],
            "created_at": _now(),
            "updated_at": _now(),
        }
    )
    await db.growth_releases.insert_one(release)
    release.pop("_id", None)
    return release


@router.get("/releases")
async def list_releases(
    status: Optional[str] = Query(default=None),
    user: Dict = Depends(current_user),
):
    query = _owned(user["handle"])
    if status:
        query["distribution_status"] = status
    releases = await db.growth_releases.find(query, {"_id": 0}).sort("release_date", -1).to_list(500)
    return {"releases": releases, "count": len(releases)}


@router.post("/smart-links", status_code=201)
async def create_smart_link(body: SmartLinkCreate, user: Dict = Depends(current_user)):
    release = await db.growth_releases.find_one(
        {"id": body.release_id, "artist_handle": user["handle"]}, {"_id": 0}
    )
    if not release:
        raise HTTPException(404, "Release not found.")

    base_slug = _slug(body.slug or f"{release['primary_artist']}-{release['title']}")
    slug = base_slug
    suffix = 2
    while await db.growth_smart_links.find_one({"slug": slug}):
        slug = f"{base_slug}-{suffix}"
        suffix += 1

    link = jsonable_encoder(body)
    link.update(
        {
            "id": _id("lnk"),
            "slug": slug,
            "artist_handle": user["handle"],
            "created_at": _now(),
            "public_path": f"/l/{slug}",
        }
    )
    await db.growth_smart_links.insert_one(link)
    link.pop("_id", None)
    return link


@router.get("/smart-links/{slug}")
async def resolve_smart_link(slug: str):
    link = await db.growth_smart_links.find_one({"slug": slug}, {"_id": 0, "pixel_ids": 0})
    if not link:
        raise HTTPException(404, "Smart link not found.")
    return link


@router.post("/campaigns", status_code=201)
async def create_campaign(body: CampaignCreate, user: Dict = Depends(current_user)):
    if body.ends_at <= body.starts_at:
        raise HTTPException(400, "Campaign end must be after its start.")
    release = await db.growth_releases.find_one({"id": body.release_id, **_owned(user["handle"])})
    if not release:
        raise HTTPException(404, "Release not found.")

    campaign = jsonable_encoder(body)
    campaign.update(
        {
            "id": _id("cmp"),
            "artist_handle": user["handle"],
            "actual_spend_usd": 0.0,
            "created_at": _now(),
            "updated_at": _now(),
        }
    )
    await db.growth_campaigns.insert_one(campaign)
    campaign.pop("_id", None)
    return campaign


@router.get("/campaigns")
async def list_campaigns(user: Dict = Depends(current_user)):
    campaigns = await db.growth_campaigns.find(_owned(user["handle"]), {"_id": 0}).sort("starts_at", -1).to_list(500)
    return {"campaigns": campaigns, "count": len(campaigns)}


@router.get("/campaigns/{campaign_id}/performance")
async def campaign_performance(campaign_id: str, user: Dict = Depends(current_user)):
    campaign = await db.growth_campaigns.find_one(
        {"id": campaign_id, **_owned(user["handle"])}, {"_id": 0}
    )
    if not campaign:
        raise HTTPException(404, "Campaign not found.")

    events = await db.growth_fan_events.find(
        {"campaign_id": campaign_id, **_owned(user["handle"])}, {"_id": 0}
    ).to_list(10000)
    conversions = await db.growth_conversions.find(
        {"campaign_id": campaign_id, **_owned(user["handle"])}, {"_id": 0}
    ).to_list(10000)

    revenue = round(sum(float(row.get("value_usd", 0)) for row in conversions), 2)
    spend = float(campaign.get("actual_spend_usd") or campaign.get("budget_usd") or 0)
    fan_ids = {event.get("fan_id") for event in events if event.get("fan_id")}
    return {
        "campaign": campaign,
        "performance": {
            "event_count": len(events),
            "known_fans": len(fan_ids),
            "conversion_count": len(conversions),
            "revenue_usd": revenue,
            "spend_usd": round(spend, 2),
            "roas": calculate_roas(revenue, spend),
            "cost_per_known_fan_usd": round(spend / len(fan_ids), 2) if fan_ids and spend else None,
        },
    }


@router.post("/fans/events", status_code=201)
async def capture_fan_event(body: FanEventCreate, user: Dict = Depends(current_user)):
    email_hash = contact_fingerprint(body.email)
    phone_hash = contact_fingerprint(body.phone)
    anon_hash = contact_fingerprint(body.anonymous_id)
    identity_hash = email_hash or phone_hash or anon_hash
    if not identity_hash:
        raise HTTPException(400, "Provide an email, phone, or anonymous_id.")

    lookup = {"artist_handle": user["handle"], "identity_hashes": identity_hash}
    existing = await db.growth_fans.find_one(lookup, {"_id": 0})
    fan_id = existing["id"] if existing else _id("fan")

    event = jsonable_encoder(body, exclude={"email", "phone", "anonymous_id"})
    event.update(
        {
            "id": _id("evt"),
            "fan_id": fan_id,
            "artist_handle": user["handle"],
            "occurred_at": _now(),
        }
    )
    await db.growth_fan_events.insert_one(event)

    all_events = await db.growth_fan_events.find(
        {"artist_handle": user["handle"], "fan_id": fan_id}, {"_id": 0}
    ).to_list(5000)
    score = fan_score(all_events)
    hashes = [value for value in [email_hash, phone_hash, anon_hash] if value]
    update = {
        "$set": {
            "artist_handle": user["handle"],
            "updated_at": _now(),
            "score": score,
            "stage": fan_stage(score),
        },
        "$setOnInsert": {"id": fan_id, "created_at": _now()},
        "$addToSet": {
            "identity_hashes": {"$each": hashes},
            "sources": body.source,
        },
        "$max": {
            "consent_email": bool(body.consent_email),
            "consent_sms": bool(body.consent_sms),
        },
    }
    await db.growth_fans.update_one(
        {"artist_handle": user["handle"], "id": fan_id}, update, upsert=True
    )
    profile = await db.growth_fans.find_one({"id": fan_id}, {"_id": 0, "identity_hashes": 0})
    event.pop("_id", None)
    return {"event": event, "fan": profile}


@router.get("/fans/segments")
async def fan_segments(user: Dict = Depends(current_user)):
    fans = await db.growth_fans.find(_owned(user["handle"]), {"_id": 0, "identity_hashes": 0}).to_list(10000)
    counts: dict[str, int] = {}
    for fan in fans:
        stage = fan.get("stage", "anonymous_listener")
        counts[stage] = counts.get(stage, 0) + 1
    return {"segments": counts, "total_known_profiles": len(fans), "fans": fans[:500]}


@router.post("/conversions", status_code=201)
async def capture_conversion(body: ConversionCreate, user: Dict = Depends(current_user)):
    conversion = jsonable_encoder(body)
    conversion.update(
        {
            "id": _id("cnv"),
            "artist_handle": user["handle"],
            "created_at": _now(),
            "attribution_model": "last_known_campaign",
        }
    )
    await db.growth_conversions.insert_one(conversion)
    conversion.pop("_id", None)
    return conversion


@router.post("/splits", status_code=201)
async def create_split_agreement(body: SplitAgreementCreate, user: Dict = Depends(current_user)):
    participants = [jsonable_encoder(row) for row in body.participants]
    try:
        validate_split_bps(participants)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc

    agreement = jsonable_encoder(body)
    agreement.update(
        {
            "id": _id("splt"),
            "artist_handle": user["handle"],
            "total_bps": 10000,
            "created_at": _now(),
            "updated_at": _now(),
        }
    )
    await db.growth_split_agreements.insert_one(agreement)
    agreement.pop("_id", None)
    return agreement


@router.post("/royalties/statements/audit", status_code=201)
async def audit_royalty_statement(body: StatementAuditCreate, user: Dict = Depends(current_user)):
    result = audit_statement_rows(
        [jsonable_encoder(row) for row in body.rows],
        body.expected_rate_usd_by_isrc,
        body.variance_tolerance_pct,
    )
    audit = {
        "id": _id("aud"),
        "artist_handle": user["handle"],
        "statement_name": body.statement_name,
        "provider": body.provider,
        "status": "review_required" if result["summary"]["actionable_count"] else "clear",
        "summary": result["summary"],
        "findings": result["findings"],
        "created_at": _now(),
        "connector_mode": "manual_normalized_rows",
    }
    await db.growth_statement_audits.insert_one(audit)
    audit.pop("_id", None)
    return audit


@router.post("/royalties/claims", status_code=201)
async def create_royalty_claim(body: RoyaltyClaimCreate, user: Dict = Depends(current_user)):
    audit = await db.growth_statement_audits.find_one(
        {"id": body.audit_id, **_owned(user["handle"])}, {"_id": 0}
    )
    if not audit:
        raise HTTPException(404, "Royalty audit not found.")

    findings = audit.get("findings", [])
    selected = [findings[index] for index in body.finding_indexes if 0 <= index < len(findings)]
    if not selected:
        raise HTTPException(400, "No valid audit findings selected.")
    recoverable = round(sum(float(row.get("recoverable_usd", 0)) for row in selected), 2)

    claim = jsonable_encoder(body)
    claim.update(
        {
            "id": _id("clm"),
            "artist_handle": user["handle"],
            "recoverable_usd": recoverable,
            "selected_findings": selected,
            "created_at": _now(),
            "updated_at": _now(),
            "submission_enabled": False,
        }
    )
    await db.growth_royalty_claims.insert_one(claim)
    claim.pop("_id", None)
    return claim


@router.post("/royalties/advance-preview")
async def royalty_advance_preview(body: AdvancePreviewCreate, user: Dict = Depends(current_user)):
    try:
        preview = preview_royalty_advance(
            body.verified_receivables_usd,
            body.advance_rate_bps,
            body.fee_bps,
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    preview.update({"artist_handle": user["handle"], "generated_at": _now()})
    return preview


@router.post("/brand-deals", status_code=201)
async def create_brand_deal(body: BrandDealCreate, user: Dict = Depends(current_user)):
    deal = jsonable_encoder(body, exclude={"contact_email"})
    deal.update(
        {
            "id": _id("deal"),
            "artist_handle": user["handle"],
            "contact_email_hash": contact_fingerprint(body.contact_email),
            "created_at": _now(),
            "updated_at": _now(),
        }
    )
    await db.growth_brand_deals.insert_one(deal)
    deal.pop("_id", None)
    return deal


@router.get("/brand-deals")
async def list_brand_deals(user: Dict = Depends(current_user)):
    deals = await db.growth_brand_deals.find(_owned(user["handle"]), {"_id": 0}).sort("updated_at", -1).to_list(1000)
    return {"deals": deals, "count": len(deals)}


@router.get("/dashboard")
async def growth_dashboard(user: Dict = Depends(current_user)):
    handle = user["handle"]
    owned = _owned(handle)
    releases = await db.growth_releases.find(owned, {"_id": 0}).to_list(5000)
    campaigns = await db.growth_campaigns.find(owned, {"_id": 0}).to_list(5000)
    fans = await db.growth_fans.find(owned, {"_id": 0, "identity_hashes": 0}).to_list(10000)
    conversions = await db.growth_conversions.find(owned, {"_id": 0}).to_list(10000)
    audits = await db.growth_statement_audits.find(owned, {"_id": 0, "findings": 0}).to_list(5000)
    deals = await db.growth_brand_deals.find(owned, {"_id": 0}).to_list(5000)

    revenue = round(sum(float(row.get("value_usd", 0)) for row in conversions), 2)
    spend = round(
        sum(float(row.get("actual_spend_usd") or row.get("budget_usd") or 0) for row in campaigns), 2
    )
    recoverable = round(
        sum(float(row.get("summary", {}).get("recoverable_usd", 0)) for row in audits), 2
    )
    contracted_brand_value = round(
        sum(float(row.get("contracted_value_usd", 0)) for row in deals), 2
    )

    return {
        "artist_handle": handle,
        "generated_at": _now(),
        "scorecard": {
            "release_count": len(releases),
            "live_release_count": sum(1 for row in releases if row.get("distribution_status") == "live"),
            "campaign_count": len(campaigns),
            "active_campaign_count": sum(1 for row in campaigns if row.get("status") == "active"),
            "known_fans": len(fans),
            "superfans": sum(1 for row in fans if row.get("stage") == "superfan"),
            "attributed_revenue_usd": revenue,
            "campaign_spend_usd": spend,
            "blended_roas": calculate_roas(revenue, spend),
            "royalty_recovery_opportunity_usd": recoverable,
            "contracted_brand_value_usd": contracted_brand_value,
        },
        "truth": {
            "real_money_movement": False,
            "dsp_connectors_live": False,
            "ad_network_connectors_live": False,
            "collection_claim_submission_live": False,
            "manual_ingestion_supported": True,
        },
    }
