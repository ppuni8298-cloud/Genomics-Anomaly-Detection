import sqlite3
import uuid
import re
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from app.config import settings

def sanitize_filename(filename: str) -> str:
    """Removes unsafe characters and path traversal attempts from filename."""
    clean = Path(filename).name
    clean = re.sub(r'[^a-zA-Z0-9._-]', '_', clean)
    if not clean or clean.startswith('.'):
        clean = f"dataset_{uuid.uuid4().hex[:8]}.fasta"
    return clean

class StorageManager:
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or settings.DB_PATH
        self.upload_dir = settings.UPLOAD_DIR
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), timeout=30.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            conn.execute("PRAGMA journal_mode = WAL")
            cursor = conn.cursor()

            # Datasets table with user_id and total_bases
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS datasets (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    storage_path TEXT NOT NULL,
                    format TEXT NOT NULL,
                    size_bytes INTEGER NOT NULL,
                    sequence_count INTEGER DEFAULT 0,
                    total_bases INTEGER DEFAULT 0,
                    status TEXT NOT NULL,
                    description TEXT,
                    uploaded_at TEXT NOT NULL
                )
            ''')

            # Analyses table with rich metrics and configuration
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS analyses (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    dataset_id TEXT NOT NULL,
                    dataset_name TEXT NOT NULL,
                    status TEXT NOT NULL,
                    anomalies_found INTEGER DEFAULT 0,
                    duration TEXT,
                    algorithm TEXT NOT NULL,
                    gc_content REAL,
                    window_size INTEGER DEFAULT 500,
                    window_step INTEGER DEFAULT 250,
                    kmer_size INTEGER DEFAULT 7,
                    contamination_rate REAL DEFAULT 0.05,
                    random_seed INTEGER DEFAULT 42,
                    total_windows INTEGER DEFAULT 0,
                    total_bases INTEGER DEFAULT 0,
                    high_severity_count INTEGER DEFAULT 0,
                    medium_severity_count INTEGER DEFAULT 0,
                    low_severity_count INTEGER DEFAULT 0,
                    normal_windows_count INTEGER DEFAULT 0,
                    feature_summary TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
                )
            ''')

            # Anomalies table with user_id
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS anomalies (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    analysis_id TEXT NOT NULL,
                    sequence_id TEXT NOT NULL,
                    anomaly_type TEXT NOT NULL,
                    score REAL NOT NULL,
                    severity TEXT NOT NULL,
                    dataset_name TEXT NOT NULL,
                    position TEXT,
                    gc_deviation TEXT,
                    description TEXT,
                    detected_at TEXT NOT NULL,
                    FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
                )
            ''')

            # Analysis windows table for exact chart profiles
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS analysis_windows (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    analysis_id TEXT NOT NULL,
                    sequence_id TEXT NOT NULL,
                    window_start INTEGER NOT NULL,
                    window_end INTEGER NOT NULL,
                    position_label TEXT NOT NULL,
                    score REAL NOT NULL,
                    is_anomaly INTEGER NOT NULL,
                    severity TEXT NOT NULL,
                    gc_content REAL NOT NULL,
                    at_content REAL NOT NULL,
                    gc_skew REAL NOT NULL,
                    max_homopolymer INTEGER NOT NULL,
                    prop_a REAL NOT NULL,
                    prop_t REAL NOT NULL,
                    prop_g REAL NOT NULL,
                    prop_c REAL NOT NULL,
                    FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
                )
            ''')

            # Check and perform graceful column migrations if database already existed
            cursor.execute("PRAGMA table_info(datasets)")
            ds_cols = [col['name'] for col in cursor.fetchall()]
            if 'user_id' not in ds_cols:
                cursor.execute("ALTER TABLE datasets ADD COLUMN user_id TEXT DEFAULT 'default_user'")
            if 'total_bases' not in ds_cols:
                cursor.execute("ALTER TABLE datasets ADD COLUMN total_bases INTEGER DEFAULT 0")

            cursor.execute("PRAGMA table_info(analyses)")
            an_cols = [col['name'] for col in cursor.fetchall()]
            if 'user_id' not in an_cols:
                cursor.execute("ALTER TABLE analyses ADD COLUMN user_id TEXT DEFAULT 'default_user'")
            if 'total_windows' not in an_cols:
                cursor.execute("ALTER TABLE analyses ADD COLUMN total_windows INTEGER DEFAULT 0")
            if 'total_bases' not in an_cols:
                cursor.execute("ALTER TABLE analyses ADD COLUMN total_bases INTEGER DEFAULT 0")
            if 'window_step' not in an_cols:
                cursor.execute("ALTER TABLE analyses ADD COLUMN window_step INTEGER DEFAULT 250")
            if 'contamination_rate' not in an_cols:
                cursor.execute("ALTER TABLE analyses ADD COLUMN contamination_rate REAL DEFAULT 0.05")
            if 'random_seed' not in an_cols:
                cursor.execute("ALTER TABLE analyses ADD COLUMN random_seed INTEGER DEFAULT 42")
            if 'high_severity_count' not in an_cols:
                cursor.execute("ALTER TABLE analyses ADD COLUMN high_severity_count INTEGER DEFAULT 0")
            if 'medium_severity_count' not in an_cols:
                cursor.execute("ALTER TABLE analyses ADD COLUMN medium_severity_count INTEGER DEFAULT 0")
            if 'low_severity_count' not in an_cols:
                cursor.execute("ALTER TABLE analyses ADD COLUMN low_severity_count INTEGER DEFAULT 0")
            if 'normal_windows_count' not in an_cols:
                cursor.execute("ALTER TABLE analyses ADD COLUMN normal_windows_count INTEGER DEFAULT 0")
            if 'feature_summary' not in an_cols:
                cursor.execute("ALTER TABLE analyses ADD COLUMN feature_summary TEXT")

            cursor.execute("PRAGMA table_info(anomalies)")
            anom_cols = [col['name'] for col in cursor.fetchall()]
            if 'user_id' not in anom_cols:
                cursor.execute("ALTER TABLE anomalies ADD COLUMN user_id TEXT DEFAULT 'default_user'")

            cursor.execute('CREATE INDEX IF NOT EXISTS idx_datasets_user ON datasets(user_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_analyses_user ON analyses(user_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_anomalies_user ON anomalies(user_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_windows_analysis ON analysis_windows(analysis_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_windows_user ON analysis_windows(user_id)')
            conn.commit()

    def save_file(self, filename: str, content: bytes) -> tuple[str, Path]:
        clean_name = sanitize_filename(filename)
        unique_prefix = uuid.uuid4().hex[:12]
        file_path = self.upload_dir / f"{unique_prefix}_{clean_name}"

        with open(file_path, "wb") as f:
            f.write(content)

        return clean_name, file_path

    def insert_dataset(
        self,
        user_id: str,
        name: str,
        storage_path: str,
        fmt: str,
        size_bytes: int,
        sequence_count: int,
        total_bases: int = 0,
        description: str = ""
    ) -> Dict[str, Any]:
        ds_id = f"ds-{uuid.uuid4().hex[:8]}"
        now = datetime.utcnow().isoformat() + "Z"

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO datasets (id, user_id, name, storage_path, format, size_bytes, sequence_count, total_bases, status, description, uploaded_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (ds_id, user_id, name, str(storage_path), fmt, size_bytes, sequence_count, total_bases, "ready", description, now))
            conn.commit()

        return {
            "id": ds_id,
            "name": name,
            "format": fmt,
            "sizeBytes": size_bytes,
            "uploadedAt": now,
            "status": "ready",
            "sequenceCount": sequence_count,
            "totalBases": total_bases,
            "description": description
        }

    def get_datasets(self, user_id: str) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM datasets WHERE user_id = ? ORDER BY uploaded_at DESC', (user_id,))
            rows = cursor.fetchall()
            return [
                {
                    "id": r["id"],
                    "name": r["name"],
                    "format": r["format"],
                    "sizeBytes": r["size_bytes"],
                    "uploadedAt": r["uploaded_at"],
                    "status": r["status"],
                    "sequenceCount": r["sequence_count"],
                    "totalBases": r["total_bases"] if "total_bases" in r.keys() else 0,
                    "description": r["description"]
                }
                for r in rows
            ]

    def get_dataset(self, dataset_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM datasets WHERE id = ? AND user_id = ?', (dataset_id, user_id))
            row = cursor.fetchone()
            if not row:
                return None
            return dict(row)

    def insert_analysis(
        self,
        analysis_id: str,
        user_id: str,
        name: str,
        dataset_id: str,
        dataset_name: str,
        algorithm: str,
        window_size: int,
        window_step: int,
        kmer_size: int,
        contamination_rate: float = 0.05,
        random_seed: int = 42
    ) -> Dict[str, Any]:
        now = datetime.utcnow().isoformat() + "Z"
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO analyses (
                    id, user_id, name, dataset_id, dataset_name, status, anomalies_found,
                    algorithm, window_size, window_step, kmer_size, contamination_rate, random_seed, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (analysis_id, user_id, name, dataset_id, dataset_name, "running", 0, algorithm, window_size, window_step, kmer_size, contamination_rate, random_seed, now))
            conn.commit()

        return {
            "id": analysis_id,
            "name": name,
            "datasetName": dataset_name,
            "status": "running",
            "anomaliesFound": 0,
            "createdAt": now,
            "algorithm": algorithm
        }

    def update_analysis_completion(
        self,
        analysis_id: str,
        status: str,
        anomalies_found: int,
        duration: str,
        gc_content: float,
        total_windows: int = 0,
        total_bases: int = 0,
        high_severity_count: int = 0,
        medium_severity_count: int = 0,
        low_severity_count: int = 0,
        normal_windows_count: int = 0,
        feature_summary: Optional[Dict[str, Any]] = None
    ):
        feature_summary_str = json.dumps(feature_summary) if feature_summary else None
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE analyses
                SET status = ?, anomalies_found = ?, duration = ?, gc_content = ?,
                    total_windows = ?, total_bases = ?, high_severity_count = ?,
                    medium_severity_count = ?, low_severity_count = ?,
                    normal_windows_count = ?, feature_summary = ?
                WHERE id = ?
            ''', (
                status, anomalies_found, duration, gc_content,
                total_windows, total_bases, high_severity_count,
                medium_severity_count, low_severity_count,
                normal_windows_count, feature_summary_str, analysis_id
            ))
            conn.commit()

    def insert_analysis_windows(
        self,
        user_id: str,
        analysis_id: str,
        windows: List[Dict[str, Any]]
    ):
        """Saves sampled window profiles for interactive chart plotting."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            rows_to_insert = []
            for w in windows:
                win_id = f"win-{uuid.uuid4().hex[:10]}"
                rows_to_insert.append((
                    win_id,
                    user_id,
                    analysis_id,
                    w.get("sequence_id", "SEQ"),
                    int(w.get("window_start", 0)),
                    int(w.get("window_end", 0)),
                    w.get("position_label", f"{w.get('window_start', 0)}-{w.get('window_end', 0)}"),
                    float(w.get("score", 0.0)),
                    1 if w.get("is_anomaly", False) else 0,
                    w.get("severity", "normal"),
                    float(w.get("gc_content", 0.0)),
                    float(w.get("at_content", 0.0)),
                    float(w.get("gc_skew", 0.0)),
                    int(w.get("max_homopolymer", 0)),
                    float(w.get("prop_a", 0.0)),
                    float(w.get("prop_t", 0.0)),
                    float(w.get("prop_g", 0.0)),
                    float(w.get("prop_c", 0.0)),
                ))

            cursor.executemany('''
                INSERT INTO analysis_windows (
                    id, user_id, analysis_id, sequence_id, window_start, window_end,
                    position_label, score, is_anomaly, severity, gc_content, at_content,
                    gc_skew, max_homopolymer, prop_a, prop_t, prop_g, prop_c
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', rows_to_insert)
            conn.commit()

    def get_analyses(self, user_id: str) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM analyses WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
            rows = cursor.fetchall()
            return [
                {
                    "id": r["id"],
                    "name": r["name"],
                    "datasetName": r["dataset_name"],
                    "status": r["status"],
                    "anomaliesFound": r["anomalies_found"],
                    "createdAt": r["created_at"],
                    "duration": r["duration"],
                    "algorithm": r["algorithm"],
                    "gcContent": r["gc_content"]
                }
                for r in rows
            ]

    def get_analysis_details(self, analysis_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT a.*, d.format as dataset_format, d.uploaded_at as dataset_uploaded_at,
                       d.sequence_count as dataset_sequence_count, d.size_bytes as dataset_size_bytes
                FROM analyses a
                LEFT JOIN datasets d ON a.dataset_id = d.id
                WHERE a.id = ? AND a.user_id = ?
            ''', (analysis_id, user_id))
            row = cursor.fetchone()
            if not row:
                return None

            r = dict(row)
            total_win = r.get("total_windows") or 0
            anom_found = r.get("anomalies_found") or 0
            anom_pct = round((anom_found / total_win) * 100, 2) if total_win > 0 else 0.0

            feature_summary = None
            if r.get("feature_summary"):
                try:
                    feature_summary = json.loads(r["feature_summary"])
                except Exception:
                    feature_summary = None

            if not feature_summary:
                avg_gc = round(r.get("gc_content") or 50.0, 1)
                feature_summary = {
                    "normal": {
                        "avgGcContent": avg_gc,
                        "avgAtContent": round(100.0 - avg_gc, 1),
                        "avgGcSkew": 0.0,
                        "avgMaxHomopolymer": 4.0
                    },
                    "anomalous": {
                        "avgGcContent": avg_gc,
                        "avgAtContent": round(100.0 - avg_gc, 1),
                        "avgGcSkew": 0.0,
                        "avgMaxHomopolymer": 4.0
                    }
                }

            return {
                "id": r["id"],
                "name": r["name"],
                "datasetId": r["dataset_id"],
                "datasetName": r["dataset_name"],
                "status": r["status"],
                "anomaliesFound": anom_found,
                "anomalyPercentage": anom_pct,
                "totalWindows": total_win,
                "totalBases": r.get("total_bases") or 0,
                "highSeverityCount": r.get("high_severity_count") or 0,
                "mediumSeverityCount": r.get("medium_severity_count") or 0,
                "lowSeverityCount": r.get("low_severity_count") or 0,
                "normalWindowsCount": r.get("normal_windows_count") or 0,
                "duration": r.get("duration"),
                "algorithm": r.get("algorithm"),
                "gcContent": r.get("gc_content"),
                "windowSize": r.get("window_size") or 500,
                "windowStep": r.get("window_step") or 250,
                "kmerSize": r.get("kmer_size") or 7,
                "contaminationRate": r.get("contamination_rate") or 0.05,
                "randomSeed": r.get("random_seed") or 42,
                "createdAt": r["created_at"],
                "datasetFormat": r.get("dataset_format"),
                "datasetUploadedAt": r.get("dataset_uploaded_at"),
                "datasetSequenceCount": r.get("dataset_sequence_count"),
                "datasetSizeBytes": r.get("dataset_size_bytes"),
                "featureSummary": feature_summary
            }

    def get_analysis_visualizations(self, analysis_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Returns structured data for the 4 interactive visualizations."""
        details = self.get_analysis_details(analysis_id, user_id)
        if not details:
            return None

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM analysis_windows
                WHERE analysis_id = ? AND user_id = ?
                ORDER BY window_start ASC
            ''', (analysis_id, user_id))
            rows = cursor.fetchall()

        windows_map = []
        gc_profile = []
        for idx, row in enumerate(rows):
            w = dict(row)
            item = {
                "windowIndex": idx,
                "sequenceId": w["sequence_id"],
                "windowStart": w["window_start"],
                "windowEnd": w["window_end"],
                "positionLabel": w["position_label"],
                "score": round(w["score"], 3),
                "isAnomaly": bool(w["is_anomaly"]),
                "severity": w["severity"],
                "gcContent": round(w["gc_content"] * 100, 1),
                "atContent": round(w["at_content"] * 100, 1),
                "gcSkew": round(w["gc_skew"], 3),
                "maxHomopolymer": w["max_homopolymer"]
            }
            windows_map.append(item)
            gc_profile.append({
                "windowIndex": idx,
                "positionLabel": w["position_label"],
                "gcContent": round(w["gc_content"] * 100, 1),
                "isAnomaly": bool(w["is_anomaly"]),
                "severity": w["severity"]
            })

        # Feature Comparison
        feature_comparison = details.get("featureSummary") or {
            "normal": {
                "avgGcContent": round(details.get("gcContent", 50.0), 1),
                "avgAtContent": round(100.0 - (details.get("gcContent", 50.0) or 50.0), 1),
                "avgGcSkew": 0.0,
                "avgMaxHomopolymer": 4.0
            },
            "anomalous": {
                "avgGcContent": round(details.get("gcContent", 50.0), 1),
                "avgAtContent": round(100.0 - (details.get("gcContent", 50.0) or 50.0), 1),
                "avgGcSkew": 0.12,
                "avgMaxHomopolymer": 6.5
            }
        }

        return {
            "analysisId": analysis_id,
            "datasetName": details["datasetName"],
            "totalWindows": details["totalWindows"],
            "severityDistribution": {
                "high": details["highSeverityCount"],
                "medium": details["mediumSeverityCount"],
                "low": details["lowSeverityCount"],
                "normal": details["normalWindowsCount"]
            },
            "windowsMap": windows_map,
            "gcProfile": gc_profile,
            "featureComparison": feature_comparison,
            "scientificDisclaimer": "Notice: Anomaly flags and outlier scores are computational statistics derived from unsupervised Isolation Forest tree partitioning. They indicate statistically unusual sequence composition (k-mers, GC-skew, homopolymers) rather than verified mutations, pathogenicity, or clinical diagnoses."
        }

    def insert_anomaly(
        self,
        analysis_id: str,
        user_id: str,
        sequence_id: str,
        anomaly_type: str,
        score: float,
        severity: str,
        dataset_name: str,
        position: str,
        gc_deviation: str,
        description: str
    ):
        anom_id = f"anom-{uuid.uuid4().hex[:8]}"
        now = datetime.utcnow().isoformat() + "Z"
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO anomalies (id, user_id, analysis_id, sequence_id, anomaly_type, score, severity, dataset_name, position, gc_deviation, description, detected_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (anom_id, user_id, analysis_id, sequence_id, anomaly_type, score, severity, dataset_name, position, gc_deviation, description, now))
            conn.commit()

    def get_anomalies(self, user_id: str) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM anomalies WHERE user_id = ? ORDER BY score DESC', (user_id,))
            rows = cursor.fetchall()
            return [
                {
                    "id": r["id"],
                    "sequenceId": r["sequence_id"],
                    "anomalyType": r["anomaly_type"],
                    "score": r["score"],
                    "severity": r["severity"],
                    "datasetName": r["dataset_name"],
                    "position": r["position"],
                    "gcDeviation": r["gc_deviation"],
                    "detectedAt": r["detected_at"],
                    "description": r["description"]
                }
                for r in rows
            ]

    def query_anomalies(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 10,
        severity: Optional[str] = None,
        search: Optional[str] = None,
        min_score: Optional[float] = None,
        max_score: Optional[float] = None,
        sort_by: str = "score",
        sort_order: str = "desc"
    ) -> Dict[str, Any]:
        """Supports search, filtering by severity and score, sorting, and pagination."""
        query_conditions = ["user_id = ?"]
        params = [user_id]

        if severity and severity.lower() != "all":
            query_conditions.append("severity = ?")
            params.append(severity.lower())

        if min_score is not None:
            query_conditions.append("score >= ?")
            params.append(min_score)

        if max_score is not None:
            query_conditions.append("score <= ?")
            params.append(max_score)

        if search and search.strip():
            term = f"%{search.strip().lower()}%"
            query_conditions.append("(LOWER(sequence_id) LIKE ? OR LOWER(anomaly_type) LIKE ? OR LOWER(dataset_name) LIKE ?)")
            params.extend([term, term, term])

        where_clause = " WHERE " + " AND ".join(query_conditions)

        # Sorting validation
        allowed_sort_fields = {"score": "score", "severity": "severity", "position": "position", "detected_at": "detected_at"}
        sort_col = allowed_sort_fields.get(sort_by, "score")
        order_dir = "ASC" if sort_order.lower() == "asc" else "DESC"

        with self._get_connection() as conn:
            cursor = conn.cursor()
            # Count total matching
            cursor.execute(f"SELECT COUNT(*) FROM anomalies {where_clause}", params)
            total = cursor.fetchone()[0]

            # Fetch page items
            offset = max((page - 1) * limit, 0)
            cursor.execute(
                f"SELECT * FROM anomalies {where_clause} ORDER BY {sort_col} {order_dir} LIMIT ? OFFSET ?",
                params + [limit, offset]
            )
            rows = cursor.fetchall()

            items = [
                {
                    "id": r["id"],
                    "sequenceId": r["sequence_id"],
                    "anomalyType": r["anomaly_type"],
                    "score": r["score"],
                    "severity": r["severity"],
                    "datasetName": r["dataset_name"],
                    "position": r["position"],
                    "gcDeviation": r["gc_deviation"],
                    "detectedAt": r["detected_at"],
                    "description": r["description"]
                }
                for r in rows
            ]

            total_pages = max((total + limit - 1) // limit, 1)

            return {
                "items": items,
                "total": total,
                "page": page,
                "limit": limit,
                "totalPages": total_pages
            }

    def get_anomalies_for_export(self, user_id: str, analysis_id: Optional[str] = None) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if analysis_id:
                cursor.execute('SELECT * FROM anomalies WHERE user_id = ? AND analysis_id = ? ORDER BY score DESC', (user_id, analysis_id))
            else:
                cursor.execute('SELECT * FROM anomalies WHERE user_id = ? ORDER BY score DESC', (user_id,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    def get_dashboard_stats(self, user_id: str) -> Dict[str, Any]:
        with self._get_connection() as conn:
            cursor = conn.cursor()

            cursor.execute('SELECT COUNT(*) FROM datasets WHERE user_id = ?', (user_id,))
            total_datasets = cursor.fetchone()[0]

            cursor.execute('SELECT COUNT(*) FROM analyses WHERE user_id = ? AND status = "completed"', (user_id,))
            analyses_completed = cursor.fetchone()[0]

            cursor.execute('SELECT COUNT(*) FROM anomalies WHERE user_id = ?', (user_id,))
            anomalies_detected = cursor.fetchone()[0]

            cursor.execute('SELECT created_at FROM analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', (user_id,))
            last_analysis_row = cursor.fetchone()
            last_analysis_date = last_analysis_row[0] if last_analysis_row else None

            return {
                "totalDatasets": total_datasets if total_datasets > 0 else None,
                "analysesCompleted": analyses_completed if analyses_completed > 0 else None,
                "anomaliesDetected": anomalies_detected if anomalies_detected > 0 else None,
                "lastAnalysisDate": last_analysis_date
            }

    def compare_datasets(self, user_id: str, dataset1_id: str, dataset2_id: str) -> Optional[Dict[str, Any]]:
        ds1 = self.get_dataset(dataset1_id, user_id)
        ds2 = self.get_dataset(dataset2_id, user_id)
        if not ds1 or not ds2:
            return None

        # Fetch latest analysis for each dataset
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM analyses WHERE dataset_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1', (dataset1_id, user_id))
            a1_row = cursor.fetchone()
            a1 = dict(a1_row) if a1_row else None

            cursor.execute('SELECT * FROM analyses WHERE dataset_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1', (dataset2_id, user_id))
            a2_row = cursor.fetchone()
            a2 = dict(a2_row) if a2_row else None

        config_warning = None
        if a1 and a2:
            w_diff = a1.get("window_size") != a2.get("window_size")
            c_diff = a1.get("contamination_rate") != a2.get("contamination_rate")
            if w_diff or c_diff:
                config_warning = (
                    f"Notice: Analysis parameters differ between datasets (Window: {a1.get('window_size')}bp vs {a2.get('window_size')}bp; "
                    f"Contamination: {a1.get('contamination_rate')} vs {a2.get('contamination_rate')}). Metrics should be compared with this variation in mind."
                )

        return {
            "dataset1": {
                "id": ds1["id"],
                "name": ds1["name"],
                "format": ds1["format"],
                "sizeBytes": ds1["size_bytes"],
                "sequenceCount": ds1["sequence_count"],
                "totalBases": ds1.get("total_bases") or 0,
                "uploadedAt": ds1["uploaded_at"],
                "hasAnalysis": bool(a1),
                "anomaliesFound": a1["anomalies_found"] if a1 else None,
                "totalWindows": a1.get("total_windows") if a1 else None,
                "gcContent": a1.get("gc_content") if a1 else None,
                "windowSize": a1.get("window_size") if a1 else None,
                "contaminationRate": a1.get("contamination_rate") if a1 else None,
                "severityDistribution": {
                    "high": a1.get("high_severity_count", 0) if a1 else 0,
                    "medium": a1.get("medium_severity_count", 0) if a1 else 0,
                    "low": a1.get("low_severity_count", 0) if a1 else 0,
                } if a1 else None
            },
            "dataset2": {
                "id": ds2["id"],
                "name": ds2["name"],
                "format": ds2["format"],
                "sizeBytes": ds2["size_bytes"],
                "sequenceCount": ds2["sequence_count"],
                "totalBases": ds2.get("total_bases") or 0,
                "uploadedAt": ds2["uploaded_at"],
                "hasAnalysis": bool(a2),
                "anomaliesFound": a2["anomalies_found"] if a2 else None,
                "totalWindows": a2.get("total_windows") if a2 else None,
                "gcContent": a2.get("gc_content") if a2 else None,
                "windowSize": a2.get("window_size") if a2 else None,
                "contaminationRate": a2.get("contamination_rate") if a2 else None,
                "severityDistribution": {
                    "high": a2.get("high_severity_count", 0) if a2 else 0,
                    "medium": a2.get("medium_severity_count", 0) if a2 else 0,
                    "low": a2.get("low_severity_count", 0) if a2 else 0,
                } if a2 else None
            },
            "configurationWarning": config_warning
        }

    def get_analysis_report_markdown(self, analysis_id: str, user_id: str) -> Optional[str]:
        details = self.get_analysis_details(analysis_id, user_id)
        if not details:
            return None

        anomalies = self.get_anomalies_for_export(user_id, analysis_id)

        md = f"""# Genomic Anomaly Analysis Summary Report
**Analysis Name:** {details['name']}
**Analysis ID:** `{details['id']}`
**Generated Date:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}
**System:** GenomeAI — Apache Spark & Isolation Forest Engine

---

## 1. Dataset & Execution Metadata
- **Source Dataset:** {details['datasetName']}
- **Dataset Format:** {details.get('datasetFormat', 'FASTA').upper()}
- **Sequence Count:** {details.get('datasetSequenceCount', 1):,}
- **Total Bases:** {details.get('totalBases', 0):,} bp
- **Execution Status:** {details['status'].upper()}
- **Computation Duration:** {details.get('duration', 'N/A')}
- **Algorithm:** {details.get('algorithm', 'PySpark + Isolation Forest')}
- **Average GC Content:** {details.get('gcContent', 0.0)}%

---

## 2. Analysis Hyperparameters
- **Sliding Window Size:** {details.get('windowSize', 500)} bp
- **Sliding Window Step:** {details.get('windowStep', 250)} bp
- **K-mer Frequency Size:** {details.get('kmerSize', 7)} (dinucleotide distribution)
- **Model Contamination Target:** {details.get('contaminationRate', 0.05)}
- **Random Seed:** {details.get('randomSeed', 42)}

---

## 3. Anomaly Summary & Severity Breakdown
- **Total Windows Analyzed:** {details.get('totalWindows', 0):,}
- **Normal Windows:** {details.get('normalWindowsCount', 0):,}
- **Detected Outlier Windows:** {details.get('anomaliesFound', 0):,} ({details.get('anomalyPercentage', 0.0)}% of dataset)
  - **High Severity (Score >= 0.80):** {details.get('highSeverityCount', 0)}
  - **Medium Severity (Score 0.65 - 0.79):** {details.get('mediumSeverityCount', 0)}
  - **Low Severity (Score < 0.65):** {details.get('lowSeverityCount', 0)}

---

## 4. Detected Outlier Loci Summary
| Sequence Locus | Anomaly Type | Outlier Score | Severity | Genomic Position | GC Deviation |
|---|---|---|---|---|---|
"""
        for a in anomalies[:25]:
            md += f"| `{a['sequence_id']}` | {a['anomaly_type']} | {a['score']:.3f} | {a['severity'].upper()} | {a['position']} | {a['gc_deviation']} |\n"

        if len(anomalies) > 25:
            md += f"\n*... and {len(anomalies) - 25} additional loci. See full CSV export for complete catalog.*\n"

        md += """
---

## 5. Scientific & Computational Interpretation Guidelines
> [!IMPORTANT]
> **Scientific Disclaimer:** The sequence regions identified in this report are statistical outliers discovered through unsupervised machine learning (Isolation Forest) based on multi-dimensional feature distributions (GC skew, k-mer frequencies, nucleotide entropy, and homopolymer run lengths).
>
> A computational outlier score does **NOT** establish a pathogenic mutation, disease state, or biological diagnosis. It indicates that the sequence locus exhibits statistical divergence from the genomic background model under the specified hyperparameters.
"""
        return md

storage = StorageManager()
