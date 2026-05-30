import os
from dataclasses import dataclass, field
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).parent
load_dotenv(ROOT / '.env')


@dataclass
class Settings:
    # Server
    host: str = os.environ.get('GATEWAY_HOST', '0.0.0.0')
    port: int = int(os.environ.get('GATEWAY_PORT', '8000'))

    # MongoDB
    mongo_url: str = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name: str = os.environ.get('DB_NAME', 'lyrica3_dev')

    # JWT (shared secret with all universe backends)
    jwt_secret: str = os.environ.get('JWT_SECRET', 'dev_secret_change_me_before_prod')
    access_ttl_minutes: int = int(os.environ.get('ACCESS_TTL_MINUTES', '15'))
    refresh_ttl_days: int = int(os.environ.get('REFRESH_TTL_DAYS', '30'))

    # Internal service URLs
    lyrica_backend_url: str = os.environ.get('LYRICA_BACKEND_URL', 'http://localhost:8001')
    transaction_api_url: str = os.environ.get('TRANSACTION_API_URL', 'http://localhost:8002')
    customer_api_url: str = os.environ.get('CUSTOMER_API_URL', 'http://localhost:8003')

    # Internal shared secret for service-to-service calls
    internal_key: str = os.environ.get('GATEWAY_INTERNAL_KEY', 'dev_internal_key')

    # CORS
    cors_origins: list[str] = field(default_factory=lambda: os.environ.get('CORS_ORIGINS', '*').split(','))

    # Public paths that bypass auth entirely
    public_paths: set = field(default_factory=lambda: {
        '/health', '/api/health',
        '/api/auth/register', '/api/auth/login', '/api/auth/refresh',
        '/api/txn/billing/webhook',
        '/api/vibes',
    })


settings = Settings()
