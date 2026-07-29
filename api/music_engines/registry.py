from __future__ import annotations

import copy
import json
from functools import lru_cache
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parents[2]
REGISTRY_PATH = ROOT_DIR / "canon" / "lyrica" / "music_engine_registry_v1.json"


@lru_cache(maxsize=1)
def _load_registry_cached() -> dict[str, Any]:
    try:
        registry = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError("Lyrica music-engine registry is unavailable or invalid.") from exc

    if registry.get("schema_version") != "1.0":
        raise RuntimeError("Unsupported Lyrica music-engine registry schema.")
    providers = registry.get("providers")
    if not isinstance(providers, dict) or not providers:
        raise RuntimeError("Lyrica music-engine registry has no providers.")

    required = {
        "display_name",
        "role",
        "license",
        "source_repository",
        "endpoint_env",
        "token_env",
        "priority",
        "capabilities",
        "constraints",
    }
    for provider_id, provider in providers.items():
        if not isinstance(provider, dict):
            raise RuntimeError(f"Provider {provider_id} is invalid.")
        missing = sorted(required.difference(provider))
        if missing:
            raise RuntimeError(f"Provider {provider_id} is missing: {', '.join(missing)}")
        if not isinstance(provider["capabilities"], list):
            raise RuntimeError(f"Provider {provider_id} capabilities must be a list.")
    return registry


def load_registry() -> dict[str, Any]:
    return copy.deepcopy(_load_registry_cached())


def provider_registry() -> dict[str, dict[str, Any]]:
    return load_registry()["providers"]


def provider(provider_id: str) -> dict[str, Any]:
    providers = provider_registry()
    if provider_id not in providers:
        raise KeyError(f"Unknown music engine provider: {provider_id}")
    return providers[provider_id]


def providers_with_capability(capability: str) -> list[str]:
    providers = provider_registry()
    matches = [
        provider_id
        for provider_id, spec in providers.items()
        if capability in spec.get("capabilities", [])
    ]
    return sorted(matches, key=lambda value: int(providers[value]["priority"]), reverse=True)
