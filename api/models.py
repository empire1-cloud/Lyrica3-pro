from pydantic import BaseModel
from typing import Dict, Any

class DuoSoulRequest(BaseModel):
    prompt: str
    persona: str
    dna: Dict[str, float]
    use_neural: bool = True

class DuoSoulResponse(BaseModel):
    lyrics: str
    metadata: Dict[str, Any]

class DNAResponse(BaseModel):
    dna: Dict[str, float]
