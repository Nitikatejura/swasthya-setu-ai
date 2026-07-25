import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "SwasthyaSetu AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "swasthya-setu-ai-super-secret-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # 15 minutes short-lived
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7    # 7 days refresh
    
    # Database
    # Default to SQLite for dev, PostgreSQL compatible
    SQLALCHEMY_DATABASE_URI: str = os.getenv(
        "DATABASE_URL", "sqlite:///./swasthya_setu.db"
    )
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    
    # AI Provider Config
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini")  # "gemini" or "mock"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Clinical Guidelines Default ("who" or "india_nhm")
    DEFAULT_TRIAGE_GUIDELINE: str = os.getenv("DEFAULT_TRIAGE_GUIDELINE", "india_nhm")

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
