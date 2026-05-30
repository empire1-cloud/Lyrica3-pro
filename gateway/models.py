from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    handle: str = Field(..., min_length=3, max_length=32, pattern=r'^[a-z0-9_.-]+$')
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    handle: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    handle: str
    wallet: str


class ErrorResponse(BaseModel):
    detail: str


class ProxyTarget:
    def __init__(self, base_url: str, strip_prefix: str | None = None):
        self.base_url = base_url.rstrip('/')
        self.strip_prefix = strip_prefix

    def resolve(self, path: str) -> str:
        if self.strip_prefix and path.startswith(self.strip_prefix):
            path = path[len(self.strip_prefix):]
        return f"{self.base_url}{path}"
