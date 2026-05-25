"""
Empire Lyric Master - Standalone Server
Zero dependencies, no MongoDB, ultra-lightweight
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.empire_router import router as empire_router

# Create standalone app for Empire
app = FastAPI(
    title="Empire Lyric Master API",
    description="Zero-API Music Production System",
    version="1.0.0",
)

# CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Empire router
app.include_router(empire_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "service": "Empire Lyric Master",
        "status": "online",
        "version": "1.0.0",
        "endpoints": [
            "/api/empire/health",
            "/api/empire/genres",
            "/api/empire/generate"
        ]
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "empire"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
