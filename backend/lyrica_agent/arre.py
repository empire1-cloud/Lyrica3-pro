"""
ARRE: Affective & Rhythmic Resonance Engine

Translates emotional vectors into precise rhythmic mappings:
- Quantization (on-grid vs late-pocket)
- MIDI timing offsets (milliseconds)
- Groove mathematics (human resistance to machine)
- Hardware-specific rhythmic signatures (TR-909, MPC, etc.)

This is the mathematical bridge between "laid-back groove" and "+8ms late-pocket shift"
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional


# ---------------------------------------------------------
# ARRE Dataclasses
# ---------------------------------------------------------

@dataclass
class InstrumentTiming:
    """
    Precise timing offset for a specific instrument or stem.
    """
    instrument: str                    # e.g. "TR-909 Kick", "Rhodes Piano", "Hi-Hats"
    quantization: str                  # "strict_grid" | "late_pocket" | "early_push" | "human_swing"
    offset_ms: int                     # Timing offset in milliseconds (+ = late, - = early)
    justification: str                 # Why this timing was chosen


@dataclass
class RhythmicMapping:
    """
    Full rhythmic blueprint for a track.
    Maps emotional intent to MIDI timing precision.
    """
    bpm: int                           # Tempo (e.g. 72, 122)
    time_signature: str = "4/4"        # Default to 4/4
    swing_amount: float = 0.0          # 0.0 = straight, 1.0 = maximum swing
    groove_descriptor: str = ""        # Human-readable description
    instrument_timings: List[InstrumentTiming] = field(default_factory=list)
    master_humanization_ms: int = 12   # Global humanization amount


@dataclass
class InstrumentationConfig:
    """
    Specific hardware/VST choices for each stem.
    Not "analog warmth" - actual gear names.
    """
    drums: str = ""                    # e.g. "TR-909 Drum Machine"
    bass: str = ""                     # e.g. "Yamaha DX7 Bass"
    chords: str = ""                   # e.g. "Rhodes Mark II Electric Piano"
    pads: str = ""                     # e.g. "Warm Analog Synth Pads (Juno-106)"
    lead: str = ""                     # e.g. "TB-303 Acid Bass"
    fx: str = ""                       # e.g. "Roland Space Echo RE-201"


@dataclass
class MusicGenerationConfig:
    """
    Full audio generation config (compatible with MusicGen, Suno, etc.)
    """
    prompt_instrumentation: str        # Comma-separated instrument list
    prompt_mood: str                   # Mood descriptors for audio model
    bpm: int                           # Tempo
    scale: str                         # e.g. "F_MINOR_E_FLAT_MAJOR", "C_MINOR"
    density: float = 0.75              # 0.0 = sparse, 1.0 = dense
    brightness: float = 0.6            # 0.0 = dark, 1.0 = bright
    guidance: float = 5.0              # Guidance scale for diffusion models
    mode: str = "QUALITY"              # "QUALITY" | "SPEED"


# ---------------------------------------------------------
# BPM Mapping by Genre & Emotional Context
# ---------------------------------------------------------

GENRE_BPM_RANGES = {
    "sgv_oldies": (68, 76),
    "trap_soul": (68, 75),
    "chicago_house": (118, 130),
    "detroit_techno": (120, 135),
    "boom_bap": (85, 95),
    "drill": (140, 150),
    "gospel": (72, 90),
    "rnb_90s": (68, 80),
}


# ---------------------------------------------------------
# Hardware Signature Database
# ---------------------------------------------------------

HARDWARE_SIGNATURES = {
    "TR-909": {
        "description": "Roland TR-909 Drum Machine",
        "cultural_origin": "Chicago House, Detroit Techno",
        "timing_characteristics": "Strict quantization, machine precision, relentless grid",
        "emotional_associations": ["progressive", "industrial", "forward momentum"],
    },
    "MPC-3000": {
        "description": "Akai MPC-3000 Sampler",
        "cultural_origin": "90s Hip-Hop, Boom Bap",
        "timing_characteristics": "Heavy swing (56-62%), late-pocket groove",
        "emotional_associations": ["laid-back", "confident", "head-nod"],
    },
    "Rhodes": {
        "description": "Fender Rhodes Mark II Electric Piano",
        "cultural_origin": "70s Soul, 90s R&B, Neo-Soul",
        "timing_characteristics": "Human swing, +6ms to +12ms late-pocket",
        "emotional_associations": ["warm", "nostalgic", "soulful", "grounded"],
    },
    "TB-303": {
        "description": "Roland TB-303 Bass Line",
        "cultural_origin": "Chicago Acid House, Queer Black Underground",
        "timing_characteristics": "Strict quantization with squelch automation",
        "emotional_associations": ["mechanical yearning", "euphoric melancholy", "liberation"],
    },
    "DX7": {
        "description": "Yamaha DX7 FM Synthesizer",
        "cultural_origin": "80s Pop, New Wave, Early Hip-Hop",
        "timing_characteristics": "Precise digital timing, no natural swing",
        "emotional_associations": ["futuristic", "cold", "crystalline"],
    },
}


# ---------------------------------------------------------
# ARRE Core Functions
# ---------------------------------------------------------

def calculate_bpm(genre: str, emotional_vector) -> int:
    """
    Calculate BPM based on genre and emotional state.
    
    Rules:
    - High arousal → faster BPM (within genre range)
    - Low arousal → slower BPM (within genre range)
    - Cultural resonance → respect genre BPM conventions
    """
    genre_key = genre.lower().replace(" ", "_").replace("-", "_")
    
    # Find matching genre range
    bpm_range = None
    for key, range_tuple in GENRE_BPM_RANGES.items():
        if key in genre_key:
            bpm_range = range_tuple
            break
    
    # Default to Trap Soul range if no match
    if not bpm_range:
        bpm_range = (70, 80)
    
    min_bpm, max_bpm = bpm_range
    
    # Map arousal to BPM within range
    # arousal 0.0 → min_bpm, arousal 1.0 → max_bpm
    arousal = emotional_vector.arousal
    bpm = int(min_bpm + (max_bpm - min_bpm) * arousal)
    
    return bpm


def map_groove_to_offsets(
    emotional_vector,
    genre: str,
    bpm: int
) -> RhythmicMapping:
    """
    Map emotional vector to rhythmic timing offsets.
    
    This is THE CHECKMATE: translating "laid-back groove" into "+8ms late-pocket."
    
    Rules:
    - Low arousal + high cultural resonance → late-pocket groove (+6ms to +12ms)
    - High arousal + low valence → on-grid aggression (0ms)
    - Mid arousal + high cultural resonance → moderate swing (+3ms to +6ms)
    """
    valence = emotional_vector.valence
    arousal = emotional_vector.arousal
    cultural_resonance = emotional_vector.cultural_resonance
    
    instrument_timings = []
    groove_descriptor = ""
    swing_amount = 0.0
    
    # RULE 1: Low arousal + high cultural resonance = late-pocket groove
    if arousal < 0.5 and cultural_resonance > 0.5:
        # Late-pocket: drums on grid, melodic elements delayed
        instrument_timings.append(InstrumentTiming(
            instrument="Kick Drum",
            quantization="strict_grid",
            offset_ms=0,
            justification="Kick provides forward momentum, stays on grid"
        ))
        
        late_pocket_offset = int(8 + (1 - arousal) * 8)  # 8-16ms based on arousal
        
        instrument_timings.append(InstrumentTiming(
            instrument="Chords/Keys",
            quantization="late_pocket",
            offset_ms=late_pocket_offset,
            justification=f"Human element resists machine grid, delayed {late_pocket_offset}ms to create 'laid-back' feel"
        ))
        
        instrument_timings.append(InstrumentTiming(
            instrument="Hi-Hats",
            quantization="late_pocket",
            offset_ms=late_pocket_offset // 2,
            justification=f"Subtle late-pocket swing on hi-hats, {late_pocket_offset // 2}ms offset"
        ))
        
        groove_descriptor = f"Late-pocket groove: kick on grid, keys/hats {late_pocket_offset}ms behind (human resistance to machine)"
        swing_amount = 0.58  # MPC-3000 style swing
    
    # RULE 2: High arousal + low valence = on-grid aggression
    elif arousal > 0.7 and valence < -0.3:
        instrument_timings.append(InstrumentTiming(
            instrument="All Drums",
            quantization="strict_grid",
            offset_ms=0,
            justification="High-arousal aggression requires relentless machine precision"
        ))
        
        instrument_timings.append(InstrumentTiming(
            instrument="Bass",
            quantization="strict_grid",
            offset_ms=0,
            justification="Bass locked to kick for maximum impact"
        ))
        
        groove_descriptor = "Machine-locked aggression: all elements quantized to grid for relentless forward momentum"
        swing_amount = 0.0
    
    # RULE 3: High arousal + high valence = tight but human
    elif arousal > 0.6 and valence > 0.4:
        instrument_timings.append(InstrumentTiming(
            instrument="Drums",
            quantization="strict_grid",
            offset_ms=0,
            justification="High energy requires tight rhythm section"
        ))
        
        instrument_timings.append(InstrumentTiming(
            instrument="Melodic Elements",
            quantization="human_swing",
            offset_ms=3,
            justification="Subtle humanization (+3ms) prevents robotic feel while maintaining energy"
        ))
        
        groove_descriptor = "Tight but human: drums on grid, melodic elements slightly behind for groove"
        swing_amount = 0.52
    
    # RULE 4: Default moderate swing
    else:
        offset = 6 if cultural_resonance > 0.5 else 3
        
        instrument_timings.append(InstrumentTiming(
            instrument="Drums",
            quantization="strict_grid",
            offset_ms=0,
            justification="Rhythm section provides steady foundation"
        ))
        
        instrument_timings.append(InstrumentTiming(
            instrument="Other Elements",
            quantization="human_swing",
            offset_ms=offset,
            justification=f"Moderate humanization ({offset}ms) for natural feel"
        ))
        
        groove_descriptor = f"Moderate groove: drums on grid, other elements {offset}ms behind"
        swing_amount = 0.54
    
    return RhythmicMapping(
        bpm=bpm,
        time_signature="4/4",
        swing_amount=swing_amount,
        groove_descriptor=groove_descriptor,
        instrument_timings=instrument_timings,
        master_humanization_ms=12,
    )


def select_instrumentation(
    genre: str,
    cultural_nodes: List,
    emotional_vector
) -> InstrumentationConfig:
    """
    Select specific hardware/VST for each stem based on cultural context.
    
    Not "analog warmth" - actual gear that birthed the genre.
    """
    genre_lower = genre.lower()
    
    # Default to generic
    config = InstrumentationConfig()
    
    # SGV Chicano / Oldies
    if "sgv" in genre_lower or "chicano" in genre_lower or "oldies" in genre_lower:
        config.drums = "Vintage Ludwig Kit (70s Soul Breaks)"
        config.bass = "Fender Precision Bass (finger-style)"
        config.chords = "Fender Rhodes Mark II Electric Piano"
        config.pads = "String Ensemble (Solina-style)"
        config.lead = "Acoustic Requinto Guitar"
        config.fx = "Tape Echo (Echoplex EP-3)"
    
    # Chicago House / Detroit Techno
    elif "house" in genre_lower or "techno" in genre_lower or "detroit" in genre_lower:
        config.drums = "Roland TR-909 Drum Machine"
        config.bass = "Roland TB-303 Acid Bass" if "acid" in genre_lower else "Yamaha DX7 Bass"
        config.chords = "Rhodes Mark II (warm, soulful)" if emotional_vector.valence < 0 else "Korg M1 Piano"
        config.pads = "Juno-106 Analog Synth Pads"
        config.lead = "TB-303 Acid Line"
        config.fx = "Roland Space Echo RE-201"
    
    # Trap Soul / R&B
    elif "trap" in genre_lower or "soul" in genre_lower or "rnb" in genre_lower or "r&b" in genre_lower:
        config.drums = "Roland TR-808 + Modern Trap Samples"
        config.bass = "Sub Bass (808 style)"
        config.chords = "Rhodes Mark II (vintage warmth)"
        config.pads = "Soft Analog Synth Pads (low-pass filtered)"
        config.lead = "Melodic Bell/Keys (trap lead)"
        config.fx = "Heavy Reverb + Delay Throws"
    
    # Boom Bap / Hip-Hop
    elif "boom bap" in genre_lower or "hip hop" in genre_lower or "hip-hop" in genre_lower:
        config.drums = "Akai MPC-3000 (sampled breaks)"
        config.bass = "Sampled Upright Bass or Moog Sub"
        config.chords = "Rhodes or Wurlitzer (sampled + pitched)"
        config.pads = "String loops (vinyl-sampled)"
        config.lead = "Jazz Horn samples or vocal chops"
        config.fx = "SP-1200 Lo-Fi Grit + Tape Saturation"
    
    return config


def build_music_generation_config(
    instrumentation: InstrumentationConfig,
    rhythmic_mapping: RhythmicMapping,
    emotional_vector,
    mood: str
) -> MusicGenerationConfig:
    """
    Build the final config for audio generation APIs (MusicGen, Suno, etc.)
    """
    # Build instrumentation prompt
    instruments = []
    if instrumentation.drums:
        instruments.append(instrumentation.drums)
    if instrumentation.bass:
        instruments.append(instrumentation.bass)
    if instrumentation.chords:
        instruments.append(instrumentation.chords)
    if instrumentation.pads:
        instruments.append(instrumentation.pads)
    
    prompt_instrumentation = ", ".join(instruments)
    
    # Map emotional vector to mood descriptors
    mood_descriptors = []
    
    if emotional_vector.arousal > 0.6:
        mood_descriptors.append("Energetic")
    elif emotional_vector.arousal < 0.4:
        mood_descriptors.append("Laid-back")
    
    if emotional_vector.valence > 0.4:
        mood_descriptors.append("Uplifting")
    elif emotional_vector.valence < -0.4:
        mood_descriptors.append("Melancholic")
    
    if emotional_vector.cultural_resonance > 0.6:
        mood_descriptors.append("Culturally Rooted")
        mood_descriptors.append("Authentic")
    
    # Add user mood if specified
    if mood:
        mood_descriptors.append(mood)
    
    prompt_mood = ", ".join(mood_descriptors)
    
    # Determine scale based on valence
    if emotional_vector.valence < -0.3:
        scale = "C_MINOR"  # Sad/melancholic
    elif emotional_vector.valence > 0.3:
        scale = "C_MAJOR"  # Happy/uplifting
    else:
        scale = "C_MINOR_E_FLAT_MAJOR"  # Mixed (resilient)
    
    return MusicGenerationConfig(
        prompt_instrumentation=prompt_instrumentation,
        prompt_mood=prompt_mood,
        bpm=rhythmic_mapping.bpm,
        scale=scale,
        density=0.75,
        brightness=max(0.2, min(0.8, 0.5 + emotional_vector.valence * 0.3)),
        guidance=5.0,
        mode="QUALITY",
    )
