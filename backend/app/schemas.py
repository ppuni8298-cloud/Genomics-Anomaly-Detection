from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Dict, Any

class HealthResponse(BaseModel):
    status: str
    version: str
    spark_available: bool
    timestamp: str

class DatasetResponse(BaseModel):
    id: str
    name: str
    format: str
    sizeBytes: int
    uploadedAt: str
    status: str
    sequenceCount: Optional[int] = 0
    totalBases: Optional[int] = 0
    description: Optional[str] = None

class AnalysisSubmitRequest(BaseModel):
    datasetId: str
    name: str
    windowSize: int = Field(default=500, ge=100, le=10000)
    windowStep: Optional[int] = Field(default=None, ge=50, le=5000)
    kmerSize: int = Field(default=7, ge=3, le=10)
    contaminationRate: float = Field(default=0.05, gt=0.0, le=0.5)
    randomSeed: Optional[int] = Field(default=42, ge=0, le=1000000)

    @model_validator(mode="after")
    def validate_window_step(self):
        if self.windowStep is not None and self.windowStep > self.windowSize:
            raise ValueError("Window step cannot exceed window size.")
        return self

class AnalysisResponse(BaseModel):
    id: str
    name: str
    datasetName: str
    status: str
    anomaliesFound: int
    createdAt: str
    duration: Optional[str] = None
    algorithm: str
    gcContent: Optional[float] = None

class AnalysisDetailResponse(BaseModel):
    id: str
    name: str
    datasetId: str
    datasetName: str
    status: str
    anomaliesFound: int
    anomalyPercentage: float
    totalWindows: int
    totalBases: int
    highSeverityCount: int
    mediumSeverityCount: int
    lowSeverityCount: int
    normalWindowsCount: int
    duration: Optional[str] = None
    algorithm: str
    gcContent: Optional[float] = None
    windowSize: int
    windowStep: int
    kmerSize: int
    contaminationRate: float
    randomSeed: int
    createdAt: str
    datasetFormat: Optional[str] = None
    datasetUploadedAt: Optional[str] = None
    datasetSequenceCount: Optional[int] = None
    datasetSizeBytes: Optional[int] = None
    featureSummary: Optional[Dict[str, Any]] = None

class WindowProfilePoint(BaseModel):
    windowIndex: int
    sequenceId: str
    windowStart: int
    windowEnd: int
    positionLabel: str
    score: float
    isAnomaly: bool
    severity: str
    gcContent: float
    atContent: float
    gcSkew: float
    maxHomopolymer: int

class GcProfilePoint(BaseModel):
    windowIndex: int
    positionLabel: str
    gcContent: float
    isAnomaly: bool
    severity: str

class AnalysisVisualizationsResponse(BaseModel):
    analysisId: str
    datasetName: str
    totalWindows: int
    severityDistribution: Dict[str, int]
    windowsMap: List[WindowProfilePoint]
    gcProfile: List[GcProfilePoint]
    featureComparison: Dict[str, Any]
    scientificDisclaimer: str

class AnomalyResponse(BaseModel):
    id: str
    sequenceId: str
    anomalyType: str
    score: float
    severity: str
    datasetName: str
    position: Optional[str] = None
    gcDeviation: Optional[str] = None
    detectedAt: Optional[str] = None
    description: Optional[str] = None

class AnomalyQueryResponse(BaseModel):
    items: List[AnomalyResponse]
    total: int
    page: int
    limit: int
    totalPages: int

class NucleotideCompositionResponse(BaseModel):
    adenine: float
    thymine: float
    guanine: float
    cytosine: float
    gcContent: float
    totalBases: int

class DashboardStatsResponse(BaseModel):
    totalDatasets: Optional[int] = None
    analysesCompleted: Optional[int] = None
    anomaliesDetected: Optional[int] = None
    lastAnalysisDate: Optional[str] = None

class DatasetComparisonResponse(BaseModel):
    dataset1: Dict[str, Any]
    dataset2: Dict[str, Any]
    configurationWarning: Optional[str] = None
