"""
VICS Emotional Vector Calculator: Affective State Machine

Maintains an internal Emotional Vector that updates with every lyric, phrase, or musical cue.
Emotional Vector Dimensions:
- Valence: -1.0 (sad/angry) → +1.0 (joyful/hopeful)
- Arousal: 0.0 (calm) → 1.0 (intense)
- Cultural Resonance: 0.0 (generic) → 1.0 (deeply rooted/subcultural)
"""

from dataclasses import dataclass
from typing import List, Optional

from .dataclasses import EmotionalVector, Subtext, CulturalNode


# ---------------------------------------------------------
# Emotion keyword priors (expandable)
# ---------------------------------------------------------

EMOTION_KEYWORDS = {
    # Low valence, low arousal (melancholic)
    "lonely":      (-0.8, 0.2),
    "alone":       (-0.7, 0.3),
    "numb":        (-0.6, 0.2),
    "empty":       (-0.7, 0.2),
    "cold":        (-0.7, 0.3),
    "distance":    (-0.6, 0.3),
    "fade":        (-0.5, 0.2),
    "ghost":       (-0.7, 0.3),
    
    # Low valence, high arousal (angry/intense)
    "heartbroken": (-0.9, 0.4),
    "angry":       (-0.6, 0.8),
    "rage":        (-0.7, 0.9),
    "fire":        (-0.3, 0.9),
    "burn":        (-0.4, 0.8),
    "scream":      (-0.5, 0.9),
    
    # Low valence, mid arousal (sad)
    "sad":         (-0.7, 0.3),
    "cry":         (-0.8, 0.4),
    "tears":       (-0.7, 0.4),
    "broken":      (-0.8, 0.5),
    "hurt":        (-0.7, 0.5),
    "pain":        (-0.7, 0.6),
    
    # Mid valence, low arousal (nostalgic/reflective)
    "nostalgic":   (-0.2, 0.4),
    "remember":    (-0.2, 0.3),
    "memory":      (-0.1, 0.3),
    "dream":       (0.1, 0.4),
    "past":        (-0.3, 0.3),
    
    # Mid valence, mid arousal (resilient/determined)
    "resilience":  (0.3, 0.6),
    "fight":       (0.2, 0.7),
    "rise":        (0.4, 0.6),
    "stand":       (0.3, 0.5),
    "survive":     (0.2, 0.6),
    
    # High valence, low arousal (comfort/peace)
    "comfort":     (0.4, 0.3),
    "peace":       (0.6, 0.2),
    "calm":        (0.5, 0.2),
    "warm":        (0.6, 0.3),
    "home":        (0.5, 0.3),
    
    # High valence, mid arousal (hopeful)
    "hopeful":     (0.5, 0.5),
    "hope":        (0.6, 0.5),
    "light":       (0.5, 0.4),
    "smile":       (0.6, 0.5),
    "love":        (0.7, 0.6),
    
    # High valence, high arousal (euphoric/joyful)
    "euphoric":    (0.9, 0.9),
    "joy":         (0.8, 0.7),
    "celebrate":   (0.8, 0.8),
    "dance":       (0.7, 0.8),
    "free":        (0.7, 0.7),
    
    # Cultural/emotional phrases
    "catharsis":   (0.2, 0.7),
    "screen":      (-0.6, 0.3),  # digital loneliness
    "floor":       (-0.4, 0.4),  # survival/resilience
    "streets":     (0.1, 0.6),   # cultural identity
    "empire":      (0.4, 0.7),   # pride/sovereignty
}


# ---------------------------------------------------------
# Cultural resonance weights (SGV-specific)
# ---------------------------------------------------------

CULTURAL_NODE_WEIGHTS = {
    "screen_is_cold": 0.3,
    "tb303_acid_bass": 0.2,
    "rnb_90s_melisma": 0.25,
    "trap_hi_hats": 0.15,
    "sgv_chicano_heritage": 0.35,
    "late_pocket_groove": 0.25,
    "gospel_melisma": 0.30,
    "analog_warmth": 0.20,
    "digital_loneliness": 0.25,
    "el_monte_pride": 0.35,
}


# ---------------------------------------------------------
# Input wrapper for calculator
# ---------------------------------------------------------

@dataclass
class EmotionalVectorInputs:
    lyric: str
    subtext: Optional[Subtext] = None
    cultural_nodes: Optional[List[CulturalNode]] = None
    explicit_goal: Optional[str] = None  # e.g. "hopeful but realistic"


# ---------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------

def _infer_valence_arousal_from_text(text: str) -> Optional[tuple[float, float]]:
    """
    Scan text for emotion keywords and return (valence, arousal) tuple.
    """
    text_l = text.lower()
    
    # Try exact word matches first
    for word, (v, a) in EMOTION_KEYWORDS.items():
        if word in text_l:
            return v, a
    
    # Fallback: check for partial matches (e.g. "remembering" → "remember")
    for word, (v, a) in EMOTION_KEYWORDS.items():
        if word in text_l or text_l in word:
            return v, a
    
    return None


def _compute_cultural_resonance(nodes: List[CulturalNode] | None) -> float:
    """
    Calculate cultural resonance score from Cultural Knowledge Graph nodes.
    Higher score = more culturally grounded (less generic).
    """
    if not nodes:
        return 0.0
    
    base = 0.1  # baseline for any cultural awareness
    boost = sum(CULTURAL_NODE_WEIGHTS.get(n.id, 0.0) for n in nodes)
    
    return max(0.0, min(1.0, base + boost))


# ---------------------------------------------------------
# Main Emotional Vector Calculator
# ---------------------------------------------------------

def calculate_emotional_vector(inputs: EmotionalVectorInputs) -> EmotionalVector:
    """
    Core Affective State Machine:
    - Reads lyric, subtext, explicit goal, and cultural nodes
    - Produces a normalized EmotionalVector
    
    Priority order:
    1. Explicit emotional goal (user-specified)
    2. Subtext emotional meaning (interpreted)
    3. Raw lyric keywords (fallback)
    """

    # 1. Start neutral
    valence = 0.0
    arousal = 0.5
    label = "neutral"

    # 2. Explicit emotional goal (highest priority)
    if inputs.explicit_goal:
        maybe = _infer_valence_arousal_from_text(inputs.explicit_goal)
        if maybe:
            valence, arousal = maybe
            label = inputs.explicit_goal

    # 3. Subtext emotional meaning
    if label == "neutral" and inputs.subtext and inputs.subtext.emotional_subtext:
        maybe = _infer_valence_arousal_from_text(inputs.subtext.emotional_subtext)
        if maybe:
            valence, arousal = maybe
            label = inputs.subtext.emotional_subtext

    # 4. Raw lyric fallback
    if label == "neutral":
        maybe = _infer_valence_arousal_from_text(inputs.lyric)
        if maybe:
            valence, arousal = maybe
            label = f"lyric: {inputs.lyric[:30]}"

    # 5. Cultural resonance
    cultural_resonance = _compute_cultural_resonance(inputs.cultural_nodes or [])

    # 6. Clamp values to valid ranges
    valence = max(-1.0, min(1.0, valence))
    arousal = max(0.0, min(1.0, arousal))

    return EmotionalVector(
        valence=valence,
        arousal=arousal,
        cultural_resonance=cultural_resonance,
        primary_label=label,
        confidence=0.85,
    )
