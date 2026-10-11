from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends, Query
from typing import List, Optional
from app.config import settings
from app.storage.local_storage import storage
from app.genomics.parser import GenomicParser, GenomicParseError
from app.schemas import DatasetResponse, NucleotideCompositionResponse, DatasetComparisonResponse
from app.auth import get_current_user, AuthenticatedUser

router = APIRouter(prefix="/datasets", tags=["Datasets"])

CHUNK_SIZE = 64 * 1024  # 64KB streaming buffer

@router.post("/upload", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    description: Optional[str] = Form(""),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided in upload payload.")

    # 1. Enforce streaming size limit (abort early if oversized)
    total_bytes = 0
    chunks = []

    while True:
        chunk = await file.read(CHUNK_SIZE)
        if not chunk:
            break
        total_bytes += len(chunk)
        if total_bytes > settings.MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed upload size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB."
            )
        chunks.append(chunk)

    if total_bytes == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

    content_bytes = b"".join(chunks)

    # 2. Content-based format inspection and parsing
    try:
        fmt = GenomicParser.detect_format(file.filename, content_bytes)
        content_str = content_bytes.decode('utf-8', errors='replace')

        if fmt == 'fasta':
            records = GenomicParser.parse_fasta(content_str)
        else:
            records = GenomicParser.parse_csv(content_str)
    except GenomicParseError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse sequence data: {str(e)}")

    total_bases = sum(len(r["sequence"]) for r in records)

    # 3. Save file with path-traversal prevention
    clean_name, storage_path = storage.save_file(file.filename, content_bytes)

    # 4. Save metadata strictly scoped to current_user.user_id
    ds_record = storage.insert_dataset(
        user_id=current_user.user_id,
        name=clean_name,
        storage_path=str(storage_path),
        fmt=fmt,
        size_bytes=total_bytes,
        sequence_count=len(records),
        total_bases=total_bases,
        description=description or f"Parsed {len(records)} sequence record(s)."
    )

    return DatasetResponse(**ds_record)

@router.get("", response_model=List[DatasetResponse])
def list_datasets(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Returns only datasets owned by the authenticated researcher."""
    return storage.get_datasets(user_id=current_user.user_id)

@router.get("/compare", response_model=DatasetComparisonResponse)
def compare_datasets(
    dataset1_id: str = Query(..., alias="dataset1_id"),
    dataset2_id: str = Query(..., alias="dataset2_id"),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Compares two datasets and their analysis metrics owned by current user."""
    comparison = storage.compare_datasets(
        user_id=current_user.user_id,
        dataset1_id=dataset1_id,
        dataset2_id=dataset2_id
    )
    if not comparison:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or both datasets not found or not owned by the authenticated researcher."
        )
    return DatasetComparisonResponse(**comparison)

@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(
    dataset_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Retrieves dataset details with strict user authorization check."""
    ds = storage.get_dataset(dataset_id=dataset_id, user_id=current_user.user_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found or access denied.")
    return DatasetResponse(
        id=ds["id"],
        name=ds["name"],
        format=ds["format"],
        sizeBytes=ds["size_bytes"],
        uploadedAt=ds["uploaded_at"],
        status=ds["status"],
        sequenceCount=ds["sequence_count"],
        totalBases=ds.get("total_bases") or 0,
        description=ds["description"]
    )

@router.get("/{dataset_id}/composition", response_model=NucleotideCompositionResponse)
def get_dataset_composition(
    dataset_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Calculates nucleotide composition for a dataset owned by current user."""
    ds = storage.get_dataset(dataset_id=dataset_id, user_id=current_user.user_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found or access denied.")

    storage_path = ds["storage_path"]
    try:
        with open(storage_path, "r", encoding="utf-8", errors="replace") as f:
            content_str = f.read()

        if ds["format"] == 'fasta':
            records = GenomicParser.parse_fasta(content_str)
        else:
            records = GenomicParser.parse_csv(content_str)

        composition = GenomicParser.calculate_nucleotide_composition(records)
        return NucleotideCompositionResponse(**composition)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate composition: {str(e)}")
