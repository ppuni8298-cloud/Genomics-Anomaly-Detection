import time
import pytest
import jwt
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

FASTA_USER_A = b""">SEQ_USER_A Homo sapiens chromosome locus
AGCTTTTCATTCTGACTGCAACGGGCAATATGTCTCTGTGTGGATTAAAAAAAGAGTGTCTGATAGCAGC
TTCTGAACTGGTTACCTGCCGTGAGTAAATTAAAATTTTATTGACTTAGGTCACTAAATACTTTAACCAA
"""

FASTA_USER_B = b""">SEQ_USER_B Mus musculus chromosome locus
CCCGGGAAATTTCCCGGGAAATTTCCCGGGAAATTTCCCGGGAAATTTCCCGGGAAATTTCCCGGGAAATT
GGGCCCAAATTTGGGCCCAAATTTGGGCCCAAATTTGGGCCCAAATTTGGGCCCAAATTTGGGCCCAAATT
"""

def make_token(user_id: str, email: str = "user@test.org", exp_delta: int = 3600, secret: str = None):
    payload = {
        "userId": user_id,
        "email": email,
        "name": f"User {user_id}",
        "exp": int(time.time()) + exp_delta,
    }
    return jwt.encode(payload, secret or settings.AUTH_SECRET, algorithm="HS256")

def test_multi_tenant_dataset_isolation():
    token_a = make_token("tenant_user_alpha")
    token_b = make_token("tenant_user_beta")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A uploads dataset A
    files_a = {"file": ("dataset_alpha.fasta", FASTA_USER_A, "application/octet-stream")}
    res_a = client.post("/api/datasets/upload", files=files_a, headers=headers_a)
    assert res_a.status_code == 201
    id_a = res_a.json()["id"]

    # User B uploads dataset B
    files_b = {"file": ("dataset_beta.fasta", FASTA_USER_B, "application/octet-stream")}
    res_b = client.post("/api/datasets/upload", files=files_b, headers=headers_b)
    assert res_b.status_code == 201
    id_b = res_b.json()["id"]

    # User A queries datasets: must see id_a, must NOT see id_b
    list_a = client.get("/api/datasets", headers=headers_a).json()
    ids_seen_by_a = [d["id"] for d in list_a]
    assert id_a in ids_seen_by_a
    assert id_b not in ids_seen_by_a

    # User B queries datasets: must see id_b, must NOT see id_a
    list_b = client.get("/api/datasets", headers=headers_b).json()
    ids_seen_by_b = [d["id"] for d in list_b]
    assert id_b in ids_seen_by_b
    assert id_a not in ids_seen_by_b

    # User A attempting to read User B's dataset composition -> 404
    cross_comp_res = client.get(f"/api/datasets/{id_b}/composition", headers=headers_a)
    assert cross_comp_res.status_code == 404

    # User B attempting to read User A's dataset composition -> 404
    cross_comp_res2 = client.get(f"/api/datasets/{id_a}/composition", headers=headers_b)
    assert cross_comp_res2.status_code == 404

def test_multi_tenant_analysis_and_export_isolation():
    token_a = make_token("tenant_analysis_alpha")
    token_b = make_token("tenant_analysis_beta")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A uploads dataset
    files_a = {"file": ("alpha_seq.fasta", FASTA_USER_A, "application/octet-stream")}
    res_a = client.post("/api/datasets/upload", files=files_a, headers=headers_a)
    assert res_a.status_code == 201
    dataset_a_id = res_a.json()["id"]

    # User B tries to submit analysis on User A's dataset -> 404
    payload_cross = {
        "datasetId": dataset_a_id,
        "name": "MALICIOUS_CROSS_RUN",
        "windowSize": 100,
        "kmerSize": 3,
        "contaminationRate": 0.05
    }
    cross_run_res = client.post("/api/analysis/submit", json=payload_cross, headers=headers_b)
    assert cross_run_res.status_code == 404
    assert "not found" in cross_run_res.json()["detail"].lower()

    # User A runs analysis on User A's dataset -> 201 Completed
    payload_a = {
        "datasetId": dataset_a_id,
        "name": "ALPHA_LEGIT_RUN",
        "windowSize": 100,
        "kmerSize": 3,
        "contaminationRate": 0.05
    }
    ana_res_a = client.post("/api/analysis/submit", json=payload_a, headers=headers_a)
    assert ana_res_a.status_code == 201
    analysis_a_id = ana_res_a.json()["id"]

    # User B listing analyses -> cannot see analysis_a_id
    list_b = client.get("/api/analysis/list", headers=headers_b).json()
    assert not any(a["id"] == analysis_a_id for a in list_b)

    # User B attempting to export anomalies for analysis_a_id -> 404
    export_cross_res = client.get(f"/api/anomalies/export?analysis_id={analysis_a_id}", headers=headers_b)
    assert export_cross_res.status_code == 404

    # User A exporting anomalies for analysis_a_id -> 200 CSV
    export_a_res = client.get(f"/api/anomalies/export?analysis_id={analysis_a_id}", headers=headers_a)
    assert export_a_res.status_code == 200
    assert "text/csv" in export_a_res.headers.get("content-type", "")

def test_token_tampering_and_expiration():
    # 1. Tampered signature
    tampered_token = make_token("attacker", secret="wrong_secret_key_12345678901234567890")
    res1 = client.get("/api/datasets", headers={"Authorization": f"Bearer {tampered_token}"})
    assert res1.status_code == 401

    # 2. Expired token
    expired_token = make_token("expired_user", exp_delta=-3600)
    res2 = client.get("/api/datasets", headers={"Authorization": f"Bearer {expired_token}"})
    assert res2.status_code == 401

    # 3. Missing userId
    payload_no_user = {"email": "nouser@test.org", "exp": int(time.time()) + 3600}
    token_no_user = jwt.encode(payload_no_user, settings.AUTH_SECRET, algorithm="HS256")
    res3 = client.get("/api/datasets", headers={"Authorization": f"Bearer {token_no_user}"})
    assert res3.status_code == 401

    # 4. Completely invalid token string
    res4 = client.get("/api/datasets", headers={"Authorization": "Bearer not_a_valid_jwt"})
    assert res4.status_code == 401

def test_cookie_authentication_supported():
    token = make_token("cookie_test_user")
    # Send via cookie instead of Authorization header
    response = client.get("/api/datasets", cookies={"genome_session_token": token})
    assert response.status_code == 200
    assert isinstance(response.json(), list)
