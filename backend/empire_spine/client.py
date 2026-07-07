"""
Resilient ArchiSynapse client for the Empire Spine.

Fixes the failure modes of the plain `requests` client in
`archisynapse_integration.py` for WRITE paths:

- Retries with exponential backoff + jitter on 429/5xx/connection errors
- Idempotency-Key header on every write (safe retries, no double charges)
- Event signature already embedded by events.sign_event()
- Explicit SpineDeliveryError so the outbox can park failures instead of
  losing them

Uses `requests` (already a Lyrica3 dependency). Timeouts are split
(connect, read) so a hung socket can't stall a relay worker.
"""

from __future__ import annotations

import logging
import os
import random
import time
from typing import Any, Dict, Optional

import requests

logger = logging.getLogger("lyrica3.empire_spine.client")

DEFAULT_BASE = os.environ.get(
    "ARCHISYNAPSE_BASE_URL",
    "https://archisynapse-production.up.railway.app/api/v1",
)

RETRYABLE_STATUS = {429, 500, 502, 503, 504}


class SpineDeliveryError(RuntimeError):
    """Raised when delivery failed after all retries. Outbox keeps the event."""

    def __init__(self, message: str, status_code: Optional[int] = None, retryable: bool = True):
        super().__init__(message)
        self.status_code = status_code
        self.retryable = retryable


class SpineClient:
    def __init__(
        self,
        api_key: str = "",
        base_url: str = DEFAULT_BASE,
        max_attempts: int = 5,
        connect_timeout: float = 5.0,
        read_timeout: float = 15.0,
        backoff_base: float = 0.5,
        backoff_cap: float = 20.0,
    ):
        self.api_key = api_key or os.environ.get("ARCHISYNAPSE_API_KEY", "")
        self.base_url = base_url.rstrip("/")
        self.max_attempts = max_attempts
        self.timeout = (connect_timeout, read_timeout)
        self.backoff_base = backoff_base
        self.backoff_cap = backoff_cap
        self.session = requests.Session()

    def _headers(self, idempotency_key: Optional[str] = None) -> Dict[str, str]:
        h = {"Content-Type": "application/json"}
        if self.api_key:
            h["Authorization"] = f"Bearer {self.api_key}"
        if idempotency_key:
            h["Idempotency-Key"] = idempotency_key
        return h

    def _sleep(self, attempt: int) -> None:
        delay = min(self.backoff_cap, self.backoff_base * (2 ** attempt))
        time.sleep(delay + random.uniform(0, delay * 0.25))  # jitter

    def post(self, path: str, json_body: Dict[str, Any], idempotency_key: Optional[str] = None) -> Any:
        """POST with retries. `idempotency_key` makes retries safe on writes."""
        url = f"{self.base_url}{path}"
        last_err: Optional[str] = None
        last_status: Optional[int] = None

        for attempt in range(self.max_attempts):
            try:
                r = self.session.post(
                    url, json=json_body,
                    headers=self._headers(idempotency_key),
                    timeout=self.timeout,
                )
            except requests.RequestException as exc:
                last_err = f"connection error: {exc}"
                logger.warning("spine POST %s attempt %d/%d failed: %s",
                               path, attempt + 1, self.max_attempts, last_err)
                self._sleep(attempt)
                continue

            if r.status_code in RETRYABLE_STATUS:
                last_err, last_status = f"HTTP {r.status_code}: {r.text[:200]}", r.status_code
                retry_after = r.headers.get("Retry-After")
                if retry_after and retry_after.isdigit():
                    time.sleep(min(float(retry_after), self.backoff_cap))
                else:
                    self._sleep(attempt)
                continue

            if r.status_code >= 400:
                # Non-retryable client error — schema/auth problem. Don't hammer.
                raise SpineDeliveryError(
                    f"POST {path} rejected: HTTP {r.status_code}: {r.text[:500]}",
                    status_code=r.status_code, retryable=False,
                )

            return r.json() if r.content else {}

        raise SpineDeliveryError(
            f"POST {path} failed after {self.max_attempts} attempts: {last_err}",
            status_code=last_status, retryable=True,
        )

    # ------------------------------------------------------------------
    # Trust-plane write operations
    # ------------------------------------------------------------------

    def deliver_event(self, event: Dict[str, Any]) -> Any:
        """Deliver a signed spine event. event_id doubles as Idempotency-Key."""
        return self.post("/events", event, idempotency_key=event["event_id"])

    def create_transaction(self, body: Dict[str, Any], idempotency_key: str) -> Any:
        return self.post("/transactions", body, idempotency_key=idempotency_key)

    def request_payout(self, body: Dict[str, Any], idempotency_key: str) -> Any:
        return self.post("/payouts", body, idempotency_key=idempotency_key)

    def health(self) -> Any:
        url = self.base_url.replace("/api/v1", "/health")
        r = self.session.get(url, timeout=self.timeout)
        return r.json()
