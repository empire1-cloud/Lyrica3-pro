import os
import json
import logging
import base64
import re

logger = logging.getLogger("empire1.lyrica_vision")

VISION_SYSTEM_PROMPT = """You are Lyrica OS's visual cortex. You translate images into emotional and harmonic data for a DSP mastering engine and stem router.
Analyze the image and return ONLY a valid JSON object matching this schema:
{
    "primary_color": "string (hex code e.g. #FF0000)",
    "brightness": float (0.0 to 1.0, where 0 is pitch black and 1 is blinding white),
    "energy_level": float (0.0 to 1.0, where 0 is calm/still and 1 is chaotic/kinetic),
    "dominant_emotion": "string (e.g., Nostalgic, Melancholic, Aggressive, Ethereal, Intimate)",
    "suggested_key_scale": "string (MUST BE ONE OF: C_MAJOR_A_MINOR, D_FLAT_MAJOR_B_FLAT_MINOR, D_MAJOR_B_MINOR, E_FLAT_MAJOR_C_MINOR, E_MAJOR_D_FLAT_MINOR, F_MAJOR_D_MINOR, G_FLAT_MAJOR_E_FLAT_MINOR, G_MAJOR_E_MINOR, A_FLAT_MAJOR_F_MINOR, A_MAJOR_G_FLAT_MINOR, B_FLAT_MAJOR_G_MINOR, B_MAJOR_A_FLAT_MINOR)"
}"""

async def analyze_image_for_lyrica(image_b64: str) -> dict:
    """Extract mood, color, culture, energy, and harmonic mapping from an image."""
    try:
        from google import genai
        from google.genai import types as gtypes
        
        genai_key = os.environ.get("GEMINI_API_KEY")
        if not genai_key:
            return {}
            
        client = genai.Client(api_key=genai_key)
        image_bytes = base64.b64decode(image_b64)
        
        # In a real async environment, wrap in asyncio.to_thread if the SDK is blocking
        response = client.models.generate_content(
            model="gemini-1.5-pro-002",
            contents=[
                gtypes.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                "Analyze this image and translate its visual properties into emotional and musical metadata."
            ],
            config=gtypes.GenerateContentConfig(
                system_instruction=VISION_SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.4
            )
        )
        
        txt = response.text
        m = re.search(r"\{[\s\S]*\}", txt)
        if m: txt = m.group(0)
        data = json.loads(txt)
        logger.info(f"👁️ Lyrica Vision Extracted Metadata: {data}")
        return data
        
    except Exception as e:
        logger.warning(f"Lyrica Vision analysis failed: {e}")
        return {}