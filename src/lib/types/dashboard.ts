export type FileFormat = 'fasta' | 'fa' | 'fna' | 'csv';

export type AnalysisStatus = 'completed' | 'running' | 'queued' | 'failed';

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'normal';

export interface DatasetItem {
  id: string;
  name: string;
  format: FileFormat;
  sizeBytes: number;
  uploadedAt: string;
  status: 'ready' | 'processing' | 'failed';
  sequenceCount?: number;
  totalBases?: number;
  description?: string;
}

export interface AnalysisRecord {
  id: string;
  name: string;
  datasetName: string;
  status: AnalysisStatus;
  anomaliesFound: number;
  createdAt: string;
  duration?: string;
  algorithm: string;
  gcContent?: number;
}

export interface AnalysisDetailRecord extends AnalysisRecord {
  datasetId: string;
  anomalyPercentage: number;
  totalWindows: number;
  totalBases: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  normalWindowsCount: number;
  windowSize: number;
  windowStep: number;
  kmerSize: number;
  contaminationRate: number;
  randomSeed: number;
  datasetFormat?: string;
  datasetUploadedAt?: string;
  datasetSequenceCount?: number;
  datasetSizeBytes?: number;
  featureSummary?: {
    normal?: {
      avgGcContent?: number;
      avgAtContent?: number;
      avgGcSkew?: number;
      avgMaxHomopolymer?: number;
    };
    anomalous?: {
      avgGcContent?: number;
      avgAtContent?: number;
      avgGcSkew?: number;
      avgMaxHomopolymer?: number;
    };
  };
}

export interface WindowProfilePoint {
  windowIndex: number;
  sequenceId: string;
  windowStart: number;
  windowEnd: number;
  positionLabel: string;
  score: number;
  isAnomaly: boolean;
  severity: AnomalySeverity;
  gcContent: number;
  atContent: number;
  gcSkew: number;
  maxHomopolymer: number;
}

export interface GcProfilePoint {
  windowIndex: number;
  positionLabel: string;
  gcContent: number;
  isAnomaly: boolean;
  severity: string;
}

export interface AnalysisVisualizationsData {
  analysisId: string;
  datasetName: string;
  totalWindows: number;
  severityDistribution: {
    high: number;
    medium: number;
    low: number;
    normal: number;
  };
  windowsMap: WindowProfilePoint[];
  gcProfile: GcProfilePoint[];
  featureComparison: {
    normal?: {
      avgGcContent?: number;
      avgAtContent?: number;
      avgGcSkew?: number;
      avgMaxHomopolymer?: number;
    };
    anomalous?: {
      avgGcContent?: number;
      avgAtContent?: number;
      avgGcSkew?: number;
      avgMaxHomopolymer?: number;
    };
  };
  scientificDisclaimer: string;
}

export interface AnomalyRecord {
  id: string;
  sequenceId: string;
  anomalyType: string;
  score: number;
  severity: AnomalySeverity;
  datasetName: string;
  position?: string;
  gcDeviation?: string;
  detectedAt?: string;
  description?: string;
}

export interface PaginatedAnomalies {
  items: AnomalyRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AnomalyQueryParams {
  page?: number;
  limit?: number;
  severity?: string;
  search?: string;
  minScore?: number;
  maxScore?: number;
  sortBy?: 'score' | 'position' | 'severity' | 'detected_at';
  sortOrder?: 'asc' | 'desc';
}

export interface DatasetComparisonData {
  dataset1: {
    id: string;
    name: string;
    format: string;
    sizeBytes: number;
    sequenceCount: number;
    totalBases: number;
    uploadedAt: string;
    hasAnalysis: boolean;
    analysisName?: string;
    analysisStatus?: string;
    anomaliesFound?: number;
    anomalyPercentage?: number;
    totalWindows?: number;
    gcContent?: number;
    windowSize?: number;
    windowStep?: number;
    kmerSize?: number;
    contaminationRate?: number;
    randomSeed?: number;
    highSeverityCount?: number;
    mediumSeverityCount?: number;
    lowSeverityCount?: number;
    normalWindowsCount?: number;
    severityDistribution?: {
      high: number;
      medium: number;
      low: number;
    };
  };
  dataset2: {
    id: string;
    name: string;
    format: string;
    sizeBytes: number;
    sequenceCount: number;
    totalBases: number;
    uploadedAt: string;
    hasAnalysis: boolean;
    analysisName?: string;
    analysisStatus?: string;
    anomaliesFound?: number;
    anomalyPercentage?: number;
    totalWindows?: number;
    gcContent?: number;
    windowSize?: number;
    windowStep?: number;
    kmerSize?: number;
    contaminationRate?: number;
    randomSeed?: number;
    highSeverityCount?: number;
    mediumSeverityCount?: number;
    lowSeverityCount?: number;
    normalWindowsCount?: number;
    severityDistribution?: {
      high: number;
      medium: number;
      low: number;
    };
  };
  configurationWarning?: string | null;
}

export interface DashboardStats {
  totalDatasets: number | null;
  analysesCompleted: number | null;
  anomaliesDetected: number | null;
  lastAnalysisDate: string | null;
}

export interface NucleotideComposition {
  adenine: number;
  thymine: number;
  guanine: number;
  cytosine: number;
  gcContent: number;
  totalBases: number;
}
