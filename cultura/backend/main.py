from fastapi import FastAPI

app = FastAPI(title="Cultura Vibe Forge Backend")

@app.get("/health")
def health():
    return {"status": "ok", "service": "cultura-backend"}
