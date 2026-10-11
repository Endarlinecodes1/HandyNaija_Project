"""Application configuration settings using Pydantic BaseSettings."""
import json
import os
from typing import List, Optional, Union

from pydantic import AnyHttpUrl, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Global settings and environment variable loader for HandyNaija."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # General Project Info
    PROJECT_NAME: str = "HandyNaija API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # PostgreSQL Database - for local dev only
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "handynaija"

    # This is the important fix - Render provides DATABASE_URL
    DATABASE_URL: Optional[str] = None
    SQLALCHEMY_DATABASE_URI: Union[PostgresDsn, str, None] = None

    @field_validator("SQLALCHEMY_DATABASE_URI", mode="before")
    def assemble_db_connection(cls, v: Optional[str], info) -> Union[str, PostgresDsn, None]:
        """Assemble DB connection string, but use Render DATABASE_URL if explicitly provided."""
        # If value is already given for SQLALCHEMY_DATABASE_URI, use it
        if isinstance(v, str) and v:
            return v

        data = info.data if hasattr(info, 'data') else {}

        # FIX: Check Render's DATABASE_URL first - THIS FIXES YOUR LOCALHOST ERROR
        render_url = os.environ.get("DATABASE_URL") or data.get("DATABASE_URL")
        if render_url:
            if render_url.startswith("postgres://"):
                render_url = render_url.replace("postgres://", "postgresql://", 1)
            return render_url

        # Fallback: build from parts for local development
        user = data.get("POSTGRES_USER", "postgres")
        password = data.get("POSTGRES_PASSWORD", "postgres")
        server = data.get("POSTGRES_SERVER", "localhost")
        port = data.get("POSTGRES_PORT", 5432)
        db = data.get("POSTGRES_DB", "handynaija")

        return f"postgresql://{user}:{password}@{server}:{port}/{db}"

    # JWT & Cryptographic Security
    SECRET_KEY: str = "handynaija2025secretkey123"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 11520 # 8 days for MVP session convenience

    # CORS Origins
    BACKEND_CORS_ORIGINS: List[Union[str, AnyHttpUrl]] = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse CORS origins whether given as JSON list or comma-separated string."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        if isinstance(v, str):
            return json.loads(v)
        return v

settings = Settings()
# Debug log to confirm which DB is being used
print(f"DEBUG DB URL: {str(settings.SQLALCHEMY_DATABASE_URI)[:60]}...")
