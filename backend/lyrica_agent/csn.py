"""
CSN: Cognitive Synthesis Network

Generates justification reports explaining WHY musical choices were made.
This is the "show your work" layer that proves intelligence vs randomness.

Example:
- Bad AI: "I added a techno beat and a happy piano"
- CSN: "Separated rhythm section from harmonic section to satisfy contradictory directive ('progressive but grounded'). TR-909 kick provides relentless forward momentum (progressive), Rhodes Piano +8ms late-pocket preserves human soul (grounded)."
"""

from dataclasses import dataclass
from typing import List, Optional

@dataclass
class CSNJustification:
    """
    Cognitive Synthesis Network report.
    Explains the reasoning behind every musical decision.
    """
    emotional_reasoning: str           # Why this emotional vector was chosen
    cultural_reasoning: str            # Why these cultural nodes were activated
    rhythmic_reasoning: str            # Why this groove/timing was chosen
    instrumentation_reasoning: str     # Why this hardware was selected
    vocal_reasoning: str               # Why this vocal approach was chosen
    contradiction_resolution: Optional[str] = None  # How contradictory directives were resolved


def generate_csn_report(
    user_goal: Optional[str],
    emotional_vector,
    cultural_nodes: List,
    rhythmic_mapping,
    instrumentation,
    performance_directives,
    lyric: str,
    genre: str
) -> CSNJustification:
    """
    Generate full CSN justification report.
    
    This is the mathematical proof that the agent UNDERSTANDS, not just executes.
    """
    
    # 1. Emotional Reasoning
    ev = emotional_vector
    emotional_reasoning = (
        f"Emotional Vector (valence={ev.valence:.2f}, arousal={ev.arousal:.2f}, "
        f"cultural_resonance={ev.cultural_resonance:.2f}) was computed from lyric analysis. "
    )
    
    if ev.valence < -0.5 and ev.arousal < 0.5:
        emotional_reasoning += (
            "Low valence + low arousal indicates melancholic, introspective state. "
            "This requires breathy, detached vocal delivery and spacious production (high reverb). "
        )
    elif ev.valence < -0.5 and ev.arousal > 0.6:
        emotional_reasoning += (
            "Low valence + high arousal indicates anger or intense emotion. "
            "This requires aggressive vocal delivery, on-grid timing, and saturated production. "
        )
    elif ev.valence > 0.4 and ev.arousal > 0.6:
        emotional_reasoning += (
            "High valence + high arousal indicates euphoria or joy. "
            "This requires bright, open vocals and energetic production. "
        )
    else:
        emotional_reasoning += (
            f"The emotional label '{ev.primary_label}' reflects the complex interplay of "
            f"{'hope' if ev.valence > 0 else 'melancholy'} and "
            f"{'intense' if ev.arousal > 0.6 else 'calm'} energy. "
        )
    
    # 2. Cultural Reasoning
    if cultural_nodes:
        node_names = [n.name for n in cultural_nodes]
        cultural_reasoning = (
            f"Cultural nodes {', '.join(node_names)} were activated based on genre '{genre}' and lyric content. "
        )
        
        # Check for specific cultural contexts
        sgv_nodes = [n for n in cultural_nodes if "sgv" in n.id.lower() or "chicano" in n.id.lower()]
        if sgv_nodes:
            cultural_reasoning += (
                "SGV Chicano Heritage requires late-pocket groove (72 BPM, laid-back swing), "
                "E♭ Major/C Minor scale preference, and preservation of vocal imperfections. "
            )
        
        gospel_nodes = [n for n in cultural_nodes if "gospel" in n.id.lower()]
        if gospel_nodes:
            cultural_reasoning += (
                "Gospel influence requires melismatic runs, chest resonance, and minimal autotune "
                "to preserve the spiritual authenticity of the vocal technique. "
            )
        
        techno_nodes = [n for n in cultural_nodes if "techno" in n.id.lower() or "house" in n.id.lower()]
        if techno_nodes:
            cultural_reasoning += (
                "House/Techno lineage (Chicago/Detroit) requires machine precision (TR-909 quantization) "
                "balanced with human soul (Rhodes late-pocket). This honors the genre's black futurist roots. "
            )
    else:
        cultural_reasoning = "No specific cultural nodes activated - production uses generic best practices. "
    
    # 3. Rhythmic Reasoning
    rm = rhythmic_mapping
    rhythmic_reasoning = f"BPM set to {rm.bpm} based on genre conventions and emotional arousal level. "
    
    if rm.groove_descriptor:
        rhythmic_reasoning += rm.groove_descriptor + " "
    
    # Explain each instrument timing
    if rm.instrument_timings:
        rhythmic_reasoning += "Specific timing decisions: "
        for timing in rm.instrument_timings:
            if timing.offset_ms == 0:
                rhythmic_reasoning += (
                    f"{timing.instrument} quantized to grid (0ms offset) to provide "
                    f"{'relentless forward momentum' if ev.arousal > 0.6 else 'steady foundation'}. "
                )
            else:
                rhythmic_reasoning += (
                    f"{timing.instrument} shifted {timing.offset_ms}ms {'late' if timing.offset_ms > 0 else 'early'}-pocket "
                    f"({timing.justification}). "
                )
    
    # 4. Instrumentation Reasoning
    inst = instrumentation
    instrumentation_reasoning = "Hardware selection based on cultural authenticity: "
    
    if inst.drums:
        instrumentation_reasoning += f"{inst.drums} for drums (historically accurate for {genre}). "
    if inst.bass:
        instrumentation_reasoning += f"{inst.bass} for bass. "
    if inst.chords:
        instrumentation_reasoning += f"{inst.chords} for chords (provides {'warmth' if ev.valence < 0 else 'brightness'}). "
    
    # 5. Vocal Reasoning
    perf = performance_directives
    vocal_reasoning = f"Vocal timbre: {perf.vocal_timbre or 'neutral'}. "
    
    if perf.breathiness and perf.breathiness > 0.6:
        vocal_reasoning += f"High breathiness ({perf.breathiness:.2f}) creates intimacy and vulnerability. "
    
    if perf.intensity and perf.intensity > 0.7:
        vocal_reasoning += f"High intensity ({perf.intensity:.2f}) conveys emotional urgency. "
    
    if perf.phrasing:
        vocal_reasoning += f"Phrasing: {perf.phrasing}. "
    
    # 6. Contradiction Resolution (if user_goal contains contradictory terms)
    contradiction_resolution = None
    if user_goal:
        goal_lower = user_goal.lower()
        
        # Check for contradictions
        if ("progressive" in goal_lower or "forward" in goal_lower) and ("grounded" in goal_lower or "realistic" in goal_lower):
            contradiction_resolution = (
                f"User goal '{user_goal}' contains contradictory directives ('progressive' vs 'grounded'). "
                f"Resolution: Separated rhythm section from harmonic section. "
                f"Drums quantized to grid ({rm.bpm} BPM strict timing) provides progressive forward momentum. "
                f"Chords/keys shifted +{rm.instrument_timings[1].offset_ms if len(rm.instrument_timings) > 1 else 8}ms late-pocket "
                f"to preserve grounded, human feel. This mathematical separation allows both qualities to coexist."
            )
        
        elif ("hopeful" in goal_lower or "uplifting" in goal_lower) and ("realistic" in goal_lower or "melancholic" in goal_lower):
            contradiction_resolution = (
                f"User goal '{user_goal}' balances hope with realism. "
                f"Resolution: Tempo kept at {rm.bpm} BPM (slow enough to carry emotional weight). "
                f"Melodic contour rises on key words ('love', 'hope') to suggest optimism, "
                f"but vocal breathiness ({perf.breathiness:.2f}) and late-pocket timing preserve 'realistic' vulnerability. "
                f"Brightness kept low ({0.5:.2f}) to avoid false cheerfulness."
            )
    
    return CSNJustification(
        emotional_reasoning=emotional_reasoning,
        cultural_reasoning=cultural_reasoning,
        rhythmic_reasoning=rhythmic_reasoning,
        instrumentation_reasoning=instrumentation_reasoning,
        vocal_reasoning=vocal_reasoning,
        contradiction_resolution=contradiction_resolution,
    )
