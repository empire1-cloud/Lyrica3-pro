"""Canonical Lyrica 3 Full Runtime contracts (v1).

These models deliberately separate generation, proof, rights, and money states.
No single boolean is allowed to imply that every trust layer succeeded.
"""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class RuntimeJobState(str, Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    BLUEPRINT_READY = "BLUEPRINT_READY"
    RENDERING = "RENDERING"
    MASTERING = "MASTERING"
    MEASURING = "MEASURING"
    PROOF_PENDING = "PROOF_PENDING"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"


class EvidenceState(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    NOT_REQUIRED = "NOT_REQUIRED"
    PENDING = "PENDING"
    RECORDED = "RECORDED"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    FAILED = "FAILED"
    UNAVAILABLE = "UNAVAILABLE"


class Contributor(BaseModel):
    creator_id: str = Field(min_length=1, max_length=128)
    role: str = Field(min_length=1, max_length=64)
    split: float = Field(ge=0.0, le=1.0)


class TrackCreateV1(BaseModel):
    creator_id: str = Field(default="", max_length=128)
    title: str = Field(min_length=1, max_length=160)
    prompt: str = Field(default="", max_length=4000)
    lyrics: str = Field(default="", max_length=12000)
    genre: str = Field(default="SGV Chicano Soul", max_length=120)
    mood: str = Field(default="Late-Night Honesty", max_length=120)
    culture: str = Field(default="SGV / El Monte", max_length=160)
    duration_seconds: int = Field(default=32, ge=8, le=60)
    bpm: int = Field(default=90, ge=40, le=220)
    musical_key: str = Field(default="C", max_length=8)
    contributors: List[Contributor] = Field(default_factory=list)
    voice_consent_id: Optional[str] = Field(default=None, max_length=200)
    parent_dna: Optional[str] = Field(default=None, max_length=200)
    idempotency_key: Optional[str] = Field(default=None, max_length=200)

    @field_validator("title", "prompt", "lyrics", "genre", "mood", "culture", mode="before")
    @classmethod
    def strip_text(cls, value: Any) -> str:
        return str(value or "").strip()

    @model_validator(mode="after")
    def validate_contributors(self) -> "TrackCreateV1":
        if not self.contributors:
            owner = self.creator_id or "authenticated_creator"
            self.contributors = [Contributor(creator_id=owner, role="artist", split=1.0)]
            return self
        total = sum(c.split for c in self.contributors)
        if abs(total - 1.0) > 0.0001:
            raise ValueError("contributor splits must total exactly 1.0")
        return self


class AudioArtifact(BaseModel):
    kind: str
    name: str
    path: str
    url: str
    sha256: str
    bytes: int = Field(ge=1)
    duration_seconds: float = Field(gt=0)
    sample_rate_hz: int = Field(gt=0)
    channels: int = Field(gt=0)
    sample_width_bits: int = Field(gt=0)
    peak_dbfs: float
    rms_dbfs: float


class ArtifactBundle(BaseModel):
    master: AudioArtifact
    stems: List[AudioArtifact] = Field(min_length=4)
    distinct_stem_hashes: bool


class SoulfireBlueprint(BaseModel):
    status: EvidenceState
    source: str
    version: str = "1.0.0"
    title: str
    cultural_context: str
    emotional_direction: Dict[str, Any]
    rhythm: Dict[str, Any]
    arrangement: Dict[str, Any]
    performance: Dict[str, Any]
    mastering: Dict[str, Any]
    raw: Dict[str, Any] = Field(default_factory=dict)


class VICSProof(BaseModel):
    status: EvidenceState
    voice_use: str
    consent_required: bool
    consent_id: Optional[str] = None
    signature: Optional[str] = None
    payload_hash: Optional[str] = None
    key_status: str
    reason: Optional[str] = None


class SoulprintProof(BaseModel):
    status: EvidenceState
    algorithm: str
    audio_sha256: str
    watermark_status: EvidenceState
    reason: Optional[str] = None


class ArchisynapseReceipt(BaseModel):
    status: EvidenceState
    event_id: str
    receipt_id: Optional[str] = None
    rights_status: EvidenceState
    payout_status: EvidenceState
    response: Dict[str, Any] = Field(default_factory=dict)
    reason: Optional[str] = None


class ProofBundle(BaseModel):
    dna_tag: str
    vics: VICSProof
    soulprint: SoulprintProof
    archisynapse: ArchisynapseReceipt


class RuntimeTrack(BaseModel):
    id: str
    dna_tag: str
    creator: str
    title: str
    genre: str
    mood: str
    culture: str
    status: RuntimeJobState
    duration_sec: float
    audio_url: str
    stems: List[Dict[str, Any]]
    soulfire_blueprint: SoulfireBlueprint
    artifacts: ArtifactBundle
    proof: ProofBundle
    contributors: List[Contributor]
    parent_dna: Optional[str] = None
    provider_mode: str = "empire_local"
    created_at: str = Field(default_factory=utc_now)


class RuntimeJob(BaseModel):
    job_id: str
    state: RuntimeJobState
    creator_id: str
    request: TrackCreateV1
    idempotency_key: str
    history: List[Dict[str, Any]] = Field(default_factory=list)
    result: Optional[RuntimeTrack] = None
    error: Optional[Dict[str, Any]] = None
    created_at: str = Field(default_factory=utc_now)
    updated_at: str = Field(default_factory=utc_now)
