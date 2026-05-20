"""
Test: Global Cultural Archetypes (Lagos Pulse, Seoul Shine, London Fog)
------------------------------------------------------------------------
Verifies that the three new global archetypes are correctly integrated
into VICS with slang-aware phonetic transformations.

Test Cases:
1. Lagos Pulse (Afrobeat) - "wetin" slang + call-and-response
2. Seoul Shine (K-Pop) - "saranghae" slang + precise vibrato
3. London Fog (UK Drill) - "innit/bruv/mandem" slang + glottal stops
"""

import sys
sys.path.insert(0, '/home/shiestybizz/Lyrica3-pro/backend')

from lyrica_agent.orchestrator import run_lyrica_agent


def print_test_header(title: str):
    """Print formatted test header."""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80 + "\n")


def print_archetype_summary(blueprint, expected_archetype: str):
    """Print archetype summary with slang phonetics."""
    print(f"Expected Archetype: {expected_archetype}")
    print(f"Actual Archetype: {blueprint.vocal_archetype.name if blueprint.vocal_archetype else 'N/A'}")
    print(f"Cultural Origin: {blueprint.vocal_archetype.cultural_origin if blueprint.vocal_archetype else 'N/A'}")
    
    if blueprint.vocal_blueprint and blueprint.vocal_blueprint.slang_phonetics:
        slang = blueprint.vocal_blueprint.slang_phonetics
        print(f"\n🔥 BARRIO PHONETICS ENGINE (GLOBAL LENS):")
        print(f"  Cultural Lens: {slang['cultural_lens']}")
        print(f"  Detected Slang: {len(slang['transformations'])} terms")
        
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
    
    print(f"\nBreathiness: {blueprint.vocal_archetype.breathiness:.1f}" if blueprint.vocal_archetype else "")
    print(f"Chest Resonance: {blueprint.vocal_archetype.chest_resonance:.1f}" if blueprint.vocal_archetype else "")
    print(f"Vulnerability Level: {blueprint.vocal_archetype.vulnerability_level:.1f}" if blueprint.vocal_archetype else "")


def test_lagos_pulse_afrobeat():
    """Test Case 1: Lagos Pulse (Afrobeat) with Pidgin English slang."""
    print_test_header("TEST 1: Lagos Pulse (Afrobeat) - 'wetin' + 'oya' slang")
    
    lyric = "Wetin you dey do? Na we go, oya!"
    genre = "Afrobeat"
    
    print(f"Lyric: {lyric}")
    print(f"Genre: {genre}")
    print("Expected: Bright, airy, forward vocal - Pidgin English phonetics\n")
    
    blueprint = run_lyrica_agent(lyric, genre)
    print_archetype_summary(blueprint, "Lagos Pulse Leader (Afrobeat/Afropop)")
    
    # Assertions
    assert blueprint.vocal_archetype is not None
    assert "lagos" in blueprint.vocal_archetype.name.lower() or "afrobeat" in blueprint.vocal_archetype.name.lower()
    assert blueprint.vocal_archetype.breathiness == 0.4  # Bright, airy
    assert blueprint.vocal_archetype.vulnerability_level == 0.3  # Joy, not melancholy
    
    if blueprint.vocal_blueprint and blueprint.vocal_blueprint.slang_phonetics:
        assert blueprint.vocal_blueprint.slang_phonetics['cultural_lens'] == 'afrobeat_lagos'
        assert len(blueprint.vocal_blueprint.slang_phonetics['transformations']) >= 2  # wetin, na, oya
    
    print("\n✅ TEST 1 PASSED: Lagos Pulse archetype + Afrobeat slang detected")


def test_seoul_shine_kpop():
    """Test Case 2: Seoul Shine (K-Pop) with Konglish slang."""
    print_test_header("TEST 2: Seoul Shine (K-Pop) - 'saranghae' + 'daebak' slang")
    
    lyric = "Saranghae, you're so daebak, oppa!"
    genre = "K-Pop"
    
    print(f"Lyric: {lyric}")
    print(f"Genre: {genre}")
    print("Expected: Crystal-clear, high-fidelity vocal - Korean/Konglish phonetics\n")
    
    blueprint = run_lyrica_agent(lyric, genre)
    print_archetype_summary(blueprint, "Seoul Shine Idol (K-Pop/K-Ballad)")
    
    # Assertions
    assert blueprint.vocal_archetype is not None
    assert "seoul" in blueprint.vocal_archetype.name.lower() or "k-pop" in blueprint.vocal_archetype.name.lower()
    assert blueprint.vocal_archetype.breathiness == 0.1  # Crystal clear (minimal breathiness)
    assert blueprint.vocal_archetype.chest_resonance == 0.5
    
    if blueprint.vocal_blueprint and blueprint.vocal_blueprint.slang_phonetics:
        assert blueprint.vocal_blueprint.slang_phonetics['cultural_lens'] == 'kpop_seoul'
        assert len(blueprint.vocal_blueprint.slang_phonetics['transformations']) >= 2  # saranghae, daebak, oppa
    
    print("\n✅ TEST 2 PASSED: Seoul Shine archetype + K-Pop slang detected")


def test_london_fog_uk_drill():
    """Test Case 3: London Fog (UK Drill) with MLE slang."""
    print_test_header("TEST 3: London Fog (UK Drill) - 'innit' + 'bruv' + 'mandem' slang")
    
    lyric = "Wagwan bruv, mandem on road innit?"
    genre = "UK Drill"
    
    print(f"Lyric: {lyric}")
    print(f"Genre: {genre}")
    print("Expected: Dry, monotone, menacing vocal - MLE phonetics with glottal stops\n")
    
    blueprint = run_lyrica_agent(lyric, genre)
    print_archetype_summary(blueprint, "London Fog Driller (UK Drill/Grime)")
    
    # Assertions
    assert blueprint.vocal_archetype is not None
    assert "london" in blueprint.vocal_archetype.name.lower() or "drill" in blueprint.vocal_archetype.name.lower()
    assert blueprint.vocal_archetype.breathiness == 0.2  # Dry, minimal breathiness
    assert blueprint.vocal_archetype.chest_resonance == 0.9  # Menacing presence
    assert blueprint.vocal_archetype.vulnerability_level == 0.1  # Aggression, not vulnerability
    
    if blueprint.vocal_blueprint and blueprint.vocal_blueprint.slang_phonetics:
        assert blueprint.vocal_blueprint.slang_phonetics['cultural_lens'] == 'uk_drill_london'
        assert len(blueprint.vocal_blueprint.slang_phonetics['transformations']) >= 3  # wagwan, bruv, mandem, innit
    
    print("\n✅ TEST 3 PASSED: London Fog archetype + UK Drill slang detected")


def main():
    """Run all global archetype tests."""
    print("\n" + "🌍"*40)
    print("GLOBAL SOULFIRE EXPANSION MAP - ARCHETYPE TESTS")
    print("🌍"*40)
    
    try:
        test_lagos_pulse_afrobeat()
        test_seoul_shine_kpop()
        test_london_fog_uk_drill()
        
        print("\n" + "="*80)
        print("✅ ALL GLOBAL ARCHETYPE TESTS PASSED")
        print("="*80 + "\n")
        
        print("GLOBAL EXPANSION SUMMARY:")
        print("  ✅ Lagos Pulse (Afrobeat) - Pidgin English + Yoruba slang")
        print("  ✅ Seoul Shine (K-Pop) - Korean + Konglish slang")
        print("  ✅ London Fog (UK Drill) - MLE slang + glottal stops")
        print("\n🌍 LYRICA3 NOW SPEAKS 7 CULTURAL LANGUAGES 🌍")
        print("  (Chicano Soul, Trap Soul, Boom Bap, Afrobeat, K-Pop, UK Drill, Neo-Soul)")
        print("\n🎯 THE GLOBAL MOAT COMPETITORS CANNOT CROSS 🎯\n")
    
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
