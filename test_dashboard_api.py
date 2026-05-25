#!/usr/bin/env python3
"""
Test script to verify AETHER_NEXUS Dashboard <-> Cloud Run API integration
Tests authentication and VICS v3.0 with Barrio Phonetics Engine
"""

import requests
import json
import time

API_BASE = "https://lyrica3-backend-e2q5oemapa-uw.a.run.app/api"

def test_auth_and_generation():
    """Test full flow: register/login -> generate with Barrio Phonetics"""
    
    # Test 1: Register a test account
    print("=" * 60)
    print("TEST 1: Register test account")
    print("=" * 60)
    
    test_handle = f"test_user_{int(time.time())}"
    test_password = "testpass123"
    
    register_response = requests.post(
        f"{API_BASE}/auth/register",
        json={"handle": test_handle, "password": test_password}
    )
    
    print(f"Status: {register_response.status_code}")
    if register_response.status_code == 200:
        register_data = register_response.json()
        print(f"✅ Registration successful")
        print(f"   Handle: {register_data['handle']}")
        print(f"   Token: {register_data['token'][:20]}...")
        print(f"   Wallet: {register_data['wallet']}")
        token = register_data['token']
    else:
        print(f"❌ Registration failed: {register_response.text}")
        return
    
    # Test 2: Generate track with Chicano Soul slang
    print("\n" + "=" * 60)
    print("TEST 2: Generate track with Chicano Soul slang")
    print("=" * 60)
    
    generation_request = {
        "lyrics": "Yeah homeboy, we gonna roll outta here right now",
        "mood": "laid-back resilience",
        "genre": "chicano_soul"
    }
    
    print(f"Request: {json.dumps(generation_request, indent=2)}")
    
    generate_response = requests.post(
        f"{API_BASE}/generate",
        json=generation_request,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    print(f"\nStatus: {generate_response.status_code}")
    if generate_response.status_code == 200:
        data = generate_response.json()
        print(f"✅ Generation successful")
        print(f"\n   Track ID: {data.get('track_id', 'N/A')}")
        
        # Check VICS blueprint
        if 'vics_blueprint' in data:
            vics = data['vics_blueprint']
            print(f"\n   🧠 VICS Blueprint:")
            
            if 'emotional_vector' in vics:
                ev = vics['emotional_vector']
                print(f"      Emotional Vector:")
                print(f"         Valence: {ev.get('valence', 'N/A')}")
                print(f"         Arousal: {ev.get('arousal', 'N/A')}")
                print(f"         Primary Label: {ev.get('primary_label', 'N/A')}")
            
            if 'vocal_blueprint' in vics and 'slang_phonetics' in vics['vocal_blueprint']:
                slang = vics['vocal_blueprint']['slang_phonetics']
                print(f"\n      🗣️ Barrio Phonetics:")
                print(f"         Cultural Lens: {slang.get('cultural_lens', 'N/A')}")
                
                if 'transformations' in slang and slang['transformations']:
                    print(f"         Detected {len(slang['transformations'])} slang term(s):")
                    for i, t in enumerate(slang['transformations'][:3], 1):  # Show first 3
                        print(f"            {i}. {json.dumps(t, indent=14)}")
                else:
                    print(f"         No slang detected")
        else:
            print(f"   ⚠️ VICS blueprint not available")
    else:
        print(f"❌ Generation failed: {generate_response.text}")
        return
    
    # Test 3: Test Cultural Gatekeeping (Korean slang in Chicano Soul)
    print("\n" + "=" * 60)
    print("TEST 3: Test Cultural Gatekeeping (Korean in Chicano)")
    print("=" * 60)
    
    gatekeeping_request = {
        "lyrics": "Saranghae my homeboy",
        "mood": "laid-back resilience",
        "genre": "chicano_soul"
    }
    
    print(f"Request: {json.dumps(gatekeeping_request, indent=2)}")
    
    gatekeeping_response = requests.post(
        f"{API_BASE}/generate",
        json=gatekeeping_request,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    print(f"\nStatus: {gatekeeping_response.status_code}")
    if gatekeeping_response.status_code == 200:
        data = gatekeeping_response.json()
        print(f"✅ Generation completed")
        
        if 'vics_blueprint' in data and 'vocal_blueprint' in data['vics_blueprint']:
            slang = data['vics_blueprint']['vocal_blueprint'].get('slang_phonetics', {})
            warnings = slang.get('cultural_gatekeeping_warnings', [])
            
            if warnings:
                print(f"\n   ⚠️ Cultural Gatekeeping Warnings:")
                for w in warnings:
                    print(f"      {w}")
            else:
                print(f"   ℹ️ No gatekeeping warnings (expected warnings)")
    else:
        print(f"❌ Generation failed: {gatekeeping_response.text}")
    
    print("\n" + "=" * 60)
    print("ALL TESTS COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    test_auth_and_generation()
