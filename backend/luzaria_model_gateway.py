"""Provider-independent model gateway for LUZARIA cognition.

The default state is disabled. Production may point this gateway at a local or
Empire-1-approved self-hosted model endpoint. Google, Gemini, and Vertex targets
are rejected to preserve the explicit Lyrica provider boundary.
"""

from __future__ import annotations

from dataclasses import dataclass
import json
import os
from typing import Any, Mapping, Sequence
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


FORBIDDEN_PROVIDER_MARKERS = {
    "googleapis",
    "generativelanguage",
    "aiplatform",
    "vertex",
    "gemini",
}


@dataclass(frozen=True)
class ModelGatewayConfig:
    endpoint: str
    model: str
    api_key: str = ""
    mode: str = "local_or_self_hosted"
    timeout_seconds: int = 45

    @property
    def enabled(self) -> bool:
        return bool(self.endpoint.strip() and self.model.strip())


def load_model_gateway_config() -> ModelGatewayConfig:
    return ModelGatewayConfig(
        endpoint=os.environ.get("LUZARIA_LLM_ENDPOINT", "").strip(),
        model=os.environ.get("LUZARIA_LLM_MODEL", "").strip(),
        api_key=os.environ.get("LUZARIA_LLM_API_KEY", "").strip(),
        mode=os.environ.get("LUZARIA_LLM_MODE", "local_or_self_hosted").strip(),
        timeout_seconds=int(os.environ.get("LUZARIA_LLM_TIMEOUT_SECONDS", "45")),
    )


def validate_model_gateway_config(config: ModelGatewayConfig) -> None:
    if not config.enabled:
        raise ValueError("LUZARIA model gateway is not configured.")
    parsed = urlparse(config.endpoint)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("LUZARIA_LLM_ENDPOINT must be an HTTP(S) endpoint.")

    searchable = f"{config.endpoint} {config.model}".lower()
    if any(marker in searchable for marker in FORBIDDEN_PROVIDER_MARKERS):
        raise ValueError("Google, Gemini, and Vertex model targets are prohibited for Lyrica.")
    if config.mode not in {"local", "self_hosted", "approved_external", "local_or_self_hosted"}:
        raise ValueError("Unsupported LUZARIA_LLM_MODE.")
    if config.timeout_seconds < 1 or config.timeout_seconds > 180:
        raise ValueError("Model timeout must be between 1 and 180 seconds.")


def model_gateway_status(config: ModelGatewayConfig | None = None) -> dict[str, Any]:
    config = config or load_model_gateway_config()
    try:
        validate_model_gateway_config(config)
        valid = True
        error = None
    except ValueError as exc:
        valid = False
        error = str(exc)
    return {
        "configured": config.enabled,
        "valid": valid,
        "mode": config.mode,
        "model": config.model or None,
        "endpoint_host": urlparse(config.endpoint).netloc or None,
        "api_key_present": bool(config.api_key),
        "google_gemini_vertex_allowed": False,
        "error": error,
    }


def _extract_text(response: Mapping[str, Any]) -> str:
    choices = response.get("choices")
    if isinstance(choices, list) and choices:
        first = choices[0] if isinstance(choices[0], Mapping) else {}
        message = first.get("message") if isinstance(first, Mapping) else None
        if isinstance(message, Mapping) and message.get("content"):
            return str(message["content"]).strip()
        if first.get("text"):
            return str(first["text"]).strip()

    message = response.get("message")
    if isinstance(message, Mapping) and message.get("content"):
        return str(message["content"]).strip()
    if response.get("response"):
        return str(response["response"]).strip()
    if response.get("content"):
        return str(response["content"]).strip()
    raise RuntimeError("Configured model endpoint returned no recognized text content.")


def generate_model_response(
    messages: Sequence[Mapping[str, str]],
    *,
    config: ModelGatewayConfig | None = None,
    temperature: float = 0.65,
    max_tokens: int = 900,
) -> dict[str, Any]:
    config = config or load_model_gateway_config()
    validate_model_gateway_config(config)
    if not messages:
        raise ValueError("At least one model message is required.")
    temperature = max(0.0, min(1.5, float(temperature)))
    max_tokens = max(64, min(4096, int(max_tokens)))

    payload = {
        "model": config.model,
        "messages": [dict(message) for message in messages],
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if config.api_key:
        headers["Authorization"] = f"Bearer {config.api_key}"

    request = Request(
        config.endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    try:
        with urlopen(request, timeout=config.timeout_seconds) as response:
            raw = response.read().decode("utf-8")
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"LUZARIA model endpoint rejected the request ({exc.code}): {detail}") from exc
    except URLError as exc:
        raise RuntimeError(f"LUZARIA model endpoint is unreachable: {exc.reason}") from exc

    try:
        decoded = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError("LUZARIA model endpoint returned invalid JSON.") from exc

    return {
        "text": _extract_text(decoded),
        "model": config.model,
        "mode": config.mode,
        "provider_endpoint": urlparse(config.endpoint).netloc,
        "raw_usage": decoded.get("usage") if isinstance(decoded, Mapping) else None,
    }
