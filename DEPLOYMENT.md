# GenomeAI — Production Deployment Guide & Architecture Manual

This guide provides end-to-end, beginner-friendly instructions for deploying the **Genomics Anomaly Detection Using Apache Spark** application into production.

---

## 1. Production Architecture Overview

The system consists of two decoupled services with dedicated persistence layers:

```
[ Researcher Browser ]
          │  HTTPS (Port 443)
          ▼
┌──────────────────────────────────────────────┐
│          Next.js 16 Web Frontend            │
│            (Deployed on Vercel)              │
│  - Landing Page & Interactive 3D WebGL Helix │
│  - Researcher Dashboard & Anomaly Explorer   │
│  - HTTP-only Session Cookie Management       │
│  - Authenticated API Proxy (/api/proxy/*)    │
└──────────────┬───────────────────────────────┘
               │
               │  DATABASE_URL (SSL)
               ▼
┌──────────────────────────────────────────────┐
│         Managed PostgreSQL Database          │
│          (Neon, Supabase, or AWS RDS)        │
│  - User Accounts (bcrypt password hashes)    │
│  - Active Sessions (cuid token references)   │
└──────────────────────────────────────────────┘

               │  Forwarded Request with
               │  Authorization: Bearer <JWT>
               ▼
┌──────────────────────────────────────────────┐
│        FastAPI + PySpark Backend Engine      │
│        (Deployed on Railway or Render)       │
│  - Docker Container: Python 3.11 + Java 17   │
│  - Multi-Tenant Row-Level JWT Verification   │
│  - PySpark Distributed Feature Aggregations  │
│  - Scikit-learn Isolation Forest Trees       │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│          Persistent Storage Volume           │
│     (Railway Volume / Render Disk / EBS)     │
│  - genomics.db (WAL Mode SQLite Metrics)     │
│  - uploads/ (Ingested FASTA & CSV Files)     │
└──────────────────────────────────────────────┘
```

---

## 2. Environment Variables Reference

### A. Frontend Service (Next.js)

| Variable Name | Required? | Example Production Value | Purpose & Security Notes |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | `postgresql://user:pass@ep-xyz.neon.tech/genome?sslmode=require` | Connection string for user authentication database. |
| `AUTH_SECRET` | **Yes** | `d3f8a91b4c7e2f5a6b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e` | Secret for HS256 JWT tokens. Must match backend secret. Minimum 32 chars. |
| `NEXT_PUBLIC_APP_URL` | **Yes** | `https://genome-ai.vercel.app` | Canonical public URL of frontend. |
| `BACKEND_URL` | **Yes** | `https://genome-api.up.railway.app` | Private/public URL of FastAPI service accessed by Next.js server proxy. |
| `NEXT_PUBLIC_BACKEND_URL`| Optional | `https://genome-api.up.railway.app` | Client fallback for direct browser requests if needed. |
| `SECURE_COOKIES` | **Yes** | `true` | Enforces `Secure` flag on session cookies (must be `true` on HTTPS). |
| `NODE_ENV` | Automatic | `production` | Set automatically by Vercel/Node runtime. |

### B. Backend Service (FastAPI & PySpark)

| Variable Name | Required? | Example Production Value | Purpose & Security Notes |
|---|---|---|---|
| `AUTH_SECRET` | **Yes** | `d3f8a91b4c7e2f5a6b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e` | Must match frontend `AUTH_SECRET` for signature verification. |
| `CORS_ORIGINS` | **Yes** | `https://genome-ai.vercel.app` | Comma-separated list of allowed web origins. |
| `HOST` | Default: `0.0.0.0` | `0.0.0.0` | IP binding address. |
| `PORT` | Auto | `8000` | Port assigned by hosting platform (Railway/Render injects `$PORT`). |
| `ENVIRONMENT` | **Yes** | `production` | Enforces production secret checks on startup. |
| `MAX_UPLOAD_SIZE_BYTES` | Optional | `52428800` | Ingestion ceiling (default 50MB). |
| `SPARK_MASTER` | Default | `local[*]` | Spark master (`local[*]` for multi-core container). |
| `SPARK_DRIVER_MEMORY` | Default | `2g` | JVM heap limit allocated to Spark driver. |

---

## 3. Step-by-Step Production Deployment Plan

### Step 1: Create a Managed PostgreSQL Database (Free Tier)
1. Sign up at [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com).
2. Create a new project (e.g. `genome-auth-prod`).
3. Copy the **Connection String** (`DATABASE_URL`), which looks like:
   `postgresql://neondb_owner:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`

### Step 2: Generate Strong Cryptographic Secrets
Generate a 64-character hex secret for `AUTH_SECRET` using OpenSSL or Node in PowerShell:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Save this token — you will supply it to **both** Vercel and Railway/Render.

### Step 3: Deploy Backend on Railway (Docker Container)
*PySpark requires a Java Virtual Machine (JDK 17) and 2GB+ RAM, making Railway or Render via Docker the ideal host.*

1. Sign up at [Railway.app](https://railway.app).
2. Click **New Project** $\rightarrow$ **Deploy from GitHub repo**.
3. Under **Settings** $\rightarrow$ **Build**:
   - Set **Dockerfile Path**: `backend/Dockerfile`.
   - Set **Root Directory**: `backend`.
4. Under **Variables**, add:
   - `AUTH_SECRET`: *(The secret generated in Step 2)*
   - `CORS_ORIGINS`: `https://your-frontend-domain.vercel.app` *(update once frontend is deployed)*
   - `ENVIRONMENT`: `production`
   - `SPARK_DRIVER_MEMORY`: `2g`
5. Under **Volumes**:
   - Add a persistent volume mounted at `/app/data` (size: 5GB). This ensures `genomics.db` and uploaded FASTA/CSV files persist across redeployments.
6. Click **Generate Domain** under Settings $\rightarrow$ Networking.
   - Example: `https://genome-api.up.railway.app`
7. Test the deployment:
   ```bash
   curl https://genome-api.up.railway.app/api/health
   # Expected response: {"status":"healthy","version":"1.0.0","spark_available":true,...}
   ```

### Step 4: Prepare Prisma for PostgreSQL
When you are ready to switch the user authentication database from local SQLite to PostgreSQL:

1. Open `prisma/schema.prisma`.
2. Change line 2 from `provider = "sqlite"` to:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Set `DATABASE_URL` in your `.env` to your PostgreSQL connection string from Step 1.
4. Run:
   ```bash
   npx prisma db push
   ```
   *(This creates the `User` and `Session` tables in your PostgreSQL database).*

### Step 5: Deploy Frontend on Vercel
1. Sign up at [Vercel.com](https://vercel.com) and import your Git repository.
2. Set **Framework Preset**: `Next.js`.
3. In **Environment Variables**, add:
   - `DATABASE_URL`: *(Your PostgreSQL URL from Step 1)*
   - `AUTH_SECRET`: *(The exact same secret as Railway in Step 2)*
   - `NEXT_PUBLIC_APP_URL`: `https://your-app-name.vercel.app`
   - `BACKEND_URL`: `https://genome-api.up.railway.app` *(from Step 3)*
   - `NEXT_PUBLIC_BACKEND_URL`: `https://genome-api.up.railway.app`
   - `SECURE_COOKIES`: `true`
4. Click **Deploy**.
5. Once deployed, copy your production Vercel domain (e.g. `https://your-app-name.vercel.app`) and update the `CORS_ORIGINS` variable in your Railway backend settings.

---

## 4. Alternative: Self-Hosted Single VPS Deployment (Docker Compose)

If deploying to a single Ubuntu/Debian VPS (e.g. DigitalOcean Droplet, AWS EC2, or Hetzner with 4GB RAM):

1. Install Docker and Docker Compose:
   ```bash
   sudo apt-get update
   sudo apt-get install -y docker.io docker-compose-plugin
   ```
2. Clone repository onto server:
   ```bash
   git clone <repo-url> /opt/genomeai
   cd /opt/genomeai
   ```
3. Create `.env` file from template:
   ```bash
   cp .env.example .env
   ```
   Set strong `AUTH_SECRET` and set `SECURE_COOKIES=true`.
4. Launch containers:
   ```bash
   docker compose up -d --build
   ```
5. Configure Nginx with Let's Encrypt SSL proxying port 3000 to domain `https://yourdomain.com`.

---

## 5. Post-Deployment Verification & Smoke Test Checklist

Once deployed to production, run this checklist:

- [ ] **Health Endpoint**: Visit `https://<backend-domain>/api/health` — must return status `healthy` with `spark_available: true`.
- [ ] **SSL & Cookies**: Inspect cookies in browser developer tools after logging in — `genome_session_token` must have both `HttpOnly` and `Secure` flags checked.
- [ ] **User Registration**: Register a new user on production `/signup` and verify automatic redirect to `/dashboard`.
- [ ] **Upload File**: Upload `scripts/test_genome.fasta` in the New Analysis panel — verify base count and sequence record detection.
- [ ] **Run Detection**: Submit analysis job with $w=250$ bp and stride $125$ bp — verify status reaches `completed`.
- [ ] **Visualization Rendering**: Verify Genomic Window Map SVG and GC profile curves display real coordinates without errors.
- [ ] **Data Export**: Click "Export CSV" and "Download Report" — verify downloaded files contain valid data.
- [ ] **Logout & Route Guard**: Log out and verify `/dashboard` is inaccessible.
