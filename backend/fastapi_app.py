from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from main_agent import agent as lyrica_agent

api = FastAPI(title="SL Universal Lyrica API", version="1.0.0")


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1)
    user_id: str = Field(default="web_user")


class QueryResponse(BaseModel):
    status: str
    user_id: str
    result: Dict[str, Any]


@api.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "sl-universal-lyrica-api"}


@api.post("/api/lyrica/query", response_model=QueryResponse)
async def lyrica_query(payload: QueryRequest) -> QueryResponse:
    try:
        result = lyrica_agent.query(payload.query)
        return QueryResponse(status="success", user_id=payload.user_id, result=result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Lyrica query failed: {exc}") from exc


app = api
