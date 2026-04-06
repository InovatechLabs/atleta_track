from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "AtletaTrack"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql://atletatrack:atletatrack@db:5432/atletatrack"
    REDIS_URL: str = "redis://redis:6379/0"

    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_USE_256BIT_RANDOM"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET: str = "atletatrack-models"

    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://atletatrack.app",
    ]

    ANOMALY_THRESHOLD: float = -0.2
    KMEANS_CLUSTERS: int = 4

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
