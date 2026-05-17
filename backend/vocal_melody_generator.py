"""
Vocal Melody MIDI Generator for Lyrica3 Soulfire Pipeline
Generates note-by-note MIDI patterns with biometric artifact markers

Built for: Acid Tears & 808s vocal chain
Scale: E♭ Major / C Minor
Tempo: 72 BPM (Half-time Trap feel)
Vocal Range: Tenor/Alto Crooner (C3 – C5)

Integration: SL Audio Master → MIDI Generator → Vocal Forge (Parler-TTS)
"""

import mido
from mido import Message, MetaMessage, MidiFile, MidiTrack, bpm2tempo
from typing import Dict, List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class VocalMelodyGenerator:
    """
    Generates MIDI melodies with biometric artifacts for Lyrica3 vocal chains.
    """
    
    # E♭ Major / C Minor Scale (MIDI note numbers)
    E_FLAT_MAJOR_C_MINOR = {
        'C': [48, 60, 72],   # C3, C4, C5
        'D': [50, 62, 74],   # D3, D4, D5
        'Eb': [51, 63, 75],  # E♭3, E♭4, E♭5
        'F': [53, 65, 77],   # F3, F4, F5
        'G': [55, 67, 79],   # G3, G4, G5
        'Ab': [56, 68, 80],  # A♭3, A♭4, A♭5
        'Bb': [58, 70, 82],  # B♭3, B♭4, B♭5
    }
    
    # Biometric artifact markers
    ARTIFACTS = {
        'rhythmic_sigh': '<rhythmic_sigh>',
        'melismatic_drift': '<melismatic_drift>',
        'chest_resonance': '<chest_resonance>',
        'emotional_crack': '<emotional_crack>',
        'melismatic_run': '<melismatic_run>',
        'vocal_fry': '<vocal_fry>',
        'inhale_timing': '<inhale_timing>',
    }
    
    def __init__(self, bpm: int = 72, time_signature: Tuple[int, int] = (4, 4)):
        """
        Initialize the vocal melody generator.
        
        Args:
            bpm: Tempo in beats per minute (default: 72 for half-time trap)
            time_signature: Time signature as (numerator, denominator) tuple
        """
        self.bpm = bpm
        self.time_signature = time_signature
        self.ticks_per_beat = 480  # mido default resolution
    
    def create_midi_file(self) -> MidiFile:
        """Create a new MIDI file with tempo and time signature."""
        mid = MidiFile()
        track = MidiTrack()
        mid.tracks.append(track)
        
        # Set tempo and time signature
        tempo = bpm2tempo(self.bpm)
        track.append(MetaMessage('set_tempo', tempo=tempo))
        track.append(MetaMessage('time_signature', 
                                 numerator=self.time_signature[0], 
                                 denominator=self.time_signature[1]))
        
        return mid
    
    def add_note(self, track: MidiTrack, note: int, start_tick: int, 
                 duration_ticks: int, velocity: int = 64):
        """
        Add a MIDI note to the track.
        
        Args:
            track: MidiTrack to add note to
            note: MIDI note number (0-127)
            start_tick: Time offset for note_on message
            duration_ticks: Duration until note_off message
            velocity: MIDI velocity (0-127)
        """
        track.append(Message('note_on', note=note, velocity=velocity, time=start_tick))
        track.append(Message('note_off', note=note, velocity=0, time=duration_ticks))
    
    def add_artifact_marker(self, track: MidiTrack, tick: int, artifact_type: str):
        """
        Add a biometric artifact marker to the track.
        
        Args:
            track: MidiTrack to add marker to
            tick: Time offset for marker
            artifact_type: Type of artifact (key from ARTIFACTS dict)
        """
        marker = self.ARTIFACTS.get(artifact_type, f'<{artifact_type}>')
        track.append(MetaMessage('text', text=marker, time=tick))
    
    def generate_acid_tears_melody(self, output_path: str = "acid_tears_vocals.mid"):
        """
        Generate the 'Acid Tears & 808s' vocal melody MIDI file.
        
        Based on the blueprint:
        - Verse: Monotone, intimate, detached (C Minor pentatonic)
        - Pre-Chorus: Melismatic drift (ascending to E♭ Major)
        - Chorus: Chest resonance & emotional crack (E♭ Major highlights)
        
        Args:
            output_path: Path to save the MIDI file
        
        Returns:
            Path to the saved MIDI file
        """
        logger.info(f"🎵 Generating 'Acid Tears & 808s' vocal melody at {self.bpm} BPM")
        
        mid = self.create_midi_file()
        track = mid.tracks[0]
        
        tick_counter = 0
        
        # --- VERSE: "Yeah... scrolling through the texts..." ---
        logger.debug("📝 Generating Verse section")
        
        # Beat 1.1: Rhythmic sigh (breath sound)
        self.add_artifact_marker(track, tick_counter, 'rhythmic_sigh')
        tick_counter += 240  # Wait 0.5 beat
        
        # Beat 1.4: Yeah (C3 = 48)
        self.add_note(track, 48, 0, 240, velocity=60)
        tick_counter += 240
        
        # Beat 2.1: scroll-ing (D3 = 50)
        self.add_note(track, 50, 0, 240, velocity=65)
        tick_counter += 240
        
        # Beat 2.3: through (E♭3 = 51)
        self.add_note(track, 51, 0, 240, velocity=60)
        tick_counter += 240
        
        # Beat 3.1: the texts (D3 = 50)
        self.add_note(track, 50, 0, 240, velocity=65)
        tick_counter += 240
        
        # Beat 3.3: but the (C3 = 48)
        self.add_note(track, 48, 0, 240, velocity=60)
        tick_counter += 240
        
        # Beat 4.1: screen (G2 = 43)
        self.add_note(track, 43, 0, 240, velocity=70)
        tick_counter += 240
        
        # Beat 4.3: is cold (C3 = 48)
        self.add_note(track, 48, 0, 480, velocity=55)
        tick_counter += 480
        
        # --- PRE-CHORUS: "We used to dream..." ---
        logger.debug("📝 Generating Pre-Chorus section")
        
        # Beat 1.1: We used (E♭3 = 51)
        self.add_note(track, 51, 0, 240, velocity=75)
        tick_counter += 240
        
        # Beat 1.3: to dream (F3 = 53)
        self.add_note(track, 53, 0, 240, velocity=80)
        tick_counter += 240
        
        # Beat 2.1: in ma-jor (G3 = 55)
        self.add_note(track, 55, 0, 240, velocity=85)
        tick_counter += 240
        
        # Beat 2.3: keys (A♭3 = 56)
        self.add_note(track, 56, 0, 240, velocity=80)
        tick_counter += 240
        
        # Beat 3.1: now we (G3 = 55)
        self.add_note(track, 55, 0, 240, velocity=75)
        tick_counter += 240
        
        # Beat 3.3: stuck in (F3 = 53)
        self.add_note(track, 53, 0, 240, velocity=70)
        tick_counter += 240
        
        # Beat 4.1: the mi-nor (E♭3 → D3 slide)
        self.add_artifact_marker(track, tick_counter, 'melismatic_drift')
        self.add_note(track, 51, 0, 240, velocity=90)  # E♭3
        tick_counter += 240
        self.add_note(track, 50, 0, 240, velocity=85)  # D3
        tick_counter += 240
        
        # --- CHORUS: "I don't wanna break..." ---
        logger.debug("📝 Generating Chorus section")
        
        # Beat 1.1: I don't (C4 = 60)
        self.add_note(track, 60, 0, 120, velocity=100)
        tick_counter += 120
        
        # Beat 1.2: wan-na (E♭4 = 63)
        self.add_note(track, 63, 0, 120, velocity=110)
        tick_counter += 120
        
        # Beat 1.4: break (G4 = 67)
        self.add_note(track, 67, 0, 240, velocity=120)
        tick_counter += 240
        
        # Beat 2.1: I just (F4 = 65)
        self.add_note(track, 65, 0, 120, velocity=105)
        tick_counter += 120
        
        # Beat 2.2: wan-na (E♭4 = 63)
        self.add_note(track, 63, 0, 120, velocity=100)
        tick_counter += 120
        
        # Beat 2.4: bend (C4 = 60)
        self.add_artifact_marker(track, tick_counter, 'chest_resonance')
        self.add_note(track, 60, 0, 480, velocity=115)  # Long hold
        tick_counter += 480
        
        # Beat 3.1: Tell me (E♭4 = 63)
        self.add_note(track, 63, 0, 240, velocity=90)
        tick_counter += 240
        
        # Beat 3.3: we can (F4 = 65)
        self.add_note(track, 65, 0, 240, velocity=95)
        tick_counter += 240
        
        # Beat 4.1: find that (G4 = 67)
        self.add_note(track, 67, 0, 240, velocity=100)
        tick_counter += 240
        
        # Beat 4.3: 90s love (A♭4 → G4)
        self.add_artifact_marker(track, tick_counter, 'emotional_crack')
        self.add_note(track, 68, 0, 120, velocity=110)  # A♭4 (Crack)
        tick_counter += 120
        self.add_note(track, 67, 0, 120, velocity=100)  # G4
        tick_counter += 120
        
        # Beat 5.1: a-gain (Run: F4 → E♭4 → C4)
        self.add_artifact_marker(track, tick_counter, 'melismatic_run')
        self.add_note(track, 65, 0, 120, velocity=80)  # F4
        tick_counter += 120
        self.add_note(track, 63, 0, 120, velocity=70)  # E♭4
        tick_counter += 120
        self.add_note(track, 60, 0, 240, velocity=60)  # C4 (Fade)
        tick_counter += 240
        
        # Save MIDI file
        mid.save(output_path)
        logger.info(f"✅ MIDI file saved: {output_path}")
        
        return output_path
    
    def generate_custom_melody(self, melody_data: List[Dict], 
                                output_path: str = "custom_melody.mid") -> str:
        """
        Generate a custom vocal melody from structured data.
        
        Args:
            melody_data: List of note dictionaries with keys:
                - note: MIDI note number (int)
                - start_beat: Starting beat position (float)
                - duration_beats: Note duration in beats (float)
                - velocity: MIDI velocity (int, 0-127)
                - artifact: Optional artifact type (str)
            output_path: Path to save the MIDI file
        
        Returns:
            Path to the saved MIDI file
        
        Example:
            melody_data = [
                {'note': 48, 'start_beat': 0.0, 'duration_beats': 0.5, 
                 'velocity': 60, 'artifact': 'rhythmic_sigh'},
                {'note': 50, 'start_beat': 0.5, 'duration_beats': 0.5, 
                 'velocity': 65},
            ]
        """
        logger.info(f"🎵 Generating custom vocal melody: {len(melody_data)} notes")
        
        mid = self.create_midi_file()
        track = mid.tracks[0]
        
        current_tick = 0
        
        for i, note_data in enumerate(melody_data):
            note = note_data['note']
            start_beat = note_data['start_beat']
            duration_beats = note_data['duration_beats']
            velocity = note_data['velocity']
            artifact = note_data.get('artifact')
            
            # Calculate tick positions
            start_tick = int(start_beat * self.ticks_per_beat) - current_tick
            duration_ticks = int(duration_beats * self.ticks_per_beat)
            
            # Add artifact marker if specified
            if artifact:
                self.add_artifact_marker(track, start_tick, artifact)
                start_tick = 0  # Reset since marker consumed the time
            
            # Add note
            self.add_note(track, note, start_tick, duration_ticks, velocity)
            current_tick = int((start_beat + duration_beats) * self.ticks_per_beat)
        
        # Save MIDI file
        mid.save(output_path)
        logger.info(f"✅ Custom MIDI file saved: {output_path}")
        
        return output_path


# --- CLI Usage ---
if __name__ == "__main__":
    import sys
    
    logging.basicConfig(level=logging.INFO, 
                        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    generator = VocalMelodyGenerator(bpm=72)
    
    if len(sys.argv) > 1:
        output_path = sys.argv[1]
    else:
        output_path = "acid_tears_vocals.mid"
    
    try:
        midi_path = generator.generate_acid_tears_melody(output_path)
        print(f"\n🔥 SUCCESS! Vocal melody MIDI generated: {midi_path}")
        print(f"📊 Specs: {generator.bpm} BPM, E♭ Major/C Minor, Tenor/Alto range (C3-C5)")
        print(f"🎯 Artifacts: {len(generator.ARTIFACTS)} biometric markers included")
        print(f"\n💡 Next steps:")
        print(f"   1. Import {midi_path} into your DAW")
        print(f"   2. Route to Vocal Forge (Parler-TTS) or your vocal synth")
        print(f"   3. Apply acid vocal chain (see acid_vocal_chain.py)")
    except Exception as e:
        logger.error(f"❌ Failed to generate MIDI: {e}")
        sys.exit(1)
