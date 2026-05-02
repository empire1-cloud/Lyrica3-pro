"""Pytest fixtures — set API base *before* test modules import (they read os.environ at load time)."""
import os


def _ensure_react_app_backend_url() -> None:
    """Test modules use REACT_APP_BACKEND_URL; also accept common CI/secret names."""
    if (os.environ.get("REACT_APP_BACKEND_URL") or "").strip():
        return
    for key in ("BACKEND_URL", "API_BASE_URL", "LYRICA_API_URL"):
        v = (os.environ.get(key) or "").strip()
        if v:
            os.environ["REACT_APP_BACKEND_URL"] = v.rstrip("/")
            return
    # Local uvicorn default; for cloud, set REACT_APP_BACKEND_URL to your API origin (e.g. https://...).
    os.environ["REACT_APP_BACKEND_URL"] = "http://127.0.0.1:8000"


_ensure_react_app_backend_url()
