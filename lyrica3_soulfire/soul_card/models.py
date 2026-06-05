"""Soul Card Pydantic models — track blueprint schema."""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class TrackMetadata(BaseModel):
    title: str
    core_genre: str
    s2_mutation: Optional[str] = None
    dna_tag_preview: Optional[str] = None


class CCNAGhostwriterDirective(BaseModel):
    corpus: str
    subtext: Optional[str] = None


class EPDVocalBlueprint(BaseModel):
    vulnerability_level: float = 0.5
    biometric_artifacts: List[str] = Field(default_factory=list)
    phonation: Optional[str] = None


class AcousticPrimitives(BaseModel):
    groove: Optional[str] = None
    texture: Optional[str] = None


class SoulCard(BaseModel):
    track_metadata: TrackMetadata
    ccna_ghostwriter_directive: Optional[CCNAGhostwriterDirective] = None
    epd_vocal_blueprint: Optional[EPDVocalBlueprint] = None
    acoustic_primitives: Optional[AcousticPrimitives] = None


class GenerateRequest(BaseModel):
    card: SoulCard
    dna_tag: Optional[str] = None
    use_neural: bool = True


class GenerateResponse(BaseModel):
    status: str
    audio_path: Optional[str] = None
    dna_tag: Optional[str] = None
    duration_ms: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CloneRequest(BaseModel):
    source_dna_tag: str
    remixer: str
    s2_mutation: Optional[str] = None


class InspectRequest(BaseModel):
    audio_path: str
    dna_tag: Optional[str] = None


class InspectResponse(BaseModel):
    detections: List[Dict[str, Any]] = Field(default_factory=list)
