# GenomeAI Backend — PySpark & FastAPI Genomics Engine

Distributed genomics anomaly detection engine integrating **Apache Spark (PySpark)** and **Scikit-learn Isolation Forest** with **Zero-Trust Multi-Tenant Security**.

---

## 1. Architectural Highlights

- **FastAPI REST API**: High-performance asynchronous API service handling genomic ingestion, background Spark transformations, and outlier scoring.
- **Multi-Tenant Isolation**: Row-level tenant partitioning on all genomic datasets, analyses, and anomalies scoped by verified cryptographic session tokens (`user_id`).
- **Streaming Upload Guard**: Chunked streaming ingestion (64KB buffer) with strict 50MB enforcement preventing server memory exhaustion.
- **Genomic Parser & Sanitizer**: Multi-FASTA (`.fasta`, `.fa`, `.fna`) and CSV parser with IUPAC ambiguous symbol normalization and bounds validation (max 10,000 records, max 50Mbp sequence length).
- **Sliding Window Vectorizer**: Extracts nucleotide proportions (A, T, G, C), GC/AT ratios, GC-skew, 16 dinucleotide k-mer frequencies, and homopolymer run lengths (max 100,000 sliding windows).
- **Apache Spark (PySpark)**: Distributed DataFrame partition transformations and summary metric computation.
- **Isolation Forest**: Unsupervised tree-based outlier scoring producing normalized anomaly scores (0.0–1.0) and severity categorizations (`high`, `medium`, `low`) with NaN-sanitized feature matrices (`np.nan_to_num`).
- **Interactive Visualizations & Downsampling**: Representative window map downsampled to 500 points preserving 100% of anomaly loci plus evenly-spaced normal loci for low-latency charting.
- **CSV Data Export**: Authenticated, scoped CSV generation (`/api/anomalies/export`) enabling researchers to export analysis results safely.
- **Markdown Analysis Report**: Automated download (`/api/analysis/{id}/report`) with complete dataset metadata, parameters, outlier tables, and scientific disclaimer guidelines.

---

## 2. API Endpoints

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | Public cluster health and PySpark status |
| `POST` | `/api/datasets/upload` | Yes (Bearer/Cookie) | Upload FASTA or CSV dataset (max 50MB, counts total bases) |
| `GET` | `/api/datasets` | Yes (Bearer/Cookie) | List datasets owned by current user |
| `GET` | `/api/datasets/{id}/composition` | Yes (Bearer/Cookie) | Overall nucleotide composition of owned dataset |
| `GET` | `/api/datasets/compare` | Yes (Bearer/Cookie) | Compare two datasets owned by current user with configuration checks |
| `POST` | `/api/analysis/submit` | Yes (Bearer/Cookie) | Execute PySpark + Isolation Forest anomaly detection job |
| `GET` | `/api/analysis/list` | Yes (Bearer/Cookie) | List past analysis execution records owned by user |
| `GET` | `/api/analysis/{id}/details` | Yes (Bearer/Cookie) | Detailed analysis metrics, parameters, and feature summary |
| `GET` | `/api/analysis/{id}/visualizations` | Yes (Bearer/Cookie) | Exact window profiles, GC content curve, and severity breakdown |
| `GET` | `/api/analysis/{id}/report` | Yes (Bearer/Cookie) | Download comprehensive analysis summary report (.md) |
| `GET` | `/api/anomalies` | Yes (Bearer/Cookie) | List detected sequence outliers owned by user |
| `GET` | `/api/anomalies/query` | Yes (Bearer/Cookie) | Paginated, searchable, filterable, and sortable anomaly query |
| `GET` | `/api/anomalies/export` | Yes (Bearer/Cookie) | Export anomalies as CSV format for owned analysis |
| `GET` | `/api/stats` | Yes (Bearer/Cookie) | Dashboard summary statistics for user |

---

## 3. Analysis Configuration Parameters

When submitting an analysis (`POST /api/analysis/submit`), the following parameters are supported and validated:

| Parameter | Type | Default | Valid Range | Description |
|---|---|---|---|---|
| `datasetId` | `string` | *Required* | Existing Dataset ID | ID of the uploaded dataset owned by researcher |
| `name` | `string` | *Required* | 1–100 chars | Descriptive identifier name for the analysis run |
| `windowSize` | `integer` | `500` | `100` – `10,000` bp | Base-pair length of sliding window segment |
| `windowStep` | `integer` | `windowSize // 2` | `50` – `5,000` bp | Stride distance between consecutive window starts ($\le$ windowSize) |
| `kmerSize` | `integer` | `7` | `3` – `10` | Word length for nucleotide sub-sequence tokenization |
| `contaminationRate` | `float` | `0.05` | `0.001` – `0.50` | Expected outlier proportion assumption for Isolation Forest |
| `randomSeed` | `integer` | `42` | `0` – `1,000,000` | Deterministic pseudo-random seed for reproducible tree partitioning |

---

## 4. Anomaly Scoring & Severity Calculation

1. **Isolation Forest Tree Depth**:
   - The Scikit-learn `IsolationForest` ensemble isolates data points by randomly partitioning features.
   - Outliers require fewer tree splits (shorter path lengths) to isolate from the background population.
   - Raw decision scores are transformed into a normalized outlier score:
     $$\text{score} = \text{clip}(0.5 - \text{decision\_function}(X), 0.0, 1.0)$$

2. **Severity Classification**:
   - **High Severity**: Normalized Score $\ge 0.80$ (extreme statistical divergence in k-mer distribution or GC skew).
   - **Medium Severity**: $0.70 \le \text{Score} < 0.80$ (moderate deviation from background genome profile).
   - **Low Severity**: $\text{Score} < 0.70$ (minor divergence).
   - **Normal Window**: Non-anomalous background loci.

3. **Scientific Responsibility Principle**:
   - Computational outlier scores reflect statistical atypicality under the current mathematical model.
   - They do **NOT** establish confirmed biological mutations, disease associations, or clinical diagnoses without biological wet-lab validation.

---

## 5. Architectural & Deployment Limitations

- **Local PySpark Execution**: PySpark runs in local mode using available CPU cores. For production distributed scale across large sequencing repositories, submit jobs to an external Spark cluster (YARN, Standalone, or Kubernetes).
- **Synchronous Execution**: Feature extraction and model fitting execute synchronously within the HTTP request cycle. Datasets should be sized to complete within standard HTTP gateway timeouts.
- **Local SQLite Database**: Tenant metadata and downsampled window profiles are persisted locally in `backend/data/genomics.db` using WAL mode. For horizontal multi-instance deployments, migrate to a managed PostgreSQL instance.

---

## 6. Running the Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run FastAPI service with uvicorn
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive OpenAPI documentation is available at `http://localhost:8000/docs`.

---

## 7. Running the Test Suite

```bash
# Run the complete Pytest suite (35 tests)
cd backend
python -m pytest tests -v
```

The test suite validates:
- `test_phase7_validation.py`: Multi-record FASTA, CSV formats, empty files, malformed headers, IUPAC ambiguity, unsupported content, short sequences, invariant matrices, and boundary validation.
- `test_analytics.py`: Analysis details, visualization data downsampling, Markdown reports, paginated anomaly querying, dataset comparison, and parameter validation.
- `test_anomaly_model.py`: Model fitting, scoring, NaN sanitization, severity thresholds.
- `test_api.py`: Health checks, unauthenticated 401 rejections, dataset upload, analysis execution, and CSV export.
- `test_authorization.py`: Multi-tenant data isolation, cross-user access denial, token signature tampering, expiration checks, and cookie auth.
- `test_features.py`: Window extraction, homopolymer runs, and dinucleotide frequency matrices.
- `test_parser.py`: Multi-FASTA, CSV parsing, IUPAC normalization, and format detection.
