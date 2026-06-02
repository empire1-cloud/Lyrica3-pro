"""
Archisynapse Payment + Registry Integration for Lyrica3 Pro

Routes royalty distributions, track purchases, subscription payments,
and Blueprint Registry semantic match / graph queries through
the deployed Archisynapse API.

Usage:
    from archisynapse_integration import ArchisynapsePayments

    payments = ArchisynapsePayments(api_key="sk_...")

    # Architecture intelligence
    results = payments.semantic_match_blueprints(
        query="ai music generation with real-time royalties",
        tags=["ai", "music", "royalties"],
    )

    # Payment flow
    txn = payments.charge_for_generation(
        user_handle="@shiestybizz",
        user_email="shiestybizz@example.com",
        amount=299,
        track_title="SGV Anthem",
    )
    payouts = payments.distribute_royalties(
        transaction_id=txn["id"],
        stakeholders={
            "prompt_writer": "@shiestybizz",
            "vocal_owner": "@shiestybizz",
            "emotional_arc_designer": "@sojisoul",
        },
        royalty_split={"prompt_writer": 40.0, "vocal_owner": 20.0, "emotional_arc_designer": 10.0},
    )
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional

import requests

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

ARCHISYNAPSE_BASE = os.environ.get(
    "ARCHISYNAPSE_BASE_URL",
    "https://archisynapse-production.up.railway.app/api/v1",
)


class ArchisynapseClient:
    """Lightweight HTTP client for the Archisynapse API.

    Handles auth, JSON serialization, error mapping.
    Used internally by ArchisynapsePayments — no external SDK dependency.
    """

    def __init__(self, api_key: str = "", base_url: str = ARCHISYNAPSE_BASE, timeout: int = 10):
        self.api_key = api_key or os.environ.get("ARCHISYNAPSE_API_KEY", "")
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def _headers(self) -> Dict[str, str]:
        h = {"Content-Type": "application/json"}
        if self.api_key:
            h["Authorization"] = f"Bearer {self.api_key}"
        return h

    def _get(self, path: str, params: dict = None) -> Any:
        url = f"{self.base_url}{path}"
        r = requests.get(url, params=params, headers=self._headers(), timeout=self.timeout)
        r.raise_for_status()
        return r.json()

    def _post(self, path: str, json: dict = None) -> Any:
        url = f"{self.base_url}{path}"
        r = requests.post(url, json=json, headers=self._headers(), timeout=self.timeout)
        r.raise_for_status()
        return r.json()

    def _put(self, path: str, json: dict = None) -> Any:
        url = f"{self.base_url}{path}"
        r = requests.put(url, json=json, headers=self._headers(), timeout=self.timeout)
        r.raise_for_status()
        return r.json()

    def _delete(self, path: str) -> Any:
        url = f"{self.base_url}{path}"
        r = requests.delete(url, headers=self._headers(), timeout=self.timeout)
        r.raise_for_status()
        return r.json()

    # -- Health --

    def health(self) -> Dict:
        url = self.base_url.replace("/api/v1", "/health")
        r = requests.get(url, headers=self._headers(), timeout=self.timeout)
        return r.json()

    def ready(self) -> Dict:
        return self._get("/ready")

    # -- Customers --

    def list_customers(self, limit: int = 20, offset: int = 0) -> Dict:
        return self._get("/customers", params={"limit": limit, "offset": offset})

    def get_customer(self, customer_id: str) -> Dict:
        return self._get(f"/customers/{customer_id}")

    def create_customer(self, email: str, name: str, metadata: dict = None) -> Dict:
        return self._post("/customers", json={"email": email, "name": name, "metadata": metadata or {}})

    # -- Transactions --

    def list_transactions(self, limit: int = 20, offset: int = 0, status: str = None) -> Dict:
        params = {"limit": limit, "offset": offset}
        if status:
            params["status"] = status
        return self._get("/transactions", params=params)

    def get_transaction(self, txn_id: str) -> Dict:
        return self._get(f"/transactions/{txn_id}")

    def create_transaction(self, amount: int, currency: str = "USD", description: str = None,
                           customer: dict = None, metadata: dict = None) -> Dict:
        return self._post("/transactions", json={
            "amount": amount, "currency": currency, "description": description,
            "customer": customer, "payment_method": {"type": "card"}, "metadata": metadata or {},
        })

    def refund_transaction(self, txn_id: str, reason: str = None) -> Dict:
        return self._post(f"/transactions/{txn_id}/refunds", json={"reason": reason or "User requested"})

    # -- Payouts --

    def list_payouts(self, limit: int = 20, offset: int = 0, status: str = None) -> Dict:
        params = {"limit": limit, "offset": offset}
        if status:
            params["status"] = status
        return self._get("/payouts", params=params)

    # -- Dashboard --

    def get_metrics(self) -> Dict:
        return self._get("/dashboard")

    # -- Webhooks --

    def send_webhook(self, event_type: str, data: dict = None) -> Dict:
        return self._post("/webhooks", json={"type": event_type, "data": data or {}})

    # -- Blueprint Registry (v0.3 : graph + semantic) --

    def list_blueprints(self, limit: int = 20, offset: int = 0, category: str = None,
                        tags: list = None, complexity: str = None) -> Dict:
        params = {"limit": limit, "offset": offset}
        if category:
            params["category"] = category
        if tags:
            params["tags"] = ",".join(tags)
        if complexity:
            params["complexity"] = complexity
        return self._get("/blueprints", params=params)

    def match_blueprints(self, query: str = None, tags: list = None, category: str = None,
                         complexity: str = None, limit: int = 5) -> Dict:
        params = {"limit": limit}
        if query:
            params["query"] = query
        if tags:
            params["tags"] = ",".join(tags)
        if category:
            params["category"] = category
        if complexity:
            params["complexity"] = complexity
        return self._get("/blueprints/match", params=params)

    def semantic_match_blueprints(self, query: str = None, tags: list = None, category: str = None,
                                  complexity: str = None, limit: int = 5) -> Dict:
        params = {"limit": limit}
        if query:
            params["query"] = query
        if tags:
            params["tags"] = ",".join(tags)
        if category:
            params["category"] = category
        if complexity:
            params["complexity"] = complexity
        return self._get("/blueprints/semantic-match", params=params)

    def get_blueprint(self, blueprint_id: str) -> Dict:
        return self._get(f"/blueprints/{blueprint_id}")

    def get_blueprint_by_slug(self, slug: str) -> Dict:
        return self._get(f"/blueprints/slug/{slug}")

    def get_embedding_info(self) -> Dict:
        return self._get("/blueprints/embedding-info")

    # -- Knowledge Graph (v0.3) --

    def graph_info(self) -> Dict:
        return self._get("/blueprints/graph/info")

    def graph_node(self, blueprint_id: str) -> Dict:
        return self._get(f"/blueprints/graph/node/{blueprint_id}")

    def graph_edges(self, blueprint_id: str) -> Dict:
        return self._get(f"/blueprints/graph/edges/{blueprint_id}")

    def graph_related(self, blueprint_id: str, limit: int = 5, min_confidence: float = 0.3) -> Dict:
        return self._get(f"/blueprints/graph/related/{blueprint_id}",
                         params={"limit": limit, "minConfidence": min_confidence})

    def graph_recommendations(self, seeds: list, limit: int = 5, min_confidence: float = 0.2) -> Dict:
        return self._get("/blueprints/graph/recommendations",
                         params={"seeds": ",".join(seeds), "limit": limit, "minConfidence": min_confidence})

    def graph_bundle(self, blueprint_ids: list, name: str = None, description: str = None) -> Dict:
        params = {"ids": ",".join(blueprint_ids)}
        if name:
            params["name"] = name
        if description:
            params["description"] = description
        return self._get("/blueprints/graph/bundle", params=params)

    def add_graph_edge(self, from_id: str, to_id: str, edge_type: str,
                       confidence: float = 0.8, source: str = "manual") -> Dict:
        return self._post("/blueprints/graph/edges", json={
            "fromId": from_id, "toId": to_id, "type": edge_type,
            "confidence": confidence, "source": source,
        })

    def remove_graph_edge(self, edge_id: str) -> Dict:
        return self._delete(f"/blueprints/graph/edges/{edge_id}")


class ArchisynapsePayments:
    """High-level integration: customers, royalties, subscriptions, blueprint intelligence."""

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.client = ArchisynapseClient(
            api_key=api_key or os.environ.get("ARCHISYNAPSE_API_KEY", ""),
            base_url=base_url or ARCHISYNAPSE_BASE,
        )
        self._customer_cache: Dict[str, str] = {}

    # ------------------------------------------------------------------
    # Blueprint Registry Intelligence
    # ------------------------------------------------------------------
    def semantic_match_blueprints(self, query: str = None, tags: list = None,
                                  category: str = None, complexity: str = None,
                                  limit: int = 5) -> Dict:
        return self.client.semantic_match_blueprints(
            query=query, tags=tags, category=category,
            complexity=complexity, limit=limit,
        )

    def get_blueprint_bundle(self, query: str = None, tags: list = None,
                             category: str = None, complexity: str = None,
                             limit: int = 5) -> Dict:
        return self.client.graph_bundle(
            blueprint_ids=[], name="Pending bundle from query"
        )

    def get_graph_recommendations(self, seed_ids: list, limit: int = 5) -> Dict:
        return self.client.graph_recommendations(seeds=seed_ids, limit=limit)

    def get_graph_info(self) -> Dict:
        return self.client.graph_info()

    # ------------------------------------------------------------------
    # Customers
    # ------------------------------------------------------------------
    def ensure_customer(self, handle: str, email: str) -> str:
        cached = self._customer_cache.get(handle)
        if cached:
            return cached
        try:
            existing = self.client.list_customers(limit=100)
            for c in existing.get("data", []):
                if c.get("email") == email:
                    self._customer_cache[handle] = c["id"]
                    return c["id"]
        except Exception:
            pass
        customer = self.client.create_customer(
            email=email,
            name=handle,
            metadata={"source": "lyrica3_pro", "handle": handle},
        )
        self._customer_cache[handle] = customer["id"]
        return customer["id"]

    # ------------------------------------------------------------------
    # Transactions
    # ------------------------------------------------------------------
    def charge_for_generation(
        self, user_handle: str, user_email: str, amount_cents: int,
        track_title: str, currency: str = "USD",
    ) -> Dict:
        customer_id = self.ensure_customer(user_handle, user_email)
        txn = self.client.create_transaction(
            amount=amount_cents,
            currency=currency,
            description=f"Track generation: {track_title}",
            customer={"id": customer_id, "email": user_email},
            metadata={"source": "lyrica3_pro", "track_title": track_title, "user_handle": user_handle},
        )
        return txn

    def charge_subscription(self, user_handle: str, user_email: str,
                            plan: str, amount_cents: int) -> Dict:
        customer_id = self.ensure_customer(user_handle, user_email)
        return self.client.create_transaction(
            amount=amount_cents,
            currency="USD",
            description=f"Lyrica3 Pro - {plan} plan",
            customer={"id": customer_id, "email": user_email},
            metadata={"source": "lyrica3_pro", "plan": plan, "type": "subscription", "user_handle": user_handle},
        )

    def refund_generation(self, transaction_id: str, reason: str = "User requested") -> Dict:
        return self.client.refund_transaction(transaction_id, reason=reason)

    # ------------------------------------------------------------------
    # Royalty Payouts
    # ------------------------------------------------------------------
    def distribute_royalties(
        self, source_transaction_id: str, stakeholders: Dict[str, str],
        royalty_split: Optional[Dict[str, float]] = None,
        total_amount_cents: Optional[int] = None,
    ) -> List[Dict]:
        txn = self.client.get_transaction(source_transaction_id)
        total = total_amount_cents or txn["amount"]
        split = royalty_split or DEFAULT_ROYALTY_SPLIT

        total_pct = sum(split.get(r, 0) for r in stakeholders)
        if not (99.8 <= total_pct <= 100.2):
            logger.warning("Royalty split sums to %.1f%% (expected ~100%%)", total_pct)

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
            results.append({"role": role, "handle": handle, "percentage": pct, "amount_cents": amount})

        return results

    # ------------------------------------------------------------------
    # Webhooks
    # ------------------------------------------------------------------
    def notify_track_created(self, track_id: str, creator: str, title: str) -> Dict:
        return self.client.send_webhook("track.created", {"track_id": track_id, "creator": creator, "title": title})

    def notify_royalty_distributed(self, track_id: str, total_cents: int, stakeholder_count: int) -> Dict:
        return self.client.send_webhook("royalty.distributed", {
            "track_id": track_id, "total_cents": total_cents, "stakeholder_count": stakeholder_count,
        })

    # ------------------------------------------------------------------
    # Dashboard & Health
    # ------------------------------------------------------------------
    def get_metrics(self) -> Dict:
        return self.client.get_metrics()

    def health_check(self) -> Dict:
        return self.client.health()
