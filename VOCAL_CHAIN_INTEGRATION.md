# Vocal Chain Integration Guide
**Soulfire Pipeline: MIDI Generation + Acid Processing**

Last Updated: May 16, 2026  
Status: READY FOR INTEGRATION

---

## 🔥 WHAT WE BUILT

**Two powerful new tools for the Soulfire pipeline:**

1. **`vocal_melody_generator.py`** - MIDI melody generator with biometric artifacts
2. **`acid_vocal_chain.py`** - Analog warmth processing (tape saturation + acid delay)

---

## 📊 ARCHITECTURE INTEGRATION

### **Current Soulfire Pipeline:**
```
User Input
    ↓
🔥 SL Audio Master (agent_1778921386550) - THE BRAIN
    └─ Generates LML + acoustic primitives
    ↓
🔥 The Beast (agent_1776939216148) - ORCHESTRATOR
    ├─ Groove Engine (MusicGen) → drums, bass, melody
    ├─ Vocal Forge (Parler-TTS) → vocals [NEW: Use MIDI melodies!]
    └─ Sonance Sentinel (Pedalboard) → mastering [NEW: Add acid chain!]
    ↓
React UI: StemMixer (4 stems)
```

### **NEW: Enhanced Vocal Chain:**
```
User Input (prompt, vibe, BPM)
    ↓
🔥 SL Audio Master
    └─ Generates: LML + vocal melody spec (E♭ Major/C Minor, 72 BPM, artifacts)
    ↓
🎵 MIDI Generator (vocal_melody_generator.py)
    └─ Converts spec → MIDI file with biometric markers
    ↓
🔥 Vocal Forge (Parler-TTS)
    └─ Renders MIDI → raw vocal WAV
    ↓
🔥 Acid Chain (acid_vocal_chain.py)
    ├─ High-pass filter (150Hz cutoff)
    ├─ Tape saturation (2.0x drive, analog warmth)
    ├─ Acid-modulated delay (1/8 note @ 72 BPM)
    └─ Biometric trigger detection
    ↓
🔥 Sonance Sentinel (Pedalboard)
    └─ Final mastering → stereo stems
    ↓
React UI: StemMixer (4 stems + metadata)
```

---

## 🎯 USAGE

### **1. Generate MIDI Melody**

**Standalone CLI:**
```bash
cd /home/shiestybizz/Lyrica3-pro/backend
python vocal_melody_generator.py acid_tears_vocals.mid
```

**Output:**
```
🔥 SUCCESS! Vocal melody MIDI generated: acid_tears_vocals.mid
📊 Specs: 72 BPM, E♭ Major/C Minor, Tenor/Alto range (C3-C5)
🎯 Artifacts: 7 biometric markers included
```

**Python API:**
```python
from vocal_melody_generator import VocalMelodyGenerator

generator = VocalMelodyGenerator(bpm=72)
midi_path = generator.generate_acid_tears_melody("output.mid")
```

**Custom Melody:**
```python
melody_data = [
    {'note': 48, 'start_beat': 0.0, 'duration_beats': 0.5, 
     'velocity': 60, 'artifact': 'rhythmic_sigh'},
    {'note': 50, 'start_beat': 0.5, 'duration_beats': 0.5, 
     'velocity': 65},
    # ... more notes
]

generator.generate_custom_melody(melody_data, "custom.mid")
```

---

### **2. Apply Acid Vocal Chain**

**Standalone CLI:**
```bash
cd /home/shiestybizz/Lyrica3-pro/backend
python acid_vocal_chain.py raw_vocal.wav processed_acid_vocal.wav 72
```

**Output:**
```
🔥 SUCCESS! Acid vocal chain applied
📊 Metadata:
{
  "duration_sec": 45.3,
  "bpm": 72,
  "biometric_triggers": [
    {"time": 2.5, "type": "emotional_peak", "amplitude_db": -18.2},
    {"time": 8.1, "type": "emotional_peak", "amplitude_db": -16.7}
  ]
}
```

**Python API:**
```python
from acid_vocal_chain import AcidVocalChain

chain = AcidVocalChain(sample_rate=44100, bpm=72)
output_path, metadata = chain.process_vocal(
    input_path="raw_vocal.wav",
    output_path="processed.wav",
    config={
        'saturation_drive': 2.5,  # More aggressive warmth
        'delay_mix': 0.4,          # More delay
    }
)
```

---

## 🔗 INTEGRATION INTO SOULFIRE PIPELINE

### **Step 1: Update SL Audio Master Prompt**

Add MIDI melody spec to SL Audio Master's output JSON:

```json
{
  "lml": "...",
  "acoustic_primitives": {
    "bpm": 72,
    "swing": "MPC-3000",
    "vocal_melody": {
      "scale": "E♭ Major / C Minor",
      "range": "C3-C5",
      "sections": [
        {
          "name": "verse",
          "strategy": "monotone, intimate, C Minor pentatonic",
          "artifacts": ["rhythmic_sigh", "vocal_fry"]
        },
        {
          "name": "pre_chorus",
          "strategy": "melismatic drift, ascending to E♭ Major",
          "artifacts": ["melismatic_drift"]
        },
        {
          "name": "chorus",
          "strategy": "chest resonance, E♭ Major highlights",
          "artifacts": ["chest_resonance", "emotional_crack", "melismatic_run"]
        }
      ]
    }
  }
}
```

### **Step 2: Update The Beast Agent**

Add vocal chain invocation to The Beast's orchestration logic:

```python
# In vertex_agents_config.py or The Beast agent code

from vocal_melody_generator import VocalMelodyGenerator
from acid_vocal_chain import AcidVocalChain

def generate_music_with_soulfire(prompt, vibe, bpm=72):
    # Step 1: Invoke SL Audio Master
    sl_payload = invoke_sl_audio_master(prompt, vibe)
    
    # Step 2: Generate MIDI melody from vocal_melody spec
    if 'vocal_melody' in sl_payload.get('acoustic_primitives', {}):
        generator = VocalMelodyGenerator(bpm=bpm)
        midi_path = generator.generate_acid_tears_melody("temp_vocals.mid")
        
        # Step 3: Render MIDI with Vocal Forge (Parler-TTS or synth)
        raw_vocal_path = vocal_forge_render(midi_path)  # Your Parler-TTS call
        
        # Step 4: Apply acid vocal chain
        chain = AcidVocalChain(sample_rate=44100, bpm=bpm)
        processed_vocal_path, metadata = chain.process_vocal(
            raw_vocal_path, 
            "processed_vocals.wav"
        )
        
        # Step 5: Pass processed vocal + metadata to Sonance Sentinel
        stems = sonance_sentinel_master(
            vocals=processed_vocal_path,
            metadata=metadata,
            other_stems=[drums, bass, melody]
        )
    
    return stems
```

### **Step 3: Update Sonance Sentinel**

Integrate biometric trigger metadata into final mastering:

```python
def sonance_sentinel_master(vocals, metadata, other_stems):
    # Use biometric triggers to place compression/effects
    for trigger in metadata['biometric_triggers']:
        time = trigger['time']
        amplitude_db = trigger['amplitude_db']
        
        # Apply dynamic compression at emotional peaks
        apply_compression_at_timestamp(vocals, time, ratio=3.0, threshold=-14.0)
    
    # Continue with normal mastering...
```

---

## 📋 DEPENDENCIES

**Already added to `requirements.txt`:**
- `mido==1.3.3` (MIDI file generation)
- `librosa==0.10.2` (Audio analysis)
- `scipy==1.15.3` (Signal processing)
- `soundfile==0.12.1` (Audio I/O)

**Install on Railway:**
```bash
pip install -r requirements.txt
```

---

## 🎨 VOCAL MELODY SPEC

### **"Acid Tears & 808s" Template**

| Section | Scale | Range | Strategy | Artifacts |
|---------|-------|-------|----------|-----------|
| **Verse** | C Minor pentatonic | C3-E♭3 | Monotone, intimate, detached | rhythmic_sigh, vocal_fry |
| **Pre-Chorus** | Ascending to E♭ Major | E♭3-A♭3 | Melismatic drift | melismatic_drift |
| **Chorus** | E♭ Major highlights | C4-A♭4 | Chest resonance, emotional | chest_resonance, emotional_crack, melismatic_run |

**MIDI Notes (E♭ Major / C Minor):**
- C3=48, D3=50, E♭3=51, F3=53, G3=55, A♭3=56, B♭3=58
- C4=60, D4=62, E♭4=63, F4=65, G4=67, A♭4=68, B♭4=70
- C5=72, D5=74, E♭5=75

---

## 🔧 CONFIGURATION

### **Acid Chain Config (Default)**

```python
config = {
    'hpf_cutoff': 150.0,           # High-pass filter cutoff (Hz)
    'saturation_drive': 2.0,       # Tape saturation drive (1.0-5.0)
    'saturation_mix': 0.7,         # Wet/dry mix (0.0-1.0)
    'delay_subdivision': '1/8',    # Rhythmic subdivision ('1/4', '1/8', '1/16')
    'delay_feedback': 0.4,         # Delay feedback (0.0-0.9)
    'delay_mix': 0.35,             # Delay wet/dry mix (0.0-1.0)
    'pre_emphasis_coef': 0.97,     # High-frequency boost (0.0-1.0)
}
```

### **For More Aggressive Warmth:**
```python
config = {
    'saturation_drive': 3.5,       # Heavier distortion
    'saturation_mix': 0.85,        # More saturated signal
    'delay_feedback': 0.6,         # Longer delay tail
    'delay_mix': 0.5,              # More prominent delay
}
```

---

## 🚀 DEPLOYMENT

### **Railway Backend:**

1. Push to main (already done - commit 11cba1a)
2. Railway auto-deploys with new dependencies
3. Test vocal chain via API endpoint:

```bash
curl -X POST https://lyrica3.com/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Acid tears & 808s vibe",
    "vibe": "melancholic trap",
    "bpm": 72
  }'
```

### **Local Testing:**

```bash
# Generate MIDI
python backend/vocal_melody_generator.py test_melody.mid

# Process audio (need a raw vocal WAV first)
python backend/acid_vocal_chain.py raw_vocal.wav processed.wav 72
```

---

## 📊 EXPECTED RESULTS

### **MIDI File Output:**
- ✅ 72 BPM tempo markers
- ✅ E♭ Major/C Minor scale notes
- ✅ Biometric artifact text markers (`<rhythmic_sigh>`, `<emotional_crack>`, etc.)
- ✅ Verse/Pre-Chorus/Chorus sections with velocity dynamics

### **Processed Audio Output:**
- ✅ Analog warmth (tape saturation)
- ✅ Rhythmic acid delay (1/8 note sync)
- ✅ Cut mud (150Hz high-pass)
- ✅ Biometric trigger metadata (timestamps, amplitudes)
- ✅ Normalized to -0.5dB headroom

---

## 🎯 NEXT STEPS

1. ✅ Vocal chain tools created
2. ✅ Dependencies added to requirements.txt
3. ✅ Committed to main (11cba1a)
4. ⏳ Railway auto-deploys
5. ⏳ Test Vercel frontend (direct studio access)
6. ⏳ Integrate MIDI generator into SL Audio Master prompt
7. ⏳ Integrate acid chain into The Beast orchestrator
8. ⏳ Test end-to-end music generation with vocals
9. ⏳ Verify biometric triggers in final stems

---

## 💡 USAGE TIPS

**For SGV Chicano authenticity:**
- Use C Minor pentatonic for verses (sad, introspective)
- Shift to E♭ Major for choruses (hopeful, pleading)
- Add `<vocal_fry>` markers at phrase endings
- Use `<emotional_crack>` on sustained high notes (A♭4, G4)

**For analog warmth:**
- Keep saturation_drive between 2.0-3.0 for subtle warmth
- Use 1/8 note delay subdivision for trap feel
- Delay feedback of 0.4-0.5 for spacious but not muddy

**For biometric triggers:**
- Threshold of -20dB catches emotional peaks
- Triggers are timestamped for precise compression/effects placement
- Use triggers to automate vocal fry, inhale timing, breath sounds

---

**Built with 🔥 by shiestybizz113-cell**  
**El Monte // SGV // Since Day One**
