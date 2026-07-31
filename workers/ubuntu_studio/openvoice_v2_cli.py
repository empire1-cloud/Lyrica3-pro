from __future__ import annotations

import argparse
import tempfile
from pathlib import Path

import torch
from melo.api import TTS
from openvoice import se_extractor
from openvoice.api import ToneColorConverter


def choose_device(requested: str) -> str:
    if requested.startswith("cuda") and torch.cuda.is_available():
        return requested if ":" in requested else "cuda:0"
    return "cpu"


def choose_speaker(speaker_ids: dict, requested: str | None) -> tuple[str, int]:
    if requested:
        for key, value in speaker_ids.items():
            if key.casefold() == requested.casefold():
                return key, value
        available = ", ".join(sorted(speaker_ids))
        raise ValueError(f"unknown MeloTTS speaker {requested!r}; available: {available}")
    key = next(iter(speaker_ids))
    return key, speaker_ids[key]


def main() -> None:
    parser = argparse.ArgumentParser(description="Lyrica OpenVoice V2 cloning worker")
    parser.add_argument("--openvoice-dir", required=True)
    parser.add_argument("--reference", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--text", required=True)
    parser.add_argument("--language", default="EN_NEWEST")
    parser.add_argument("--speaker")
    parser.add_argument("--speed", type=float, default=1.0)
    parser.add_argument("--device", default="cuda")
    args = parser.parse_args()

    root = Path(args.openvoice_dir).expanduser().resolve()
    checkpoints = root / "checkpoints_v2"
    converter_dir = checkpoints / "converter"
    output_path = Path(args.output).expanduser().resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    device = choose_device(args.device)

    converter = ToneColorConverter(str(converter_dir / "config.json"), device=device)
    converter.load_ckpt(str(converter_dir / "checkpoint.pth"))
    target_se, _ = se_extractor.get_se(args.reference, converter, vad=True)

    model = TTS(language=args.language, device=device)
    speaker_key, speaker_id = choose_speaker(model.hps.data.spk2id, args.speaker)
    speaker_asset = speaker_key.lower().replace("_", "-")
    source_se_path = checkpoints / "base_speakers" / "ses" / f"{speaker_asset}.pth"
    if not source_se_path.is_file():
        raise FileNotFoundError(f"OpenVoice source speaker embedding missing: {source_se_path}")
    source_se = torch.load(str(source_se_path), map_location=device)

    if torch.backends.mps.is_available() and device == "cpu":
        torch.backends.mps.is_available = lambda: False  # type: ignore[method-assign]

    with tempfile.TemporaryDirectory(prefix="openvoice-v2-", dir=str(output_path.parent)) as temp_dir:
        base_path = Path(temp_dir) / "base.wav"
        model.tts_to_file(args.text, speaker_id, str(base_path), speed=args.speed)
        converter.convert(
            audio_src_path=str(base_path),
            src_se=source_se,
            tgt_se=target_se,
            output_path=str(output_path),
            message="@Lyrica3",
        )


if __name__ == "__main__":
    main()
