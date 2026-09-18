from __future__ import annotations

from pathlib import Path

import pytest

from workers.ubuntu_studio import adapters


def config(tmp_path: Path) -> adapters.WorkerConfig:
    seed = tmp_path / "models" / "seed-vc"
    openvoice = tmp_path / "models" / "OpenVoice"
    return adapters.WorkerConfig(
        audio_root=tmp_path / "audio",
        seed_vc_dir=seed,
        seed_vc_python=seed / ".venv" / "bin" / "python",
        openvoice_dir=openvoice,
        openvoice_python=openvoice / ".venv" / "bin" / "python",
        demucs_python=seed / ".venv" / "bin" / "python",
        device="cuda",
        command_timeout_seconds=60,
    )


def touch(path: Path, payload: bytes = b"x") -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(payload)
    return path


def test_audio_paths_fail_closed_outside_shared_root(tmp_path):
    cfg = config(tmp_path)
    outside = touch(tmp_path / "outside.wav")
    with pytest.raises(adapters.WorkerExecutionError, match="outside"):
        adapters.require_inside_audio_root(str(outside), cfg, must_exist=True)


def test_seed_vc_command_is_real_singing_conversion(monkeypatch, tmp_path):
    cfg = config(tmp_path)
    touch(cfg.seed_vc_python)
    touch(cfg.seed_vc_dir / "inference.py")
    source = touch(cfg.audio_root / "source.wav", b"dry singing")
    reference = touch(cfg.audio_root / "reference.wav", b"authorized voice")
    output = cfg.audio_root / "results" / "clone.wav"
    checkpoint = touch(tmp_path / "weights" / "seed.pth")
    model_config = touch(tmp_path / "weights" / "seed.yml")
    monkeypatch.setenv("SEED_VC_CHECKPOINT", str(checkpoint))
    monkeypatch.setenv("SEED_VC_CONFIG", str(model_config))
    captured = {}

    def fake_run(command, **kwargs):
        captured["command"] = command
        output_dir = Path(command[command.index("--output") + 1])
        touch(output_dir / "converted.wav", b"converted singing")

    monkeypatch.setattr(adapters, "_run", fake_run)
    result = adapters.SeedVcAdapter(cfg).render(
        source_path=source,
        reference_path=reference,
        output_path=output,
        diffusion_steps=35,
        semitone_shift=0,
    )
    command = captured["command"]
    assert command[command.index("--f0-condition") + 1] == "True"
    assert command[command.index("--checkpoint") + 1] == str(checkpoint)
    assert output.read_bytes() == b"converted singing"
    assert result["model"]["mode"] == "zero-shot singing voice conversion"


def test_openvoice_adapter_calls_pinned_wrapper(monkeypatch, tmp_path):
    cfg = config(tmp_path)
    touch(cfg.openvoice_python)
    touch(cfg.openvoice_dir / "checkpoints_v2" / "converter" / "checkpoint.pth")
    wrapper = touch(tmp_path / "openvoice_v2_cli.py")
    reference = touch(cfg.audio_root / "reference.wav")
    output = cfg.audio_root / "results" / "speech.wav"
    captured = {}

    def fake_run(command, **kwargs):
        captured["command"] = command
        touch(output, b"cloned speech")

    monkeypatch.setattr(adapters, "_run", fake_run)
    result = adapters.OpenVoiceV2Adapter(cfg, wrapper).render(
        text="Lyrica speaks.",
        reference_path=reference,
        output_path=output,
        language="EN_NEWEST",
        speaker=None,
        speed=1.0,
    )
    command = captured["command"]
    assert command[0] == str(cfg.openvoice_python)
    assert command[1] == str(wrapper)
    assert command[command.index("--reference") + 1] == str(reference)
    assert result["model"]["name"] == "OpenVoice V2"
