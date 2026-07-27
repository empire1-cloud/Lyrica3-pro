"""Approval-gated advertising connectors for Lyrica paid growth.

The connectors can create real provider objects when credentials and the global
execution flag are configured. New campaigns are created paused/disabled.
Activation is a separate, explicit operation.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any, Mapping
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


class ProviderRequestError(RuntimeError):
    pass


@dataclass(frozen=True)
class ConnectorState:
    provider: str
    credentials_ready: bool
    creation_enabled: bool
    activation_enabled: bool


def _truthy(value: str | None) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "yes", "on"}


def paid_execution_enabled() -> bool:
    return _truthy(os.getenv("PAID_GROWTH_EXECUTION_ENABLED"))


def paid_activation_enabled() -> bool:
    return paid_execution_enabled() and _truthy(os.getenv("PAID_GROWTH_ACTIVATION_ENABLED"))


def _json_request(
    url: str,
    *,
    method: str = "POST",
    headers: Mapping[str, str] | None = None,
    payload: Mapping[str, Any] | None = None,
    timeout_seconds: int = 30,
) -> dict[str, Any]:
    data = None if payload is None else json.dumps(dict(payload)).encode("utf-8")
    request_headers = {"Content-Type": "application/json", **dict(headers or {})}
    request = Request(url, data=data, headers=request_headers, method=method)
    try:
        with urlopen(request, timeout=timeout_seconds) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw or "{}")
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise ProviderRequestError(f"Provider HTTP {exc.code}: {detail[:1000]}") from exc
    except URLError as exc:
        raise ProviderRequestError(f"Provider connection failed: {exc.reason}") from exc
    except json.JSONDecodeError as exc:
        raise ProviderRequestError("Provider returned invalid JSON.") from exc


class TikTokAdsConnector:
    def __init__(self) -> None:
        self.access_token = os.getenv("TIKTOK_ACCESS_TOKEN", "").strip()
        self.advertiser_id = os.getenv("TIKTOK_ADVERTISER_ID", "").strip()
        self.pixel_code = os.getenv("TIKTOK_PIXEL_CODE", "").strip()
        self.base_url = os.getenv(
            "TIKTOK_BUSINESS_API_BASE_URL",
            "https://business-api.tiktok.com/open_api/v1.3",
        ).rstrip("/")

    @property
    def state(self) -> ConnectorState:
        ready = bool(self.access_token and self.advertiser_id)
        return ConnectorState(
            provider="tiktok",
            credentials_ready=ready,
            creation_enabled=ready and paid_execution_enabled(),
            activation_enabled=ready and paid_activation_enabled(),
        )

    def _post(self, endpoint: str, payload: Mapping[str, Any]) -> dict[str, Any]:
        if not self.state.creation_enabled:
            raise ProviderRequestError("TikTok execution is not enabled or credentials are missing.")
        body = {"advertiser_id": self.advertiser_id, **dict(payload)}
        return _json_request(
            f"{self.base_url}/{endpoint.lstrip('/')}",
            headers={"Access-Token": self.access_token},
            payload=body,
        )

    def create_disabled_campaign(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        body = {**dict(payload), "operation_status": "DISABLE"}
        return self._post("campaign/create/", body)

    def create_disabled_adgroup(self, campaign_id: str, payload: Mapping[str, Any]) -> dict[str, Any]:
        body = {
            **dict(payload),
            "campaign_id": campaign_id,
            "operation_status": "DISABLE",
        }
        return self._post("adgroup/create/", body)

    def create_disabled_ad(self, adgroup_id: str, payload: Mapping[str, Any]) -> dict[str, Any]:
        body = {
            **dict(payload),
            "adgroup_id": adgroup_id,
            "operation_status": "DISABLE",
        }
        return self._post("ad/create/", body)

    def activate_campaign(self, campaign_id: str) -> dict[str, Any]:
        if not self.state.activation_enabled:
            raise ProviderRequestError("TikTok activation is disabled. Explicitly enable paid activation first.")
        return self._post(
            "campaign/status/update/",
            {"campaign_ids": [campaign_id], "operation_status": "ENABLE"},
        )

    def report_event(self, event: Mapping[str, Any]) -> dict[str, Any]:
        if not self.pixel_code:
            raise ProviderRequestError("TIKTOK_PIXEL_CODE is required for Events API reporting.")
        body = dict(event)
        body.setdefault("pixel_code", self.pixel_code)
        return self._post("event/track/", {"event_source": "WEB", "data": [body]})

    def integrated_report(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        return self._post("report/integrated/get/", payload)


class MetaAdsConnector:
    """Meta connector with an operator-supplied Graph API version.

    No API version is guessed. META_GRAPH_API_VERSION must be explicitly set so
    upgrades remain controlled and reviewable.
    """

    def __init__(self) -> None:
        self.access_token = os.getenv("META_ACCESS_TOKEN", "").strip()
        self.ad_account_id = os.getenv("META_AD_ACCOUNT_ID", "").strip().removeprefix("act_")
        self.pixel_id = os.getenv("META_PIXEL_ID", "").strip()
        self.api_version = os.getenv("META_GRAPH_API_VERSION", "").strip().lstrip("v")
        self.base_host = os.getenv("META_GRAPH_HOST", "https://graph.facebook.com").rstrip("/")

    @property
    def base_url(self) -> str:
        return f"{self.base_host}/v{self.api_version}" if self.api_version else ""

    @property
    def state(self) -> ConnectorState:
        ready = bool(self.access_token and self.ad_account_id and self.api_version)
        return ConnectorState(
            provider="meta",
            credentials_ready=ready,
            creation_enabled=ready and paid_execution_enabled(),
            activation_enabled=ready and paid_activation_enabled(),
        )

    def _post_form(self, path: str, payload: Mapping[str, Any]) -> dict[str, Any]:
        if not self.state.creation_enabled:
            raise ProviderRequestError("Meta execution is not enabled or credentials are missing.")
        body = {**dict(payload), "access_token": self.access_token}
        data = urlencode(
            {
                key: json.dumps(value) if isinstance(value, (dict, list, bool)) else str(value)
                for key, value in body.items()
                if value is not None
            }
        ).encode("utf-8")
        request = Request(
            f"{self.base_url}/{path.lstrip('/')}",
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST",
        )
        try:
            with urlopen(request, timeout=30) as response:
                return json.loads(response.read().decode("utf-8") or "{}")
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise ProviderRequestError(f"Meta HTTP {exc.code}: {detail[:1000]}") from exc
        except URLError as exc:
            raise ProviderRequestError(f"Meta connection failed: {exc.reason}") from exc

    def create_paused_campaign(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        body = {**dict(payload), "status": "PAUSED"}
        return self._post_form(f"act_{self.ad_account_id}/campaigns", body)

    def create_paused_adset(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        body = {**dict(payload), "status": "PAUSED"}
        return self._post_form(f"act_{self.ad_account_id}/adsets", body)

    def create_paused_ad(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        body = {**dict(payload), "status": "PAUSED"}
        return self._post_form(f"act_{self.ad_account_id}/ads", body)

    def activate_campaign(self, campaign_id: str) -> dict[str, Any]:
        if not self.state.activation_enabled:
            raise ProviderRequestError("Meta activation is disabled. Explicitly enable paid activation first.")
        return self._post_form(campaign_id, {"status": "ACTIVE"})

    def report_event(self, events: list[Mapping[str, Any]]) -> dict[str, Any]:
        if not self.pixel_id:
            raise ProviderRequestError("META_PIXEL_ID is required for server-side conversion events.")
        return self._post_form(f"{self.pixel_id}/events", {"data": list(events)})


def connector_states() -> list[dict[str, Any]]:
    return [
        TikTokAdsConnector().state.__dict__,
        MetaAdsConnector().state.__dict__,
        {
            "provider": "spotify_manual",
            "credentials_ready": False,
            "creation_enabled": False,
            "activation_enabled": False,
            "mode": "operator_handoff",
        },
    ]
