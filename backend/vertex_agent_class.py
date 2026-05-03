import os
from pathlib import Path
from typing import Any

from google.adk.agents import llm_agent
from google.adk.sessions import vertex_ai_session_service
from google.adk.tools import agent_tool
from google.adk.tools.google_search_tool import GoogleSearchTool
from google.adk.tools.url_context_tool import UrlContextTool
from vertexai.preview.reasoning_engines import AdkApp

VertexAiSessionService = vertex_ai_session_service.VertexAiSessionService

DEFAULT_DESCRIPTION = (
    "The Soulfire Sonance Sentinel (SSS) is an intelligent, real-time audio "
    "mastering system for the Soulfire ecosystem."
)

DEFAULT_INSTRUCTION = "LYRICA 3 PRO IS A BEAST"
DEFAULT_MODEL = "gemini-2.5-pro"
DEFAULT_WEB_TOOL_MODEL = "gemini-2.5-flash"
DEFAULT_ROOT_AGENT_NAME = "lyrica_3"


def _load_text_if_exists(path: Path) -> str:
    if path.exists():
        return path.read_text(encoding="utf-8").strip()
    return ""


class AgentClass:
    def __init__(self):
        self.app = None

    def session_service_builder(self):
        return VertexAiSessionService()

    def _get_model(self) -> str:
        return os.getenv("LYRICA_AGENT_MODEL", DEFAULT_MODEL)

    def _get_web_tool_model(self) -> str:
        return os.getenv("LYRICA_WEB_TOOL_MODEL", DEFAULT_WEB_TOOL_MODEL)

    def _build_specialist_agent(self, base_dir: Path, name: str, default_instruction: str, instruction_file: str):
        instruction = _load_text_if_exists(base_dir / instruction_file) or default_instruction
        return llm_agent.LlmAgent(
            name=name,
            model=self._get_model(),
            description=f"Specialist sub-agent: {name}",
            sub_agents=[],
            instruction=instruction,
            tools=[],
        )

    def set_up(self):
        """
        Sets up the ADK application.

        If these files exist, they are loaded at runtime:
        - LYRICA3_PRO_VERTEX_AGENT.md (description)
        - LYRICA3_MASTER_INSTRUCTION.md (instruction)
        """
        base_dir = Path(__file__).resolve().parent
        description = _load_text_if_exists(base_dir / "LYRICA3_PRO_VERTEX_AGENT.md") or DEFAULT_DESCRIPTION
        instruction = _load_text_if_exists(base_dir / "LYRICA3_MASTER_INSTRUCTION.md") or DEFAULT_INSTRUCTION

        pfa_agent = self._build_specialist_agent(
            base_dir=base_dir,
            name="empire_sub_agent_pfa_vocal_biometrics",
            default_instruction="Translate vocal artifact tags into strict JSON DSP automation.",
            instruction_file="agents/PFA_Vocal_Biometrics.md",
        )
        mma_agent = self._build_specialist_agent(
            base_dir=base_dir,
            name="empire_sub_agent_mma_late_pocket_groove",
            default_instruction="Generate late-pocket 16-step MIDI JSON for kick/snare/hihat.",
            instruction_file="agents/MMA_Late_Pocket_Groove.md",
        )
        pda_agent = self._build_specialist_agent(
            base_dir=base_dir,
            name="empire_sub_agent_pda_texture_mastering",
            default_instruction="Translate texture strings into strict JSON mastering DSP bus values.",
            instruction_file="agents/PDA_Texture_and_Mastering.md",
        )

        web_tool_model = self._get_web_tool_model()
        subagent_google_search_agent = llm_agent.LlmAgent(
            name="subagent_google_search",
            model=web_tool_model,
            description="Agent specialized in performing Google searches.",
            sub_agents=[],
            instruction="Use the GoogleSearchTool to find information on the web.",
            tools=[GoogleSearchTool()],
        )
        subagent_url_context_agent = llm_agent.LlmAgent(
            name="subagent_url_context",
            model=web_tool_model,
            description="Agent specialized in fetching content from URLs.",
            sub_agents=[],
            instruction="Use the UrlContextTool to retrieve content from provided URLs.",
            tools=[UrlContextTool()],
        )

        root_agent = llm_agent.LlmAgent(
            name=os.getenv("LYRICA_ROOT_AGENT_NAME", DEFAULT_ROOT_AGENT_NAME),
            model=self._get_model(),
            description=description,
            sub_agents=[],
            instruction=instruction,
            tools=[
                agent_tool.AgentTool(agent=pfa_agent),
                agent_tool.AgentTool(agent=mma_agent),
                agent_tool.AgentTool(agent=pda_agent),
                agent_tool.AgentTool(agent=subagent_google_search_agent),
                agent_tool.AgentTool(agent=subagent_url_context_agent),
            ],
        )

        self.app = AdkApp(
            agent=root_agent,
            session_service_builder=self.session_service_builder,
        )

    async def stream_query(self, query: str, user_id: str = "test") -> Any:
        """Streaming query."""
        if self.app is None:
            self.set_up()
        async for chunk in self.app.async_stream_query(
            message=query,
            user_id=user_id,
        ):
            yield chunk


app = AgentClass()
