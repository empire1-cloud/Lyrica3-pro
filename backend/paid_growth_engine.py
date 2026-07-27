"""Paid advertising API for Lyrica's self-promotion and artist campaigns."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field

from paid_growth_connectors import (
    MetaAdsConnector,
    ProviderRequestError,
    TikTokAdsConnector,
    connector_states,
)
from paid_growth_core import (
    add_utm,
    allocate_budget,
    approval_digest,
    build_test_cells,
    launch_readiness,
    recommend_action,
    validate_plan,
)
from server import current_user, db

router = APIRouter(prefix="/api/growth/paid", tags=["paid-growth"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


class PaidCampaignPlanCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    objective: Literal["awareness", "traffic", "fan_capture", "creator_signup", "release_streams", "retargeting"]
    target_scope: Literal["lyrica_platform", "release", "feature", "creator_story"] = "lyrica_platform"
    release_id: Optional[str] = None
    destination_url: str = Field(min_length=8, max_length=1000)
    providers: List[Literal["tiktok", "meta", "spotify_manual"]] = Field(min_length=1, max_length=3)
    total_budget_usd: float = Field(gt=0)
    daily_cap_usd: float = Field(gt=0)
    target_cpa_usd: float = Field(gt=0)
    operator_max_budget_usd: float = Field(default=10000, gt=0)
    creative_ids: List[str] = Field(min_length=2, max_length=30)
    audience_ids: List[str] = Field(min_length=1, max_length=30)
    rights_verified: bool = False
    landing_page_ready: bool = False
    conversion_tracking_ready: bool = False
    notes: Optional[str] = None


class CampaignApproval(BaseModel):
    max_spend_usd: float = Field(gt=0)
    confirmation: Literal["APPROVE_PAID_CAMPAIGN"]


class ProviderLaunch(BaseModel):
    provider: Literal["tiktok", "meta"]
    approval_digest: str
    campaign_payload: Dict[str, Any]
    adgroup_payloads: List[Dict[str, Any]] = Field(default_factory=list, max_length=50)
    ad_payloads: List[Dict[str, Any]] = Field(default_factory=list, max_length=100)


class ProviderActivation(BaseModel):
    approval_digest: str
    confirmation: Literal["ACTIVATE_PAID_SPEND"]


class PerformanceRow(BaseModel):
    impressions: int = Field(default=0, ge=0)
    clicks: int = Field(default=0, ge=0)
    conversions: int = Field(default=0, ge=0)
    spend_usd: float = Field(default=0, ge=0)
    revenue_usd: float = Field(default=0, ge=0)


class ConversionEventReport(BaseModel):
    provider: Literal["tiktok", "meta"]
    event_payload: Dict[str, Any]


@router.get("/connectors")
async def paid_connector_status(user: Dict = Depends(current_user)):
    return {
        "artist_handle": user["handle"],
        "connectors": connector_states(),
        "creation_rule": "real provider objects are created paused or disabled",
        "activation_rule": "activation requires a separate approval and server flag",
    }


@router.post("/campaigns/plan", status_code=201)
async def create_paid_plan(body: PaidCampaignPlanCreate, user: Dict = Depends(current_user)):
    raw = jsonable_encoder(body)
    try:
        validate_plan(raw)
        allocations = allocate_budget(body.total_budget_usd, body.providers, body.objective)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc

    campaign_id = _id("pcmp")
    cells: list[dict[str, Any]] = []
    for provider, amount in allocations.items():
        cells.extend(
            build_test_cells(
                campaign_name=body.name,
                provider=provider,
                budget_usd=amount,
                creative_ids=body.creative_ids,
                audience_ids=body.audience_ids,
                destination_url=body.destination_url,
            )
        )

    plan = {
        **raw,
        "id": campaign_id,
        "artist_handle": user["handle"],
        "status": "draft",
        "budget_approved": False,
        "provider_allocations_usd": allocations,
        "test_cells": cells,
        "created_at": _now(),
        "updated_at": _now(),
        "external_execution_enabled": False,
    }
    await db.growth_paid_campaigns.insert_one(plan)
    plan.pop("_id", None)
    return plan


@router.get("/campaigns")
async def list_paid_campaigns(user: Dict = Depends(current_user)):
    rows = await db.growth_paid_campaigns.find(
        {"artist_handle": user["handle"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    return {"campaigns": rows, "count": len(rows)}


@router.get("/campaigns/{campaign_id}/readiness")
async def campaign_readiness(campaign_id: str, user: Dict = Depends(current_user)):
    plan = await db.growth_paid_campaigns.find_one(
        {"id": campaign_id, "artist_handle": user["handle"]}, {"_id": 0}
    )
    if not plan:
        raise HTTPException(404, "Paid campaign not found.")

    states = {row["provider"]: row for row in connector_states()}
    selected = list(plan.get("providers") or [])
    credentials_present = all(
        provider == "spotify_manual" or bool(states.get(provider, {}).get("credentials_ready"))
        for provider in selected
    )
    readiness_input = {**plan, "provider_credentials_present": credentials_present}
    return {"campaign_id": campaign_id, **launch_readiness(readiness_input)}


@router.post("/campaigns/{campaign_id}/approve")
async def approve_paid_campaign(
    campaign_id: str,
    body: CampaignApproval,
    user: Dict = Depends(current_user),
):
    plan = await db.growth_paid_campaigns.find_one(
        {"id": campaign_id, "artist_handle": user["handle"]}, {"_id": 0}
    )
    if not plan:
        raise HTTPException(404, "Paid campaign not found.")
    if body.max_spend_usd > float(plan.get("total_budget_usd", 0)):
        raise HTTPException(400, "Approval cannot exceed the planned campaign budget.")

    digest = approval_digest(campaign_id, body.max_spend_usd, user["handle"])
    approval = {
        "approved_by": user["handle"],
        "approved_at": _now(),
        "max_spend_usd": body.max_spend_usd,
        "digest": digest,
    }
    await db.growth_paid_campaigns.update_one(
        {"id": campaign_id, "artist_handle": user["handle"]},
        {
            "$set": {
                "status": "approved_for_creation",
                "budget_approved": True,
                "approval": approval,
                "updated_at": _now(),
            }
        },
    )
    return {
        "campaign_id": campaign_id,
        "status": "approved_for_creation",
        "approval_digest": digest,
        "activation_still_required": True,
    }


def _verify_approval(plan: Dict[str, Any], supplied_digest: str) -> None:
    approval = plan.get("approval") or {}
    if not approval or approval.get("digest") != supplied_digest:
        raise HTTPException(403, "Paid campaign approval is missing or does not match.")


@router.post("/campaigns/{campaign_id}/launch")
async def create_provider_campaign(
    campaign_id: str,
    body: ProviderLaunch,
    user: Dict = Depends(current_user),
):
    plan = await db.growth_paid_campaigns.find_one(
        {"id": campaign_id, "artist_handle": user["handle"]}, {"_id": 0}
    )
    if not plan:
        raise HTTPException(404, "Paid campaign not found.")
    _verify_approval(plan, body.approval_digest)
    if body.provider not in plan.get("providers", []):
        raise HTTPException(400, "Provider is not part of this approved plan.")

    try:
        if body.provider == "tiktok":
            connector = TikTokAdsConnector()
            campaign_result = connector.create_disabled_campaign(body.campaign_payload)
            provider_campaign_id = str((campaign_result.get("data") or {}).get("campaign_id") or campaign_result.get("campaign_id") or "")
            children = []
            for payload in body.adgroup_payloads:
                result = connector.create_disabled_adgroup(provider_campaign_id, payload)
                children.append({"kind": "adgroup", "result": result})
            for payload in body.ad_payloads:
                adgroup_id = str(payload.get("adgroup_id", ""))
                if not adgroup_id:
                    raise HTTPException(400, "Each TikTok ad payload requires adgroup_id.")
                result = connector.create_disabled_ad(adgroup_id, payload)
                children.append({"kind": "ad", "result": result})
        else:
            connector = MetaAdsConnector()
            campaign_result = connector.create_paused_campaign(body.campaign_payload)
            provider_campaign_id = str(campaign_result.get("id") or "")
            children = []
            for payload in body.adgroup_payloads:
                result = connector.create_paused_adset({**payload, "campaign_id": provider_campaign_id})
                children.append({"kind": "adset", "result": result})
            for payload in body.ad_payloads:
                result = connector.create_paused_ad(payload)
                children.append({"kind": "ad", "result": result})
    except ProviderRequestError as exc:
        raise HTTPException(502, str(exc)) from exc

    launch_record = {
        "provider": body.provider,
        "provider_campaign_id": provider_campaign_id,
        "created_at": _now(),
        "status": "provider_created_paused",
        "campaign_result": campaign_result,
        "children": children,
    }
    await db.growth_paid_campaigns.update_one(
        {"id": campaign_id, "artist_handle": user["handle"]},
        {
            "$set": {
                f"provider_launches.{body.provider}": launch_record,
                "status": "provider_created_paused",
                "updated_at": _now(),
                "external_execution_enabled": True,
            }
        },
    )
    return {
        "campaign_id": campaign_id,
        **launch_record,
        "spend_active": False,
        "next_gate": "explicit activation approval",
    }


@router.post("/campaigns/{campaign_id}/providers/{provider}/activate")
async def activate_provider_campaign(
    campaign_id: str,
    provider: Literal["tiktok", "meta"],
    body: ProviderActivation,
    user: Dict = Depends(current_user),
):
    plan = await db.growth_paid_campaigns.find_one(
        {"id": campaign_id, "artist_handle": user["handle"]}, {"_id": 0}
    )
    if not plan:
        raise HTTPException(404, "Paid campaign not found.")
    _verify_approval(plan, body.approval_digest)
    launch = (plan.get("provider_launches") or {}).get(provider) or {}
    provider_campaign_id = launch.get("provider_campaign_id")
    if not provider_campaign_id:
        raise HTTPException(409, "Create the paused provider campaign before activation.")

    try:
        result = (
            TikTokAdsConnector().activate_campaign(provider_campaign_id)
            if provider == "tiktok"
            else MetaAdsConnector().activate_campaign(provider_campaign_id)
        )
    except ProviderRequestError as exc:
        raise HTTPException(502, str(exc)) from exc

    await db.growth_paid_campaigns.update_one(
        {"id": campaign_id, "artist_handle": user["handle"]},
        {
            "$set": {
                f"provider_launches.{provider}.status": "active",
                f"provider_launches.{provider}.activated_at": _now(),
                "status": "active",
                "updated_at": _now(),
            }
        },
    )
    return {
        "campaign_id": campaign_id,
        "provider": provider,
        "status": "active",
        "spend_active": True,
        "provider_result": result,
    }


@router.post("/campaigns/{campaign_id}/performance/recommend")
async def paid_performance_recommendation(
    campaign_id: str,
    body: PerformanceRow,
    user: Dict = Depends(current_user),
):
    plan = await db.growth_paid_campaigns.find_one(
        {"id": campaign_id, "artist_handle": user["handle"]}, {"_id": 0}
    )
    if not plan:
        raise HTTPException(404, "Paid campaign not found.")
    recommendation = recommend_action(
        jsonable_encoder(body), target_cpa_usd=plan.get("target_cpa_usd", 0)
    )
    record = {"id": _id("rec"), **recommendation, "created_at": _now()}
    await db.growth_paid_recommendations.insert_one(
        {**record, "campaign_id": campaign_id, "artist_handle": user["handle"]}
    )
    return record


@router.post("/events/report")
async def report_paid_conversion_event(
    body: ConversionEventReport,
    user: Dict = Depends(current_user),
):
    try:
        if body.provider == "tiktok":
            result = TikTokAdsConnector().report_event(body.event_payload)
        else:
            result = MetaAdsConnector().report_event([body.event_payload])
    except ProviderRequestError as exc:
        raise HTTPException(502, str(exc)) from exc
    return {
        "provider": body.provider,
        "reported_by": user["handle"],
        "reported_at": _now(),
        "result": result,
    }


@router.get("/spotify-handoff/{campaign_id}")
async def spotify_campaign_handoff(campaign_id: str, user: Dict = Depends(current_user)):
    plan = await db.growth_paid_campaigns.find_one(
        {"id": campaign_id, "artist_handle": user["handle"]}, {"_id": 0}
    )
    if not plan:
        raise HTTPException(404, "Paid campaign not found.")
    if "spotify_manual" not in plan.get("providers", []):
        raise HTTPException(400, "Spotify is not included in this campaign plan.")
    return {
        "campaign_id": campaign_id,
        "mode": "operator_handoff",
        "destination_url": add_utm(
            plan["destination_url"],
            campaign=plan["name"],
            source="spotify",
            medium="paid_streaming",
            content="campaign-kit",
        ),
        "allocated_budget_usd": (plan.get("provider_allocations_usd") or {}).get("spotify_manual", 0),
        "steps": [
            "Confirm release and artist-team eligibility in Spotify for Artists",
            "Open Campaigns and choose the available Marquee or Showcase format",
            "Use the approved audience goal, territory, dates, and budget from this plan",
            "Record the Spotify campaign ID and results back in Lyrica",
        ],
        "automatic_launch_available": False,
    }
