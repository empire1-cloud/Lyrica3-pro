"""
Barrio Phonetics Engine
-----------------------
Slang-aware phonetic transformation system that encodes cultural authenticity
into vocal pronunciation via IPA targets, formant shifts, and DSP parameters.

THE MOAT COMPETITORS CANNOT CROSS.

Architecture:
    User Input (slang terms) → Contextual Slang Detector (CSD) → 
    Slang Dictionary Lookup → Phonetic Transformation → 
    Formant Engine (DSP) → Audio Output (culturally authentic)

Author: shiestybizz113-cell
Date: 2026-05-17
"""

import json
import os
import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from pathlib import Path


# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class PhoneticTransformation:
    """
    Represents a slang term's phonetic transformation parameters.
    """
    term: str
    ipa_standard: str
    ipa_target: str
    formant_shift: float = 0.0
    duration_multiplier: float = 1.0
    compression_ratio: Optional[float] = None
    spectral_tilt: Optional[float] = None
    nasal_boost_db: Optional[float] = None
    nasal_boost_hz: Optional[int] = None
    timing_offset_ms: Optional[int] = None
    consonant_softness: Optional[float] = None
    drop_final_r: bool = False
    glottal_stop_t: bool = False
    flapped_t: bool = False
    y_glide_injection: bool = False
    vowel_flatten: bool = False
    syllable_merge: bool = False
    biometric_artifacts: List[str] = field(default_factory=list)
    cultural_note: str = ""
    reference_artists: List[str] = field(default_factory=list)
    cultural_gatekeeping: str = "OPTIONAL"  # OPTIONAL, STRICT
    allowed_lenses: List[str] = field(default_factory=list)
    respect_protocol: bool = False


@dataclass
class SlangDetectionResult:
    """
    Result of slang detection for a given phrase.
    """
    original_phrase: str
    detected_slang: List[Tuple[str, str]]  # [(term, cultural_lens), ...]
    transformations: List[PhoneticTransformation]
    cultural_lens: str
    gatekeeping_warnings: List[str] = field(default_factory=list)
    transformed_phrase_ipa: str = ""


@dataclass
class CulturalMismatchWarning:
    """
    Warning for cultural context mismatch.
    """
    term: str
    required_lens: List[str]
    current_lens: str
    message: str


# ============================================================================
# CONTEXTUAL SLANG DETECTOR (CSD)
# ============================================================================

class ContextualSlangDetector:
    """
    Detects slang terms in text and maps them to cultural contexts.
    Enforces Cultural Gatekeeping Protocol to prevent misuse.
    """
    
    def __init__(self, dictionary_path: Optional[str] = None):
        """
        Initialize the Contextual Slang Detector.
        
        Args:
            dictionary_path: Path to slang_dictionary_v1.json
        """
        if dictionary_path is None:
            # Default to same directory as this script
            script_dir = Path(__file__).parent
            dictionary_path = script_dir / "slang_dictionary_v1.json"
        
        self.dictionary_path = dictionary_path
        self.slang_dict_full = self._load_dictionary()
        
        # Extract just the slang entries (not metadata)
        self.slang_dict = {
            k: v for k, v in self.slang_dict_full.items()
            if k not in ["metadata", "processing_rules", "cultural_gatekeeping", "community_verification"]
        }
        
        # Build reverse lookup: term -> cultural_lens
        self.term_to_lens: Dict[str, str] = {}
        for lens, terms in self.slang_dict.items():
            if isinstance(terms, dict):
                for term in terms.keys():
                    self.term_to_lens[term.lower()] = lens
    
    def _load_dictionary(self) -> Dict:
        """Load slang dictionary from JSON file."""
        try:
            with open(self.dictionary_path, 'r', encoding='utf-8') as f:
                full_data = json.load(f)
                # Extract slang_dictionary_v1 nested object
                return full_data.get("slang_dictionary_v1", {})
        except FileNotFoundError:
            print(f"⚠️ WARNING: Slang dictionary not found at {self.dictionary_path}")
            return {"metadata": {}, "chicano_soul": {}, "trap_soul": {}, "boom_bap": {}, "drill": {}}
    
    def detect_slang(self, text: str, cultural_lens: str) -> SlangDetectionResult:
        """
        Detect slang terms in text and return phonetic transformations.
        
        Args:
            text: Input text with potential slang
            cultural_lens: Current cultural context (e.g., "chicano_soul", "trap_soul")
        
        Returns:
            SlangDetectionResult with detected terms and transformations
        """
        detected_slang: List[Tuple[str, str]] = []
        transformations: List[PhoneticTransformation] = []
        gatekeeping_warnings: List[str] = []
        
        # Tokenize (keep contractions and slang terms intact)
        # Match whole words, including apostrophes for contractions
        words = re.findall(r"\b[\w']+\b", text.lower())
        
        for word in words:
            # Remove apostrophes for lookup (finna's → finna)
            word_clean = word.replace("'", "")
            
            if word_clean in self.term_to_lens:
                slang_lens = self.term_to_lens[word_clean]
                detected_slang.append((word_clean, slang_lens))
                
                # Get transformation parameters
                slang_entry = self.slang_dict[slang_lens][word_clean]
                transformation = self._build_transformation(word_clean, slang_entry, slang_lens)
                
                # Check cultural gatekeeping
                if transformation.cultural_gatekeeping == "STRICT":
                    warning = self._check_cultural_gatekeeping(
                        word_clean, transformation, cultural_lens
                    )
                    if warning:
                        gatekeeping_warnings.append(warning.message)
                
                transformations.append(transformation)
        
        # Build transformed phrase IPA (simplified)
        transformed_ipa = self._build_transformed_ipa(text, transformations)
        
        return SlangDetectionResult(
            original_phrase=text,
            detected_slang=detected_slang,
            transformations=transformations,
            cultural_lens=cultural_lens,
            gatekeeping_warnings=gatekeeping_warnings,
            transformed_phrase_ipa=transformed_ipa
        )
    
    def _build_transformation(
        self, 
        term: str, 
        entry: Dict, 
        cultural_lens: str
    ) -> PhoneticTransformation:
        """Build PhoneticTransformation from dictionary entry."""
        return PhoneticTransformation(
            term=term,
            ipa_standard=entry.get("ipa_standard", ""),
            ipa_target=entry.get("ipa_target", ""),
            formant_shift=entry.get("formant_shift", 0.0),
            duration_multiplier=entry.get("duration_multiplier", 1.0),
            compression_ratio=entry.get("compression_ratio"),
            spectral_tilt=entry.get("spectral_tilt"),
            nasal_boost_db=entry.get("nasal_boost_db"),
            nasal_boost_hz=entry.get("nasal_boost_hz"),
            timing_offset_ms=entry.get("timing_offset_ms"),
            consonant_softness=entry.get("consonant_softness"),
            drop_final_r=entry.get("drop_final_r", False),
            glottal_stop_t=entry.get("glottal_stop_t", False),
            flapped_t=entry.get("flapped_t", False),
            y_glide_injection=entry.get("y_glide_injection", False),
            vowel_flatten=entry.get("vowel_flatten", False),
            syllable_merge=entry.get("syllable_merge", False),
            biometric_artifacts=entry.get("biometric_artifacts", []),
            cultural_note=entry.get("cultural_note", ""),
            reference_artists=entry.get("reference_artists", []),
            cultural_gatekeeping=entry.get("cultural_gatekeeping", "OPTIONAL"),
            allowed_lenses=entry.get("allowed_lenses", []),
            respect_protocol=entry.get("respect_protocol", False)
        )
    
    def _check_cultural_gatekeeping(
        self,
        term: str,
        transformation: PhoneticTransformation,
        current_lens: str
    ) -> Optional[CulturalMismatchWarning]:
        """
        Check if slang term is allowed in current cultural context.
        Returns warning if mismatch detected.
        """
        if transformation.cultural_gatekeeping != "STRICT":
            return None
        
        allowed = transformation.allowed_lenses
        if not allowed:
            return None
        
        if current_lens not in allowed:
            message = (
                f"⚠️ WARNING: Cultural Mismatch\n"
                f"Slang '{term}' requires {', '.join(allowed)} Cultural Lens.\n"
                f"Current Lens: '{current_lens}' (INCOMPATIBLE)"
            )
            return CulturalMismatchWarning(
                term=term,
                required_lens=allowed,
                current_lens=current_lens,
                message=message
            )
        
        return None
    
    def _build_transformed_ipa(
        self, 
        text: str, 
        transformations: List[PhoneticTransformation]
    ) -> str:
        """
        Build IPA representation of transformed phrase.
        (Simplified: just concatenates IPA targets)
        """
        ipa_parts = []
        words = re.findall(r"\b[\w']+\b", text.lower())
        
        for word in words:
            # Remove apostrophes for lookup
            word_clean = word.replace("'", "")
            
            # Check if this word has a transformation
            transformation = next(
                (t for t in transformations if t.term == word_clean),
                None
            )
            if transformation:
                ipa_parts.append(transformation.ipa_target)
            else:
                # No transformation, keep original (placeholder)
                ipa_parts.append(f"/{word_clean}/")
        
        return " ".join(ipa_parts)


# ============================================================================
# PHONETIC TRANSFORMATION PROCESSOR
# ============================================================================

class PhoneticTransformationProcessor:
    """
    Applies phonetic transformations to generate DSP parameters
    for the Formant Engine.
    """
    
    def __init__(self):
        pass
    
    def generate_dsp_parameters(
        self, 
        transformation: PhoneticTransformation
    ) -> Dict:
        """
        Convert phonetic transformation into DSP parameters
        for formant_engine.py processing.
        
        Returns:
            Dict with DSP parameters (formant_shift, spectral_tilt, 
            timing_offset, artifacts, etc.)
        """
        dsp_params = {
            "term": transformation.term,
            "ipa_target": transformation.ipa_target,
            "formant_shift": transformation.formant_shift,
            "duration_multiplier": transformation.duration_multiplier,
            "biometric_artifacts": transformation.biometric_artifacts,
        }
        
        # Optional parameters
        if transformation.spectral_tilt is not None:
            dsp_params["spectral_tilt"] = transformation.spectral_tilt
        
        if transformation.nasal_boost_db is not None and transformation.nasal_boost_hz is not None:
            dsp_params["nasal_boost"] = {
                "db": transformation.nasal_boost_db,
                "hz": transformation.nasal_boost_hz
            }
        
        if transformation.timing_offset_ms is not None:
            dsp_params["timing_offset_ms"] = transformation.timing_offset_ms
        
        if transformation.consonant_softness is not None:
            dsp_params["consonant_softness"] = transformation.consonant_softness
        
        # Boolean flags
        dsp_params["drop_final_r"] = transformation.drop_final_r
        dsp_params["glottal_stop_t"] = transformation.glottal_stop_t
        dsp_params["flapped_t"] = transformation.flapped_t
        dsp_params["vowel_flatten"] = transformation.vowel_flatten
        
        # Compression/syllable merging
        if transformation.compression_ratio is not None:
            dsp_params["compression_ratio"] = transformation.compression_ratio
            dsp_params["syllable_merge"] = transformation.syllable_merge
        
        return dsp_params
    
    def apply_transformations_to_phrase(
        self,
        detection_result: SlangDetectionResult
    ) -> Dict:
        """
        Apply all transformations in a detection result to generate
        complete DSP parameter set for phrase.
        
        Returns:
            Dict with phrase-level DSP parameters
        """
        phrase_dsp = {
            "original_phrase": detection_result.original_phrase,
            "transformed_ipa": detection_result.transformed_phrase_ipa,
            "cultural_lens": detection_result.cultural_lens,
            "transformations": [],
            "gatekeeping_warnings": detection_result.gatekeeping_warnings,
            "respect_protocol_active": False
        }
        
        for transformation in detection_result.transformations:
            dsp_params = self.generate_dsp_parameters(transformation)
            phrase_dsp["transformations"].append(dsp_params)
            
            # Check if Respect Protocol is active
            if transformation.respect_protocol:
                phrase_dsp["respect_protocol_active"] = True
        
        return phrase_dsp


# ============================================================================
# MAIN BARRIO PHONETICS ENGINE
# ============================================================================

class BarrioPhoneticsEngine:
    """
    Main orchestrator for slang-aware phonetic transformations.
    Integrates Contextual Slang Detector + Phonetic Transformation Processor.
    """
    
    def __init__(self, dictionary_path: Optional[str] = None):
        """
        Initialize Barrio Phonetics Engine.
        
        Args:
            dictionary_path: Path to slang_dictionary_v1.json
        """
        self.detector = ContextualSlangDetector(dictionary_path)
        self.processor = PhoneticTransformationProcessor()
    
    def process_lyrics(
        self, 
        lyrics: str, 
        cultural_lens: str,
        verbose: bool = True
    ) -> Dict:
        """
        Main entry point: process lyrics with slang detection and
        phonetic transformation.
        
        Args:
            lyrics: Input lyrics text
            cultural_lens: Cultural context (e.g., "chicano_soul", "trap_soul")
            verbose: Print detailed processing info
        
        Returns:
            Dict with detection results, DSP parameters, warnings
        """
        # Detect slang
        detection = self.detector.detect_slang(lyrics, cultural_lens)
        
        # Generate DSP parameters
        dsp_params = self.processor.apply_transformations_to_phrase(detection)
        
        # Print verbose output
        if verbose:
            self._print_processing_summary(detection, dsp_params)
        
        return {
            "detection_result": detection,
            "dsp_parameters": dsp_params,
            "success": len(detection.gatekeeping_warnings) == 0
        }
    
    def _print_processing_summary(
        self, 
        detection: SlangDetectionResult,
        dsp_params: Dict
    ):
        """Print human-readable processing summary."""
        print("\n" + "="*70)
        print("BARRIO PHONETICS ENGINE - PROCESSING SUMMARY")
        print("="*70)
        print(f"Original Phrase: {detection.original_phrase}")
        print(f"Cultural Lens: {detection.cultural_lens}")
        print(f"Detected Slang: {len(detection.detected_slang)} terms")
        print(f"Respect Protocol: {'ACTIVE' if dsp_params['respect_protocol_active'] else 'INACTIVE'}")
        
        if detection.gatekeeping_warnings:
            print("\n⚠️  CULTURAL GATEKEEPING WARNINGS:")
            for warning in detection.gatekeeping_warnings:
                print(f"  {warning}")
        
        print("\nPHONETIC TRANSFORMATIONS:")
        for i, transformation in enumerate(detection.transformations, 1):
            print(f"\n  [{i}] {transformation.term.upper()}")
            print(f"      IPA: {transformation.ipa_standard} → {transformation.ipa_target}")
            print(f"      Formant Shift: {transformation.formant_shift:.2f}")
            if transformation.timing_offset_ms:
                print(f"      Timing Offset: +{transformation.timing_offset_ms}ms")
            if transformation.biometric_artifacts:
                print(f"      Artifacts: {', '.join(transformation.biometric_artifacts)}")
            if transformation.cultural_note:
                print(f"      Note: {transformation.cultural_note}")
        
        print(f"\nTransformed IPA: {detection.transformed_phrase_ipa}")
        print("="*70 + "\n")


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_barrio_phonetics_spec(
    lyrics: str,
    cultural_lens: str,
    dictionary_path: Optional[str] = None
) -> Dict:
    """
    Quick helper to get Barrio Phonetics processing spec for lyrics.
    
    Args:
        lyrics: Input lyrics
        cultural_lens: Cultural context
        dictionary_path: Optional path to dictionary
    
    Returns:
        Dict with full processing results
    """
    engine = BarrioPhoneticsEngine(dictionary_path)
    return engine.process_lyrics(lyrics, cultural_lens, verbose=False)


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    print("\n🔥 BARRIO PHONETICS ENGINE - TEST MODE 🔥\n")
    
    # Test Case 1: Chicano Soul with "homeboy"
    print("TEST CASE 1: Chicano Soul")
    print("-" * 70)
    engine = BarrioPhoneticsEngine()
    result1 = engine.process_lyrics(
        lyrics="Yeah, my homeboy said we gonna roll outta here right now, bro.",
        cultural_lens="chicano_soul",
        verbose=True
    )
    
    # Test Case 2: Trap Soul with "finna" and "tryna"
    print("\nTEST CASE 2: Trap Soul")
    print("-" * 70)
    result2 = engine.process_lyrics(
        lyrics="I'm finna tell you tryna make it work.",
        cultural_lens="trap_soul",
        verbose=True
    )
    
    # Test Case 3: Cultural Gatekeeping (should warn)
    print("\nTEST CASE 3: Cultural Gatekeeping (ESE in Trap Soul - MISMATCH)")
    print("-" * 70)
    result3 = engine.process_lyrics(
        lyrics="What's up ese, tryna roll?",
        cultural_lens="trap_soul",  # Mismatch: "ese" requires chicano_soul
        verbose=True
    )
    
    print("\n✅ BARRIO PHONETICS ENGINE TESTS COMPLETE\n")
