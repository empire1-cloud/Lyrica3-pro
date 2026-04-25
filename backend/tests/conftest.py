"""Pytest fixtures — set defaults so import-time env reads in test modules work."""
import os

# Integration tests expect a live API; local/CI runs default to a typical dev URL.
os.environ.setdefault("REACT_APP_BACKEND_URL", "http://127.0.0.1:8000")
