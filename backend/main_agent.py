import json
import os
from pathlib import Path
from typing import Any, Dict


class _PromptedStage:
    def __init__(self, model: Any, template: str):
        self.model = model
        self.template = template

    def run(self, **kwargs: Any) -> str:
        prompt = self.template.format(**kwargs)
        response = self.model.invoke(prompt)
        content = getattr(response, "content", None)
        return content if isinstance(content, str) else str(response)


def _read_text(path: Path, fallback: str) -> str:
    if path.exists():
        return path.read_text(encoding="utf-8").strip()
    return fallback


class Lyrica3Agent:
    """
    Canonical Lyrica 3 deterministic cognitive pipeline.
    AURA -> EFL -> ASE -> ECHO -> EFAD
    """

    def __init__(
        self,
        model: str | None = None,
        project: str | None = None,
        location: str | None = None,
    ):
        self.model_name = model or os.getenv("LYRICA_AGENT_MODEL", "gemini-2.5-pro")
        self.project = project or os.getenv("GOOGLE_CLOUD_PROJECT")
        self.location = location or os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        self.ready = False
        self._base_dir = Path(__file__).resolve().parent

    def set_up(self) -> None:
        import vertexai
        from langchain_google_vertexai import ChatVertexAI

        if not self.project:
            raise ValueError("GOOGLE_CLOUD_PROJECT is required for Vertex initialization.")

        vertexai.init(project=self.project, location=self.location)
        self.model = ChatVertexAI(model_name=self.model_name, temperature=0.75, max_output_tokens=8192)

        prompts_dir = self._base_dir / "prompts"
        self.aura = _PromptedStage(self.model, _read_text(prompts_dir / "AURA.md", "Analyze: {user_input}"))
        self.efl = _PromptedStage(self.model, _read_text(prompts_dir / "EFL.md", "Map emotion: {aura_state}"))
        self.ase = _PromptedStage(self.model, _read_text(prompts_dir / "ASE.md", "Evaluate: {efl_state}"))
        self.echo = _PromptedStage(self.model, _read_text(prompts_dir / "ECHO.md", "DSP: {ase_state}"))
        self.efad = _PromptedStage(
            self.model,
            _read_text(prompts_dir / "EFAD.md", "Assemble JSON from {aura_state} {efl_state} {ase_state} {echo_state}"),
        )

        self.ready = True

    @staticmethod
    def _coerce_json(text: str) -> Dict[str, Any]:
        cleaned = text.replace("```json", "").replace("```", "").strip()
        try:
            parsed = json.loads(cleaned)
            return parsed if isinstance(parsed, dict) else {"payload": parsed}
        except Exception:
            return {"error": "JSON_PARSE_FAILED", "raw_output": cleaned}

    def query(self, user_input: str) -> Dict[str, Any]:
        if not self.ready:
            self.set_up()

        aura_state = self.aura.run(user_input=user_input)
        efl_state = self.efl.run(aura_state=aura_state)
        ase_state = self.ase.run(efl_state=efl_state)
        echo_state = self.echo.run(ase_state=ase_state)
        efad_state = self.efad.run(
            aura_state=aura_state,
            efl_state=efl_state,
            ase_state=ase_state,
            echo_state=echo_state,
            schema=_read_text(self._base_dir / "schemas" / "soulfire_payload.json", "{}"),
        )

        return {
            "input": user_input,
            "cognitive_history": {
                "aura_cortex": aura_state,
                "efl_engine": efl_state,
                "ase_core": ase_state,
                "echo_weaver": echo_state,
            },
            "soulfire_blueprint": self._coerce_json(efad_state),
        }


agent = Lyrica3Agent()
