import os
import asyncio
import numpy as np
import soundfile as sf
from google import genai

# Import your Soulfire Mastering Engine from the local audio_engine.py
from audio_engine import MasteringChain

def lyria_bytes_to_numpy(audio_bytes, sample_rate=44100):
    """
    Convert raw PCM bytes from Lyria into a NumPy float32 array.
    Assuming the bytes are 16-bit PCM for this example, but adjusting as needed.
    """
    # Assuming Lyria returns 16-bit PCM 
    # (Update this if the API returns a different format like float32 or MP3/WAV with headers)
    audio = np.frombuffer(audio_bytes, dtype=np.int16)

    # Convert to float32 between -1.0 and 1.0
    audio = audio.astype(np.float32) / 32768.0
    
    # If stereo interleaved, reshape to (N, 2). Assuming Mono for now unless specified.
    # If you know the output is stereo, you'd do:
    # audio = audio.reshape(-1, 2)

    return audio, sample_rate

def master_lyria_audio(audio_bytes, preset="soulfire", out_path="mastered.wav"):
    """
    Full pipeline: Lyria bytes → NumPy → Soulfire Mastering → WAV.
    """
    print(f"Converting bytes to numpy array...")
    # 1. Convert to NumPy
    # Note: Lyria's exact sample rate might vary (e.g., 24000 or 44100). 
    # Adjust `sr` here if you know the exact output specs.
    audio, sr = lyria_bytes_to_numpy(audio_bytes, sample_rate=44100)

    print(f"Applying Soulfire MasteringChain (preset: {preset})...")
    # 2. Run through your mastering chain
    chain = MasteringChain(preset=preset, sr=sr)
    mastered = chain.process(audio)

    print(f"Saving mastered track to {out_path}...")
    # 3. Save to disk
    sf.write(out_path, mastered, sr)
    return out_path

async def main():
    # Initialize the client using the environment variable
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
        http_options={'api_version': 'v1alpha'}
    )
    
    print("Generating raw audio from Lyria...")
    prompt = "A heavy synthwave bassline with a fast tempo, instrumental."
    
    try:
        # Note: Depending on the exact Lyria API endpoint you use (generate_content vs live realtime),
        # how you extract the raw bytes differs. This assumes the standard generate_content returns
        # an audio file or inline bytes. For the realtime streaming API, you would collect 
        # the chunks and concatenate them before passing to the master function.
        
        # For this example, let's pretend we have some raw PCM bytes 
        # (you'll plug in the actual Lyria byte stream here based on your specific API call)
        # raw_bytes = get_lyria_bytes(...) 
        
        # Let's generate a quick sine wave just to test the mastering chain runs without crashing
        print("Creating a test tone (simulate Lyria bytes)...")
        t = np.linspace(0, 2, 44100 * 2, endpoint=False) # 2 seconds
        test_audio = (np.sin(2 * np.pi * 440 * t) * 16000).astype(np.int16) 
        raw_bytes = test_audio.tobytes()
        
        # Master it!
        mastered_file = master_lyria_audio(
            audio_bytes=raw_bytes, 
            preset="soulfire", 
            out_path="soulfire_mastered_output.wav"
        )
        print(f"Done! Mastered file saved as: {mastered_file}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(main())
