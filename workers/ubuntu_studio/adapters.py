from __future__ import annotations

import hashlib
import os
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any


class WorkerConfigurationError(RuntimeError):
    pass


class WorkerExecutionError(RuntimeError):
    pass


@dataclass(frozen=True)
class WorkerConfig:
    audio_root: Path
    seed_vc_dir: Path
    seed_vc_python: Path
    openvoice_dir: Path
    openvoice_python: Path
    demucs_python: Path
    device: str
    command_timeout_seconds: int

    @classmethod
    def from_env(cls) -> "WorkerConfig":
        audio_root = Path(os.environ.get("LYRICA_AUDIO_ROOT", "~/LyricaStudio/audio")).expanduser().resolve()
        seed_vc_dir = Path(os.environ.get("SEED_VC_DIR", "~/LyricaStudio/models/seed-vc")).expanduser().resolve()
        openvoice_dir = Path(os.environ.get("OPENVOICE_DIR", "~/LyricaStudio/models/OpenVoice")).expanduser().resolve()
        return cls(
            audio_root=audio_root,
            seed_vc_dir=seed_vc_dir,
            seed_vc_python=Path(
                os.environ.get("SEED_VC_PYTHON", str(seed_vc_dir / ".venv" / "bin" / "python"))
            ).expanduser().resolve(),
            openvoice_dir=openvoice_dir,
            openvoice_python=Path(
                os.environ.get("OPENVOICE_PYTHON", str(openvoice_dir / ".venv" / "bin" / "python"))
            ).expanduser().resolve(),
            demucs_python=Path(
                os.environ.get("DEMUCS_PYTHON", str(seed_vc_dir / ".venv" / "bin" / "python"))
            ).expanduser().resolve(),
            device=os.environ.get("LYRICA_AUDIO_DEVICE", "cuda"),
            command_timeout_seconds=int(os.environ.get("LYRICA_AUDIO_COMMAND_TIMEOUT_SECONDS", "1800")),
        )


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def require_inside_audio_root(path_value: str, config: WorkerConfig, *, must_exist: bool) -> Path:
    path = Path(path_value).expanduser().resolve()
    root = config.audio_root
    root.mkdir(parents=True, exist_ok=True)
    if path != root and root not in path.parents:
        raise WorkerExecutionError("audio path is outside LYRICA_AUDIO_ROOT")
    if must_exist and not path.is_file():
        raise WorkerExecutionError("required audio file does not exist")
    if not must_exist:
        path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _require_file(path: Path, label: str) -> None:
    if not path.is_file():
        raise WorkerConfigurationError(f"{label} is missing: {path}")


def _run(command: list[str], *, cwd: Path, timeout: int, env: dict[str, str] | None = None) -> None:
    completed = subprocess.run(
        command,
        cwd=str(cwd),
        env=env,
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False,
    )
    if completed.returncode != 0:
        stderr = completed.stderr[-4000:]
        stdout = completed.stdout[-2000:]
        raise WorkerExecutionError(
            f"worker command failed with exit {completed.returncode}; stdout={stdout!r}; stderr={stderr!r}"
        )


class SeedVcAdapter:
    provider_id = "seed_vc_singing"

    def __init__(self, config: WorkerConfig):
        self.config = config

    def health(self) -> dict[str, Any]:
        inference = self.config.seed_vc_dir / "inference.py"
        return {
            "ready": self.config.seed_vc_python.is_file() and inference.is_file(),
            "python": str(self.config.seed_vc_python),
            "repo": str(self.config.seed_vc_dir),
            "checkpoint_mode": "official_huggingface_auto_download_or_pinned_env",
            "license_boundary": "GPL-3.0 external worker",
        }

    def render(
        self,
        *,
        source_path: Path,
        reference_path: Path,
        output_path: Path,
        diffusion_steps: int,
        semitone_shift: int,
    ) -> dict[str, Any]:
        inference = self.config.seed_vc_dir / "inference.py"
        _require_file(self.config.seed_vc_python, "Seed-VC Python")
        _require_file(inference, "Seed-VC inference.py")
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with tempfile.TemporaryDirectory(prefix="seed-vc-", dir=str(output_path.parent)) as temp_dir:
            temp_output = Path(temp_dir)
            checkpoint = Path(os.environ.get("SEED_VC_CHECKPOINT", "")).expanduser() if os.environ.get("SEED_VC_CHECKPOINT") else None
            model_config = Path(os.environ.get("SEED_VC_CONFIG", "")).expanduser() if os.environ.get("SEED_VC_CONFIG") else None
            command = [
                str(self.config.seed_vc_python),
                str(inference),
                "--source",
                str(source_path),
                "--target",
                str(reference_path),
                "--output",
                str(temp_output),
                "--diffusion-steps",
                str(diffusion_steps),
                "--length-adjust",
                "1.0",
                "--inference-cfg-rate",
                "0.7",
                "--f0-condition",
                "True",
                "--auto-f0-adjust",
                "False",
                "--semi-tone-shift",
                str(semitone_shift),
                "--fp16",
                "True" if self.config.device.startswith("cuda") else "False",
            ]
            if checkpoint:
                _require_file(checkpoint, "Seed-VC checkpoint")
                command.extend(["--checkpoint", str(checkpoint)])
            if model_config:
                _require_file(model_config, "Seed-VC config")
                command.extend(["--config", str(model_config)])
            env = dict(os.environ)
            env.setdefault("CUDA_VISIBLE_DEVICES", os.environ.get("CUDA_VISIBLE_DEVICES", "0"))
            _run(
                command,
                cwd=self.config.seed_vc_dir,
                timeout=self.config.command_timeout_seconds,
                env=env,
            )
            candidates = sorted(
                temp_output.rglob("*.wav"),
                key=lambda item: item.stat().st_mtime_ns,
                reverse=True,
            )
            if not candidates:
                raise WorkerExecutionError("Seed-VC completed without producing a WAV")
            shutil.copy2(candidates[0], output_path)

        return {
            "provider_id": self.provider_id,
            "model": {
                "name": "Seed-VC seed-uvit-whisper-base F0 v2",
                "mode": "zero-shot singing voice conversion",
                "f0_condition": True,
                "diffusion_steps": diffusion_steps,
                "repository": "Plachtaa/seed-vc",
                "weights": "Plachta/Seed-VC",
            },
        }


class OpenVoiceV2Adapter:
    provider_id = "openvoice_v2_tts"

    def __init__(self, config: WorkerConfig, wrapper_path: Path):
        self.config = config
        self.wrapper_path = wrapper_path.resolve()

    def health(self) -> dict[str, Any]:
        converter = self.config.openvoice_dir / "checkpoints_v2" / "converter" / "checkpoint.pth"
        return {
            "ready": (
                self.config.openvoice_python.is_file()
                and self.wrapper_path.is_file()
                and converter.is_file()
            ),
            "python": str(self.config.openvoice_python),
            "repo": str(self.config.openvoice_dir),
            "weights": str(self.config.openvoice_dir / "checkpoints_v2"),
            "license_boundary": "MIT",
        }

    def render(
        self,
        *,
        text: str,
        reference_path: Path,
        output_path: Path,
        language: str,
        speaker: str | None,
        speed: float,
    ) -> dict[str, Any]:
        _require_file(self.config.openvoice_python, "OpenVoice Python")
        _require_file(self.wrapper_path, "Lyrica OpenVoice V2 wrapper")
        _require_file(
            self.config.openvoice_dir / "checkpoints_v2" / "converter" / "checkpoint.pth",
            "OpenVoice V2 converter checkpoint",
        )
        command = [
            str(self.config.openvoice_python),
            str(self.wrapper_path),
            "--openvoice-dir",
            str(self.config.openvoice_dir),
            "--reference",
            str(reference_path),
            "--output",
            str(output_path),
            "--text",
            text,
            "--language",
            language,
            "--speed",
            str(speed),
            "--device",
            self.config.device,
        ]
        if speaker:
            command.extend(["--speaker", speaker])
        _run(
            command,
            cwd=self.config.openvoice_dir,
            timeout=self.config.command_timeout_seconds,
            env=dict(os.environ),
        )
        if not output_path.is_file():
            raise WorkerExecutionError("OpenVoice V2 completed without producing a WAV")
        return {
            "provider_id": self.provider_id,
            "model": {
                "name": "OpenVoice V2",
                "mode": "zero-shot multilingual TTS tone-color cloning",
                "language": language,
                "repository": "myshell-ai/OpenVoice",
                "weights": "myshell-ai/OpenVoiceV2",
            },
        }


class DemucsAdapter:
    provider_id = "demucs_v4"

    def __init__(self, config: WorkerConfig):
        self.config = config

    def health(self) -> dict[str, Any]:
        ready = self.config.demucs_python.is_file()
        return {
            "ready": ready,
            "python": str(self.config.demucs_python),
            "model": "htdemucs",
            "license_boundary": "MIT",
        }

    def separate(self, *, source_path: Path, output_dir: Path, model: str = "htdemucs") -> dict[str, Any]:
        _require_file(self.config.demucs_python, "Demucs Python")
        output_dir.mkdir(parents=True, exist_ok=True)
        command = [
            str(self.config.demucs_python),
            "-m",
            "demucs",
            "-n",
            model,
            "-d",
            self.config.device if self.config.device in {"cpu", "cuda"} else "cpu",
            "-o",
            str(output_dir),
            str(source_path),
        ]
        _run(command, cwd=self.config.audio_root, timeout=self.config.command_timeout_seconds)
        stems = sorted(str(path) for path in output_dir.rglob("*.wav"))
        if not stems:
            raise WorkerExecutionError("Demucs completed without producing stems")
        return {
            "provider_id": self.provider_id,
            "model": {"name": model, "repository": "adefossez/demucs"},
            "stems": stems,
        }
