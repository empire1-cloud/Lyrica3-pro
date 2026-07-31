#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="${LYRICA_STUDIO_ROOT:-$HOME/LyricaStudio}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODELS="$ROOT/models"
WEIGHTS="$ROOT/weights"
AUDIO_ROOT="$ROOT/audio"
CONFIG_DIR="$ROOT/config"
SEED_DIR="$MODELS/seed-vc"
OPENVOICE_DIR="$MODELS/OpenVoice"
WORKER_VENV="$ROOT/worker-venv"
SEED_REF="${SEED_VC_REF:-51383efd921027683c89e5348211d93ff12ac2a8}"
OPENVOICE_REF="${OPENVOICE_REF:-74a1d147b17a8c3092dd5430504bd83ef6c7eb23}"
SEED_MODEL_REVISION="${SEED_MODEL_REVISION:-609dd03a0312184629d90659f56d72b3132fb696}"
OPENVOICE_MODEL_REVISION="${OPENVOICE_MODEL_REVISION:-fd981100305a0e4291f93a9ad169c6d9f7bed54a}"
SEED_CHECKPOINT="DiT_seed_v2_uvit_whisper_base_f0_44k_bigvgan_pruned_ft_ema_v2.pth"
SEED_CHECKPOINT_SHA256="42aef93ffe65857c840d270252fa040f7ba04514945ec460f3ac1ac2a96de684"
OPENVOICE_CONVERTER_SHA256="9652c27e92b6b2a91632590ac9962ef7ae2b712e5c5b7f4c34ec55ee2b37ab9e"

log() { printf '\n[lyrica-neural] %s\n' "$*"; }
fail() { printf '\n[lyrica-neural] ERROR: %s\n' "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"; }

need git
need ffmpeg
need openssl
need curl
need sha256sum
need systemctl

PY310="${PYTHON310:-$(command -v python3.10 || true)}"
PY39="${PYTHON39:-$(command -v python3.9 || true)}"
[[ -n "$PY310" ]] || fail "Python 3.10 is required for Seed-VC. Set PYTHON310=/path/to/python3.10."
[[ -n "$PY39" ]] || fail "Python 3.9 is required for OpenVoice V2. Set PYTHON39=/path/to/python3.9."

mkdir -p "$MODELS" "$WEIGHTS/seed-vc" "$AUDIO_ROOT/neural-assets" "$AUDIO_ROOT/neural-results" "$CONFIG_DIR"

git_clone_or_update() {
  local url="$1" dir="$2" ref="$3"
  if [[ -d "$dir/.git" ]]; then
    log "Updating $(basename "$dir")"
    git -C "$dir" fetch --tags origin
  else
    log "Cloning $url"
    git clone "$url" "$dir"
  fi
  git -C "$dir" checkout --detach "$ref"
}

git_clone_or_update https://github.com/Plachtaa/seed-vc.git "$SEED_DIR" "$SEED_REF"
git_clone_or_update https://github.com/myshell-ai/OpenVoice.git "$OPENVOICE_DIR" "$OPENVOICE_REF"

log "Creating Seed-VC environment"
"$PY310" -m venv "$SEED_DIR/.venv"
"$SEED_DIR/.venv/bin/python" -m pip install --upgrade pip wheel setuptools
"$SEED_DIR/.venv/bin/python" -m pip install -r "$SEED_DIR/requirements.txt"
"$SEED_DIR/.venv/bin/python" -m pip install "huggingface_hub>=0.25,<1" "demucs>=4,<5"

log "Downloading the official Seed-VC singing checkpoint"
SEED_WEIGHTS="$WEIGHTS/seed-vc"
SEED_MODEL_REVISION="$SEED_MODEL_REVISION" SEED_WEIGHTS="$SEED_WEIGHTS" \
  "$SEED_DIR/.venv/bin/python" - <<'PY'
import os
from huggingface_hub import snapshot_download
snapshot_download(
    repo_id="Plachta/Seed-VC",
    revision=os.environ["SEED_MODEL_REVISION"],
    allow_patterns=[
        "DiT_seed_v2_uvit_whisper_base_f0_44k_bigvgan_pruned_ft_ema_v2.pth",
        "config_dit_mel_seed_uvit_whisper_base_f0_44k.yml",
        "*.yml",
        "*.pt",
    ],
    local_dir=os.environ["SEED_WEIGHTS"],
)
PY

seed_actual="$(sha256sum "$SEED_WEIGHTS/$SEED_CHECKPOINT" | awk '{print $1}')"
[[ "$seed_actual" == "$SEED_CHECKPOINT_SHA256" ]] || \
  fail "Seed-VC checkpoint hash mismatch: $seed_actual"

log "Creating OpenVoice V2 environment"
"$PY39" -m venv "$OPENVOICE_DIR/.venv"
"$OPENVOICE_DIR/.venv/bin/python" -m pip install --upgrade pip wheel setuptools
"$OPENVOICE_DIR/.venv/bin/python" -m pip install -e "$OPENVOICE_DIR"
"$OPENVOICE_DIR/.venv/bin/python" -m pip install \
  "git+https://github.com/myshell-ai/MeloTTS.git@209145371cff8fc3bd60d7be902ea69cbdb7965a" \
  "huggingface_hub>=0.25,<1"
"$OPENVOICE_DIR/.venv/bin/python" -m unidic download

log "Downloading official OpenVoice V2 weights"
OPENVOICE_MODEL_REVISION="$OPENVOICE_MODEL_REVISION" OPENVOICE_DIR="$OPENVOICE_DIR" \
  "$OPENVOICE_DIR/.venv/bin/python" - <<'PY'
import os
from huggingface_hub import snapshot_download
snapshot_download(
    repo_id="myshell-ai/OpenVoiceV2",
    revision=os.environ["OPENVOICE_MODEL_REVISION"],
    local_dir=os.path.join(os.environ["OPENVOICE_DIR"], "checkpoints_v2"),
)
PY

openvoice_actual="$(sha256sum "$OPENVOICE_DIR/checkpoints_v2/converter/checkpoint.pth" | awk '{print $1}')"
[[ "$openvoice_actual" == "$OPENVOICE_CONVERTER_SHA256" ]] || \
  fail "OpenVoice V2 converter hash mismatch: $openvoice_actual"

log "Creating Lyrica worker service environment"
"$PY310" -m venv "$WORKER_VENV"
"$WORKER_VENV/bin/python" -m pip install --upgrade pip wheel setuptools
"$WORKER_VENV/bin/python" -m pip install -r "$REPO_ROOT/workers/ubuntu_studio/requirements.txt"

TOKEN="${LYRICA_AUDIO_WORKER_TOKEN:-$(openssl rand -hex 32)}"
DEVICE="cpu"
if command -v nvidia-smi >/dev/null 2>&1 && nvidia-smi >/dev/null 2>&1; then
  DEVICE="cuda"
fi

cat > "$CONFIG_DIR/audio-worker.env" <<EOF
LYRICA_AUDIO_WORKER_TOKEN=$TOKEN
LYRICA_AUDIO_ROOT=$AUDIO_ROOT
LYRICA_AUDIO_DEVICE=$DEVICE
SEED_VC_DIR=$SEED_DIR
SEED_VC_PYTHON=$SEED_DIR/.venv/bin/python
SEED_VC_CHECKPOINT=$SEED_WEIGHTS/$SEED_CHECKPOINT
SEED_VC_CONFIG=$SEED_WEIGHTS/config_dit_mel_seed_uvit_whisper_base_f0_44k.yml
OPENVOICE_DIR=$OPENVOICE_DIR
OPENVOICE_PYTHON=$OPENVOICE_DIR/.venv/bin/python
DEMUCS_PYTHON=$SEED_DIR/.venv/bin/python
EOF
chmod 600 "$CONFIG_DIR/audio-worker.env"

cat > "$CONFIG_DIR/lyrica-client.env" <<EOF
VOCAL_FORGE_ARTIFACT_DIR=$AUDIO_ROOT
LYRICA_AUDIO_WORKER_URL=http://127.0.0.1:8787
LYRICA_AUDIO_WORKER_TOKEN=$TOKEN
EOF
chmod 600 "$CONFIG_DIR/lyrica-client.env"

mkdir -p "$HOME/.config/systemd/user"
cat > "$HOME/.config/systemd/user/lyrica-audio-worker.service" <<EOF
[Unit]
Description=Lyrica Ubuntu Studio Neural Audio Worker
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$REPO_ROOT
EnvironmentFile=$CONFIG_DIR/audio-worker.env
ExecStart=$WORKER_VENV/bin/python -m uvicorn workers.ubuntu_studio.app:app --host 127.0.0.1 --port 8787
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=default.target
EOF

cat > "$CONFIG_DIR/installed-models.json" <<EOF
{
  "installed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "seed_vc": {
    "code_repository": "https://github.com/Plachtaa/seed-vc",
    "code_commit": "$(git -C "$SEED_DIR" rev-parse HEAD)",
    "license": "GPL-3.0 external worker",
    "weights_repository": "https://huggingface.co/Plachta/Seed-VC",
    "weights_revision": "$SEED_MODEL_REVISION",
    "checkpoint_sha256": "$seed_actual"
  },
  "openvoice_v2": {
    "code_repository": "https://github.com/myshell-ai/OpenVoice",
    "code_commit": "$(git -C "$OPENVOICE_DIR" rev-parse HEAD)",
    "license": "MIT",
    "weights_repository": "https://huggingface.co/myshell-ai/OpenVoiceV2",
    "weights_revision": "$OPENVOICE_MODEL_REVISION",
    "checkpoint_sha256": "$openvoice_actual"
  },
  "demucs": {
    "package": "demucs",
    "license": "MIT",
    "model": "htdemucs"
  }
}
EOF

log "Enabling the local worker"
systemctl --user daemon-reload
systemctl --user enable --now lyrica-audio-worker.service

log "Checking worker health"
sleep 2
curl --fail --silent http://127.0.0.1:8787/health | "$PY310" -m json.tool

cat <<EOF

Installed.

Lyrica client environment:
  source "$CONFIG_DIR/lyrica-client.env"

Worker logs:
  journalctl --user -u lyrica-audio-worker -f

The worker only listens on 127.0.0.1 and only accepts audio paths under:
  $AUDIO_ROOT
EOF
