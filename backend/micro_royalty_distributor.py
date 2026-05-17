"""
Lyrica3 Pro: Micro-Royalty Distribution System
7-Stakeholder Model for Creator-Owned AI Music

Every contribution gets paid. Every output becomes a revenue-bearing asset.

Stakeholders:
1. Prompt Writer - Crafts the creative direction
2. Vocal Owner - Provides voice/vocal timbre
3. Emotional Arc Designer - Defines biometric artifacts (cracks, fry, melisma)
4. Persona Creator - Builds the cultural/sonic identity (SGV Chicano, etc.)
5. Producer - Final arrangement/mixing decisions
6. Remixer - Transforms stems into new works
7. Model Owner - AI model developers (MusicGen, Demucs, etc.)

Built with 🔥 by shiestybizz113-cell
El Monte // SGV // Since Day One
"""

import os
import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from decimal import Decimal
from pymongo import MongoClient
from bson import ObjectId
import stripe
import logging

logger = logging.getLogger(__name__)


class MicroRoyaltyDistributor:
    """
    Micro-royalty distribution system for 7-stakeholder creator-owned AI music.
    
    Every contribution gets attribution + payment:
    - Prompt Writer: Creative direction
    - Vocal Owner: Voice/timbre
    - Emotional Arc Designer: Biometric artifacts
    - Persona Creator: Cultural identity
    - Producer: Final arrangement
    - Remixer: Stem transformations
    - Model Owner: AI model developers
    """
    
    # Default royalty split (percentages, must sum to 100)
    DEFAULT_SPLIT = {
        "prompt_writer": 40.0,        # Creative vision
        "vocal_owner": 20.0,          # Voice/timbre
        "emotional_arc_designer": 10.0,  # Biometric design
        "persona_creator": 10.0,      # Cultural identity
        "producer": 10.0,             # Final arrangement
        "remixer": 5.0,               # Stem transformation (if remixed)
        "model_owners": 5.0,          # AI model developers (split among all)
    }
    
    # AI model owner registry (who gets paid for each model)
    MODEL_OWNER_REGISTRY = {
        "musicgen": {
            "owner": "Meta",
            "stripe_account_id": "acct_meta_musicgen",
            "wallet_address": None,
        },
        "demucs": {
            "owner": "Meta",
            "stripe_account_id": "acct_meta_demucs",
            "wallet_address": None,
        },
        "pedalboard": {
            "owner": "Spotify",
            "stripe_account_id": "acct_spotify_pedalboard",
            "wallet_address": None,
        },
        "sl_audio_master": {
            "owner": "Lyrica3",
            "stripe_account_id": "acct_lyrica3_sla",
            "wallet_address": None,
        },
        "the_beast": {
            "owner": "Lyrica3",
            "stripe_account_id": "acct_lyrica3_beast",
            "wallet_address": None,
        },
    }
    
    def __init__(self, mongodb_uri: str, stripe_api_key: str):
        """
        Initialize the micro-royalty distributor.
        
        Args:
            mongodb_uri: MongoDB connection string
            stripe_api_key: Stripe API key for payment processing
        """
        self.db = MongoClient(mongodb_uri)["lyrica3"]
        stripe.api_key = stripe_api_key
    
    def create_birth_certificate(
        self,
        track_data: Dict,
        stakeholders: Dict[str, str],
        royalty_split: Optional[Dict[str, float]] = None
    ) -> Dict:
        """
        Generate digital birth certificate with full stakeholder attribution.
        
        Args:
            track_data: Track metadata (title, creator, stems, etc.)
            stakeholders: Dict mapping roles to user handles:
                {
                    "prompt_writer": "@shiestybizz",
                    "vocal_owner": "@shiestybizz",
                    "emotional_arc_designer": "@shiestybizz",
                    "persona_creator": "@shiestybizz",
                    "producer": "@shiestybizz",
                    "remixer": None,  # Optional
                }
            royalty_split: Custom royalty split (percentages, optional)
        
        Returns:
            Birth certificate dict with hash, timestamp, and stakeholder attribution
        """
        logger.info(f"🎫 Creating birth certificate for track: {track_data.get('title')}")
        
        # Use default split if not provided
        if royalty_split is None:
            royalty_split = self.DEFAULT_SPLIT.copy()
        
        # Validate split sums to 100%
        total = sum(royalty_split.values())
        if not (99.9 <= total <= 100.1):  # Allow for floating point errors
            raise ValueError(f"Royalty split must sum to 100%, got {total}%")
        
        # Build stakeholder attribution
        stakeholder_attribution = {}
        for role, handle in stakeholders.items():
            if handle:  # Skip if role is not filled
                stakeholder_attribution[role] = {
                    "handle": handle,
                    "royalty_percentage": royalty_split.get(role, 0.0),
                    "contribution": self._describe_contribution(role, track_data)
                }
        
        # Build AI model attribution
        ai_models_used = track_data.get("ai_contribution", {}).get("models", [])
        model_count = len(ai_models_used)
        model_split_each = royalty_split.get("model_owners", 5.0) / model_count if model_count > 0 else 0.0
        
        ai_model_attribution = []
        for model in ai_models_used:
            model_name = model.get("name", "unknown").lower().replace(" ", "_")
            registry_entry = self.MODEL_OWNER_REGISTRY.get(model_name, {})
            
            ai_model_attribution.append({
                "model_name": model.get("name"),
                "model_id": model.get("id"),
                "version": model.get("version"),
                "provider": model.get("provider"),
                "owner": registry_entry.get("owner", "Unknown"),
                "royalty_percentage": model_split_each,
                "stripe_account_id": registry_entry.get("stripe_account_id"),
            })
        
        # Build full certificate
        certificate = {
            "track_id": track_data["dna_tag"],
            "title": track_data["title"],
            "creator": track_data["creator"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            
            "birth_certificate": {
                "human_stakeholders": stakeholder_attribution,
                "ai_models": ai_model_attribution,
                
                "human_contribution": track_data.get("human_contribution", {}),
                "ai_contribution": track_data.get("ai_contribution", {}),
                
                "stems": track_data.get("stems", []),
                
                "provenance": {
                    "backend": "Railway (https://lyrica3.com)",
                    "frontend": "Vercel",
                    "ai_platform": "GCP Vertex AI (disco-amphora-490606-n8, us-west1)",
                    "git_commit": os.getenv("GIT_COMMIT", "unknown"),
                    "deployment_date": datetime.now(timezone.utc).isoformat(),
                }
            },
            
            "royalty_split": royalty_split,
            
            "ownership": {
                "stakeholder_model": "7-stakeholder micro-royalty distribution",
                "platform_fee": "0% (tip-based)",
                "creator_sovereignty": "100% (all stakeholders are creator-owned)",
            },
            
            "license": "Creator-owned, commercial use allowed, all stakeholders compensated",
        }
        
        # Generate cryptographic hash
        cert_json = json.dumps(certificate, sort_keys=True, default=str)
        certificate["hash"] = hashlib.sha256(cert_json.encode()).hexdigest()
        
        # Store in MongoDB
        result = self.db.birth_certificates.insert_one(certificate)
        certificate["_id"] = str(result.inserted_id)
        
        logger.info(f"✅ Birth certificate created: {certificate['hash'][:16]}...")
        logger.info(f"   Stakeholders: {len(stakeholder_attribution)} human, {len(ai_model_attribution)} AI")
        
        return certificate
    
    def _describe_contribution(self, role: str, track_data: Dict) -> str:
        """Generate human-readable description of stakeholder contribution."""
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
    
    def distribute_royalties(
        self,
        track_id: str,
        amount_usd: float,
        source: str = "streaming"
    ) -> Dict:
        """
        Distribute royalties for a track according to the birth certificate split.
        
        Args:
            track_id: Track DNA tag
            amount_usd: Total royalty amount in USD
            source: Revenue source ("streaming", "download", "sync", etc.)
        
        Returns:
            Distribution result with payment IDs
        """
        logger.info(f"💰 Distributing ${amount_usd:.4f} royalties for track: {track_id}")
        
        # Get birth certificate
        cert = self.db.birth_certificates.find_one({"track_id": track_id})
        if not cert:
            raise ValueError(f"Birth certificate not found for {track_id}")
        
        # Calculate stakeholder payments
        stakeholder_payments = []
        human_stakeholders = cert["birth_certificate"]["human_stakeholders"]
        
        for role, stakeholder in human_stakeholders.items():
            handle = stakeholder["handle"]
            percentage = stakeholder["royalty_percentage"]
            amount = Decimal(str(amount_usd)) * Decimal(str(percentage)) / Decimal("100")
            
            payment = self._pay_stakeholder(handle, float(amount), role, track_id)
            stakeholder_payments.append({
                "role": role,
                "handle": handle,
                "percentage": percentage,
                "amount_usd": float(amount),
                "payment": payment
            })
        
        # Calculate AI model payments
        ai_model_payments = []
        ai_models = cert["birth_certificate"]["ai_models"]
        
        for model in ai_models:
            model_name = model["model_name"]
            percentage = model["royalty_percentage"]
            amount = Decimal(str(amount_usd)) * Decimal(str(percentage)) / Decimal("100")
            
            payment = self._pay_ai_model(
                model_name,
                float(amount),
                model.get("stripe_account_id")
            )
            ai_model_payments.append({
                "model_name": model_name,
                "owner": model["owner"],
                "percentage": percentage,
                "amount_usd": float(amount),
                "payment": payment
            })
        
        # Log distribution
        distribution_record = {
            "track_id": track_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": source,
            "total_amount_usd": amount_usd,
            "stakeholder_payments": stakeholder_payments,
            "ai_model_payments": ai_model_payments,
            "status": "completed"
        }
        
        self.db.royalty_distributions.insert_one(distribution_record)
        
        logger.info(f"✅ Royalty distribution complete:")
        logger.info(f"   Human stakeholders: {len(stakeholder_payments)} payments")
        logger.info(f"   AI models: {len(ai_model_payments)} payments")
        
        return distribution_record
    
    def _pay_stakeholder(self, handle: str, amount_usd: float, 
                         role: str, track_id: str) -> Dict:
        """
        Pay a human stakeholder via Stripe Connect.
        
        Args:
            handle: User handle (e.g., "@shiestybizz")
            amount_usd: Payment amount in USD
            role: Stakeholder role
            track_id: Track DNA tag
        
        Returns:
            Payment result dict
        """
        # Get user's Stripe Connect account
        user = self.db.users.find_one({"handle": handle})
        
        if not user or not user.get("stripe_account_id"):
            # Queue payment for later (user needs to connect Stripe)
            logger.warning(f"⚠️  {handle} has no Stripe account, queueing payment")
            return {
                "status": "queued",
                "amount_usd": amount_usd,
                "reason": "User needs to connect Stripe account"
            }
        
        # Create Stripe transfer
        try:
            transfer = stripe.Transfer.create(
                amount=int(amount_usd * 100),  # Convert to cents
                currency="usd",
                destination=user["stripe_account_id"],
                transfer_group=f"track_{track_id}",
                description=f"{role} royalty for track {track_id}"
            )
            
            logger.info(f"   ✅ Paid {handle} (${amount_usd:.4f})")
            
            return {
                "status": "paid",
                "amount_usd": amount_usd,
                "stripe_transfer_id": transfer.id,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        except stripe.error.StripeError as e:
            logger.error(f"   ❌ Stripe payment failed for {handle}: {e}")
            return {
                "status": "failed",
                "amount_usd": amount_usd,
                "error": str(e)
            }
    
    def _pay_ai_model(self, model_name: str, amount_usd: float,
                      stripe_account_id: Optional[str]) -> Dict:
        """
        Pay an AI model owner (e.g., Meta, Spotify) via Stripe Connect.
        
        Args:
            model_name: Model name (e.g., "MusicGen")
            amount_usd: Payment amount in USD
            stripe_account_id: Stripe Connect account ID (optional)
        
        Returns:
            Payment result dict
        """
        if not stripe_account_id:
            # Queue payment or donate to open-source fund
            logger.warning(f"⚠️  {model_name} has no payment method, queueing")
            return {
                "status": "queued",
                "model": model_name,
                "amount_usd": amount_usd,
                "reason": "Model owner has no payment method configured"
            }
        
        # Create Stripe transfer
        try:
            transfer = stripe.Transfer.create(
                amount=int(amount_usd * 100),  # Convert to cents
                currency="usd",
                destination=stripe_account_id,
                transfer_group=f"model_{model_name}",
                description=f"Model usage royalty: {model_name}"
            )
            
            logger.info(f"   ✅ Paid {model_name} model (${amount_usd:.4f})")
            
            return {
                "status": "paid",
                "model": model_name,
                "amount_usd": amount_usd,
                "stripe_transfer_id": transfer.id,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        except stripe.error.StripeError as e:
            logger.error(f"   ❌ Stripe payment failed for {model_name}: {e}")
            return {
                "status": "failed",
                "model": model_name,
                "amount_usd": amount_usd,
                "error": str(e)
            }
    
    def get_royalty_dashboard(self, handle: str) -> Dict:
        """
        Get real-time royalty tracking dashboard for a user.
        
        Args:
            handle: User handle (e.g., "@shiestybizz")
        
        Returns:
            Dashboard data with earnings breakdown
        """
        # Get all certificates where user is a stakeholder
        certificates = list(self.db.birth_certificates.find({
            f"birth_certificate.human_stakeholders.prompt_writer.handle": handle
        })) + list(self.db.birth_certificates.find({
            f"birth_certificate.human_stakeholders.vocal_owner.handle": handle
        })) + list(self.db.birth_certificates.find({
            f"birth_certificate.human_stakeholders.producer.handle": handle
        }))
        
        # Deduplicate by track_id
        certificates = {cert["track_id"]: cert for cert in certificates}.values()
        
        # Get all distributions for these tracks
        track_ids = [cert["track_id"] for cert in certificates]
        distributions = list(self.db.royalty_distributions.find({
            "track_id": {"$in": track_ids}
        }))
        
        # Calculate total earnings by role
        earnings_by_role = {}
        total_earnings = Decimal("0")
        
        for dist in distributions:
            for payment in dist["stakeholder_payments"]:
                if payment["handle"] == handle:
                    role = payment["role"]
                    amount = Decimal(str(payment["amount_usd"]))
                    
                    if role not in earnings_by_role:
                        earnings_by_role[role] = Decimal("0")
                    
                    earnings_by_role[role] += amount
                    total_earnings += amount
        
        # Build dashboard
        dashboard = {
            "handle": handle,
            "total_earnings_usd": float(total_earnings),
            "earnings_by_role": {
                role: float(amount) for role, amount in earnings_by_role.items()
            },
            "tracks_created": len(certificates),
            "distributions_received": len([
                d for d in distributions 
                if any(p["handle"] == handle for p in d["stakeholder_payments"])
            ]),
            "recent_distributions": [
                {
                    "track_id": d["track_id"],
                    "timestamp": d["timestamp"],
                    "amount_usd": next(
                        p["amount_usd"] for p in d["stakeholder_payments"] 
                        if p["handle"] == handle
                    ),
                    "role": next(
                        p["role"] for p in d["stakeholder_payments"] 
                        if p["handle"] == handle
                    ),
                    "source": d["source"]
                }
                for d in sorted(distributions, key=lambda x: x["timestamp"], reverse=True)[:10]
                if any(p["handle"] == handle for p in d["stakeholder_payments"])
            ]
        }
        
        return dashboard


# --- API Endpoints (for FastAPI integration) ---

def setup_royalty_routes(app, distributor: MicroRoyaltyDistributor):
    """
    Add royalty distribution routes to FastAPI app.
    
    Args:
        app: FastAPI app instance
        distributor: MicroRoyaltyDistributor instance
    """
    from fastapi import APIRouter, HTTPException, Depends
    from pydantic import BaseModel
    
    router = APIRouter(prefix="/api/royalties", tags=["royalties"])
    
    class CreateCertificateRequest(BaseModel):
        track_data: Dict
        stakeholders: Dict[str, str]
        royalty_split: Optional[Dict[str, float]] = None
    
    class DistributeRoyaltiesRequest(BaseModel):
        track_id: str
        amount_usd: float
        source: str = "streaming"
    
    @router.post("/certificate")
    async def create_certificate(req: CreateCertificateRequest):
        """Generate digital birth certificate for a track."""
        try:
            cert = distributor.create_birth_certificate(
                req.track_data,
                req.stakeholders,
                req.royalty_split
            )
            return cert
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    @router.get("/certificate/{track_id}")
    async def get_certificate(track_id: str):
        """Get birth certificate for a track."""
        cert = distributor.db.birth_certificates.find_one({"track_id": track_id})
        if not cert:
            raise HTTPException(status_code=404, detail="Certificate not found")
        cert["_id"] = str(cert["_id"])
        return cert
    
    @router.post("/distribute")
    async def distribute_royalties(req: DistributeRoyaltiesRequest):
        """Distribute royalties for a track."""
        try:
            result = distributor.distribute_royalties(
                req.track_id,
                req.amount_usd,
                req.source
            )
            return result
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    @router.get("/dashboard/{handle}")
    async def get_dashboard(handle: str):
        """Get royalty dashboard for a user."""
        dashboard = distributor.get_royalty_dashboard(handle)
        return dashboard
    
    app.include_router(router)


# --- CLI Usage ---
if __name__ == "__main__":
    import sys
    
    logging.basicConfig(level=logging.INFO,
                        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # Example usage
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    stripe_api_key = os.getenv("STRIPE_API_KEY", "sk_test_...")
    
    distributor = MicroRoyaltyDistributor(mongodb_uri, stripe_api_key)
    
    # Example: Create birth certificate
    track_data = {
        "dna_tag": "DNA-8472A3",
        "title": "Acid Tears & 808s",
        "creator": "@shiestybizz",
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
        ]
    }
    
    stakeholders = {
        "prompt_writer": "@shiestybizz",
        "vocal_owner": "@shiestybizz",
        "emotional_arc_designer": "@shiestybizz",
        "persona_creator": "@shiestybizz",
        "producer": "@shiestybizz",
        "remixer": None,  # Not remixed
    }
    
    cert = distributor.create_birth_certificate(track_data, stakeholders)
    print(f"\n🎫 Birth Certificate Created:")
    print(f"   Track: {cert['title']}")
    print(f"   Hash: {cert['hash'][:32]}...")
    print(f"   Stakeholders: {len(cert['birth_certificate']['human_stakeholders'])}")
    print(f"   AI Models: {len(cert['birth_certificate']['ai_models'])}")
    
    # Example: Distribute $1.00 in royalties
    distribution = distributor.distribute_royalties("DNA-8472A3", 1.00, "streaming")
    print(f"\n💰 Royalty Distribution:")
    print(f"   Total: ${distribution['total_amount_usd']:.2f}")
    print(f"   Human payments: {len(distribution['stakeholder_payments'])}")
    print(f"   AI model payments: {len(distribution['ai_model_payments'])}")
