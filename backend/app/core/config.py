import os
import secrets
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "swasthya_setu.db").replace("\\", "/")

class Settings(BaseSettings):
    PROJECT_NAME: str = "SwasthyaSetu AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    SECRET_KEY: str = os.getenv("SECRET_KEY") or secrets.token_hex(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # 15 minutes short-lived
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7    # 7 days refresh
    
    # Database
    SQLALCHEMY_DATABASE_URI: str = os.getenv(
        "DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}"
    )
    
    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    def get_cors_origins(self) -> List[str]:
        origins = list(self.BACKEND_CORS_ORIGINS)
        if self.FRONTEND_URL and self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)
        return origins
    
    # AI Provider Config
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Clinical Guidelines Default ("who" or "india_nhm")
    DEFAULT_TRIAGE_GUIDELINE: str = os.getenv("DEFAULT_TRIAGE_GUIDELINE", "india_nhm")

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
        extra="ignore"
    )

settings = Settings()

