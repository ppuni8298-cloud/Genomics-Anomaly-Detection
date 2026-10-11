import io
import csv
import uuid
from fastapi import APIRouter, HTTPException, status, Depends, Query
from fastapi.responses import Response, PlainTextResponse
from typing import List, Optional
from app.config import settings
from app.storage.local_storage import storage
from app.genomics.parser import GenomicParser
from app.genomics.features import extract_window_features
from app.services.spark_service import spark_engine
from app.auth import get_current_user, AuthenticatedUser
from app.schemas import (
    AnalysisSubmitRequest,
    AnalysisResponse,
    AnalysisDetailResponse,
    AnalysisVisualizationsResponse,
    AnomalyResponse,
    AnomalyQueryResponse,
    DashboardStatsResponse
)

router = APIRouter(prefix="", tags=["Analysis & Anomalies"])

@router.post("/analysis/submit", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
def submit_analysis(
    payload: AnalysisSubmitRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    # 1. Enforce dataset ownership: User can only analyze their own dataset
    ds = storage.get_dataset(dataset_id=payload.datasetId, user_id=current_user.user_id)
    if not ds:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referenced dataset not found or access denied."
        )

    # 2. Validate analysis parameters
    if payload.windowSize < 100 or payload.windowSize > 10000:
        raise HTTPException(status_code=400, detail="Window size must be between 100 and 10,000 base pairs.")
    if payload.kmerSize < 3 or payload.kmerSize > 10:
        raise HTTPException(status_code=400, detail="K-mer word size must be between 3 and 10.")
    if payload.contaminationRate <= 0.0 or payload.contaminationRate > 0.5:
        raise HTTPException(status_code=400, detail="Contamination rate must be in range (0.0, 0.5].")

    step = payload.windowStep if payload.windowStep is not None else max(payload.windowSize // 2, 50)
    seed = payload.randomSeed if payload.randomSeed is not None else 42

    analysis_id = f"ana-{uuid.uuid4().hex[:8]}"
    algorithm_tag = f"PySpark + Isolation Forest (w={payload.windowSize}bp, s={step}bp, k={payload.kmerSize})"

    # 3. Register running record owned by current_user.user_id
    storage.insert_analysis(
        analysis_id=analysis_id,
        user_id=current_user.user_id,
        name=payload.name,
        dataset_id=ds["id"],
        dataset_name=ds["name"],
        algorithm=algorithm_tag,
        window_size=payload.windowSize,
        window_step=step,
        kmer_size=payload.kmerSize,
        contamination_rate=payload.contaminationRate,
        random_seed=seed
    )

    try:
        # Read verified dataset file
        with open(ds["storage_path"], "r", encoding="utf-8", errors="replace") as f:
            content_str = f.read()

        if ds["format"] == 'fasta':
            records = GenomicParser.parse_fasta(content_str)
        else:
            records = GenomicParser.parse_csv(content_str)

        total_bases = sum(len(r["sequence"]) for r in records)

        # Extract sliding-window feature vectors
        all_features = []
        remaining_budget = settings.MAX_TOTAL_WINDOWS

        for rec in records:
            if remaining_budget <= 0:
                break
            feats = extract_window_features(
                seq_id=rec["sequence_id"],
                sequence=rec["sequence"],
                window_size=payload.windowSize,
                window_stride=step,
                kmer_size=payload.kmerSize,
                max_windows=remaining_budget
            )
            all_features.extend(feats)
            remaining_budget -= len(feats)

        if not all_features:
            raise ValueError("Sequence length is insufficient for sliding window feature extraction.")

        # Process with Apache Spark & Isolation Forest
        anomalies, global_gc, duration_str, scored_windows, feature_comparison, severity_counts = spark_engine.process_features_and_detect_anomalies(
            features=all_features,
            dataset_name=ds["name"],
            contamination=payload.contaminationRate,
            random_seed=seed
        )

        # Save detected anomalies owned by current_user.user_id
        for anom in anomalies:
            storage.insert_anomaly(
                analysis_id=analysis_id,
                user_id=current_user.user_id,
                sequence_id=anom["sequence_id"],
                anomaly_type=anom["anomaly_type"],
                score=anom["score"],
                severity=anom["severity"],
                dataset_name=anom["dataset_name"],
                position=anom["position"],
                gc_deviation=anom["gc_deviation"],
                description=anom["description"]
            )

        # Downsample windows to max 500 for lightweight interactive visualization
        # Always retain 100% of anomaly windows + evenly spaced normal windows
        anom_windows = [w for w in scored_windows if w["is_anomaly"]]
        norm_windows = [w for w in scored_windows if not w["is_anomaly"]]

        max_sample_norm = max(500 - len(anom_windows), 50)
        if len(norm_windows) > max_sample_norm:
            stride_step = len(norm_windows) // max_sample_norm
            sampled_norm = norm_windows[::stride_step][:max_sample_norm]
        else:
            sampled_norm = norm_windows

        combined_sample = anom_windows + sampled_norm
        combined_sample.sort(key=lambda w: w["window_start"])

        storage.insert_analysis_windows(
            user_id=current_user.user_id,
            analysis_id=analysis_id,
            windows=combined_sample
        )

        # Mark analysis completed
        storage.update_analysis_completion(
            analysis_id=analysis_id,
            status="completed",
            anomalies_found=len(anomalies),
            duration=duration_str,
            gc_content=global_gc,
            total_windows=len(all_features),
            total_bases=total_bases,
            high_severity_count=severity_counts.get("high", 0),
            medium_severity_count=severity_counts.get("medium", 0),
            low_severity_count=severity_counts.get("low", 0),
            normal_windows_count=severity_counts.get("normal", 0),
            feature_summary=feature_comparison
        )

        analyses = storage.get_analyses(user_id=current_user.user_id)
        updated_rec = next((a for a in analyses if a["id"] == analysis_id), None)
        return AnalysisResponse(**updated_rec)

    except HTTPException:
        storage.update_analysis_completion(
            analysis_id=analysis_id,
            status="failed",
            anomalies_found=0,
            duration="0s",
            gc_content=0.0
        )
        raise
    except ValueError as ve:
        storage.update_analysis_completion(
            analysis_id=analysis_id,
            status="failed",
            anomalies_found=0,
            duration="0s",
            gc_content=0.0
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        storage.update_analysis_completion(
            analysis_id=analysis_id,
            status="failed",
            anomalies_found=0,
            duration="0s",
            gc_content=0.0
        )
        raise HTTPException(status_code=500, detail=f"Analysis pipeline execution failed: {str(e)}")

@router.get("/analysis/list", response_model=List[AnalysisResponse])
def list_analyses(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Returns only analyses owned by the authenticated researcher."""
    analyses = storage.get_analyses(user_id=current_user.user_id)
    return [AnalysisResponse(**a) for a in analyses]

@router.get("/analysis/{analysis_id}/details", response_model=AnalysisDetailResponse)
def get_analysis_details(
    analysis_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Retrieves full analysis metrics, dataset metadata, and parameters."""
    details = storage.get_analysis_details(analysis_id=analysis_id, user_id=current_user.user_id)
    if not details:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found or access denied.")
    return AnalysisDetailResponse(**details)

@router.get("/analysis/{analysis_id}/visualizations", response_model=AnalysisVisualizationsResponse)
def get_analysis_visualizations(
    analysis_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Retrieves exact window profiles and severity distributions for interactive charts."""
    viz = storage.get_analysis_visualizations(analysis_id=analysis_id, user_id=current_user.user_id)
    if not viz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis visualizations not found or access denied.")
    return AnalysisVisualizationsResponse(**viz)

@router.get("/analysis/{analysis_id}/report")
def download_analysis_report(
    analysis_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Generates and downloads a comprehensive markdown analysis summary report."""
    report_md = storage.get_analysis_report_markdown(analysis_id=analysis_id, user_id=current_user.user_id)
    if not report_md:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis report not found or access denied.")

    filename = f"genomic_analysis_report_{analysis_id}.md"
    return Response(
        content=report_md,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/anomalies", response_model=List[AnomalyResponse])
def list_anomalies(
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Returns all anomalies owned by the authenticated researcher."""
    anomalies = storage.get_anomalies(user_id=current_user.user_id)
    return [AnomalyResponse(**a) for a in anomalies]

@router.get("/anomalies/query", response_model=AnomalyQueryResponse)
def query_anomalies(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    severity: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    min_score: Optional[float] = Query(default=None, ge=0.0, le=1.0),
    max_score: Optional[float] = Query(default=None, ge=0.0, le=1.0),
    sort_by: str = Query(default="score"),
    sort_order: str = Query(default="desc"),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Paginated, searchable, filterable, and sortable anomaly query endpoint."""
    result = storage.query_anomalies(
        user_id=current_user.user_id,
        page=page,
        limit=limit,
        severity=severity,
        search=search,
        min_score=min_score,
        max_score=max_score,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return AnomalyQueryResponse(**result)

@router.get("/anomalies/export")
def export_anomalies_csv(
    analysis_id: Optional[str] = None,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Exports detected anomalies strictly owned by current user as CSV with RFC-4180 escaping."""
    if analysis_id:
        ana = storage.get_analysis_details(analysis_id, current_user.user_id)
        if not ana:
            raise HTTPException(status_code=404, detail="Referenced analysis not found or access denied.")

    records = storage.get_anomalies_for_export(user_id=current_user.user_id, analysis_id=analysis_id)

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    writer.writerow([
        "Anomaly ID",
        "Sequence Locus",
        "Anomaly Classification",
        "Outlier Score",
        "Severity",
        "Source Dataset",
        "Genomic Position",
        "GC Deviation",
        "Detection Timestamp",
        "Description"
    ])

    for r in records:
        writer.writerow([
            r.get("id", ""),
            r.get("sequence_id", ""),
            r.get("anomaly_type", ""),
            f"{r.get('score', 0.0):.3f}",
            r.get("severity", ""),
            r.get("dataset_name", ""),
            r.get("position", ""),
            r.get("gc_deviation", ""),
            r.get("detected_at", ""),
            r.get("description", "")
        ])

    csv_data = output.getvalue()
    filename = f"genomic_anomalies_{analysis_id or 'all'}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/stats", response_model=DashboardStatsResponse)
def get_stats(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Returns dashboard summary stats strictly scoped to current user."""
    return storage.get_dashboard_stats(user_id=current_user.user_id)
