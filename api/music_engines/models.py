from __future__ import annotations

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class MusicTask(str, Enum):
    FULL_SONG = "full_song"
    LYRICS_TO_SONG = "lyrics_to_song"
    INSTRUMENTAL = "instrumental"
    LONG_FORM = "long_form"
    REMIX = "remix"
    AUDIO_EDIT = "audio_edit"
    SINGING_VOICE = "singing_voice"
    VOICE_EDIT = "voice_edit"
    VOICE_CONVERSION = "voice_conversion"
    SINGING_STYLE_CONVERSION = "singing_style_conversion"


class QualityMode(str, Enum):
    FAST = "fast"
    BALANCED = "balanced"
    STUDIO = "studio"
    COUNCIL = "council"


class MusicEngineRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    task: MusicTask = MusicTask.FULL_SONG
    prompt: str = Field(default="", max_length=8000)
    lyrics: str = Field(default="", max_length=50000)
    artist_id: Optional[str] = Field(default=None, max_length=200)
    artist_name: Optional[str] = Field(default=None, max_length=200)
    voice_identity_ref: Optional[str] = Field(default=None, max_length=500)
    consent_assertion_id: Optional[str] = Field(default=None, max_length=500)
    reference_audio_url: Optional[str] = Field(default=None, max_length=2000)
    melody_url: Optional[str] = Field(default=None, max_length=2000)
    midi_url: Optional[str] = Field(default=None, max_length=2000)
    language_tags: list[str] = Field(default_factory=list, max_length=16)
    genre_tags: list[str] = Field(default_factory=list, max_length=32)
    negative_tags: list[str] = Field(default_factory=list, max_length=32)
    duration_seconds: int = Field(default=180, ge=5, le=600)
    bpm: Optional[int] = Field(default=None, ge=30, le=240)
    musical_key: Optional[str] = Field(default=None, max_length=32)
    time_signature: Optional[str] = Field(default=None, max_length=16)
    needs_exact_lyrics: bool = False
    needs_melody_control: bool = False
    needs_personalization: bool = False
    candidate_count: int = Field(default=3, ge=1, le=8)
    quality_mode: QualityMode = QualityMode.COUNCIL
    preferred_provider: Optional[str] = Field(default=None, max_length=100)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def enforce_identity_and_content_boundaries(self) -> "MusicEngineRequest":
        uses_reference_identity = bool(
            self.reference_audio_url
            or self.voice_identity_ref
            or self.task in {
                MusicTask.VOICE_CONVERSION,
                MusicTask.SINGING_STYLE_CONVERSION,
                MusicTask.VOICE_EDIT,
            }
        )
        if uses_reference_identity and not self.consent_assertion_id:
            raise ValueError(
                "Reference audio, voice identity, and voice-conversion tasks require a consent assertion."
            )

        if self.task in {MusicTask.LYRICS_TO_SONG, MusicTask.LONG_FORM} and not self.lyrics.strip():
            raise ValueError("Lyrics are required for lyrics-to-song and long-form generation.")

        if self.task == MusicTask.SINGING_VOICE and not (self.midi_url or self.melody_url):
            raise ValueError("Singing-voice rendering requires a MIDI or melody reference.")

        if not self.prompt.strip() and not self.lyrics.strip():
            raise ValueError("A prompt or lyrics payload is required.")

        return self


class EngineStage(BaseModel):
    stage_id: str
    purpose: str
    providers: list[str]
    selection_rule: str
    required: bool = True
    payloads: dict[str, dict[str, Any]] = Field(default_factory=dict)


class EngineExecutionPlan(BaseModel):
    registry_id: str
    request_fingerprint: str
    primary_provider: str
    fallback_providers: list[str]
    stages: list[EngineStage]
    excluded_providers: dict[str, str] = Field(default_factory=dict)
    proof_handoff: list[str]
    warnings: list[str] = Field(default_factory=list)


class EngineJobRecord(BaseModel):
    job_id: str
    status: str
    created_at: str
    updated_at: str
    request: dict[str, Any]
    plan: dict[str, Any]
    dispatches: list[dict[str, Any]] = Field(default_factory=list)
    result: Optional[dict[str, Any]] = None
    error: Optional[str] = None
