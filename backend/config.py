import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# Force local SQLite database to prevent global Postgres env overrides from breaking local execution
# Skip this override when deploying on Render in production
if "RENDER" not in os.environ and "DATABASE_URL" in os.environ and not os.environ["DATABASE_URL"].startswith("sqlite"):
    os.environ["DATABASE_URL"] = "sqlite:///./gramcredit.db"

# Correct postgres:// prefix to postgresql:// for SQLAlchemy compatibility on Render
if "DATABASE_URL" in os.environ and os.environ["DATABASE_URL"].startswith("postgres://"):
    os.environ["DATABASE_URL"] = os.environ["DATABASE_URL"].replace("postgres://", "postgresql://", 1)


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./gramcredit.db"
    SECRET_KEY: str = "supersecretkeyforlocaldevchangeinproduction"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 Hours
    GEMINI_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
