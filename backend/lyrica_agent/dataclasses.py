"""
VICS Dataclasses: Emotional Vector, Subtext, Cultural Nodes, Performance Directives
"""

from dataclasses import dataclass, field
from typing import List, Optional


# ---------------------------------------------------------
# 1. Emotional Vector (Affective State Machine)
# ---------------------------------------------------------

@dataclass
class EmotionalVector:
    """
    Affective State Machine output.
    Controls vocal timbre, phrasing, artifacts, timing, DSP, melodic contour.
    """
    valence: float                     # -1.0 (sad/angry) → +1.0 (joyful/hopeful)
    arousal: float                     # 0.0 (calm) → 1.0 (intense)
    cultural_resonance: float          # 0.0 (generic) → 1.0 (deeply rooted/subcultural)
    primary_label: str                 # e.g. "Digital Loneliness", "Late-Night Honesty"
    confidence: float = 1.0            # default confidence


# ---------------------------------------------------------
# 2. Subtext Interpreter Output
# ---------------------------------------------------------

@dataclass
class Subtext:
    """
    Interpretation of metaphor, cultural meaning, emotional implications.
    """
    literal_meaning: Optional[str] = None
    metaphorical_meaning: Optional[str] = None
    cultural_references: List[str] = field(default_factory=list)
    emotional_subtext: Optional[str] = None
    performance_implications: Optional[str] = None


# ---------------------------------------------------------
# 3. Cultural Context Graph Node
# ---------------------------------------------------------

@dataclass
class CulturalNode:
    """
    Cultural Knowledge Graph node.
    Maps musical elements to historical and emotional roots.
    Examples:
    - TB-303 Acid Bass → Chicago House, Queer Black Underground
    - 90s R&B Melisma → Black Church Gospel
    - Trap Hi-Hats → Atlanta Hip-Hop
    - "Screen is Cold" → Digital Age Loneliness
    """
    id: str
    name: str
    cultural_significance: List[str] = field(default_factory=list)
    emotional_associations: List[str] = field(default_factory=list)
    behavior_trigger: Optional[str] = None


# ---------------------------------------------------------
# 4. Respect Protocol (Cultural Sensitivity Filter)
# ---------------------------------------------------------

@dataclass
class RespectProtocol:
    """
    Cultural sensitivity guardrail.
    If a musical element originates from a marginalized culture,
    activate Respect Protocol:
    - Never over-polish Gospel melisma
    - Preserve imperfections
    - Add metadata: origin_acknowledgment
    - Avoid tone-deaf or generic delivery
    """
    activated: bool = False
    origin_acknowledgment: Optional[str] = None
    preserve_imperfections: bool = False
    autotune_amount: Optional[str] = None   # "none" | "low" | "medium" | "high"


# ---------------------------------------------------------
# 5. Vibe Check Module
# ---------------------------------------------------------

@dataclass
class VibeCheck:
    """
    Contextual emotional/cultural reasoning.
    Before generating output, ask:
    - What is the cultural context?
    - What is the emotional goal?
    - Am I respecting the source material?
    """
    cultural_context: Optional[str] = None
    emotional_goal: Optional[str] = None
    respect_required: bool = False
    notes: Optional[str] = None


# ---------------------------------------------------------
# 6. Performance Directives (EPD / MaestroNet)
# ---------------------------------------------------------

@dataclass
class PerformanceDirectives:
    """
    How the agent should perform the line.
    Controls: vocal timbre, phrasing, articulation, breathiness, intensity, melodic behavior.
    """
    vocal_timbre: Optional[str] = None      # e.g. "breathy_detached", "bright_open"
    phrasing: Optional[str] = None          # e.g. "laid_back", "forward"
    articulation: Optional[str] = None      # e.g. "legato", "staccato"
    breathiness: Optional[float] = None     # 0.0 → 1.0
    intensity: Optional[float] = None       # 0.0 → 1.0
    melodic_behavior: Optional[str] = None  # e.g. "rising", "falling", "wavering"


# ---------------------------------------------------------
# 7. Vocal Artifacts (MIDI Markers)
# ---------------------------------------------------------

VALID_ARTIFACTS = [
    "<rhythmic_sigh>",
    "<melismatic_drift>",
    "<chest_resonance>",
    "<emotional_crack>",
    "<melismatic_run>",
    "<breathy_fade>",
    "<soft_spoken>",
    "<peak_intensity>",
]


# ---------------------------------------------------------
# 8. DSP Modifiers (Audio Engine)
# ---------------------------------------------------------

@dataclass
class DSPModifiers:
    """
    DSP decisions for the audio engine.
    Controls: saturation, delay, reverb, stereo width, humanization.
    """
    saturation_drive: Optional[float] = None     # 0.0 → 1.0
    delay_throw_targets: List[str] = field(default_factory=list)
    reverb_amount: Optional[float] = None        # 0.0 → 1.0
    stereo_width: Optional[float] = None         # 0.0 → 1.0
    humanization_ms: Optional[int] = None        # ≥ 0


# ---------------------------------------------------------
# 9. Full Lyrica Agent Blueprint (Master Object)
# ---------------------------------------------------------

@dataclass
class LyricaAgentBlueprint:
    """
    Full emotional + cultural blueprint for the performance.
    This is what VICS outputs for every lyric or musical request.
    
    Now includes:
    - ARRE rhythmic mapping (BPM, timing offsets, instrumentation)
    - CSN justification (explains WHY choices were made)
    - Vocal Archetype (specific historical vocal style)
    """
    emotional_vector: EmotionalVector
    subtext: Subtext
    cultural_nodes: List[CulturalNode]
    performance_directives: PerformanceDirectives

    respect_protocol: Optional[RespectProtocol] = None
    vibe_check: Optional[VibeCheck] = None
    artifacts: List[str] = field(default_factory=list)
    dsp_modifiers: Optional[DSPModifiers] = None
    
    # ARRE (Affective & Rhythmic Resonance Engine)
    rhythmic_mapping: Optional[object] = None         # RhythmicMapping from arre.py
    instrumentation: Optional[object] = None          # InstrumentationConfig from arre.py
    music_generation_config: Optional[object] = None  # MusicGenerationConfig from arre.py
    
    # CSN (Cognitive Synthesis Network)
    csn_justification: Optional[object] = None        # CSNJustification from csn.py
    
    # Vocal Archetype (z_S_style)
    vocal_archetype: Optional[object] = None          # VocalArchetype from vocal_archetypes.py
    vocal_blueprint: Optional[object] = None          # VocalBlueprint from vocal_archetypes.py
