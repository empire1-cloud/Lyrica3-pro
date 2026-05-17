"""
VICS Orchestrator: Main agent entrypoint

Coordinates all VICS modules:
1. Subtext Interpreter
2. Cultural Graph lookup
3. Emotional Vector Calculator
4. Respect Protocol
5. Vibe Check
6. Performance Directives
7. DSP Modifiers
"""

from dataclasses import asdict
from typing import Dict, Any, Optional

from .dataclasses import (
    LyricaAgentBlueprint,
    EmotionalVector,
    Subtext,
    CulturalNode,
    RespectProtocol,
    VibeCheck,
    PerformanceDirectives,
    DSPModifiers,
)
from .emotional_vector_calculator import (
    EmotionalVectorInputs,
    calculate_emotional_vector,
)


# ---------------------------------------------------------
# TEMPORARY STUBS (to be replaced with real implementations)
# ---------------------------------------------------------

def interpret_subtext(lyric: str, genre: str) -> Subtext:
    """
    TEMP STUB: Basic subtext interpretation.
    TODO: Replace with LLM-based subtext interpreter.
    
    For now, does simple keyword matching and genre-based inference.
    """
    lyric_lower = lyric.lower()
    
    # Default values
    literal = lyric
    metaphorical = None
    cultural_refs = []
    emotional = None
    performance = None
    
    # SGV Oldies / Chicano Soul specific patterns
    if "sgv" in genre.lower() or "chicano" in genre.lower():
        cultural_refs.append("SGV Chicano Heritage")
        
        if "floor" in lyric_lower:
            metaphorical = "Economic hardship, resilience through adversity"
            emotional = "melancholic resilience"
            performance = "late-pocket groove, breathy vocal, analog warmth"
        
        if "empire" in lyric_lower:
            metaphorical = "Cultural sovereignty, community pride"
            emotional = "defiant pride"
            performance = "forward phrasing, chest resonance"
    
    # Digital loneliness patterns
    if "screen" in lyric_lower or "phone" in lyric_lower or "text" in lyric_lower:
        cultural_refs.append("Digital Age Loneliness")
        metaphorical = "Disconnection in hyper-connected world"
        emotional = "isolated yet surrounded"
        performance = "breathy, detached, reverb-heavy"
    
    # Gospel/spiritual patterns
    if "pray" in lyric_lower or "lord" in lyric_lower or "heaven" in lyric_lower:
        cultural_refs.append("Gospel Influence")
        emotional = "spiritual yearning"
        performance = "melismatic runs, chest resonance, preserve imperfections"
    
    return Subtext(
        literal_meaning=literal,
        metaphorical_meaning=metaphorical,
        cultural_references=cultural_refs,
        emotional_subtext=emotional,
        performance_implications=performance,
    )


def get_relevant_cultural_nodes(lyric: str, genre: str) -> list[CulturalNode]:
    """
    TEMP STUB: Cultural Knowledge Graph lookup.
    TODO: Replace with real graph database or LLM-powered cultural context retrieval.
    
    For now, returns hardcoded nodes based on genre and lyric patterns.
    """
    nodes = []
    lyric_lower = lyric.lower()
    genre_lower = genre.lower()
    
    # SGV Chicano Heritage
    if "sgv" in genre_lower or "chicano" in genre_lower or "el monte" in lyric_lower:
        nodes.append(CulturalNode(
            id="sgv_chicano_heritage",
            name="SGV Chicano Heritage",
            cultural_significance=[
                "East LA / SGV cultural identity",
                "Chicano Soul tradition",
                "Late-pocket groove (laid-back swing)",
                "E♭ Major / C Minor scale preference",
            ],
            emotional_associations=[
                "resilience",
                "community pride",
                "melancholic determination",
                "nocturnal honesty",
            ],
            behavior_trigger="late_pocket_timing, analog_warmth, preserve_vocal_grit"
        ))
    
    # Late-pocket groove (Trap Soul / SGV Oldies)
    if "trap" in genre_lower or "soul" in genre_lower or "oldies" in genre_lower:
        nodes.append(CulturalNode(
            id="late_pocket_groove",
            name="Late-Pocket Groove",
            cultural_significance=[
                "Laid-back swing timing (behind the beat)",
                "Trap Soul / 90s R&B influence",
                "72 BPM sweet spot",
            ],
            emotional_associations=[
                "nocturnal",
                "introspective",
                "unhurried confidence",
            ],
            behavior_trigger="delay_vocal_timing_12ms, soft_quantize"
        ))
    
    # TB-303 Acid Bass (if electronic/house elements)
    if "acid" in genre_lower or "house" in genre_lower or "electronic" in genre_lower:
        nodes.append(CulturalNode(
            id="tb303_acid_bass",
            name="TB-303 Acid Bass",
            cultural_significance=[
                "Chicago House origin",
                "Queer Black Underground",
                "Detroit Techno lineage",
            ],
            emotional_associations=[
                "mechanical yearning",
                "euphoric melancholy",
                "liberation through rhythm",
            ],
            behavior_trigger="acid_bass_sidechain, machine_vs_human_tension"
        ))
    
    # 90s R&B Melisma
    if "r&b" in genre_lower or "rnb" in genre_lower:
        nodes.append(CulturalNode(
            id="rnb_90s_melisma",
            name="90s R&B Melisma",
            cultural_significance=[
                "Black Church Gospel roots",
                "90s R&B vocal tradition",
                "Melismatic runs as emotional release",
            ],
            emotional_associations=[
                "spiritual catharsis",
                "emotional excess as technique",
                "vulnerability through virtuosity",
            ],
            behavior_trigger="melismatic_runs, preserve_imperfections, low_autotune"
        ))
    
    # Digital Loneliness
    if "screen" in lyric_lower or "phone" in lyric_lower or "distance" in lyric_lower:
        nodes.append(CulturalNode(
            id="digital_loneliness",
            name="Digital Age Loneliness",
            cultural_significance=[
                "Hyper-connected isolation",
                "Screen-mediated relationships",
                "Post-pandemic emotional landscape",
            ],
            emotional_associations=[
                "cold",
                "distant",
                "yearning for physical presence",
                "numbness",
            ],
            behavior_trigger="reverb_heavy, breathy_vocal, detached_phrasing"
        ))
    
    return nodes


def apply_respect_protocol(
    genre: str, 
    blueprint: LyricaAgentBlueprint
) -> RespectProtocol:
    """
    Cultural sensitivity guardrail.
    If a musical element originates from a marginalized culture,
    activate Respect Protocol to preserve authenticity and avoid appropriation.
    """
    activated = False
    origin_ack = None
    preserve_imp = False
    autotune = "medium"  # default
    
    # Check for Gospel/Black Church roots
    gospel_nodes = [n for n in blueprint.cultural_nodes if "gospel" in n.name.lower() or "church" in n.name.lower()]
    if gospel_nodes:
        activated = True
        origin_ack = "Gospel_influenced_vocal_technique"
        preserve_imp = True
        autotune = "none"  # never over-polish Gospel melisma
    
    # Check for Chicano/Latinx cultural elements
    chicano_nodes = [n for n in blueprint.cultural_nodes if "chicano" in n.name.lower() or "sgv" in n.name.lower()]
    if chicano_nodes:
        activated = True
        origin_ack = "SGV_Chicano_Soul_tradition"
        preserve_imp = True
        autotune = "low"  # preserve vocal grit
    
    # Check for Queer Black Underground (Chicago House, Ballroom)
    queer_nodes = [n for n in blueprint.cultural_nodes if "queer" in str(n.cultural_significance).lower() or "ballroom" in str(n.cultural_significance).lower()]
    if queer_nodes:
        activated = True
        origin_ack = "Queer_Black_Underground_House_tradition"
        preserve_imp = True
    
    return RespectProtocol(
        activated=activated,
        origin_acknowledgment=origin_ack,
        preserve_imperfections=preserve_imp,
        autotune_amount=autotune,
    )


def run_vibe_check(
    lyric: str, 
    genre: str, 
    user_goal: Optional[str]
) -> VibeCheck:
    """
    Contextual emotional/cultural reasoning.
    Before generating output, ask:
    - What is the cultural context?
    - What is the emotional goal?
    - Am I respecting the source material?
    """
    ctx = f"{genre}"
    goal = user_goal if user_goal else "authentic emotional expression"
    respect_req = False
    notes = None
    
    # Check for cultural sensitivity requirements
    if any(word in genre.lower() for word in ["chicano", "gospel", "queer", "black", "latinx"]):
        respect_req = True
        notes = "Cultural roots detected - Respect Protocol should be active"
    
    # Check for emotional authenticity requirements
    if any(word in lyric.lower() for word in ["pain", "broken", "lonely", "cry"]):
        notes = (notes or "") + " | Raw emotion detected - avoid over-polishing"
    
    return VibeCheck(
        cultural_context=ctx,
        emotional_goal=goal,
        respect_required=respect_req,
        notes=notes,
    )


def build_performance_directives(
    ev: EmotionalVector, 
    subtext: Subtext
) -> PerformanceDirectives:
    """
    Map emotional vector + subtext into performance decisions.
    
    Rules:
    - low valence + low arousal → breathy, slow, nocturnal
    - low valence + high arousal → aggressive, forward, distorted
    - high valence + low arousal → smooth, warm, comfortable
    - high valence + high arousal → bright, open, euphoric
    - hopeful but realistic → rising melody, low brightness
    """
    timbre = "neutral"
    phrasing = "straight"
    articulation = "legato"
    breathiness = 0.3
    intensity = 0.5
    melodic = None

    # Low valence + low arousal (melancholic, introspective)
    if ev.valence < -0.5 and ev.arousal < 0.4:
        timbre = "breathy_detached"
        phrasing = "laid_back"
        articulation = "soft_legato"
        breathiness = 0.7
        intensity = 0.4
        melodic = "wavering_descent"
    
    # Low valence + high arousal (angry, intense)
    elif ev.valence < -0.5 and ev.arousal > 0.6:
        timbre = "aggressive_grit"
        phrasing = "forward_driving"
        articulation = "staccato"
        breathiness = 0.2
        intensity = 0.9
        melodic = "sharp_ascent"
    
    # High valence + low arousal (comfortable, peaceful)
    elif ev.valence > 0.4 and ev.arousal < 0.4:
        timbre = "warm_smooth"
        phrasing = "relaxed"
        articulation = "legato"
        breathiness = 0.4
        intensity = 0.5
        melodic = "gentle_rise"
    
    # High valence + high arousal (joyful, euphoric)
    elif ev.valence > 0.4 and ev.arousal > 0.6:
        timbre = "bright_open"
        phrasing = "forward"
        articulation = "crisp"
        breathiness = 0.2
        intensity = 0.8
        melodic = "soaring_ascent"
    
    # Mid valence (resilient, determined)
    elif -0.3 < ev.valence < 0.3:
        timbre = "grounded_chest"
        phrasing = "steady"
        articulation = "legato"
        breathiness = 0.4
        intensity = 0.6
        melodic = "steady_rise"

    return PerformanceDirectives(
        vocal_timbre=timbre,
        phrasing=phrasing,
        articulation=articulation,
        breathiness=breathiness,
        intensity=intensity,
        melodic_behavior=melodic,
    )


def build_dsp_modifiers(ev: EmotionalVector) -> DSPModifiers:
    """
    Simple emotional → DSP mapping.
    
    Rules:
    - Low valence → more reverb (spaciousness, isolation)
    - High arousal → more saturation (energy, aggression)
    - Low arousal → narrow stereo (intimacy)
    - High arousal → wide stereo (expansiveness)
    """
    reverb = 0.4
    sat = 0.3
    width = 0.5
    humanization = 12  # default 12ms timing variation

    # Low valence (sad/lonely) → spacious reverb
    if ev.valence < -0.5:
        reverb = 0.7
        sat = 0.2
        width = 0.4
        humanization = 8  # tighter timing = more mechanical = digital loneliness
    
    # High arousal (intense) → saturation + wide stereo
    if ev.arousal > 0.7:
        sat = 0.6
        width = 0.8
        humanization = 15  # more variation = more human energy
    
    # Low arousal (calm) → dry + narrow
    if ev.arousal < 0.3:
        reverb = 0.3
        width = 0.4
        humanization = 10

    return DSPModifiers(
        saturation_drive=sat,
        delay_throw_targets=[],
        reverb_amount=reverb,
        stereo_width=width,
        humanization_ms=humanization,
    )


# ---------------------------------------------------------
# MAIN ORCHESTRATOR ENTRYPOINT
# ---------------------------------------------------------

def run_lyrica_agent(
    lyric: str,
    genre: str,
    user_goal: Optional[str] = None,
) -> LyricaAgentBlueprint:
    """
    Main orchestration entrypoint.
    Given a lyric + context, produce a full LyricaAgentBlueprint.
    
    Pipeline:
    1. Subtext Interpreter → understand what the lyric really means
    2. Cultural Graph → map to historical/emotional roots
    3. Emotional Vector → compute valence, arousal, cultural resonance
    4. Vibe Check → verify cultural context and emotional goal
    5. Performance Directives → vocal timbre, phrasing, intensity
    6. DSP Modifiers → reverb, saturation, stereo width
    7. Respect Protocol → cultural sensitivity guardrails
    """

    # 1. Subtext
    sub = interpret_subtext(lyric, genre)

    # 2. Cultural nodes
    nodes = get_relevant_cultural_nodes(lyric, genre)

    # 3. Emotional vector
    ev_inputs = EmotionalVectorInputs(
        lyric=lyric,
        subtext=sub,
        cultural_nodes=nodes,
        explicit_goal=user_goal,
    )
    ev = calculate_emotional_vector(ev_inputs)

    # 4. Vibe check
    vibe = run_vibe_check(lyric, genre, user_goal)

    # 5. Performance directives
    perf = build_performance_directives(ev, sub)

    # 6. DSP modifiers
    dsp = build_dsp_modifiers(ev)

    # 7. Build blueprint
    blueprint = LyricaAgentBlueprint(
        emotional_vector=ev,
        subtext=sub,
        cultural_nodes=nodes,
        performance_directives=perf,
        dsp_modifiers=dsp,
    )
    
    # 8. Respect protocol
    respect = apply_respect_protocol(genre, blueprint)
    blueprint.respect_protocol = respect
    blueprint.vibe_check = vibe

    return blueprint


def run_lyrica_agent_dict(
    lyric: str,
    genre: str,
    user_goal: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Convenience wrapper: returns dict instead of dataclass.
    Useful for JSON serialization or piping into other agents.
    """
    bp = run_lyrica_agent(lyric, genre, user_goal)
    return asdict(bp)
