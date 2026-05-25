"""
Vocal Archetypes (z_S_style)

Specific historical vocal styles instead of generic descriptors.
Not "breathy vocal" - "90s House Gospel Diva (Echoes of Crystal Waters)"

Each archetype includes:
- Historical reference
- Phonation characteristics
- Biometric artifact patterns
- Cultural significance
- Slang-aware phonetic transformations (Barrio Phonetics Engine)
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict
from .barrio_phonetics_engine import BarrioPhoneticsEngine


@dataclass
class VocalArchetype:
    """
    Specific vocal style archetype with historical grounding.
    """
    name: str                          # e.g. "90s House Gospel Diva"
    description: str                   # Full description
    cultural_origin: str               # Where this style came from
    reference_artists: List[str]       # Specific artists who embody this style
    phonation: str                     # How the voice is produced
    breathiness: float                 # 0.0 → 1.0
    chest_resonance: float             # 0.0 → 1.0
    vulnerability_level: float         # 0.0 → 1.0
    artifacts: List[str] = field(default_factory=list)  # Biometric artifacts
    

# ---------------------------------------------------------
# Vocal Archetype Database
# ---------------------------------------------------------

VOCAL_ARCHETYPES = {
    "90s_house_gospel_diva": VocalArchetype(
        name="90s House/Techno Gospel Diva",
        description="Powerful, chest-dominant belt with gospel melismatic runs, designed to cut through heavy electronic textures",
        cultural_origin="Chicago House, Detroit Techno - Black Church Gospel tradition meeting electronic music",
        reference_artists=["Crystal Waters", "Martha Wash", "Loleatta Holloway", "CeCe Peniston"],
        phonation="Commanding, chest-dominant belt with rhythmic gospel phrasing",
        breathiness=0.3,
        chest_resonance=0.9,
        vulnerability_level=0.4,
        artifacts=["<sharp_rhythmic_inhale>", "<chest_resonance_surge>", "<melismatic_run>", "<defiant_vocal_break_on_apex>"],
    ),
    
    "trap_soul_nocturnal": VocalArchetype(
        name="Trap Soul Nocturnal (Late-Night Honesty)",
        description="Breathy, detached, intimate vocal with subtle melismatic drift - 3am confessional energy",
        cultural_origin="Trap Soul (Bryson Tiller, 6LACK, PARTYNEXTDOOR) - post-Drake emotional vulnerability",
        reference_artists=["Bryson Tiller", "6LACK", "PARTYNEXTDOOR", "Summer Walker"],
        phonation="Breathy, laid-back, slightly detached - close-mic intimacy",
        breathiness=0.8,
        chest_resonance=0.4,
        vulnerability_level=0.9,
        artifacts=["<breathy_fade>", "<melismatic_drift>", "<rhythmic_sigh>", "<soft_spoken>"],
    ),
    
    "chicano_soul_requinto": VocalArchetype(
        name="Chicano Soul Requinto Voice",
        description="Warm, mid-range vocal with slight rasp - Oldies/Lowrider Soul tradition",
        cultural_origin="SGV Chicano Soul, East LA Oldies - Art Laboe, cruising culture",
        reference_artists=["Thee Midniters", "Tierra", "War", "El Chicano"],
        phonation="Warm, conversational, mid-range with emotional grit",
        breathiness=0.5,
        chest_resonance=0.6,
        vulnerability_level=0.7,
        artifacts=["<emotional_crack>", "<melismatic_drift>", "<chest_resonance>"],
    ),
    
    "90s_rnb_melisma": VocalArchetype(
        name="90s R&B Melismatic Virtuoso",
        description="Melismatic runs as emotional release - Gospel-influenced R&B vocal acrobatics",
        cultural_origin="90s R&B - Black Church Gospel tradition (Whitney Houston, Mariah Carey, Brandy)",
        reference_artists=["Whitney Houston", "Mariah Carey", "Brandy", "Monica", "Toni Braxton"],
        phonation="Powerful chest voice with head voice transitions, extensive melismatic runs",
        breathiness=0.4,
        chest_resonance=0.8,
        vulnerability_level=0.6,
        artifacts=["<melismatic_run>", "<chest_resonance>", "<emotional_crack>", "<breathy_fade>"],
    ),
    
    "boom_bap_monotone": VocalArchetype(
        name="Boom Bap Monotone Flow",
        description="Low-energy, conversational rap delivery - MF DOOM/Nas style storytelling",
        cultural_origin="90s East Coast Hip-Hop - emphasis on lyricism over vocal acrobatics",
        reference_artists=["MF DOOM", "Nas", "AZ", "Rakim"],
        phonation="Monotone, conversational, laid-back delivery with rhythmic precision",
        breathiness=0.3,
        chest_resonance=0.7,
        vulnerability_level=0.3,
        artifacts=["<rhythmic_sigh>", "<soft_spoken>"],
    ),
    
    "drill_aggression": VocalArchetype(
        name="Drill Aggressive Monotone",
        description="Low, menacing monotone with minimal melodic variation - UK/Chicago Drill energy",
        cultural_origin="Chicago/UK Drill - dark, nihilistic energy",
        reference_artists=["Chief Keef", "Pop Smoke", "Headie One", "Digga D"],
        phonation="Low-register, aggressive monotone with sharp consonants",
        breathiness=0.2,
        chest_resonance=0.9,
        vulnerability_level=0.1,
        artifacts=["<chest_resonance>", "<peak_intensity>"],
    ),
    
    "emo_rap_autotune": VocalArchetype(
        name="Emo Rap Autotuned Wail",
        description="Heavy autotune, melodic wailing - Juice WRLD/Lil Uzi style emotional excess",
        cultural_origin="Emo Rap/SoundCloud Rap - vulnerability through melodic excess",
        reference_artists=["Juice WRLD", "Lil Uzi Vert", "Trippie Redd"],
        phonation="Melodic, autotuned wails with emotional cracks preserved",
        breathiness=0.6,
        chest_resonance=0.5,
        vulnerability_level=0.9,
        artifacts=["<emotional_crack>", "<melismatic_drift>", "<peak_intensity>"],
    ),
    
    "neo_soul_rasp": VocalArchetype(
        name="Neo-Soul Raspy Warmth",
        description="Raspy, warm, conversational vocal - Erykah Badu/D'Angelo intimacy",
        cultural_origin="Neo-Soul movement (90s-2000s) - raw, unpolished vocal texture",
        reference_artists=["Erykah Badu", "D'Angelo", "Jill Scott", "Maxwell"],
        phonation="Raspy, conversational, warm mid-range - minimal polish",
        breathiness=0.5,
        chest_resonance=0.7,
        vulnerability_level=0.8,
        artifacts=["<emotional_crack>", "<breathy_fade>", "<soft_spoken>"],
    ),
    
    # =================================================================
    # GLOBAL EXPANSION ARCHETYPES (SOULFIRE EXPANSION MAP)
    # =================================================================
    
    "lagos_pulse_leader": VocalArchetype(
        name="Lagos Pulse Leader (Afrobeat/Afropop)",
        description="Bright, airy, forward vocal cutting through dense polyrhythmic percussion - West African joy and community",
        cultural_origin="Lagos/West Africa - Fela Kuti legacy, Afrobeat polyrhythm, Pidgin English, Yoruba inflection",
        reference_artists=["Burna Boy", "Wizkid", "Tems", "Fela Kuti", "Tiwa Savage"],
        phonation="Bright, airy, forward - cuts through percussion with +3dB @ 4kHz boost",
        breathiness=0.4,
        chest_resonance=0.6,
        vulnerability_level=0.3,  # Joy, not melancholy
        artifacts=["<call_and_response_echo>", "<polyrhythmic_sync>", "<yoruba_tonal_shift>"],
    ),
    
    "seoul_shine_idol": VocalArchetype(
        name="Seoul Shine Idol (K-Pop/K-Ballad)",
        description="Crystal-clear, high-fidelity vocal with extreme precision - technical virtuosity and emotional extremes",
        cultural_origin="Seoul/K-Pop Industry - SM/JYP/YG training systems, idol vocal techniques",
        reference_artists=["IU", "Taeyeon", "Baekhyun", "Ailee", "ROSÉ"],
        phonation="Crystal clear, glass-like transparency - zero noise floor, extreme compression",
        breathiness=0.1,  # Minimal breathiness (clean production)
        chest_resonance=0.5,
        vulnerability_level=0.7,
        artifacts=["<ad_lib_high_note>", "<precise_vibrato_switch>", "<konglish_code_switch>"],
    ),
    
    "london_fog_driller": VocalArchetype(
        name="London Fog Driller (UK Drill/Grime)",
        description="Dry, monotone, menacing vocal - aggressive coldness and street reality",
        cultural_origin="London/UK Drill - MLE (Multicultural London English), cold intimidation",
        reference_artists=["Headie One", "Digga D", "Central Cee", "Skepta", "Dave"],
        phonation="Dry, monotone, menacing - minimal reverb, close-mic, low brightness",
        breathiness=0.2,
        chest_resonance=0.9,
        vulnerability_level=0.1,  # Aggression, not vulnerability
        artifacts=["<sarcastic_chuckle>", "<glottal_stop_hard>", "<staccato_anticipatory>"],
    ),
}


def select_vocal_archetype(
    genre: str,
    emotional_vector,
    cultural_nodes: List,
    mood: str = None
) -> VocalArchetype:
    """
    Select the most appropriate vocal archetype based on context.
    
    Returns a specific historical vocal style, not generic descriptors.
    Supports global archetypes: Chicano Soul, Afrobeat, K-Pop, UK Drill.
    """
    genre_lower = genre.lower()
    
    # GLOBAL EXPANSION ARCHETYPES
    if "afrobeat" in genre_lower or "afropop" in genre_lower or "lagos" in genre_lower:
        return VOCAL_ARCHETYPES["lagos_pulse_leader"]
    
    elif "k-pop" in genre_lower or "kpop" in genre_lower or "k-ballad" in genre_lower or "seoul" in genre_lower:
        return VOCAL_ARCHETYPES["seoul_shine_idol"]
    
    elif "uk drill" in genre_lower or ("uk" in genre_lower and "drill" in genre_lower) or "grime" in genre_lower or "london" in genre_lower:
        return VOCAL_ARCHETYPES["london_fog_driller"]
    
    # ORIGINAL ARCHETYPES
    elif "house" in genre_lower or "techno" in genre_lower:
        return VOCAL_ARCHETYPES["90s_house_gospel_diva"]
    
    elif "trap soul" in genre_lower or ("trap" in genre_lower and "soul" in genre_lower):
        return VOCAL_ARCHETYPES["trap_soul_nocturnal"]
    
    elif "sgv" in genre_lower or "chicano" in genre_lower or "oldies" in genre_lower:
        return VOCAL_ARCHETYPES["chicano_soul_requinto"]
    
    elif "r&b" in genre_lower or "rnb" in genre_lower:
        return VOCAL_ARCHETYPES["90s_rnb_melisma"]
    
    elif "boom bap" in genre_lower or "hip hop" in genre_lower:
        return VOCAL_ARCHETYPES["boom_bap_monotone"]
    
    elif "drill" in genre_lower:  # General drill (defaults to UK)
        return VOCAL_ARCHETYPES["london_fog_driller"]
    
    elif "emo" in genre_lower and "rap" in genre_lower:
        return VOCAL_ARCHETYPES["emo_rap_autotune"]
    
    elif "neo soul" in genre_lower or "neo-soul" in genre_lower:
        return VOCAL_ARCHETYPES["neo_soul_rasp"]
    
    # Fallback: use emotional vector
    elif emotional_vector.arousal > 0.7 and emotional_vector.valence < -0.3:
        return VOCAL_ARCHETYPES["drill_aggression"]
    
    elif emotional_vector.arousal < 0.4 and emotional_vector.valence < 0:
        # Low arousal + negative valence = vulnerable, intimate
        return VOCAL_ARCHETYPES["trap_soul_nocturnal"]
    
    elif emotional_vector.cultural_resonance > 0.7:
        # High cultural resonance → use culturally-grounded archetype
        return VOCAL_ARCHETYPES["chicano_soul_requinto"]
    
    else:
        # Default to Neo-Soul (versatile, emotional)
        return VOCAL_ARCHETYPES["neo_soul_rasp"]


@dataclass
class VocalBlueprint:
    """
    Full vocal blueprint combining archetype + performance directives + slang phonetics.
    This is what gets sent to the TTS engine or vocal synthesis module.
    """
    archetype: VocalArchetype
    performance_directives: object     # PerformanceDirectives from dataclasses.py
    autotune_amount: str               # "none" | "low" | "medium" | "high"
    respect_protocol_active: bool
    slang_phonetics: Optional[Dict] = None  # Barrio Phonetics DSP parameters


def select_vocal_archetype_with_slang(
    genre: str,
    emotional_vector,
    cultural_nodes: List,
    lyrics: str = "",
    mood: str = None
) -> tuple[VocalArchetype, Optional[Dict]]:
    """
    Select the most appropriate vocal archetype based on context,
    AND process slang phonetics if lyrics are provided.
    
    Returns:
        (VocalArchetype, slang_phonetics_dict or None)
    """
    # Step 1: Select base archetype (existing logic)
    archetype = select_vocal_archetype(genre, emotional_vector, cultural_nodes, mood)
    
    # Step 2: Process slang phonetics if lyrics provided
    slang_phonetics = None
    if lyrics:
        # Map genre to cultural lens
        cultural_lens = _map_genre_to_cultural_lens(genre)
        
        # Run Barrio Phonetics Engine
        try:
            engine = BarrioPhoneticsEngine()
            result = engine.process_lyrics(
                lyrics=lyrics,
                cultural_lens=cultural_lens,
                verbose=False
            )
            
            if result["success"]:
                slang_phonetics = result["dsp_parameters"]
            else:
                # Cultural gatekeeping warning - log but continue
                print(f"⚠️ Barrio Phonetics Warning: {result['dsp_parameters']['gatekeeping_warnings']}")
                slang_phonetics = result["dsp_parameters"]
        
        except Exception as e:
            print(f"⚠️ Barrio Phonetics Engine error: {e}")
            slang_phonetics = None
    
    return archetype, slang_phonetics


def _map_genre_to_cultural_lens(genre: str) -> str:
    """
    Map genre to cultural lens for Barrio Phonetics Engine.
    Supports global cultural lenses.
    """
    genre_lower = genre.lower()
    
    # GLOBAL EXPANSION LENSES
    if "afrobeat" in genre_lower or "afropop" in genre_lower or "lagos" in genre_lower:
        return "afrobeat_lagos"
    elif "k-pop" in genre_lower or "kpop" in genre_lower or "k-ballad" in genre_lower or "seoul" in genre_lower:
        return "kpop_seoul"
    elif "uk drill" in genre_lower or ("uk" in genre_lower and "drill" in genre_lower) or "grime" in genre_lower or "london" in genre_lower:
        return "uk_drill_london"
    
    # ORIGINAL LENSES
    elif "chicano" in genre_lower or "sgv" in genre_lower or "oldies" in genre_lower:
        return "chicano_soul"
    elif "trap soul" in genre_lower or ("trap" in genre_lower and "soul" in genre_lower):
        return "trap_soul"
    elif "boom bap" in genre_lower or "hip hop" in genre_lower:
        return "boom_bap"
    elif "drill" in genre_lower:
        return "uk_drill_london"  # Default drill to UK
    else:
        # Default to trap_soul (most versatile slang dictionary)
        return "trap_soul"
