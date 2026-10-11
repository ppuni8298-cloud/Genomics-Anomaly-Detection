# Genomics Anomaly Detection Using Apache Spark & Machine Learning

An enterprise-grade, full-stack genomics analysis application for detecting structural anomalies, nucleotide frequency deviations, and sequence outliers in massive DNA datasets using **Apache Spark (PySpark)**, **Scikit-learn Isolation Forest**, **Next.js 14**, and a **Zero-Trust Multi-Tenant Architecture**.

---

## 🌟 Key Capabilities

- **3D Interactive DNA Double Helix**: Built using Three.js / WebGL with custom particle shaders, interactive rotatability, nucleotide coloring, and cybernetic UI aesthetics.
- **Distributed Big Data Processing**: PySpark orchestrates genomic feature transformations across partitioned DataFrames.
- **Unsupervised Machine Learning**: Isolation Forest trains on 20-dimensional genomic feature vectors (GC-content, AT-content, GC-skew, 16 dinucleotide k-mer frequencies, homopolymer run lengths) to isolate sequence anomalies with normalized anomaly scores.
- **Enterprise Multi-Tenant Security**: Cryptographic cross-service session verification (HS256 JWT tokens). Every dataset, analysis job, sequence locus, and anomaly is strictly partitioned by user identity.
- **Streaming Ingestion**: 50MB maximum upload limit with 64KB chunk streaming and bounds enforcement (max 10,000 sequence records, max 50Mbp sequence length).
- **Comprehensive Analytics Dashboard**: Live KPI statistics, GC-skew scatter plots, chromosome overview bars, severity breakdown charts, anomaly inspection modal, and CSV export functionality.

---

## 🏗️ Architecture Overview

```
                                      ┌────────────────────────────────────────┐
                                      │        Next.js 14 Web Frontend        │
                                      │  (React, TypeScript, Tailwind, Three)   │
                                      └───────────────────┬────────────────────┘
                                                          │
                                     Secure Authenticated Proxy (/api/proxy/*)
                                    [HTTP-only JWT Cookie -> Bearer Header]
                                                          │
                                                          ▼
                                      ┌────────────────────────────────────────┐
                                      │         FastAPI Python Engine          │
                                      │     (JWT Verification, Multi-Tenant)   │
                                      └─────────────┬──────────────────────────┘
                                                    │
                           ┌────────────────────────┴────────────────────────┐
                           ▼                                                 ▼
             ┌───────────────────────────┐                     ┌───────────────────────────┐
             │   Apache Spark (PySpark)  │                     │   Scikit-Learn ML Model   │
             │ - Genomic Window Slicing  │                     │ - Feature Normalization   │
             │ - DataFrame Partitioning  │                     │ - Isolation Forest Trees  │
             │ - Summary Statistics      │                     │ - Outlier Scoring (0-1)   │
             └───────────────────────────┘                     └───────────────────────────┘
```

---

## 🔒 Security Hardening (Phase 5)

1. **Zero-Trust Cross-Service Authorization**:
   - The frontend authenticates users and sets an `HTTP-only`, `SameSite=Lax` cookie (`genome_session_token`).
   - The Next.js API Proxy (`/api/proxy/[...path]`) validates the session server-side and attaches an `Authorization: Bearer <token>` header to all outgoing requests to FastAPI.
   - FastAPI (`backend/app/auth.py`) cryptographically decodes and verifies the signature using `HS256`, ensuring token expiration (`exp`) and extracting the `user_id`.
   - Direct, unauthenticated requests to FastAPI return `401 Unauthorized`.

2. **Row-Level Multi-Tenant Data Isolation**:
   - Every database query in `local_storage.py` filters by `user_id = ?`.
   - Researchers can only view, query, analyze, or export their own datasets and anomalies.
   - Cross-tenant access attempts return `404 Not Found` (preventing ID enumeration).

3. **Denial-of-Service & Resource Exhaustion Defenses**:
   - Ingestion enforces a 50MB streaming limit using 64KB buffers without holding entire payloads in RAM.
   - Sequence length is capped at 50,000,000 bp per sequence.
   - Maximum record count is capped at 10,000 sequences per dataset.
   - Sliding window count is capped at 100,000 windows per analysis.
   - Isolation Forest input matrices are sanitized using `np.nan_to_num` to prevent crashes on invariant sequence windows.

4. **Rate Limiting**:
   - Next.js authentication endpoints (`/api/auth/login`, `/api/auth/register`) feature IP-based rate limiting to thwart brute-force attacks.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or v3.11
- **Java**: Java Development Kit (JDK) 11 or 17 (Required for PySpark)

### 1. Frontend Setup

```bash
# Install Node dependencies
npm install

# Initialize Prisma Database
npx prisma db push

# Start Next.js development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend API will be available at `http://localhost:8000`.
Interactive Swagger UI is available at `http://localhost:8000/docs`.

---

## 📈 Advanced Analytics & Visualization (Phase 6)

Phase 6 transforms the dashboard into an interactive genomics research platform powered by real PySpark feature matrices and Scikit-learn Isolation Forest trees:

### 1. Interactive Genomic Visualizations
- **Anomaly Distribution Donut**: Visualizes severity proportions (High $\ge 0.80$, Medium $0.70-0.79$, Low $< 0.70$, and Normal) with percentages and exact loci counts.
- **Genomic Window Anomaly Map**: Responsive SVG scatter chart plotting sequence position on the X-axis (bp) vs Isolation Forest outlier score on the Y-axis, highlighting flagged loci above the 0.70 threshold.
- **GC Content Profile Curve**: Plots GC content across sliding windows with dataset mean baseline and biological context explaining natural GC isochore fluctuations.
- **Feature Comparison**: Compares average GC content, AT content, GC skew, and max homopolymer lengths between normal background windows and flagged anomaly loci.

### 2. Anomaly Explorer
- Multi-field text search across Sequence Identifiers, Anomaly Classifications, and Dataset names.
- Severity tier filtering (`High`, `Medium`, `Low`, or `All`).
- Score threshold slider filtering (e.g. $\ge 0.75$).
- Multi-column sorting by Outlier Score, Genomic Position, Severity, or Sequence ID.
- Safe pagination with configurable page sizes (10, 25, 50).
- Detailed Window Inspector Modal displaying exact coordinates, score bars, nucleotide metrics, and computational rationale.

### 3. Configurable Analysis Parameters
- **Window Size**: 100 to 10,000 base pairs (sliding locus length).
- **Window Step (Stride)**: 50 to 5,000 base pairs ($\le$ window size for overlapping or non-overlapping sweeps).
- **K-mer Word Length ($k$)**: 3 to 10 (sub-sequence frequency tokenization depth).
- **Contamination Assumption**: 0.1% to 50% (Isolation Forest tree proportion assumption).
- **Pseudo-Random Seed**: 0 to 999,999 (deterministic seed for reproducible tree partitioning).

### 4. Dataset Comparison Workflow
- Side-by-side comparative analytics for any two datasets owned by the authenticated researcher.
- Compares format, file size, sequence count, total bases, window counts, global GC content, anomaly counts, and severity distribution.
- **Configuration Mismatch Warning**: Warns when datasets were analyzed with differing window sizes, strides, or contamination rates to prevent misleading comparisons.

### 5. Downloadable Analysis Summary Report
- Comprehensive Markdown report download (`.md`) containing dataset metadata, analysis parameters, metric tables, top outlier loci catalog, and interpretation guidelines.

### 6. Scientific Responsibility & Ethical Guidance
- **Statistical Outlier Notice**: Anomaly scores reflect tree isolation depth and statistical divergence under the current mathematical model.
- Computational anomaly flags do **NOT** signify confirmed biological mutations, disease pathology, or clinical diagnoses.

---

## 🧪 Testing & Verification

### 1. Backend Pytest Suite (24 Tests)

Tests model accuracy, API endpoints, analytics details, visualizations, queries, comparisons, configuration validators, multi-tenant isolation, dinucleotide vectorization, and FASTA/CSV parsers:

```bash
cd backend
python -m pytest tests -v
```

### 2. Frontend Typecheck & Production Build

```bash
npx tsc --noEmit
npm run build
```

### 3. End-to-End Verification Suites

Run the end-to-end integration suites across both services:

```bash
# Verify Authentication & Rate Limiting (Phase 2)
node scripts/verify-auth.mjs

# Verify Dashboard Components & Visualization (Phase 3)
node scripts/verify-phase3.mjs

# Verify FastAPI & PySpark Engine (Phase 4)
node scripts/verify-phase4.mjs

# Verify Security, Multi-Tenant Isolation & CSV Export (Phase 5)
node scripts/verify-phase5.mjs

# Verify Advanced Analytics, Explorer, Comparison & Reports (Phase 6)
node scripts/verify-phase6.mjs
```

---

## 📊 Genomic Anomaly Features

Each sliding window extracts:
- **Canonical Nucleotide Proportions**: $P(A), P(T), P(G), P(C)$
- **GC Content**: $(G + C) / (A + T + G + C)$
- **AT Content**: $(A + T) / (A + T + G + C)$
- **GC Skew**: $(G - C) / (G + C)$
- **16 Dinucleotide K-mer Frequencies**: AA, AC, AG, AT, CA, CC, CG, CT, GA, GC, GG, GT, TA, TC, TG, TT
- **Homopolymer Max Run Lengths**: Longest consecutive repeats of A, T, G, and C
- **Ambiguity Count**: Count of non-canonical IUPAC bases (N, R, Y, S, W, K, M, B, D, H, V)

---

## 🚀 Production Deployment Architecture

For deploying GenomeAI in a cloud production environment:

### 1. Component Hosting Recommendation
- **Next.js Frontend**: Hosted on Vercel or containerized on AWS ECS / Google Cloud Run.
- **FastAPI + PySpark Backend**: Hosted on a dedicated Python VM (e.g. AWS EC2, GCP Compute Engine, Render Web Service, or Railway with Docker).
  - *Note*: PySpark requires a JVM (JDK 11, 17, or 21+) and sufficient CPU/RAM allocation (minimum 2GB, recommended 4GB+).
- **Relational Storage**:
  - *Local Prototyping*: Uses local SQLite databases (`prisma/dev.db` for users/sessions, `backend/data/genomics.db` for metrics with WAL mode).
  - *Cloud Production*: Migrate `prisma/schema.prisma` to a managed PostgreSQL cluster (e.g. Neon, Supabase, AWS RDS). Update `DATABASE_URL` accordingly.
- **Dataset Storage**:
  - *Local Prototyping*: Stored in `backend/data/uploads/`.
  - *Cloud Production*: Ephemeral container disks will lose uploaded datasets upon redeploy. For durable production storage, mount an Amazon S3 bucket or Google Cloud Storage via standard presigned URL or object storage adapter.

### 2. Key Production Environment Variables
| Variable | Service | Required Value |
|---|---|---|
| `DATABASE_URL` | Frontend | PostgreSQL connection string (or SQLite `file:./dev.db`) |
| `AUTH_SECRET` | Both | Strong random cryptographic secret (&ge; 32 characters, e.g. `openssl rand -base64 32`) |
| `BACKEND_URL` | Frontend | URL of backend API accessible from Next.js server proxy (e.g. `https://api.yourdomain.com`) |
| `NEXT_PUBLIC_APP_URL` | Frontend | Public canonical URL (e.g. `https://genome.yourdomain.com`) |
| `SECURE_COOKIES` | Frontend | Set to `'true'` for production HTTPS deployments |
| `CORS_ORIGINS` | Backend | Comma-separated list of allowed frontend origins |
| `MAX_UPLOAD_SIZE_BYTES` | Backend | `52428800` (50MB default streaming threshold) |
| `SPARK_MASTER` | Backend | `local[*]` for standalone multicore, or `spark://<host>:7077` for Spark cluster |

---

## 🎓 Evaluator Demonstration Checklist

Use this 8-step guide to demonstrate the system end-to-end to an evaluator or professor:

1. **Start Services**:
   - Backend: `cd backend && python -m uvicorn app.main:app --port 8000 --reload`
   - Frontend: `npm run dev` (Access at `http://localhost:3000`)
2. **Landing Page & 3D Double Helix**:
   - Show the cyberpunk dark-navy aesthetic and interactive 3D WebGL particle helix that rotates on drag.
3. **Researcher Account Creation**:
   - Navigate to `/signup` and create a new researcher profile (e.g., `evaluator@university.edu`).
   - Demonstrate automatic redirect to `/dashboard` upon session issuance.
4. **Dataset Ingestion & Validation**:
   - Go to `/dashboard/new-analysis`.
   - Upload `scripts/test_genome.fasta` (or a supported CSV file).
   - Show immediate format detection, record counting, and total base-pair calculation.
5. **Hyperparameter Configuration & PySpark Execution**:
   - Configure window size (e.g. 250 bp), stride (125 bp), and k-mer size ($k=5$).
   - Click **Run Anomaly Detection Pipeline**.
   - Show real-time step progression: ingestion $\rightarrow$ feature extraction $\rightarrow$ Isolation Forest outlier scoring.
6. **Genomic Visual Analytics**:
   - View the generated interactive **Window Anomaly Map** (position vs score).
   - Inspect the **GC Content Profile Curve** and **Severity Donut** breakdown.
   - Click any window locus to open the **Window Inspector Modal** with exact nucleotide coordinates and reason.
7. **Dataset Comparison & Report Export**:
   - Visit `/dashboard/datasets` and launch the side-by-side **Dataset Comparison Tool**.
   - Download the generated Markdown summary report (`.md`) and Anomaly Catalog (`.csv`).
8. **Security & Session Termination**:
   - Log out via the header or settings page.
   - Attempt to access `/dashboard` directly to confirm immediate redirect to `/login`.
