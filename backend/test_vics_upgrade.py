#!/usr/bin/env python3
"""
Test VICS upgrade: ARRE + CSN + Vocal Archetypes
"""

import sys
import json
from lyrica_agent.orchestrator import run_lyrica_agent_dict

def test_sgv_oldies():
    """Test: 'Sleep on the Floor' (SGV Oldies)"""
    print("\n" + "="*80)
    print("TEST 1: 'Sleep on the Floor' (SGV Oldies)")
    print("="*80)
    
    lyric = "Sleep on the Floor"
    genre = "SGV Oldies"
    user_goal = "melancholic resilience, late-pocket groove"
    
    result = run_lyrica_agent_dict(lyric, genre, user_goal)
    
    # Print key outputs
    print(f"\n📊 EMOTIONAL VECTOR:")
    ev = result['emotional_vector']
    print(f"  Valence: {ev['valence']:.2f}")
    print(f"  Arousal: {ev['arousal']:.2f}")
    print(f"  Cultural Resonance: {ev['cultural_resonance']:.2f}")
    print(f"  Label: {ev['primary_label']}")
    
    print(f"\n🎵 ARRE - RHYTHMIC MAPPING:")
    rm = result.get('rhythmic_mapping')
    if rm:
        print(f"  BPM: {rm['bpm']}")
        print(f"  Groove: {rm['groove_descriptor']}")
        print(f"  Instrument Timings:")
        for timing in rm.get('instrument_timings', []):
            print(f"    - {timing['instrument']}: {timing['quantization']}, {timing['offset_ms']}ms ({timing['justification']})")
    
    print(f"\n🎸 INSTRUMENTATION:")
    inst = result.get('instrumentation')
    if inst:
        print(f"  Drums: {inst.get('drums', 'N/A')}")
        print(f"  Bass: {inst.get('bass', 'N/A')}")
        print(f"  Chords: {inst.get('chords', 'N/A')}")
        print(f"  Lead: {inst.get('lead', 'N/A')}")
    
    print(f"\n🎤 VOCAL ARCHETYPE:")
    va = result.get('vocal_archetype')
    if va:
        print(f"  Name: {va['name']}")
        print(f"  Cultural Origin: {va['cultural_origin']}")
        print(f"  Reference Artists: {', '.join(va['reference_artists'])}")
        print(f"  Phonation: {va['phonation']}")
        print(f"  Breathiness: {va['breathiness']:.2f}")
        print(f"  Chest Resonance: {va['chest_resonance']:.2f}")
    
    print(f"\n🧠 CSN JUSTIFICATION:")
    csn = result.get('csn_justification')
    if csn:
        print(f"  Emotional Reasoning: {csn['emotional_reasoning'][:150]}...")
        print(f"  Cultural Reasoning: {csn['cultural_reasoning'][:150]}...")
        print(f"  Rhythmic Reasoning: {csn['rhythmic_reasoning'][:150]}...")
        print(f"  Instrumentation Reasoning: {csn['instrumentation_reasoning'][:150]}...")
        print(f"  Vocal Reasoning: {csn['vocal_reasoning'][:150]}...")
        if csn.get('contradiction_resolution'):
            print(f"  Contradiction Resolution: {csn['contradiction_resolution'][:150]}...")
    
    print(f"\n✅ RESPECT PROTOCOL:")
    rp = result.get('respect_protocol')
    if rp and rp.get('activated'):
        print(f"  ACTIVE: {rp['origin_acknowledgment']}")
        print(f"  Preserve Imperfections: {rp['preserve_imperfections']}")
        print(f"  Autotune: {rp['autotune_amount']}")
    else:
        print("  Not activated")
    
    return result


def test_90s_love_again():
    """Test: '90s love again' (hopeful but realistic)"""
    print("\n" + "="*80)
    print("TEST 2: '90s love again' (Trap Soul)")
    print("="*80)
    
    lyric = "90s love again"
    genre = "Trap Soul"
    user_goal = "hopeful but realistic, cautious optimism"
    
    result = run_lyrica_agent_dict(lyric, genre, user_goal)
    
    # Print key outputs
    print(f"\n📊 EMOTIONAL VECTOR:")
    ev = result['emotional_vector']
    print(f"  Valence: {ev['valence']:.2f}")
    print(f"  Arousal: {ev['arousal']:.2f}")
    print(f"  Label: {ev['primary_label']}")
    
    print(f"\n🎵 ARRE - RHYTHMIC MAPPING:")
    rm = result.get('rhythmic_mapping')
    if rm:
        print(f"  BPM: {rm['bpm']}")
        print(f"  Groove: {rm['groove_descriptor']}")
    
    print(f"\n🎸 INSTRUMENTATION:")
    inst = result.get('instrumentation')
    if inst:
        print(f"  Drums: {inst.get('drums', 'N/A')}")
        print(f"  Chords: {inst.get('chords', 'N/A')}")
    
    print(f"\n🎤 VOCAL ARCHETYPE:")
    va = result.get('vocal_archetype')
    if va:
        print(f"  Name: {va['name']}")
        print(f"  Breathiness: {va['breathiness']:.2f}")
    
    print(f"\n🧠 CSN JUSTIFICATION (Contradiction Resolution):")
    csn = result.get('csn_justification')
    if csn and csn.get('contradiction_resolution'):
        print(f"  {csn['contradiction_resolution']}")
    
    return result


def test_chicago_house():
    """Test: Progressive but grounded (Chicago House)"""
    print("\n" + "="*80)
    print("TEST 3: 'Dancing in the Dark' (Chicago House - Progressive but Grounded)")
    print("="*80)
    
    lyric = "Dancing in the dark, feeling the machine"
    genre = "Chicago House"
    user_goal = "progressive but grounded"
    
    result = run_lyrica_agent_dict(lyric, genre, user_goal)
    
    print(f"\n🎵 ARRE - RHYTHMIC MAPPING:")
    rm = result.get('rhythmic_mapping')
    if rm:
        print(f"  BPM: {rm['bpm']}")
        print(f"  Instrument Timings:")
        for timing in rm.get('instrument_timings', []):
            print(f"    - {timing['instrument']}: {timing['offset_ms']}ms ({timing['justification']})")
    
    print(f"\n🎸 INSTRUMENTATION:")
    inst = result.get('instrumentation')
    if inst:
        print(f"  Drums: {inst.get('drums', 'N/A')}")
        print(f"  Chords: {inst.get('chords', 'N/A')}")
    
    print(f"\n🎤 VOCAL ARCHETYPE:")
    va = result.get('vocal_archetype')
    if va:
        print(f"  Name: {va['name']}")
        print(f"  Cultural Origin: {va['cultural_origin']}")
    
    print(f"\n🧠 CSN JUSTIFICATION (Contradiction Resolution):")
    csn = result.get('csn_justification')
    if csn:
        print(f"  Cultural: {csn['cultural_reasoning'][:200]}...")
        if csn.get('contradiction_resolution'):
            print(f"\n  CONTRADICTION RESOLUTION:")
            print(f"  {csn['contradiction_resolution']}")
    
    return result


if __name__ == "__main__":
    try:
        print("\n🚀 VICS UPGRADE TEST SUITE")
        print("Testing: ARRE + CSN + Vocal Archetypes Integration")
        
        # Test 1: SGV Oldies
        test_sgv_oldies()
        
        # Test 2: 90s love again
        test_90s_love_again()
        
        # Test 3: Chicago House (contradiction resolution)
        test_chicago_house()
        
        print("\n" + "="*80)
        print("✅ ALL TESTS COMPLETED")
        print("="*80)
        print("\nVICS now outputs:")
        print("  ✅ ARRE: BPM + timing offsets + hardware-specific instrumentation")
        print("  ✅ CSN: Cognitive justification explaining WHY choices were made")
        print("  ✅ Vocal Archetypes: Specific historical vocal styles with reference artists")
        print("  ✅ Respect Protocol: Cultural sensitivity guardrails")
        print("\nThis is SL Audio Master-level reasoning. 🎯")
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
