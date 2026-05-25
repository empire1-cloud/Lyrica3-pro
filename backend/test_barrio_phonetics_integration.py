"""
Test: VICS + Barrio Phonetics Engine Integration
-------------------------------------------------
Verifies that slang-aware phonetic transformations are correctly
integrated into the full VICS pipeline.

Test Cases:
1. Chicano Soul with "homeboy" slang
2. Trap Soul with "finna/tryna" slang
3. Cultural Gatekeeping warning (ese in wrong context)
"""

import sys
sys.path.insert(0, '/home/shiestybizz/Lyrica3-pro/backend')

from lyrica_agent.orchestrator import run_lyrica_agent


def print_test_header(title: str):
    """Print formatted test header."""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80 + "\n")


def print_blueprint_summary(blueprint):
    """Print human-readable blueprint summary."""
    print(f"Cultural Context: {blueprint.vibe_check.cultural_context if blueprint.vibe_check else 'N/A'}")
    print(f"Emotional Vector:")
    print(f"  Valence: {blueprint.emotional_vector.valence:.2f}")
    print(f"  Arousal: {blueprint.emotional_vector.arousal:.2f}")
    print(f"  Cultural Resonance: {blueprint.emotional_vector.cultural_resonance:.2f}")
    
    print(f"\nVocal Archetype: {blueprint.vocal_archetype.name if blueprint.vocal_archetype else 'N/A'}")
    
    if blueprint.vocal_blueprint and blueprint.vocal_blueprint.slang_phonetics:
        slang = blueprint.vocal_blueprint.slang_phonetics
        print(f"\n🔥 BARRIO PHONETICS ENGINE:")
        print(f"  Cultural Lens: {slang['cultural_lens']}")
        print(f"  Detected Slang: {len(slang['transformations'])} terms")
        print(f"  Respect Protocol: {'ACTIVE' if slang['respect_protocol_active'] else 'INACTIVE'}")
        
        if slang['gatekeeping_warnings']:
            print(f"\n  ⚠️  CULTURAL GATEKEEPING WARNINGS:")
            for warning in slang['gatekeeping_warnings']:
                print(f"    {warning}")
        
        if slang['transformations']:
            print(f"\n  PHONETIC TRANSFORMATIONS:")
            for i, trans in enumerate(slang['transformations'], 1):
                print(f"\n    [{i}] {trans['term'].upper()}")
                print(f"        IPA: {trans['ipa_target']}")
                print(f"        Formant Shift: {trans['formant_shift']:.2f}")
                if trans.get('timing_offset_ms'):
                    print(f"        Timing Offset: +{trans['timing_offset_ms']}ms")
                if trans.get('biometric_artifacts'):
                    print(f"        Artifacts: {', '.join(trans['biometric_artifacts'])}")
        
        print(f"\n  Transformed IPA: {slang['transformed_ipa']}")
    else:
        print("\n  (No slang detected)")
    
    print(f"\nRhythmic Mapping:")
    if blueprint.rhythmic_mapping:
        print(f"  BPM: {blueprint.rhythmic_mapping.bpm}")
    
    print(f"\nInstrumentation: {len(blueprint.instrumentation.instruments) if blueprint.instrumentation and hasattr(blueprint.instrumentation, 'instruments') else 0} instruments")
    
    print(f"\nRespect Protocol: {'ACTIVE' if blueprint.respect_protocol and blueprint.respect_protocol.activated else 'INACTIVE'}")
    
    if blueprint.csn_justification:
        print(f"\nCSN Justification (excerpt):")
        print(f"  Emotional: {blueprint.csn_justification.emotional_reasoning[:100]}...")


def test_chicano_soul_homeboy():
    """Test Case 1: Chicano Soul with 'homeboy' slang."""
    print_test_header("TEST 1: Chicano Soul + 'homeboy' slang")
    
    lyric = "Yeah, my homeboy said we gonna roll outta here right now, bro."
    genre = "SGV Oldies"
    
    print(f"Lyric: {lyric}")
    print(f"Genre: {genre}\n")
    
    blueprint = run_lyrica_agent(lyric, genre)
    print_blueprint_summary(blueprint)
    
    # Assertions
    assert blueprint.vocal_blueprint is not None
    assert blueprint.vocal_blueprint.slang_phonetics is not None
    assert len(blueprint.vocal_blueprint.slang_phonetics['transformations']) >= 4
    assert blueprint.vocal_blueprint.slang_phonetics['cultural_lens'] == 'chicano_soul'
    
    print("\n✅ TEST 1 PASSED: Chicano Soul slang detected and transformed")


def test_trap_soul_finna_tryna():
    """Test Case 2: Trap Soul with 'finna/tryna' slang."""
    print_test_header("TEST 2: Trap Soul + 'finna/tryna' slang")
    
    lyric = "I'm finna tell you tryna make it work."
    genre = "Trap Soul"
    
    print(f"Lyric: {lyric}")
    print(f"Genre: {genre}\n")
    
    blueprint = run_lyrica_agent(lyric, genre)
    print_blueprint_summary(blueprint)
    
    # Assertions
    assert blueprint.vocal_blueprint is not None
    assert blueprint.vocal_blueprint.slang_phonetics is not None
    assert len(blueprint.vocal_blueprint.slang_phonetics['transformations']) >= 2
    assert blueprint.vocal_blueprint.slang_phonetics['cultural_lens'] == 'trap_soul'
    
    print("\n✅ TEST 2 PASSED: Trap Soul slang detected and transformed")


def test_cultural_gatekeeping():
    """Test Case 3: Cultural Gatekeeping (ese in wrong context)."""
    print_test_header("TEST 3: Cultural Gatekeeping Warning")
    
    lyric = "What's up ese, tryna roll?"
    genre = "Trap Soul"  # Mismatch: "ese" requires chicano_soul
    
    print(f"Lyric: {lyric}")
    print(f"Genre: {genre}")
    print("(Expected: Cultural Mismatch Warning for 'ese')\n")
    
    blueprint = run_lyrica_agent(lyric, genre)
    print_blueprint_summary(blueprint)
    
    # Assertions
    assert blueprint.vocal_blueprint is not None
    assert blueprint.vocal_blueprint.slang_phonetics is not None
    assert len(blueprint.vocal_blueprint.slang_phonetics['gatekeeping_warnings']) > 0
    assert blueprint.vocal_blueprint.slang_phonetics['respect_protocol_active'] == True
    
    print("\n✅ TEST 3 PASSED: Cultural Gatekeeping Warning triggered")


def main():
    """Run all tests."""
    print("\n" + "🔥"*40)
    print("VICS + BARRIO PHONETICS ENGINE INTEGRATION TESTS")
    print("🔥"*40)
    
    try:
        test_chicano_soul_homeboy()
        test_trap_soul_finna_tryna()
        test_cultural_gatekeeping()
        
        print("\n" + "="*80)
        print("✅ ALL TESTS PASSED - BARRIO PHONETICS ENGINE FULLY INTEGRATED")
        print("="*80 + "\n")
        
        print("SUMMARY:")
        print("  - Slang detection working across cultural lenses")
        print("  - Phonetic transformations (IPA targets, formant shifts, timing offsets)")
        print("  - Cultural Gatekeeping Protocol active")
        print("  - Respect Protocol integration working")
        print("  - CSN + ARRE + Vocal Archetypes + Barrio Phonetics = FULL PIPELINE")
        print("\n🎯 THE MOAT COMPETITORS CANNOT CROSS 🎯\n")
    
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
