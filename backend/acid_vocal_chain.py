"""
Acid Vocal Processing Chain for Lyrica3 Soulfire Pipeline
Simulates analog warmth with tape saturation, acid-modulated delay, and biometric artifacts

Built for: Acid Tears & 808s vocal chain
Tempo: 72 BPM (Half-time Trap feel)
Signal Chain: HPF → Tape Saturation → Acid Delay → Biometric Triggers

Integration: Vocal Forge (Parler-TTS) → Acid Chain → Sonance Sentinel (Pedalboard)
"""

import numpy as np
import librosa
import soundfile as sf
from scipy import signal
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class AcidVocalChain:
    """
    Audio processing chain for Lyrica3 vocal tracks with analog warmth and biometric artifacts.
    """
    
    def __init__(self, sample_rate: int = 44100, bpm: int = 72):
        """
        Initialize the acid vocal processing chain.
        
        Args:
            sample_rate: Audio sample rate in Hz (default: 44100)
            bpm: Tempo in beats per minute (default: 72 for half-time trap)
        """
        self.sample_rate = sample_rate
        self.bpm = bpm
        self.beat_duration = 60.0 / bpm  # Duration of one beat in seconds
    
    def high_pass_filter(self, audio: np.ndarray, cutoff_hz: float = 150.0) -> np.ndarray:
        """
        Apply high-pass filter to cut low frequencies.
        
        Args:
            audio: Input audio signal
            cutoff_hz: Cutoff frequency in Hz (default: 150Hz to cut mud)
        
        Returns:
            Filtered audio signal
        """
        logger.debug(f"🎚️ Applying high-pass filter at {cutoff_hz}Hz")
        
        # Design Butterworth high-pass filter (4th order)
        nyquist = self.sample_rate / 2
        normalized_cutoff = cutoff_hz / nyquist
        b, a = signal.butter(4, normalized_cutoff, btype='high', analog=False)
        
        # Apply filter
        filtered = signal.filtfilt(b, a, audio)
        
        return filtered
    
    def tape_saturation(self, audio: np.ndarray, drive: float = 2.0, 
                        mix: float = 0.7) -> np.ndarray:
        """
        Apply tape saturation for analog warmth using soft clipping.
        
        Args:
            audio: Input audio signal
            drive: Amount of saturation/distortion (1.0-5.0, default: 2.0)
            mix: Wet/dry mix (0.0-1.0, default: 0.7 = 70% saturated)
        
        Returns:
            Saturated audio signal
        """
        logger.debug(f"🔥 Applying tape saturation (drive: {drive}, mix: {mix})")
        
        # Apply soft clipping with tanh for analog-style distortion
        wet = np.tanh(audio * drive) / drive
        
        # Mix wet and dry signals
        output = (wet * mix) + (audio * (1.0 - mix))
        
        # Normalize to prevent clipping
        peak = np.max(np.abs(output))
        if peak > 0.95:
            output = output * (0.95 / peak)
        
        return output
    
    def acid_modulated_delay(self, audio: np.ndarray, delay_subdivision: str = '1/8', 
                             feedback: float = 0.4, wet_mix: float = 0.35) -> np.ndarray:
        """
        Apply acid-modulated delay synced to BPM with time-based echo.
        
        Args:
            audio: Input audio signal
            delay_subdivision: Rhythmic subdivision ('1/4', '1/8', '1/16', default: '1/8')
            feedback: Delay feedback amount (0.0-0.9, default: 0.4)
            wet_mix: Wet/dry mix (0.0-1.0, default: 0.35 = 35% delayed)
        
        Returns:
            Audio with delay applied
        """
        logger.debug(f"⏱️ Applying acid delay ({delay_subdivision}, feedback: {feedback})")
        
        # Calculate delay time based on BPM and subdivision
        subdivision_map = {
            '1/4': 1.0,    # Quarter note
            '1/8': 0.5,    # Eighth note
            '1/16': 0.25,  # Sixteenth note
        }
        
        subdivision_factor = subdivision_map.get(delay_subdivision, 0.5)
        delay_time_sec = self.beat_duration * subdivision_factor
        delay_samples = int(delay_time_sec * self.sample_rate)
        
        logger.debug(f"   Delay time: {delay_time_sec:.3f}s ({delay_samples} samples)")
        
        # Create delay buffer
        output = np.copy(audio)
        
        # Apply delay with feedback
        if delay_samples < len(audio):
            for i in range(delay_samples, len(audio)):
                # Add delayed signal with feedback
                output[i] += output[i - delay_samples] * feedback
        
        # Mix wet and dry signals
        final_output = (output * wet_mix) + (audio * (1.0 - wet_mix))
        
        # Normalize to prevent clipping
        peak = np.max(np.abs(final_output))
        if peak > 0.95:
            final_output = final_output * (0.95 / peak)
        
        return final_output
    
    def detect_biometric_triggers(self, audio: np.ndarray, 
                                   threshold_db: float = -20.0) -> Tuple[np.ndarray, list]:
        """
        Detect vocal biometric triggers (emotional cracks, vocal fry) for artifact placement.
        
        Args:
            audio: Input audio signal
            threshold_db: Peak detection threshold in dB (default: -20dB)
        
        Returns:
            Tuple of (audio, list of trigger timestamps)
        """
        logger.debug(f"🎯 Detecting biometric triggers (threshold: {threshold_db}dB)")
        
        # Calculate RMS energy in windows
        hop_length = 512
        frame_length = 2048
        rms = librosa.feature.rms(y=audio, frame_length=frame_length, 
                                  hop_length=hop_length)[0]
        
        # Convert RMS to dB
        rms_db = librosa.amplitude_to_db(rms, ref=np.max)
        
        # Find peaks above threshold
        peaks, _ = signal.find_peaks(rms_db, height=threshold_db, distance=20)
        
        # Convert frame indices to timestamps
        timestamps = librosa.frames_to_time(peaks, sr=self.sample_rate, 
                                            hop_length=hop_length)
        
        logger.debug(f"   Found {len(timestamps)} biometric triggers")
        
        # Mark triggers in metadata
        trigger_list = [
            {'time': float(t), 'type': 'emotional_peak', 'amplitude_db': float(rms_db[i])}
            for t, i in zip(timestamps, peaks)
        ]
        
        return audio, trigger_list
    
    def apply_pre_emphasis(self, audio: np.ndarray, coef: float = 0.97) -> np.ndarray:
        """
        Apply pre-emphasis filter to boost high frequencies (presence/air).
        
        Args:
            audio: Input audio signal
            coef: Pre-emphasis coefficient (0.0-1.0, default: 0.97)
        
        Returns:
            Pre-emphasized audio signal
        """
        logger.debug(f"✨ Applying pre-emphasis (coef: {coef})")
        return librosa.effects.preemphasis(audio, coef=coef)
    
    def process_vocal(self, input_path: str, output_path: str, 
                      config: Optional[dict] = None) -> Tuple[str, dict]:
        """
        Process vocal audio through the complete acid chain.
        
        Signal flow:
        1. Load audio
        2. High-pass filter (cut lows below 150Hz)
        3. Pre-emphasis (boost highs for presence)
        4. Tape saturation (analog warmth)
        5. Acid-modulated delay (rhythmic echo)
        6. Detect biometric triggers (emotional peaks)
        7. Normalize and export
        
        Args:
            input_path: Path to input audio file (WAV, MP3, etc.)
            output_path: Path to save processed audio (WAV recommended)
            config: Optional processing config dict with keys:
                - 'hpf_cutoff': High-pass filter cutoff in Hz (default: 150.0)
                - 'saturation_drive': Tape saturation drive (default: 2.0)
                - 'saturation_mix': Tape saturation wet/dry (default: 0.7)
                - 'delay_subdivision': Delay subdivision (default: '1/8')
                - 'delay_feedback': Delay feedback (default: 0.4)
                - 'delay_mix': Delay wet/dry mix (default: 0.35)
                - 'pre_emphasis_coef': Pre-emphasis coefficient (default: 0.97)
        
        Returns:
            Tuple of (output_path, metadata_dict)
        """
        logger.info(f"🎙️ Processing vocal: {input_path}")
        
        # Default config
        default_config = {
            'hpf_cutoff': 150.0,
            'saturation_drive': 2.0,
            'saturation_mix': 0.7,
            'delay_subdivision': '1/8',
            'delay_feedback': 0.4,
            'delay_mix': 0.35,
            'pre_emphasis_coef': 0.97,
        }
        
        if config:
            default_config.update(config)
        cfg = default_config
        
        # 1. Load audio
        logger.debug("📂 Loading audio file")
        audio, sr = librosa.load(input_path, sr=self.sample_rate, mono=True)
        logger.debug(f"   Loaded: {len(audio)} samples, {sr}Hz, {len(audio)/sr:.2f}s duration")
        
        # 2. High-pass filter
        audio = self.high_pass_filter(audio, cutoff_hz=cfg['hpf_cutoff'])
        
        # 3. Pre-emphasis
        audio = self.apply_pre_emphasis(audio, coef=cfg['pre_emphasis_coef'])
        
        # 4. Tape saturation
        audio = self.tape_saturation(audio, drive=cfg['saturation_drive'], 
                                      mix=cfg['saturation_mix'])
        
        # 5. Acid-modulated delay
        audio = self.acid_modulated_delay(audio, 
                                          delay_subdivision=cfg['delay_subdivision'],
                                          feedback=cfg['delay_feedback'],
                                          wet_mix=cfg['delay_mix'])
        
        # 6. Detect biometric triggers
        audio, triggers = self.detect_biometric_triggers(audio)
        
        # 7. Final normalization
        peak = np.max(np.abs(audio))
        if peak > 0:
            audio = audio * (0.95 / peak)  # Normalize to -0.5dB headroom
        
        # 8. Save output
        logger.debug(f"💾 Saving processed audio: {output_path}")
        sf.write(output_path, audio, self.sample_rate)
        
        # Build metadata
        metadata = {
            'input_path': input_path,
            'output_path': output_path,
            'sample_rate': self.sample_rate,
            'bpm': self.bpm,
            'duration_sec': len(audio) / self.sample_rate,
            'config': cfg,
            'biometric_triggers': triggers,
        }
        
        logger.info(f"✅ Vocal processing complete: {output_path}")
        logger.info(f"   Duration: {metadata['duration_sec']:.2f}s")
        logger.info(f"   Triggers: {len(triggers)} biometric peaks detected")
        
        return output_path, metadata


# --- CLI Usage ---
if __name__ == "__main__":
    import sys
    import json
    
    logging.basicConfig(level=logging.INFO, 
                        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    if len(sys.argv) < 3:
        print("Usage: python acid_vocal_chain.py <input_audio.wav> <output_audio.wav> [bpm]")
        print("\nExample:")
        print("  python acid_vocal_chain.py raw_vocal.wav processed_acid_vocal.wav 72")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    bpm = int(sys.argv[3]) if len(sys.argv) > 3 else 72
    
    try:
        chain = AcidVocalChain(sample_rate=44100, bpm=bpm)
        processed_path, metadata = chain.process_vocal(input_path, output_path)
        
        print(f"\n🔥 SUCCESS! Acid vocal chain applied")
        print(f"📊 Metadata:")
        print(json.dumps(metadata, indent=2))
        print(f"\n💡 Next steps:")
        print(f"   1. Import {processed_path} into your DAW")
        print(f"   2. Layer with drums/808s from Groove Engine")
        print(f"   3. Apply final mastering via Sonance Sentinel")
    except Exception as e:
        logger.error(f"❌ Failed to process vocal: {e}")
        sys.exit(1)
