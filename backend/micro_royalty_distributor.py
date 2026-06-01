"""
Lyrica3 Pro: Micro-Royalty Distribution System
7-Stakeholder Model for Creator-Owned AI Music

Every contribution gets paid. Every output becomes a revenue-bearing asset.

Archisynapse is the SOURCE OF TRUTH for all payment data.
Stripe is the downstream settlement layer (optional, for actual money movement).

Stakeholders:
1. Prompt Writer - Crafts the creative direction
2. Vocal Owner - Provides voice/vocal timbre
3. Emotional Arc Designer - Defines biometric artifacts (cracks, fry, melisma)
4. Persona Creator - Builds the cultural/sonic identity (SGV Chicano, etc.)
5. Producer - Final arrangement/mixing decisions
6. Remixer - Transforms stems into new works
7. Model Owner - AI model developers (MusicGen, Demucs, etc.)
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple

from bson import ObjectId
from pymongo import MongoClient

import stripe

from archisynapse_integration import ArchisynapsePayments

logger = logging.getLogger(__name__)


class MicroRoyaltyDistributor:
    """
    Micro-royalty distribution system for 7-stakeholder creator-owned AI music.

    Archisynapse is the canonical ledger — every transaction, royalty split,
    and payout is recorded there first. Stripe handles actual cash movement
    as a downstream settlement layer.
    """

    DEFAULT_SPLIT = {
        "prompt_writer": 40.0,
        "vocal_owner": 20.0,
        "emotional_arc_designer": 10.0,
        "persona_creator": 10.0,
        "producer": 10.0,
        "remixer": 5.0,
        "model_owners": 5.0,
    }

    MODEL_OWNER_REGISTRY = {
        "musicgen": {"owner": "Meta", "stripe_account_id": "acct_meta_musicgen"},
        "demucs": {"owner": "Meta", "stripe_account_id": "acct_meta_demucs"},
        "pedalboard": {"owner": "Spotify", "stripe_account_id": "acct_spotify_pedalboard"},
        "sl_audio_master": {"owner": "Lyrica3", "stripe_account_id": "acct_lyrica3_sla"},
        "the_beast": {"owner": "Lyrica3", "stripe_account_id": "acct_lyrica3_beast"},
    }

    def __init__(
        self,
        mongodb_uri: str,
        stripe_api_key: str = "",
        arc: Optional[ArchisynapsePayments] = None,
    ):
        self.db = MongoClient(mongodb_uri)["lyrica3"]
        stripe.api_key = stripe_api_key
        self.arc = arc or ArchisynapsePayments()
        self._customer_cache: Dict[str, str] = {}

    # ------------------------------------------------------------------
    # Birth Certificates
    # ------------------------------------------------------------------

    def create_birth_certificate(
        self,
        track_data: Dict,
        stakeholders: Dict[str, str],
        royalty_split: Optional[Dict[str, float]] = None,
        charge_amount_cents: Optional[int] = None,
    ) -> Dict:
        """
        Generate digital birth certificate with full stakeholder attribution.

        Records an Archisynapse transaction as the source-of-truth payment
        reference for this track. The transaction can be for the generation
        fee, a downstream sale, or $0 (just attribution).

        Args:
            track_data: Track metadata (title, creator, stems, etc.)
            stakeholders: Dict mapping roles to user handles
            royalty_split: Custom royalty split (optional)
            charge_amount_cents: Optional upfront charge recorded in Archisynapse

        Returns:
            Birth certificate with archisynapse_txn_id embedded
        """
        logger.info(f"Creating birth certificate for track: {track_data.get('title')}")

        if royalty_split is None:
            royalty_split = self.DEFAULT_SPLIT.copy()

        total = sum(royalty_split.values())
        if not (99.9 <= total <= 100.1):
            raise ValueError(f"Royalty split must sum to 100%, got {total}%")

        # -- Record canonical transaction in Archisynapse --
        creator_handle = track_data.get("creator", "unknown")
        creator_email = track_data.get("creator_email", f"{creator_handle.replace('@', '')}@lyrica3.creator")
        arc_txn = self.arc.charge_for_generation(
            user_handle=creator_handle,
            user_email=creator_email,
            amount_cents=charge_amount_cents or 0,
            track_title=track_data.get("title", "Untitled"),
        )
        arc_txn_id = arc_txn["id"]
        logger.info(f"Archisynapse transaction: {arc_txn_id}")

        # Build stakeholder attribution
        stakeholder_attribution = {}
        for role, handle in stakeholders.items():
            if handle:
                self.arc.ensure_customer(handle, f"{handle.replace('@', '')}@lyrica3.creator")
                stakeholder_attribution[role] = {
                    "handle": handle,
                    "royalty_percentage": royalty_split.get(role, 0.0),
                    "contribution": self._describe_contribution(role, track_data),
                }

        # Build AI model attribution
        ai_models_used = track_data.get("ai_contribution", {}).get("models", [])
        model_count = len(ai_models_used)
        model_split_each = royalty_split.get("model_owners", 5.0) / model_count if model_count > 0 else 0.0

        ai_model_attribution = []
        for model in ai_models_used:
            model_name = model.get("name", "unknown").lower().replace(" ", "_")
            registry = self.MODEL_OWNER_REGISTRY.get(model_name, {})
            ai_model_attribution.append({
                "model_name": model.get("name"),
                "model_id": model.get("id"),
                "version": model.get("version"),
                "provider": model.get("provider"),
                "owner": registry.get("owner", "Unknown"),
                "royalty_percentage": model_split_each,
                "stripe_account_id": registry.get("stripe_account_id"),
            })

        certificate = {
            "track_id": track_data["dna_tag"],
            "title": track_data["title"],
            "creator": creator_handle,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "archisynapse_txn_id": arc_txn_id,
            "archisynapse_txn_amount_cents": charge_amount_cents or 0,
            "birth_certificate": {
                "human_stakeholders": stakeholder_attribution,
                "ai_models": ai_model_attribution,
                "human_contribution": track_data.get("human_contribution", {}),
                "ai_contribution": track_data.get("ai_contribution", {}),
                "stems": track_data.get("stems", []),
                "provenance": {
                    "backend": "Railway (https://lyrica3.com)",
                    "frontend": "Vercel",
                    "ai_platform": "GCP Vertex AI",
                    "payment_ledger": "Archisynapse",
                    "settlement_layer": "Stripe",
                },
            },
            "royalty_split": royalty_split,
            "ownership": {
                "stakeholder_model": "7-stakeholder micro-royalty distribution",
                "platform_fee": "0% (tip-based)",
                "creator_sovereignty": "100%",
            },
            "license": "Creator-owned, commercial use allowed, all stakeholders compensated",
        }

        cert_json = json.dumps(certificate, sort_keys=True, default=str)
        certificate["hash"] = hashlib.sha256(cert_json.encode()).hexdigest()

        result = self.db.birth_certificates.insert_one(certificate)
        certificate["_id"] = str(result.inserted_id)

        # Notify Archisynapse via webhook
        try:
            self.arc.notify_track_created(
                track_id=track_data["dna_tag"],
                creator=creator_handle,
                title=track_data.get("title", "Untitled"),
            )
        except Exception:
            logger.warning("Could not notify Archisynapse webhook", exc_info=True)

        logger.info(f"Birth certificate created: {certificate['hash'][:16]}...  (arc txn: {arc_txn_id})")
        return certificate

    def _describe_contribution(self, role: str, track_data: Dict) -> str:
        descriptions = {
            "prompt_writer": f"Creative direction: '{track_data.get('human_contribution', {}).get('prompt', 'N/A')}'",
            "vocal_owner": f"Voice/timbre for {len([s for s in track_data.get('stems', []) if s.get('name') == 'vocals'])} vocal stems",
            "emotional_arc_designer": f"Biometric artifacts: {', '.join(track_data.get('ai_contribution', {}).get('parameters', {}).get('artifacts', []))}",
            "persona_creator": f"Cultural identity: {track_data.get('cultural_matrix', 'N/A')}",
            "producer": f"Final arrangement and mixing across {len(track_data.get('stems', []))} stems",
            "remixer": "Stem transformation and remix",
            "model_owners": "AI model development and maintenance",
        }
        return descriptions.get(role, "Contribution to track creation")

    # ------------------------------------------------------------------
    # Royalty Distribution
    # ------------------------------------------------------------------

    def distribute_royalties(
        self,
        track_id: str,
        amount_usd: float,
        source: str = "streaming",
    ) -> Dict:
        """
        Distribute royalties for a track according to the birth certificate split.

        Archisynapse is the source of truth: every stakeholder payout creates
        an Archisynapse transaction as the canonical record. Stripe is called
        afterward for actual money movement (if the stakeholder has a Stripe
        account connected).

        Args:
            track_id: Track DNA tag
            amount_usd: Total royalty amount in USD
            source: Revenue source ("streaming", "download", "sync", etc.)

        Returns:
            Distribution result with Archisynapse txn IDs + Stripe transfer IDs
        """
        logger.info(f"Distributing ${amount_usd:.4f} royalties for track: {track_id}")

        cert = self.db.birth_certificates.find_one({"track_id": track_id})
        if not cert:
            raise ValueError(f"Birth certificate not found for {track_id}")

        # Create the SOURCE Archisynapse transaction (total revenue)
        source_txn = self.arc.charge_for_generation(
            user_handle=cert.get("creator", "unknown"),
            user_email=f"{cert.get('creator', 'unknown').replace('@', '')}@lyrica3.creator",
            amount_cents=int(amount_usd * 100),
            track_title=cert.get("title", "Untitled"),
        )
        source_txn_id = source_txn["id"]

        # Distribute to human stakeholders
        stakeholder_payments = []
        human_stakeholders = cert["birth_certificate"]["human_stakeholders"]
        for role, stakeholder in human_stakeholders.items():
            handle = stakeholder["handle"]
            percentage = stakeholder["royalty_percentage"]
            amount = float(Decimal(str(amount_usd)) * Decimal(str(percentage)) / Decimal("100"))

            payment = self._pay_stakeholder(handle, amount, role, track_id, source_txn_id)
            stakeholder_payments.append({
                "role": role,
                "handle": handle,
                "percentage": percentage,
                "amount_usd": round(amount, 6),
                "payment": payment,
            })

        # Distribute to AI model owners
        ai_model_payments = []
        ai_models = cert["birth_certificate"]["ai_models"]
        for model in ai_models:
            model_name = model["model_name"]
            percentage = model["royalty_percentage"]
            amount = float(Decimal(str(amount_usd)) * Decimal(str(percentage)) / Decimal("100"))

            payment = self._pay_ai_model(model_name, amount, model.get("stripe_account_id"), source_txn_id)
            ai_model_payments.append({
                "model_name": model_name,
                "owner": model["owner"],
                "percentage": percentage,
                "amount_usd": round(amount, 6),
                "payment": payment,
            })

        distribution = {
            "track_id": track_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": source,
            "total_amount_usd": amount_usd,
            "archisynapse_source_txn_id": source_txn_id,
            "stakeholder_payments": stakeholder_payments,
            "ai_model_payments": ai_model_payments,
            "status": "completed",
        }

        self.db.royalty_distributions.insert_one(distribution)

        # Notify Archisynapse via webhook
        try:
            self.arc.notify_royalty_distributed(
                track_id=track_id,
                total_cents=int(amount_usd * 100),
                stakeholder_count=len(stakeholder_payments),
            )
        except Exception:
            logger.warning("Could not notify Archisynapse webhook", exc_info=True)

        logger.info(f"Royalty distribution complete: {len(stakeholder_payments)} human + {len(ai_model_payments)} AI")
        return distribution

    def _pay_stakeholder(
        self,
        handle: str,
        amount_usd: float,
        role: str,
        track_id: str,
        source_txn_id: str,
    ) -> Dict:
        """
        Pay a human stakeholder.

        Archisynapse records the payout as the source of truth.
        Stripe Connect is used for actual settlement (optional).

        Returns:
            Payment result dict with Archisynapse txn ID and Stripe details
        """
        result = {
            "status": "recorded",
            "amount_usd": amount_usd,
            "archisynapse_txn_id": None,
            "stripe_transfer_id": None,
        }

        amount_cents = int(amount_usd * 100)
        if amount_cents <= 0:
            result["status"] = "skipped"
            return result

        # 1. Record the payout in Archisynapse (canonical ledger)
        try:
            arc_distributions = self.arc.distribute_royalties(
                source_transaction_id=source_txn_id,
                stakeholders={role: handle},
                total_amount_cents=amount_cents,
            )
            if arc_distributions:
                result["archisynapse_txn_id"] = source_txn_id
                result["status"] = "recorded"
                logger.info(f"   [Arc] Recorded payout for {handle}: ${amount_usd:.4f} ({role})")
        except Exception as e:
            logger.warning(f"   [Arc] Failed to record payout for {handle}: {e}")
            result["status"] = "arc_failed"

        # 2. Actual Stripe settlement (if account connected)
        user = self.db.users.find_one({"handle": handle})
        if user and user.get("stripe_account_id"):
            try:
                transfer = stripe.Transfer.create(
                    amount=amount_cents,
                    currency="usd",
                    destination=user["stripe_account_id"],
                    transfer_group=f"track_{track_id}",
                    description=f"{role} royalty via arc txn {source_txn_id}",
                )
                result["stripe_transfer_id"] = transfer.id
                result["status"] = "paid"
                logger.info(f"   [Stripe] Settled ${amount_usd:.4f} to {handle}")
            except stripe.error.StripeError as e:
                logger.error(f"   [Stripe] Failed for {handle}: {e}")
                result["status"] = "stripe_failed"
        else:
            logger.info(f"   [Stripe] No account for {handle}, queued for later settlement")

        return result

    def _pay_ai_model(
        self,
        model_name: str,
        amount_usd: float,
        stripe_account_id: Optional[str],
        source_txn_id: str,
    ) -> Dict:
        """
        Pay an AI model owner.

        Archisynapse records the liability. Stripe settles it if possible.

        Returns:
            Payment result dict
        """
        result = {
            "status": "recorded",
            "model": model_name,
            "amount_usd": amount_usd,
            "archisynapse_txn_id": source_txn_id,
            "stripe_transfer_id": None,
        }

        amount_cents = int(amount_usd * 100)
        if amount_cents <= 0:
            result["status"] = "skipped"
            return result

        result["amount_usd"] = round(amount_usd, 6)

        if not stripe_account_id:
            logger.warning(f"   {model_name} has no Stripe account, liability recorded in Arc")
            return result

        try:
            transfer = stripe.Transfer.create(
                amount=amount_cents,
                currency="usd",
                destination=stripe_account_id,
                transfer_group=f"model_{model_name}",
                description=f"Model royalty via arc txn {source_txn_id}",
            )
            result["stripe_transfer_id"] = transfer.id
            result["status"] = "paid"
            logger.info(f"   [Stripe] Paid {model_name} ${amount_usd:.4f}")
        except stripe.error.StripeError as e:
            logger.error(f"   [Stripe] Failed for {model_name}: {e}")
            result["status"] = "stripe_failed"

        return result

    # ------------------------------------------------------------------
    # Dashboard
    # ------------------------------------------------------------------

    def get_royalty_dashboard(self, handle: str) -> Dict:
        """
        Get real-time royalty tracking dashboard for a user.

        Sources of truth (in priority order):
          1. Archisynapse dashboard metrics (aggregate platform data)
          2. MongoDB distributions (per-user breakdown)

        Args:
            handle: User handle (e.g., "@shiestybizz")

        Returns:
            Dashboard data with earnings breakdown
        """
        # 1. Pull aggregate platform metrics from Archisynapse
        arc_metrics = {}
        try:
            arc_metrics = self.arc.get_metrics()
        except Exception:
            logger.warning("Could not reach Archisynapse for dashboard metrics")

        # 2. Pull per-user data from MongoDB
        certificates = list(self.db.birth_certificates.find({
            "$or": [
                {f"birth_certificate.human_stakeholders.{role}.handle": handle}
                for role in self.DEFAULT_SPLIT
            ]
        }))
        certificates = {c["track_id"]: c for c in certificates}.values()

        track_ids = [c["track_id"] for c in certificates]
        distributions = list(self.db.royalty_distributions.find({
            "track_id": {"$in": track_ids},
        }))

        earnings_by_role: Dict[str, float] = {}
        total_earnings = 0.0

        for dist in distributions:
            for payment in dist["stakeholder_payments"]:
                if payment["handle"] == handle:
                    role = payment["role"]
                    earnings_by_role[role] = earnings_by_role.get(role, 0.0) + payment["amount_usd"]
                    total_earnings += payment["amount_usd"]

        recent = []
        for d in sorted(distributions, key=lambda x: x["timestamp"], reverse=True)[:10]:
            for p in d.get("stakeholder_payments", []):
                if p["handle"] == handle:
                    recent.append({
                        "track_id": d["track_id"],
                        "timestamp": d["timestamp"],
                        "amount_usd": p["amount_usd"],
                        "role": p["role"],
                        "source": d["source"],
                        "arc_txn_id": d.get("archisynapse_source_txn_id"),
                    })

        dashboard = {
            "handle": handle,
            "total_earnings_usd": round(total_earnings, 2),
            "earnings_by_role": {k: round(v, 2) for k, v in earnings_by_role.items()},
            "tracks_created": len(certificates),
            "distributions_received": sum(1 for d in distributions if any(
                p["handle"] == handle for p in d["stakeholder_payments"]
            )),
            "recent_distributions": recent,
            "archisynapse_platform_metrics": {
                "total_transactions": arc_metrics.get("metrics", {}).get("total_transactions"),
                "total_volume_formatted": arc_metrics.get("metrics", {}).get("total_volume_formatted"),
                "active_customers": arc_metrics.get("metrics", {}).get("active_customers"),
            },
        }
        return dashboard


# ------------------------------------------------------------------
# FastAPI Routes
# ------------------------------------------------------------------

def setup_royalty_routes(app, distributor: MicroRoyaltyDistributor):
    from fastapi import APIRouter, HTTPException
    from pydantic import BaseModel

    router = APIRouter(prefix="/api/royalties", tags=["royalties"])

    class CreateCertificateRequest(BaseModel):
        track_data: Dict
        stakeholders: Dict[str, str]
        royalty_split: Optional[Dict[str, float]] = None
        charge_amount_cents: Optional[int] = None

    class DistributeRoyaltiesRequest(BaseModel):
        track_id: str
        amount_usd: float
        source: str = "streaming"

    @router.post("/certificate")
    async def create_certificate(req: CreateCertificateRequest):
        try:
            cert = distributor.create_birth_certificate(
                req.track_data,
                req.stakeholders,
                req.royalty_split,
                req.charge_amount_cents,
            )
            return cert
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @router.get("/certificate/{track_id}")
    async def get_certificate(track_id: str):
        cert = distributor.db.birth_certificates.find_one({"track_id": track_id})
        if not cert:
            raise HTTPException(status_code=404, detail="Certificate not found")
        cert["_id"] = str(cert["_id"])
        return cert

    @router.post("/distribute")
    async def distribute_royalties(req: DistributeRoyaltiesRequest):
        try:
            result = distributor.distribute_royalties(req.track_id, req.amount_usd, req.source)
            return result
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @router.get("/dashboard/{handle}")
    async def get_dashboard(handle: str):
        return distributor.get_royalty_dashboard(handle)

    app.include_router(router)


# ------------------------------------------------------------------
# CLI Usage
# ------------------------------------------------------------------

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

    arc = ArchisynapsePayments()
    distributor = MicroRoyaltyDistributor(
        mongodb_uri=os.getenv("MONGODB_URI", "mongodb://localhost:27017"),
        stripe_api_key=os.getenv("STRIPE_API_KEY", "sk_test_..."),
        arc=arc,
    )

    track_data = {
        "dna_tag": "DNA-8472A3",
        "title": "Acid Tears & 808s",
        "creator": "@shiestybizz",
        "creator_email": "shiestybizz@lyrica3.creator",
        "cultural_matrix": "SGV Chicano / Half-time Trap",
        "human_contribution": {
            "prompt": "Melancholic trap beat, 72 BPM, SGV lowrider vibe",
            "creative_direction": "E♭ Major/C Minor, emotional crack on chorus",
        },
        "ai_contribution": {
            "models": [
                {"name": "SL Audio Master", "id": "agent_1778921386550", "version": "v1.0"},
                {"name": "The Beast", "id": "agent_1776939216148", "version": "v1.2"},
                {"name": "MusicGen", "provider": "Meta", "version": "large-2.5"},
                {"name": "Demucs", "provider": "Meta", "version": "v4"},
            ]
        },
        "stems": [
            {"name": "drums", "duration": 45.3},
            {"name": "bass", "duration": 45.3},
            {"name": "melody", "duration": 45.3},
            {"name": "vocals", "duration": 45.3},
        ],
    }

    stakeholders = {
        "prompt_writer": "@shiestybizz",
        "vocal_owner": "@shiestybizz",
        "emotional_arc_designer": "@shiestybizz",
        "persona_creator": "@shiestybizz",
        "producer": "@shiestybizz",
        "remixer": None,
    }

    cert = distributor.create_birth_certificate(track_data, stakeholders, charge_amount_cents=29900)
    print(f"\nTrack: {cert['title']}")
    print(f"Arc txn: {cert['archisynapse_txn_id']}")
    print(f"Hash: {cert['hash'][:32]}...")
