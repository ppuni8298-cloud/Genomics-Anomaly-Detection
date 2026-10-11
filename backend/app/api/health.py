from fastapi import APIRouter
from datetime import datetime
from app.schemas import HealthResponse
from app.services.spark_service import spark_engine

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("", response_model=HealthResponse)
def get_health():
    spark = spark_engine.get_spark_session()
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        spark_available=spark is not None,
        timestamp=datetime.utcnow().isoformat() + "Z"
    )
