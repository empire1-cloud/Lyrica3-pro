"""Compatibility shim for the unavailable emergentintegrations package.

This preserves backend startup in environments where the external package
is not installable. AI-backed routes will return a structured fallback.
"""

import json
from dataclasses import dataclass


@dataclass
class UserMessage:
    text: str


class LlmChat:
    def __init__(self, api_key=None, session_id=None, system_message=None):
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message
        self.provider = None
        self.model_name = None

    def with_model(self, provider, model_name):
        self.provider = provider
        self.model_name = model_name
        return self

    async def send_message(self, message):
        return json.dumps(
            {
                "summary": "AI provider is unavailable in this deployment environment.",
                "steps": [
                    "Install the proprietary emergentintegrations package or switch these routes to a supported provider."
                ],
                "risks": [
                    "AI-backed engine output is disabled until the dependency is restored."
                ],
                "resources": [],
                "next_action": "Restore the AI integration package for full engine behavior.",
            }
        )