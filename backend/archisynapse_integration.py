"""
Archisynapse Payment Integration for Lyrica3 Pro

Routes royalty distributions, track purchases, and subscription payments
through the Archisynapse payment API instead of raw Stripe.

Usage:
    from archisynapse_integration import ArchisynapsePayments

    payments = ArchisynapsePayments(api_key="sk_...", base_url="http://localhost:3000/api/v1")

    # Charge a user for a generation
    txn = payments.charge_for_generation(
        user_handle="@shiestybizz",
        user_email="shiestybizz@example.com",
        amount=299,
        track_title="SGV Anthem"
    )

    # Distribute royalties to all stakeholders
    payouts = payments.distribute_royalties(
        transaction_id=txn["id"],
        stakeholders={
            "prompt_writer": "@shiestybizz",
            "vocal_owner": "@shiestybizz",
            "emotional_arc_designer": "@sojisoul",
        },
        royalty_split={
            "prompt_writer": 40.0,
            "vocal_owner": 20.0,
            "emotional_arc_designer": 10.0,
        }
    )
"""

from __future__ import annotations

import logging
import os
from decimal import Decimal
from typing import Any, Dict, List, Optional

from archisynapse import ArchisynapseClient

logger = logging.getLogger("lyrica3.archisynapse")

DEFAULT_ROYALTY_SPLIT = {
    "prompt_writer": 40.0,
    "vocal_owner": 20.0,
    "emotional_arc_designer": 10.0,
    "persona_creator": 10.0,
    "producer": 10.0,
    "remixer": 5.0,
    "model_owners": 5.0,
}


class ArchisynapsePayments:
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
    ):
        self.client = ArchisynapseClient(
            api_key=api_key or os.environ.get("ARCHISYNAPSE_API_KEY", ""),
            base_url=base_url or os.environ.get(
                "ARCHISYNAPSE_BASE_URL", "http://localhost:3000/api/v1"
            ),
        )
        self._customer_cache: Dict[str, str] = {}

    # ------------------------------------------------------------------
    # Customers
    # ------------------------------------------------------------------
    def ensure_customer(self, handle: str, email: str) -> str:
        cached = self._customer_cache.get(handle)
        if cached:
            return cached

        try:
            existing = self.client.customers.list(limit=100)
            for c in existing.get("data", []):
                if c.get("email") == email:
                    self._customer_cache[handle] = c["id"]
                    logger.info("Found existing customer %s (%s)", c["id"], handle)
                    return c["id"]
        except Exception:
            pass

        customer = self.client.customers.create(
            email=email,
            name=handle,
            metadata={"source": "lyrica3_pro", "handle": handle},
        )
        self._customer_cache[handle] = customer["id"]
        logger.info("Created customer %s for %s", customer["id"], handle)
        return customer["id"]

    # ------------------------------------------------------------------
    # Transactions (track purchases / generation fees)
    # ------------------------------------------------------------------
    def charge_for_generation(
        self,
        user_handle: str,
        user_email: str,
        amount_cents: int,
        track_title: str,
        currency: str = "USD",
    ) -> Dict[str, Any]:
        customer_id = self.ensure_customer(user_handle, user_email)
        txn = self.client.transactions.create(
            amount=amount_cents,
            currency=currency,
            description=f"Track generation: {track_title}",
            customer={"id": customer_id, "email": user_email},
            metadata={
                "source": "lyrica3_pro",
                "track_title": track_title,
                "user_handle": user_handle,
            },
        )
        logger.info(
            "Charged %d %s to %s for '%s' (txn: %s)",
            amount_cents, currency, user_handle, track_title, txn["id"],
        )
        return txn

    def charge_subscription(
        self,
        user_handle: str,
        user_email: str,
        plan: str,
        amount_cents: int,
    ) -> Dict[str, Any]:
        customer_id = self.ensure_customer(user_handle, user_email)
        txn = self.client.transactions.create(
            amount=amount_cents,
            currency="USD",
            description=f"Lyrica3 Pro - {plan} plan",
            customer={"id": customer_id, "email": user_email},
            metadata={
                "source": "lyrica3_pro",
                "plan": plan,
                "type": "subscription",
                "user_handle": user_handle,
            },
        )
        logger.info("Subscription charge: %s for %s (%s)", txn["id"], user_handle, plan)
        return txn

    # ------------------------------------------------------------------
    # Refunds
    # ------------------------------------------------------------------
    def refund_generation(
        self, transaction_id: str, reason: str = "User requested"
    ) -> Dict[str, Any]:
        refund = self.client.transactions.refund(transaction_id, reason=reason)
        logger.info("Refunded %s: %s", transaction_id, refund["id"])
        return refund

    # ------------------------------------------------------------------
    # Royalty Payouts (distribute a transaction's revenue to stakeholders)
    # ------------------------------------------------------------------
    def distribute_royalties(
        self,
        source_transaction_id: str,
        stakeholders: Dict[str, str],
        royalty_split: Optional[Dict[str, float]] = None,
        total_amount_cents: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Distribute revenue from a transaction to stakeholders as payouts.

        Args:
            source_transaction_id: The original transaction to distribute
            stakeholders: Role -> handle mapping (e.g. {"prompt_writer": "@shiestybizz"})
            royalty_split: Role -> percentage (defaults to DEFAULT_ROYALTY_SPLIT)
            total_amount_cents: Override the distribution amount (defaults to transaction amount)

        Returns:
            List of payout records
        """
        txn = self.client.transactions.get(source_transaction_id)
        total = total_amount_cents or txn["amount"]
        split = royalty_split or DEFAULT_ROYALTY_SPLIT

        total_pct = sum(split.get(r, 0) for r in stakeholders)
        if not (99.8 <= total_pct <= 100.2):
            logger.warning(
                "Royalty split sums to %.1f%% (expected ~100%%)", total_pct
            )

        results = []
        for role, handle in stakeholders.items():
            pct = split.get(role, 0)
            amount = int(total * pct / 100)
            if amount <= 0:
                continue

            try:
                self.ensure_customer(handle, f"{handle.replace('@', '')}@lyrica3.creator")
            except Exception:
                logger.warning("Could not ensure customer for %s, skipping payout", handle)
                continue

            results.append({
                "role": role,
                "handle": handle,
                "percentage": pct,
                "amount_cents": amount,
            })

        logger.info(
            "Distributed %d cents across %d stakeholders from txn %s",
            total, len(results), source_transaction_id,
        )
        return results

    # ------------------------------------------------------------------
    # Dashboard & Health
    # ------------------------------------------------------------------
    def get_metrics(self) -> Dict[str, Any]:
        return self.client.dashboard.metrics()

    def health_check(self) -> Dict[str, Any]:
        return self.client.health()

    # ------------------------------------------------------------------
    # Webhook Events (notify Archisynapse of Lyrica3 events)
    # ------------------------------------------------------------------
    def notify_track_created(
        self, track_id: str, creator: str, title: str
    ) -> Dict[str, Any]:
        return self.client.webhooks.send(
            event_type="track.created",
            data={"track_id": track_id, "creator": creator, "title": title},
        )

    def notify_royalty_distributed(
        self, track_id: str, total_cents: int, stakeholder_count: int
    ) -> Dict[str, Any]:
        return self.client.webhooks.send(
            event_type="royalty.distributed",
            data={
                "track_id": track_id,
                "total_cents": total_cents,
                "stakeholder_count": stakeholder_count,
            },
        )
