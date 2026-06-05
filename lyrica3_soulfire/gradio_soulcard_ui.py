"""🔥 Lyrica 3 Soulfire — Gradio Soul Card UI

Companion app: load fixture → edit → generate → inspect.

Usage:
    python -m lyrica3_soulfire.gradio_soulcard_ui
"""

import json
import gradio as gr
from pathlib import Path

from lyrica3_soulfire.two_pass_pipeline import generate_track_from_soul_card
from lyrica3_soulfire.soul_card.synthid_detector import detect_synthid_watermark

FIXTURE_DIR = Path(__file__).parent / "soul_card" / "fixtures"
FIXTURES = {p.stem: p for p in FIXTURE_DIR.glob("*.json")}


def load_fixture(name: str) -> str:
    if name not in FIXTURES:
        return "{}"
    with open(FIXTURES[name], "r") as f:
        return f.read()


def run_generation(card_json: str, dna_tag: str):
    try:
        temp_path = "input_card.json"
        with open(temp_path, "w") as f:
            f.write(card_json)

        out_path = generate_track_from_soul_card(temp_path, dna_tag=dna_tag or None)
        return out_path, "Generation complete."
    except Exception as e:
        return None, f"Error: {e}"


def run_inspector(audio_file):
    if audio_file is None:
        return "No audio to inspect."

    with open(audio_file, "rb") as f:
        audio_bytes = f.read()

    results = []
    for name, path in FIXTURES.items():
        with open(path, "r") as f:
            card = json.load(f)
        tag = card.get("track_metadata", {}).get("dna_tag_preview")
        if tag:
            det = detect_synthid_watermark(audio_bytes, tag)
            results.append(f"{name}: {det.confidence:.3f}")

    return "\n".join(results) if results else "No DNA tags found."


with gr.Blocks(title="Lyrica 3 Soulfire — Soul Card Generator") as demo:
    gr.Markdown("# 🎶 Lyrica 3 Soulfire — Soul Card → Track Generator")
    gr.Markdown("Paste a Soul Card JSON or load a fixture, then generate a full track.")

    with gr.Row():
        fixture_selector = gr.Dropdown(
            choices=list(FIXTURES.keys()),
            label="Load Fixture Soul Card",
            value=list(FIXTURES.keys())[0] if FIXTURES else None,
        )
        dna_input = gr.Textbox(
            label="Optional DNA Tag (for watermarking)",
            placeholder="trk_omega_a4f9c3e2_empire1",
        )

    card_box = gr.Textbox(lines=25, label="Soul Card JSON", placeholder="Paste your Soul Card JSON here...")

    load_btn = gr.Button("Load Fixture")
    load_btn.click(load_fixture, inputs=fixture_selector, outputs=card_box)

    gen_btn = gr.Button("Generate Track")
    audio_out = gr.Audio(label="Generated Track", type="filepath")
    status_out = gr.Textbox(label="Status")

    gen_btn.click(run_generation, inputs=[card_box, dna_input], outputs=[audio_out, status_out])

    gr.Markdown("### 🔍 Optional: Run Soulfire Inspector")
    inspect_btn = gr.Button("Inspect Watermark")
    inspector_out = gr.Textbox(label="Inspector Output")

    inspect_btn.click(run_inspector, inputs=audio_out, outputs=inspector_out)


if __name__ == "__main__":
    demo.launch()
