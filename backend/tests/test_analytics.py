import time
import pytest
import jwt
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

FASTA_PAYLOAD_1 = b""">CHR_01 Test chromosome sequence alpha
AGCTTTTCATTCTGACTGCAACGGGCAATATGTCTCTGTGTGGATTAAAAAAAGAGTGTCTGATAGCAGC
TTCTGAACTGGTTACCTGCCGTGAGTAAATTAAAATTTTATTGACTTAGGTCACTAAATACTTTAACCAA
TATAGGCATAGCGCACAGACAGATAAAAATTACAGAGTACACAACATCCATGAAACGCATTAGCACCACC
ATTACCACCACCATCACCATTACCACAGGTAACGGTGCGGGCTGACGCGTACAGGAAACACAGAAAAAAGC
"""

FASTA_PAYLOAD_2 = b""">CHR_02 Test chromosome sequence beta
GGCCGGCCGGCCGGCCGGCCGGCCGGCCGGCCGGCCGGCCGGCCGGCCGGCCGGCCGGCCGGCCGGCC
ATATATATATATATATATATATATATATATATATATATATATATATATATATATATATATATATATATAT
CGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGCGC
"""

def generate_token(user_id: str, email: str = "researcher@lab.org", expires_in: int = 3600):
    payload = {
        "userId": user_id,
        "email": email,
        "name": f"Researcher {user_id}",
        "exp": int(time.time()) + expires_in,
    }
    return jwt.encode(payload, settings.AUTH_SECRET, algorithm="HS256")

def auth_headers(user_id: str):
    token = generate_token(user_id=user_id)
    return {"Authorization": f"Bearer {token}"}

def test_analysis_details_and_visualizations_endpoints():
    user_id = f"test_user_analytics_{int(time.time())}"
    headers = auth_headers(user_id)

    # 1. Upload dataset
    upload_res = client.post(
        "/api/datasets/upload",
        headers=headers,
        files={"file": ("test_seq1.fasta", FASTA_PAYLOAD_1, "application/octet-stream")},
        data={"description": "Phase 6 analytics test sequence"},
    )
    assert upload_res.status_code == 201
    ds = upload_res.json()
    assert ds["totalBases"] > 0

    # 2. Submit analysis with custom step and seed
    submit_res = client.post(
        "/api/analysis/submit",
        headers=headers,
        json={
            "datasetId": ds["id"],
            "name": "Phase6_Analytics_Run",
            "windowSize": 100,
            "windowStep": 50,
            "kmerSize": 5,
            "contaminationRate": 0.10,
            "randomSeed": 42
        }
    )
    assert submit_res.status_code == 201
    analysis = submit_res.json()
    analysis_id = analysis["id"]
    assert analysis["status"] == "completed"

    # 3. GET /api/analysis/{analysis_id}/details
    details_res = client.get(f"/api/analysis/{analysis_id}/details", headers=headers)
    assert details_res.status_code == 200
    details = details_res.json()
    assert details["id"] == analysis_id
    assert details["datasetId"] == ds["id"]
    assert details["totalWindows"] > 0
    assert details["totalBases"] > 0
    assert "anomalyPercentage" in details
    assert "highSeverityCount" in details
    assert "mediumSeverityCount" in details
    assert "lowSeverityCount" in details
    assert "normalWindowsCount" in details
    assert details["windowSize"] == 100
    assert details["windowStep"] == 50
    assert details["randomSeed"] == 42
    assert "featureSummary" in details

    # 4. GET /api/analysis/{analysis_id}/visualizations
    viz_res = client.get(f"/api/analysis/{analysis_id}/visualizations", headers=headers)
    assert viz_res.status_code == 200
    viz = viz_res.json()
    assert viz["analysisId"] == analysis_id
    assert "severityDistribution" in viz
    assert "windowsMap" in viz
    assert "gcProfile" in viz
    assert "featureComparison" in viz
    assert "scientificDisclaimer" in viz
    assert len(viz["windowsMap"]) > 0
    assert len(viz["gcProfile"]) > 0

    # 5. GET /api/analysis/{analysis_id}/report (Markdown download)
    report_res = client.get(f"/api/analysis/{analysis_id}/report", headers=headers)
    assert report_res.status_code == 200
    assert "text/markdown" in report_res.headers.get("content-type", "")
    content = report_res.text
    assert "# Genomic Anomaly Analysis Summary Report" in content
    assert details["name"] in content
    assert "Scientific & Computational Interpretation Guidelines" in content

def test_anomaly_query_search_and_pagination():
    user_id = f"test_user_anom_query_{int(time.time())}"
    headers = auth_headers(user_id)

    # Upload and analyze
    upload_res = client.post(
        "/api/datasets/upload",
        headers=headers,
        files={"file": ("test_query.fasta", FASTA_PAYLOAD_1, "application/octet-stream")},
    )
    assert upload_res.status_code == 201
    ds_id = upload_res.json()["id"]

    sub_res = client.post(
        "/api/analysis/submit",
        headers=headers,
        json={
            "datasetId": ds_id,
            "name": "Query_Test_Run",
            "windowSize": 100,
            "windowStep": 50,
            "kmerSize": 5,
            "contaminationRate": 0.20
        }
    )
    assert sub_res.status_code == 201

    # Query with pagination
    query_res = client.get("/api/anomalies/query?page=1&limit=5", headers=headers)
    assert query_res.status_code == 200
    data = query_res.json()
    assert "items" in data
    assert "total" in data
    assert data["page"] == 1
    assert data["limit"] == 5
    assert "totalPages" in data

    # Score filtering
    score_res = client.get("/api/anomalies/query?min_score=0.0&max_score=1.0", headers=headers)
    assert score_res.status_code == 200

    # Sorting
    sort_res = client.get("/api/anomalies/query?sort_by=score&sort_order=desc", headers=headers)
    assert sort_res.status_code == 200
    items = sort_res.json()["items"]
    if len(items) >= 2:
        assert items[0]["score"] >= items[1]["score"]

def test_dataset_comparison_and_cross_user_isolation():
    user_a = f"user_compare_a_{int(time.time())}"
    user_b = f"user_compare_b_{int(time.time())}"
    headers_a = auth_headers(user_a)
    headers_b = auth_headers(user_b)

    # User A uploads dataset 1 and dataset 2
    res1 = client.post(
        "/api/datasets/upload",
        headers=headers_a,
        files={"file": ("ds1.fasta", FASTA_PAYLOAD_1, "application/octet-stream")},
    )
    assert res1.status_code == 201
    ds1_id = res1.json()["id"]

    res2 = client.post(
        "/api/datasets/upload",
        headers=headers_a,
        files={"file": ("ds2.fasta", FASTA_PAYLOAD_2, "application/octet-stream")},
    )
    assert res2.status_code == 201
    ds2_id = res2.json()["id"]

    # User A runs analysis on ds1
    sub_res = client.post(
        "/api/analysis/submit",
        headers=headers_a,
        json={"datasetId": ds1_id, "name": "DS1_Analysis", "windowSize": 100, "windowStep": 50, "kmerSize": 5, "contaminationRate": 0.05}
    )
    assert sub_res.status_code == 201

    # User A compares ds1 and ds2 -> Success
    compare_res = client.get(f"/api/datasets/compare?dataset1_id={ds1_id}&dataset2_id={ds2_id}", headers=headers_a)
    assert compare_res.status_code == 200
    comp = compare_res.json()
    assert "dataset1" in comp
    assert "dataset2" in comp
    assert comp["dataset1"]["id"] == ds1_id
    assert comp["dataset2"]["id"] == ds2_id
    assert comp["dataset1"]["hasAnalysis"] is True
    assert comp["dataset2"]["hasAnalysis"] is False

    # User B attempts to compare User A's datasets -> 404 (isolated)
    bad_compare = client.get(f"/api/datasets/compare?dataset1_id={ds1_id}&dataset2_id={ds2_id}", headers=headers_b)
    assert bad_compare.status_code == 404

def test_analysis_configuration_validation():
    user_id = f"test_val_user_{int(time.time())}"
    headers = auth_headers(user_id)

    # Window step > window size should be rejected
    res = client.post(
        "/api/analysis/submit",
        headers=headers,
        json={
            "datasetId": "some_dataset_id",
            "name": "Invalid_Config_Run",
            "windowSize": 100,
            "windowStep": 200,  # Invalid: step exceeds window size
            "kmerSize": 5,
            "contaminationRate": 0.05
        }
    )
    assert res.status_code == 422

    # Negative contamination rate
    res2 = client.post(
        "/api/analysis/submit",
        headers=headers,
        json={
            "datasetId": "some_dataset_id",
            "name": "Invalid_Config_Run",
            "windowSize": 500,
            "windowStep": 250,
            "kmerSize": 7,
            "contaminationRate": -0.05
        }
    )
    assert res2.status_code == 422
