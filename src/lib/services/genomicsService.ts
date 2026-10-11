import {
  DatasetItem,
  AnalysisRecord,
  AnalysisDetailRecord,
  AnalysisVisualizationsData,
  AnomalyRecord,
  PaginatedAnomalies,
  AnomalyQueryParams,
  DatasetComparisonData,
  DashboardStats,
  NucleotideComposition,
} from '../types/dashboard';

// Route via same-origin Next.js proxy route to forward authenticated HTTP-only session cookies
const API_BASE = typeof window !== 'undefined' ? '/api/proxy' : (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000') + '/api';

export const EMPTY_STATS: DashboardStats = {
  totalDatasets: null,
  analysesCompleted: null,
  anomaliesDetected: null,
  lastAnalysisDate: null,
};

export const SYNTHETIC_DEMO_NUCLEOTIDES: NucleotideComposition = {
  adenine: 29.8,
  thymine: 30.1,
  guanine: 20.3,
  cytosine: 19.8,
  gcContent: 40.1,
  totalBases: 1425890,
};

export const SYNTHETIC_DEMO_ANALYSES: AnalysisRecord[] = [
  {
    id: 'ana-ref-001',
    name: 'Synthetic E. Coli K-12 Skew Run',
    datasetName: 'ecoli_mg1655_ref.fasta',
    status: 'completed',
    anomaliesFound: 3,
    createdAt: '2026-10-10T11:20:00Z',
    duration: '1m 42s',
    algorithm: 'Isolation Forest (k=7)',
    gcContent: 50.8,
  },
  {
    id: 'ana-ref-002',
    name: 'Bacteriophage Lambda Window Sweep',
    datasetName: 'lambda_phage_sample.fa',
    status: 'completed',
    anomaliesFound: 1,
    createdAt: '2026-10-09T16:45:00Z',
    duration: '48s',
    algorithm: 'Isolation Forest (k=5)',
    gcContent: 49.9,
  },
];

export const SYNTHETIC_DEMO_ANOMALIES: AnomalyRecord[] = [
  {
    id: 'anom-ref-01',
    sequenceId: 'CHR_01_LOC_45280',
    anomalyType: 'Extreme GC-Skew Outlier',
    score: 0.942,
    severity: 'high',
    datasetName: 'ecoli_mg1655_ref.fasta',
    position: '45,280 - 45,580 bp',
    gcDeviation: '+28.4% above mean',
    detectedAt: '2026-10-10T11:21:12Z',
    description: 'Statistical anomaly: significant atypical GC composition isolated in 300bp sliding window.',
  },
  {
    id: 'anom-ref-02',
    sequenceId: 'CHR_01_LOC_98120',
    anomalyType: 'K-mer Frequency Deviation',
    score: 0.781,
    severity: 'medium',
    datasetName: 'ecoli_mg1655_ref.fasta',
    position: '98,120 - 98,320 bp',
    gcDeviation: '-14.2% below mean',
    detectedAt: '2026-10-10T11:21:28Z',
    description: 'Statistical anomaly: low-frequency dinucleotide entropy cluster outside baseline distribution.',
  },
];

export const SYNTHETIC_DEMO_DATASETS: DatasetItem[] = [
  {
    id: 'ds-ref-01',
    name: 'ecoli_mg1655_ref.fasta',
    format: 'fasta',
    sizeBytes: 4641652,
    uploadedAt: '2026-10-10T10:15:00Z',
    status: 'ready',
    sequenceCount: 1,
    description: 'Synthetic Reference sequence for visual preview.',
  },
];

/**
 * Health check
 */
export async function checkClusterHealth(): Promise<{ status: string; spark_available: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch {
    return { status: 'offline', spark_available: false };
  }
}

/**
 * Upload real genomic dataset (FASTA or CSV)
 */
export async function uploadDataset(file: File, description = ''): Promise<DatasetItem> {
  const formData = new FormData();
  formData.append('file', file);
  if (description) {
    formData.append('description', description);
  }

  const res = await fetch(`${API_BASE}/datasets/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Upload failed with HTTP status ${res.status}`);
  }

  return await res.json();
}

/**
 * Submit real analysis run to PySpark and Isolation Forest backend
 */
export async function submitAnalysis(payload: {
  datasetId: string;
  name: string;
  windowSize: number;
  windowStep?: number;
  kmerSize: number;
  contaminationRate: number;
  randomSeed?: number;
}): Promise<AnalysisRecord> {
  const res = await fetch(`${API_BASE}/analysis/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Analysis submission failed with HTTP status ${res.status}`);
  }

  return await res.json();
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(includeDemo = false): Promise<DashboardStats> {
  if (includeDemo) {
    return {
      totalDatasets: SYNTHETIC_DEMO_DATASETS.length,
      analysesCompleted: SYNTHETIC_DEMO_ANALYSES.length,
      anomaliesDetected: SYNTHETIC_DEMO_ANOMALIES.length,
      lastAnalysisDate: '2026-10-10T11:20:00Z',
    };
  }

  try {
    const res = await fetch(`${API_BASE}/stats`, { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offline
  }

  return EMPTY_STATS;
}

/**
 * Get recent analyses
 */
export async function getRecentAnalyses(includeDemo = false): Promise<AnalysisRecord[]> {
  if (includeDemo) {
    return SYNTHETIC_DEMO_ANALYSES;
  }

  try {
    const res = await fetch(`${API_BASE}/analysis/list`, { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offline
  }

  return [];
}

/**
 * Get detected anomalies
 */
export async function getAnomalies(includeDemo = false): Promise<AnomalyRecord[]> {
  if (includeDemo) {
    return SYNTHETIC_DEMO_ANOMALIES;
  }

  try {
    const res = await fetch(`${API_BASE}/anomalies`, { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offline
  }

  return [];
}

/**
 * Get registered datasets
 */
export async function getDatasets(includeDemo = false): Promise<DatasetItem[]> {
  if (includeDemo) {
    return SYNTHETIC_DEMO_DATASETS;
  }

  try {
    const res = await fetch(`${API_BASE}/datasets`, { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offline
  }

  return [];
}

/**
 * Get nucleotide composition for the most recent dataset or specified dataset
 */
export async function getNucleotideComposition(
  datasetIdOrDemo?: string | boolean,
  includeDemo = false
): Promise<NucleotideComposition | null> {
  const isDemo = typeof datasetIdOrDemo === 'boolean' ? datasetIdOrDemo : includeDemo;
  const targetId = typeof datasetIdOrDemo === 'string' ? datasetIdOrDemo : undefined;

  if (isDemo) {
    return SYNTHETIC_DEMO_NUCLEOTIDES;
  }

  try {
    let resolvedId = targetId;
    if (!resolvedId) {
      const datasets = await getDatasets(false);
      if (datasets.length > 0) {
        resolvedId = datasets[0].id;
      }
    }

    if (resolvedId) {
      const res = await fetch(`${API_BASE}/datasets/${resolvedId}/composition`, { cache: 'no-store' });
      if (res.ok) {
        return await res.json();
      }
    }
  } catch {
    // Backend offline
  }

  return null;
}

/**
 * Triggers CSV download for anomalies
 */
export async function exportAnomaliesCsv(analysisId?: string): Promise<void> {
  const query = analysisId ? `?analysis_id=${encodeURIComponent(analysisId)}` : '';
  const url = `${API_BASE}/anomalies/export${query}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to download anomalies CSV export.');
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `genomic_anomalies_${analysisId || 'all'}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Get detailed analysis metrics, dataset metadata, and parameters
 */
export async function getAnalysisDetails(analysisId: string): Promise<AnalysisDetailRecord | null> {
  try {
    const res = await fetch(`${API_BASE}/analysis/${encodeURIComponent(analysisId)}/details`, { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch analysis details:', err);
  }
  return null;
}

/**
 * Get interactive visualization data for genomic window map, GC profile, severity donut, and feature comparison
 */
export async function getAnalysisVisualizations(analysisId: string): Promise<AnalysisVisualizationsData | null> {
  try {
    const res = await fetch(`${API_BASE}/analysis/${encodeURIComponent(analysisId)}/visualizations`, { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch analysis visualizations:', err);
  }
  return null;
}

/**
 * Query anomalies with search, filtering, sorting, and pagination
 */
export async function queryAnomalies(params: AnomalyQueryParams = {}): Promise<PaginatedAnomalies> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.severity && params.severity !== 'all') query.set('severity', params.severity);
  if (params.search) query.set('search', params.search);
  if (params.minScore !== undefined) query.set('min_score', String(params.minScore));
  if (params.maxScore !== undefined) query.set('max_score', String(params.maxScore));
  if (params.sortBy) query.set('sort_by', params.sortBy);
  if (params.sortOrder) query.set('sort_order', params.sortOrder);

  const res = await fetch(`${API_BASE}/anomalies/query?${query.toString()}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to query anomalies');
  }
  return await res.json();
}

/**
 * Compare two datasets owned by the authenticated researcher
 */
export async function compareDatasets(dataset1Id: string, dataset2Id: string): Promise<DatasetComparisonData> {
  const res = await fetch(
    `${API_BASE}/datasets/compare?dataset1_id=${encodeURIComponent(dataset1Id)}&dataset2_id=${encodeURIComponent(dataset2Id)}`,
    { cache: 'no-store' }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to compare datasets.');
  }
  return await res.json();
}

/**
 * Download Markdown Analysis Summary Report
 */
export async function downloadAnalysisReport(analysisId: string): Promise<void> {
  const url = `${API_BASE}/analysis/${encodeURIComponent(analysisId)}/report`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to download analysis report.');
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `genomic_analysis_report_${analysisId}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
}
