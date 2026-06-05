from .voice_analyzer import analyze_voice
from .soulfire_bridge import generate_soulfire_payload
from .models import DuoSoulRequest, DuoSoulResponse

def analyze_and_suggest_dna(path: str):
    return analyze_voice(path)

def generate_duo_soul(req: DuoSoulRequest) -> DuoSoulResponse:
    payload = generate_soulfire_payload(
        prompt=req.prompt,
        persona=req.persona,
        dna=req.dna,
        use_neural=req.use_neural
    )
    return DuoSoulResponse(
        lyrics=payload["lyrics"],
        metadata=payload
    )
