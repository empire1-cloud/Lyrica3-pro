from typing import Literal
from pydantic import BaseModel, Field, field_validator


class CulturalMatrixRef(BaseModel):
    matrix_id: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9][a-z0-9_-]+$")
    version: str = Field(min_length=1, max_length=32)


class GenerationRequest(BaseModel):
    persona_id: str = Field(min_length=1, max_length=80)
    persona_b_id: str | None = Field(default=None, min_length=1, max_length=80)
    topic: str = Field(min_length=1, max_length=2000)
    cultural_matrix: CulturalMatrixRef = CulturalMatrixRef(
        matrix_id="sgv_chicano_soul", version="1.0.0"
    )
    lines: int = Field(default=8, ge=2, le=128)
    mode: Literal["acoustic_profile", "authorized_voice_identity", "synthetic"] = "synthetic"
    consent_receipt_id: str | None = Field(default=None, max_length=200)

    @field_validator("consent_receipt_id")
    @classmethod
    def require_consent_for_identity_mode(cls, value: str | None, info):
        mode = info.data.get("mode")
        if mode == "authorized_voice_identity" and not value:
            raise ValueError("consent_receipt_id is required for authorized voice identity mode")
        return value
