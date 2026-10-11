import time
import pytest
import jwt
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

FASTA_PAYLOAD = b""">TEST_GENOME Escherichia coli reference window
AGCTTTTCATTCTGACTGCAACGGGCAATATGTCTCTGTGTGGATTAAAAAAAGAGTGTCTGATAGCAGC
TTCTGAACTGGTTACCTGCCGTGAGTAAATTAAAATTTTATTGACTTAGGTCACTAAATACTTTAACCAA
TATAGGCATAGCGCACAGACAGATAAAAATTACAGAGTACACAACATCCATGAAACGCATTAGCACCACC
ATTACCACCACCATCACCATTACCACAGGTAACGGTGCGGGCTGACGCGTACAGGAAACACAGAAAAAAGC
"""

def generate_token(user_id: str = "test_researcher_1", email: str = "researcher1@lab.org", expires_in: int = 3600):
    payload = {
        "userId": user_id,
        "email": email,
        "name": "Dr. Test Researcher",
        "exp": int(time.time()) + expires_in,
    }
    return jwt.encode(payload, settings.AUTH_SECRET, algorithm="HS256")

def auth_headers(user_id: str = "test_researcher_1"):
    token = generate_token(user_id=user_id)
    return {"Authorization": f"Bearer {token}"}

def test_health_endpoint_public():
    """Health check endpoint is public without authentication."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_unauthenticated_requests_rejected():
    """Protected endpoints must reject unauthenticated requests with 401."""
    # Datasets
    res1 = client.get("/api/datasets")
    assert res1.status_code == 401

    # Analysis list
    res2 = client.get("/api/analysis/list")
    assert res2.status_code == 401

    # Anomalies
    res3 = client.get("/api/anomalies")
    assert res3.status_code == 401

    # Stats
    res4 = client.get("/api/stats")
    assert res4.status_code == 401

    # CSV Export
    res5 = client.get("/api/anomalies/export")
    assert res5.status_code == 401

def test_dataset_upload_and_list():
    headers = auth_headers("user_test_datasets")
    files = {"file": ("ecoli_sample.fasta", FASTA_PAYLOAD, "application/octet-stream")}
    data = {"description": "E. coli benchmark window"}
    response = client.post("/api/datasets/upload", files=files, data=data, headers=headers)
    assert response.status_code == 201
    created_ds = response.json()
    assert created_ds["name"] == "ecoli_sample.fasta"
    assert created_ds["format"] == "fasta"
    assert created_ds["sequenceCount"] == 1

    # List datasets
    list_res = client.get("/api/datasets", headers=headers)
    assert list_res.status_code == 200
    datasets = list_res.json()
    assert any(d["id"] == created_ds["id"] for d in datasets)

    # Nucleotide composition
    comp_res = client.get(f"/api/datasets/{created_ds['id']}/composition", headers=headers)
    assert comp_res.status_code == 200
    comp = comp_res.json()
    assert comp["gcContent"] > 0
    assert comp["totalBases"] > 0

def test_submit_analysis_query_results_and_export():
    headers = auth_headers("user_test_analysis")

    # 1. Upload dataset first
    files = {"file": ("test_analysis_seq.fasta", FASTA_PAYLOAD, "application/octet-stream")}
    up_res = client.post("/api/datasets/upload", files=files, headers=headers)
    assert up_res.status_code == 201
    dataset_id = up_res.json()["id"]

    # 2. Submit analysis
    analysis_payload = {
        "datasetId": dataset_id,
        "name": "TEST_ISOFOREST_RUN",
        "windowSize": 100,
        "kmerSize": 5,
        "contaminationRate": 0.05
    }
    ana_res = client.post("/api/analysis/submit", json=analysis_payload, headers=headers)
    assert ana_res.status_code == 201
    ana_data = ana_res.json()
    assert ana_data["status"] == "completed"
    assert "id" in ana_data
    analysis_id = ana_data["id"]

    # 3. Query analysis list
    list_res = client.get("/api/analysis/list", headers=headers)
    assert list_res.status_code == 200
    analyses = list_res.json()
    assert any(a["id"] == analysis_id for a in analyses)

    # 4. Query stats
    stats_res = client.get("/api/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["totalDatasets"] >= 1
    assert stats["analysesCompleted"] >= 1

    # 5. Query anomalies list
    anom_res = client.get("/api/anomalies", headers=headers)
    assert anom_res.status_code == 200
    anomalies = anom_res.json()
    assert isinstance(anomalies, list)

    # 6. Export anomalies CSV
    export_res = client.get(f"/api/anomalies/export?analysis_id={analysis_id}", headers=headers)
    assert export_res.status_code == 200
    assert "text/csv" in export_res.headers.get("content-type", "")
    assert "Sequence Locus" in export_res.text
