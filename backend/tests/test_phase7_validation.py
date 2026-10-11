import time
import pytest
import jwt
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.genomics.parser import GenomicParser, GenomicParseError
from app.genomics.features import extract_window_features
from app.genomics.anomaly_model import GenomicAnomalyModel

client = TestClient(app)

def make_token(user_id: str = "phase7_tester", exp: int = 3600):
    payload = {
        "userId": user_id,
        "email": f"{user_id}@lab.org",
        "name": f"Researcher {user_id}",
        "exp": int(time.time()) + exp,
    }
    return jwt.encode(payload, settings.AUTH_SECRET, algorithm="HS256")

def auth_headers(user_id: str = "phase7_tester"):
    return {"Authorization": f"Bearer {make_token(user_id)}"}


# -----------------------------------------------------------------------------
# 1. FASTA & CSV Formats, Headers, and Boundary Cases
# -----------------------------------------------------------------------------

def test_valid_fasta_multiple_records():
    content = """>SEQ_1 Alpha Sequence
AGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT
>SEQ_2 Beta Sequence
CGATCGATCGATCGATCGATCGATCGATCGATCGATCGAT
"""
    records = GenomicParser.parse_fasta(content)
    assert len(records) == 2
    assert records[0]["sequence_id"] == "SEQ_1"
    assert records[1]["sequence_id"] == "SEQ_2"
    assert len(records[0]["sequence"]) == 40
    assert len(records[1]["sequence"]) == 40

def test_valid_csv_formats():
    content = """id,sequence,notes
GENE_01,AGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT,Synthetic promoter
GENE_02,CGATCGATCGATCGATCGATCGATCGATCGAT,Synthetic terminator
"""
    records = GenomicParser.parse_csv(content)
    assert len(records) == 2
    assert records[0]["sequence_id"] == "GENE_01"
    assert records[1]["sequence_id"] == "GENE_02"

def test_empty_file_rejection():
    with pytest.raises(GenomicParseError, match="empty"):
        GenomicParser.detect_format("empty.fasta", b"")

    headers = auth_headers("empty_file_user")
    res = client.post(
        "/api/datasets/upload",
        headers=headers,
        files={"file": ("empty.fasta", b"", "application/octet-stream")},
    )
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()

def test_malformed_fasta_header():
    # Empty header without ID
    content = """>
AGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT
"""
    with pytest.raises(GenomicParseError, match="Empty FASTA header"):
        GenomicParser.parse_fasta(content)

    # Sequence without header
    content_no_header = """AGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT"""
    with pytest.raises(GenomicParseError, match="before first FASTA header"):
        GenomicParser.parse_fasta(content_no_header)

def test_missing_or_invalid_sequence_data():
    # File with header but zero bases
    content = """>SEQ_EMPTY
"""
    with pytest.raises(GenomicParseError, match="contains no bases|No valid sequence records"):
        GenomicParser.parse_fasta(content)

    # Sequence with all invalid non-genomic characters (digits, punctuation)
    content_invalid = """>SEQ_INVALID
1234567890!@#$%^&*()1234567890
"""
    with pytest.raises(GenomicParseError, match="invalid non-nucleotide characters|contains 0 canonical"):
        GenomicParser.parse_fasta(content_invalid)

def test_ambiguous_iupac_bases():
    content = """>SEQ_IUPAC
AGCTNNNRYSWKMBDHVAGCTAGCTAGCTAGCTAGCTAGCT
"""
    records = GenomicParser.parse_fasta(content)
    assert len(records) == 1
    comp = GenomicParser.calculate_nucleotide_composition(records)
    assert comp["totalBases"] == len(records[0]["sequence"])
    # GC content only counts canonical bases
    assert comp["gcContent"] > 0

def test_unsupported_file_extension_and_content():
    content = b"PDF-1.4 %binary data here not genomic"
    with pytest.raises(GenomicParseError, match="Unsupported genomic file format"):
        GenomicParser.detect_format("document.pdf", content)

    headers = auth_headers("bad_ext_user")
    res = client.post(
        "/api/datasets/upload",
        headers=headers,
        files={"file": ("report.pdf", content, "application/pdf")},
    )
    assert res.status_code == 422


# -----------------------------------------------------------------------------
# 2. Window Features, Short Sequences & Invariant Matrices
# -----------------------------------------------------------------------------

def test_short_sequence_handling():
    # Sequence of 30bp (shorter than min_window_length of 100bp)
    seq = "AGCTAGCTAGCTAGCTAGCTAGCTAGCTAG"
    feats = extract_window_features(
        seq_id="SHORT_SEQ",
        sequence=seq,
        window_size=500,
        window_stride=250,
        min_window_length=100
    )
    # Extracts exactly 1 adaptive window representing the locus
    assert len(feats) == 1
    assert feats[0]["window_start"] == 0
    assert feats[0]["window_length"] == len(seq)

def test_constant_invariant_feature_matrix():
    # Repetitive identical sequence windows produce an invariant feature matrix
    features = []
    for i in range(10):
        features.append({
            "sequence_id": "REP_CHR",
            "window_start": i * 100,
            "window_end": (i + 1) * 100,
            "prop_a": 0.25,
            "prop_t": 0.25,
            "prop_g": 0.25,
            "prop_c": 0.25,
            "gc_content": 0.50,
            "at_content": 0.50,
            "gc_skew": 0.0,
            "max_run_a": 2,
            "max_run_t": 2,
            "max_run_g": 2,
            "max_run_c": 2,
            **{f"kmer_{pair.lower()}": 0.0625 for pair in [
                'AA', 'AC', 'AG', 'AT', 'CA', 'CC', 'CG', 'CT',
                'GA', 'GC', 'GG', 'GT', 'TA', 'TC', 'TG', 'TT'
            ]}
        })

    model = GenomicAnomalyModel(contamination=0.1, random_state=42)
    # Must not raise NaN or zero-division exception on invariant matrix
    anomalies, scored_windows, comp, severity_counts = model.fit_predict_analysis(features, "invariant_test")
    assert len(scored_windows) == 10
    assert isinstance(severity_counts, dict)


# -----------------------------------------------------------------------------
# 3. Parameter Boundary Validation & Duplicate Dataset Names
# -----------------------------------------------------------------------------

def test_invalid_analysis_parameters():
    user = "param_test_user"
    headers = auth_headers(user)

    # 1. Upload valid dataset
    res = client.post(
        "/api/datasets/upload",
        headers=headers,
        files={"file": ("params_seq.fasta", b">CHR\nAGCT" * 50, "text/plain")},
    )
    assert res.status_code == 201
    ds_id = res.json()["id"]

    # Test windowSize < 100
    res_bad_w = client.post(
        "/api/analysis/submit",
        headers=headers,
        json={"datasetId": ds_id, "name": "Bad_W", "windowSize": 50},
    )
    assert res_bad_w.status_code == 422 or res_bad_w.status_code == 400

    # Test windowStep > windowSize
    res_bad_step = client.post(
        "/api/analysis/submit",
        headers=headers,
        json={"datasetId": ds_id, "name": "Bad_Step", "windowSize": 500, "windowStep": 600},
    )
    assert res_bad_step.status_code == 422 or res_bad_step.status_code == 400

    # Test contaminationRate > 0.5
    res_bad_contam = client.post(
        "/api/analysis/submit",
        headers=headers,
        json={"datasetId": ds_id, "name": "Bad_Contam", "windowSize": 500, "contaminationRate": 0.8},
    )
    assert res_bad_contam.status_code == 422 or res_bad_contam.status_code == 400

def test_duplicate_dataset_names_gracefully_handled():
    user = "dup_test_user"
    headers = auth_headers(user)

    payload = b">CHR_01\nAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT"
    # First upload
    res1 = client.post(
        "/api/datasets/upload",
        headers=headers,
        files={"file": ("sample.fasta", payload, "text/plain")},
    )
    assert res1.status_code == 201
    id1 = res1.json()["id"]

    # Second upload with identical filename
    res2 = client.post(
        "/api/datasets/upload",
        headers=headers,
        files={"file": ("sample.fasta", payload, "text/plain")},
    )
    assert res2.status_code == 201
    id2 = res2.json()["id"]

    # Both datasets exist with unique IDs and are queryable
    assert id1 != id2
    datasets_res = client.get("/api/datasets", headers=headers)
    assert datasets_res.status_code == 200
    ids = [d["id"] for d in datasets_res.json()]
    assert id1 in ids
    assert id2 in ids
