from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json, tempfile, shutil, uuid
from pathlib import Path

from .vocal_engine import generate_duo_soul, analyze_and_suggest_dna
from .models import DuoSoulRequest, DuoSoulResponse, DNAResponse

from lyrica3_soulfire.soul_card.models import SoulCard, GenerateResponse, InspectResponse
from lyrica3_soulfire.two_pass_pipeline import generate_track_from_soul_card
from lyrica3_soulfire.soul_card.synthid_detector import detect_synthid_watermark

app = FastAPI(title="Lyrica 3 Duo-Soul Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze-voice", response_model=DNAResponse)
async def analyze_voice_endpoint(file: UploadFile = File(...)):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        dna = analyze_and_suggest_dna(tmp_path)
        return DNAResponse(dna=dna)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/duo/generate", response_model=DuoSoulResponse)
async def duo_generate(req: DuoSoulRequest):
    try:
        return generate_duo_soul(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ─── Lyrica 3 Soulfire Universe ───

@app.post("/soulfire/generate")
async def soulfire_generate(card: SoulCard, dna_tag: str = None):
    try:
        temp_path = f"/tmp/soulcard_{uuid.uuid4().hex}.json"
        with open(temp_path, "w") as f:
            f.write(card.model_dump_json())
        out_path = generate_track_from_soul_card(temp_path, dna_tag=dna_tag)
        return GenerateResponse(status="ok", audio_path=out_path, dna_tag=dna_tag)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/soulfire/soul-card")
async def soulfire_validate_card(card: SoulCard):
    return {"valid": True, "card": card.model_dump()}

@app.post("/soulfire/clone")
async def soulfire_clone(source_dna_tag: str, remixer: str, s2_mutation: str = None):
    return {
        "status": "cloned",
        "source": source_dna_tag,
        "remixer": remixer,
        "s2_mutation": s2_mutation or "none",
        "new_dna_tag": f"trk_flip_{uuid.uuid4().hex[:8]}",
    }

@app.post("/soulfire/inspect")
async def soulfire_inspect(audio_path: str, dna_tag: str = None):
    audio_file = Path(audio_path)
    if not audio_file.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    audio_bytes = audio_file.read_bytes()
    result = detect_synthid_watermark(audio_bytes, dna_tag)
    return InspectResponse(detections=[{"dna_tag": result.dna_tag, "confidence": result.confidence}])
