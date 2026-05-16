#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/workspaces/Lyrica3-pro"
BACKEND_ENV="$ROOT_DIR/backend/.env"
BACKEND_VENV="$ROOT_DIR/backend/.venv"
export ROOT_DIR

cd "$ROOT_DIR"

if [ ! -f "$BACKEND_ENV" ]; then
  cp "$ROOT_DIR/backend/.env.example" "$BACKEND_ENV"
fi

python3 - <<'PY'
import os
from pathlib import Path

root_dir = Path(os.environ["ROOT_DIR"])
backend_env = root_dir / "backend/.env"
backend_text = backend_env.read_text()
backend_text = backend_text.replace(
    "MONGO_URL=mongodb://localhost:27017",
    "MONGO_URL=mongodb://mongo:27017",
)
backend_env.write_text(backend_text)

frontend_env = root_dir / "frontend/.env.local"
if not frontend_env.exists():
    frontend_env.write_text("REACT_APP_BACKEND_URL=http://localhost:8001\n")
PY

if [ ! -d "$BACKEND_VENV" ]; then
  python3 -m venv "$BACKEND_VENV"
fi

. "$BACKEND_VENV/bin/activate"
pip install --upgrade pip
pip install -r "$ROOT_DIR/backend/requirements.txt"

cd "$ROOT_DIR/frontend"
# The repo currently has a known dependency engine mismatch in frontend deps; keep install aligned with existing local workflow.
yarn install --ignore-engines
