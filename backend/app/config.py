import os
import sys
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "GenomeAI Anomaly Detection Backend"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = os.getenv("NODE_ENV", os.getenv("ENVIRONMENT", "development"))

    # Base directories
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    UPLOAD_DIR: Path = DATA_DIR / "uploads"
    DB_PATH: Path = DATA_DIR / "genomics.db"

    # Authentication Secret shared with Next.js frontend for JWT verification
    AUTH_SECRET: str = os.getenv(
        "AUTH_SECRET",
        "genome_ai_secret_key_session_auth_phase2_super_secure_32b_token"
    )

    # Upload limits
    MAX_UPLOAD_SIZE_BYTES: int = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", 50 * 1024 * 1024))  # 50MB
    ALLOWED_EXTENSIONS: set = {".fasta", ".fa", ".fna", ".csv"}

    # Resource exhaustion guards
    MAX_SEQUENCE_LENGTH: int = 50_000_000     # 50 Mbp max per record
    MAX_RECORD_COUNT: int = 10_000           # 10k records max per file
    MAX_TOTAL_WINDOWS: int = 100_000         # 100k windows max per analysis run

    # CORS
    CORS_ORIGINS: list[str] = [
        o.strip() for o in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001"
        ).split(",") if o.strip()
    ]

    # Host & Port
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))

    # Spark Settings
    SPARK_APP_NAME: str = "GenomeAI-Spark-AnomalyDetection"
    SPARK_MASTER: str = os.getenv("SPARK_MASTER", "local[*]")
    SPARK_DRIVER_MEMORY: str = os.getenv("SPARK_DRIVER_MEMORY", "2g")

    def validate_production_secrets(self):
        """Ensures strong production secrets are present."""
        if self.ENVIRONMENT == "production":
            if not self.AUTH_SECRET or len(self.AUTH_SECRET) < 32 or "super_secure_32b_token" in self.AUTH_SECRET:
                raise ValueError("CRITICAL: Strong AUTH_SECRET (>= 32 chars) must be configured in production!")

settings = Settings()

# Validate environment secrets
try:
    settings.validate_production_secrets()
except ValueError as e:
    # Print error but don't exit in development
    if settings.ENVIRONMENT == "production":
        sys.exit(str(e))

# Ensure data directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
