"""
VICS: Vibe Interpretation & Cultural Synthesis
EQ-aware, CQ-aware music intelligence agent for Lyrica3 Pro

This module interprets lyrics, detects emotional subtext, understands cultural lineage,
and generates performance decisions that respect emotional truth and cultural roots.
"""

from .dataclasses import (
    EmotionalVector,
    Subtext,
    CulturalNode,
    RespectProtocol,
    VibeCheck,
    PerformanceDirectives,
    DSPModifiers,
    LyricaAgentBlueprint,
)

from .orchestrator import (
    run_lyrica_agent,
    run_lyrica_agent_dict,
)

__all__ = [
    "EmotionalVector",
    "Subtext",
    "CulturalNode",
    "RespectProtocol",
    "VibeCheck",
    "PerformanceDirectives",
    "DSPModifiers",
    "LyricaAgentBlueprint",
    "run_lyrica_agent",
    "run_lyrica_agent_dict",
]
