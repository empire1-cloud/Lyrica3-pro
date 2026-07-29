from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any


class ProviderAdapterError(RuntimeError):
    pass


def _post_json(url: str, payload: dict[str, Any], token: str, timeout_seconds: int = 30) -> dict[str, Any]:
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    headers = {
        "content-type": "application/json",
        "accept": "application/json",
        "x-empire1-service": "lyrica3",
    }
    if token:
        headers["authorization"] = f"Bearer {token}"
    request = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            raw = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:2000]
        raise ProviderAdapterError(f"provider returned HTTP {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise ProviderAdapterError(f"provider connection failed: {exc.reason}") from exc
    try:
        value = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ProviderAdapterError("provider returned invalid JSON") from exc
    if not isinstance(value, dict):
        raise ProviderAdapterError("provider response must be a JSON object")
    return value


def _ace_step_native_payload(payload: dict[str, Any]) -> dict[str, Any]:
    language_tags = payload.get("language_tags") or []
    vocal_language = language_tags[0] if language_tags else "en"
    return {
        "prompt": payload.get("caption", ""),
        "lyrics": payload.get("lyrics", ""),
        "audio_duration": payload.get("duration"),
        "bpm": payload.get("bpm"),
        "key_scale": payload.get("key_scale") or "",
        "time_signature": payload.get("time_signature") or "",
        "vocal_language": vocal_language,
        "thinking": True,
        "use_format": False,
        "audio_format": "wav",
        "user_metadata": {
            "title": payload.get("title"),
            "artist_id": payload.get("artist_id"),
            "artist_name": payload.get("artist_name"),
            "voice_identity_ref": payload.get("voice_identity_ref"),
            "consent_assertion_id": payload.get("consent_assertion_id"),
            "lyrica_metadata": payload.get("lyrica_metadata", {}),
        },
    }


def submit_ace_step(endpoint: str, token: str, payload: dict[str, Any]) -> dict[str, Any]:
    response = _post_json(
        f"{endpoint.rstrip('/')}/release_task",
        _ace_step_native_payload(payload),
        token,
    )
    if response.get("code") != 200:
        raise ProviderAdapterError(str(response.get("error") or "ACE-Step rejected the task"))
    data = response.get("data")
    if not isinstance(data, dict) or not data.get("task_id"):
        raise ProviderAdapterError("ACE-Step response did not include a task_id")
    return {
        "provider_job_id": str(data["task_id"]),
        "provider_status": str(data.get("status") or "queued"),
        "native_endpoint": "/release_task",
        "raw": response,
    }


def submit_standard_sidecar(
    provider_id: str,
    endpoint: str,
    token: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    response = _post_json(f"{endpoint.rstrip('/')}/v1/jobs", payload, token)
    provider_job_id = response.get("job_id") or response.get("task_id")
    if not provider_job_id:
        raise ProviderAdapterError(f"{provider_id} sidecar did not return a job_id")
    return {
        "provider_job_id": str(provider_job_id),
        "provider_status": str(response.get("status") or "queued"),
        "native_endpoint": "/v1/jobs",
        "raw": response,
    }


def submit_provider(
    provider_id: str,
    endpoint: str,
    token: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    if provider_id == "ace_step_1_5":
        return submit_ace_step(endpoint, token, payload)
    return submit_standard_sidecar(provider_id, endpoint, token, payload)
