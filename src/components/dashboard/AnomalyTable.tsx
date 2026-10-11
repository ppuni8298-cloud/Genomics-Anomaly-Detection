'use client';

import React, { useState, useMemo } from 'react';
import { AnomalyRecord, AnomalySeverity } from '@/lib/types/dashboard';
import StatusBadge from './StatusBadge';
import EmptyState from './EmptyState';
import InfoModal from './InfoModal';
import { TableRowSkeleton } from './LoadingSkeleton';
import ErrorBanner from './ErrorBanner';
import {
  ShieldAlert,
  Search,
  Filter,
  Eye,
  AlertCircle,
  Dna,
  Info,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Sliders,
} from 'lucide-react';

interface AnomalyTableProps {
  records: AnomalyRecord[];
  isLoading?: boolean;
  error?: string | null;
  searchTerm?: string;
  severityFilter?: string;
  typeFilter?: string;
  minScoreFilter?: number;
  maxScoreFilter?: number;
  sortBy?: 'score' | 'position' | 'severity' | 'sequenceId';
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (field: 'score' | 'position' | 'severity' | 'sequenceId') => void;
  currentPage?: number;
  totalPages?: number;
  totalRecords?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

export default function AnomalyTable({
  records,
  isLoading = false,
  error = null,
  searchTerm = '',
  severityFilter = 'all',
  typeFilter = 'all',
  minScoreFilter = 0.0,
  maxScoreFilter = 1.0,
  sortBy: externalSortBy,
  sortOrder: externalSortOrder,
  onSortChange: externalOnSortChange,
  currentPage: externalPage,
  totalPages: externalTotalPages,
  totalRecords: externalTotalRecords,
  onPageChange: externalOnPageChange,
  pageSize: externalPageSize,
  onPageSizeChange: externalOnPageSizeChange,
}: AnomalyTableProps) {
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyRecord | null>(null);

  // Local sorting if not externally driven
  const [localSortBy, setLocalSortBy] = useState<'score' | 'position' | 'severity' | 'sequenceId'>('score');
  const [localSortOrder, setLocalSortOrder] = useState<'asc' | 'desc'>('desc');
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(10);

  const activeSortBy = externalSortBy ?? localSortBy;
  const activeSortOrder = externalSortOrder ?? localSortOrder;
  const activePage = externalPage ?? localPage;
  const activePageSize = externalPageSize ?? localPageSize;

  const handleSort = (field: 'score' | 'position' | 'severity' | 'sequenceId') => {
    if (externalOnSortChange) {
      externalOnSortChange(field);
    } else {
      if (localSortBy === field) {
        setLocalSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setLocalSortBy(field);
        setLocalSortOrder('desc');
      }
      setLocalPage(1);
    }
  };

  // Filter records locally if not using server-side pre-filtered set
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchesSearch =
        rec.sequenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.anomalyType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.datasetName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSeverity =
        severityFilter === 'all' || rec.severity.toLowerCase() === severityFilter.toLowerCase();

      const matchesType =
        typeFilter === 'all' || rec.anomalyType.toLowerCase().includes(typeFilter.toLowerCase());

      const matchesScore =
        rec.score >= minScoreFilter && rec.score <= maxScoreFilter;

      return matchesSearch && matchesSeverity && matchesType && matchesScore;
    });
  }, [records, searchTerm, severityFilter, typeFilter, minScoreFilter, maxScoreFilter]);

  // Sort records locally
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let comparison = 0;
      if (activeSortBy === 'score') {
        comparison = a.score - b.score;
      } else if (activeSortBy === 'sequenceId') {
        comparison = a.sequenceId.localeCompare(b.sequenceId);
      } else if (activeSortBy === 'position') {
        comparison = (a.position || '').localeCompare(b.position || '');
      } else if (activeSortBy === 'severity') {
        const order: Record<string, number> = { high: 3, medium: 2, low: 1, normal: 0 };
        comparison = (order[a.severity] || 0) - (order[b.severity] || 0);
      }
      return activeSortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredRecords, activeSortBy, activeSortOrder]);

  // Pagination
  const totalCount = externalTotalRecords ?? sortedRecords.length;
  const computedTotalPages = externalTotalPages ?? Math.max(1, Math.ceil(sortedRecords.length / activePageSize));

  const displayRecords = useMemo(() => {
    if (externalPage !== undefined) {
      // Server-side paginated
      return sortedRecords;
    }
    const start = (activePage - 1) * activePageSize;
    return sortedRecords.slice(start, start + activePageSize);
  }, [sortedRecords, externalPage, activePage, activePageSize]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > computedTotalPages) return;
    if (externalOnPageChange) {
      externalOnPageChange(newPage);
    } else {
      setLocalPage(newPage);
    }
  };

  if (error) {
    return <ErrorBanner message={error} className="my-4" />;
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl glass-panel border border-[#28D7FF]/20 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-[11px] font-mono text-[#A7B1C8] uppercase">
              <th className="py-3.5 px-4">Sequence Identifier</th>
              <th className="py-3.5 px-4">Locus Position</th>
              <th className="py-3.5 px-4">Anomaly Classification</th>
              <th className="py-3.5 px-4">Outlier Score</th>
              <th className="py-3.5 px-4">Severity</th>
              <th className="py-3.5 px-4">Source Dataset</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <TableRowSkeleton cols={7} />
            <TableRowSkeleton cols={7} />
            <TableRowSkeleton cols={7} />
          </tbody>
        </table>
      </div>
    );
  }

  if (records.length === 0 || sortedRecords.length === 0) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title={records.length === 0 ? "No Detected Anomalies" : "No Matching Anomalies"}
        description={
          records.length === 0
            ? "Anomalies will appear here after a completed genomic analysis run. Run your first analysis to detect sequence outliers using Isolation Forest."
            : "No detected anomalies match your search, severity, and score threshold parameters."
        }
        actionText={records.length === 0 ? "Initiate Analysis" : undefined}
        actionHref="/dashboard/new-analysis"
      />
    );
  }

  const renderSortIcon = (field: 'score' | 'position' | 'severity' | 'sequenceId') => {
    if (activeSortBy !== field) {
      return <ArrowUpDown className="w-3 h-3 text-[#A7B1C8]/40" />;
    }
    return activeSortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[#28D7FF]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#28D7FF]" />
    );
  };

  return (
    <div className="rounded-2xl glass-panel border border-[#28D7FF]/20 overflow-hidden space-y-0">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-[11px] font-mono text-[#A7B1C8] uppercase tracking-wider select-none">
              <th
                onClick={() => handleSort('sequenceId')}
                className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Sequence Identifier</span>
                  {renderSortIcon('sequenceId')}
                </div>
              </th>
              <th
                onClick={() => handleSort('position')}
                className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Locus Position</span>
                  {renderSortIcon('position')}
                </div>
              </th>
              <th className="py-3.5 px-4 font-semibold">Anomaly Classification</th>
              <th
                onClick={() => handleSort('score')}
                className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Outlier Score</span>
                  {renderSortIcon('score')}
                </div>
              </th>
              <th
                onClick={() => handleSort('severity')}
                className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Severity</span>
                  {renderSortIcon('severity')}
                </div>
              </th>
              <th className="py-3.5 px-4 font-semibold">Source Dataset</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {displayRecords.map((rec) => (
              <tr
                key={rec.id}
                className="hover:bg-white/[0.03] transition-colors group"
              >
                <td className="py-4 px-4 font-mono font-bold text-white">
                  <div className="flex items-center gap-2">
                    <Dna className="w-4 h-4 text-[#28D7FF] shrink-0" />
                    <span>{rec.sequenceId}</span>
                  </div>
                </td>
                <td className="py-4 px-4 font-mono text-[#A7B1C8]">
                  {rec.position || 'Locus 0 bp'}
                </td>
                <td className="py-4 px-4 text-[#F8FAFC]">
                  {rec.anomalyType}
                </td>
                <td className="py-4 px-4 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{rec.score.toFixed(3)}</span>
                    <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden hidden sm:block">
                      <div
                        className="h-full bg-gradient-to-r from-[#28D7FF] to-rose-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, rec.score * 100))}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <StatusBadge severity={rec.severity} />
                </td>
                <td className="py-4 px-4 font-mono text-[#A7B1C8] truncate max-w-[140px]">
                  {rec.datasetName}
                </td>
                <td className="py-4 px-4 text-right">
                  <button
                    onClick={() => setSelectedAnomaly(rec)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#28D7FF] bg-[#28D7FF]/10 border border-[#28D7FF]/30 hover:bg-[#28D7FF]/20 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-3.5 border-t border-white/5 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#A7B1C8]">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-white">{Math.min(totalCount, (activePage - 1) * activePageSize + 1)}</strong> to{' '}
            <strong className="text-white">{Math.min(totalCount, activePage * activePageSize)}</strong> of{' '}
            <strong className="text-white">{totalCount}</strong> anomalies
          </span>
          {externalPageSize === undefined && (
            <select
              value={activePageSize}
              onChange={(e) => {
                const s = parseInt(e.target.value, 10);
                if (externalOnPageSizeChange) externalOnPageSizeChange(s);
                else {
                  setLocalPageSize(s);
                  setLocalPage(1);
                }
              }}
              className="bg-[#050816]/80 border border-white/10 rounded px-2 py-0.5 text-xs text-white focus:outline-none ml-2"
            >
              <option value="10">10 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
            </select>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handlePageChange(activePage - 1)}
            disabled={activePage <= 1}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[#A7B1C8] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-2.5 py-1 rounded bg-[#28D7FF]/10 border border-[#28D7FF]/25 text-[#28D7FF] font-bold text-xs">
            {activePage} / {computedTotalPages}
          </span>

          <button
            onClick={() => handlePageChange(activePage + 1)}
            disabled={activePage >= computedTotalPages}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[#A7B1C8] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Genomic Window Details & Inspection Modal */}
      {selectedAnomaly && (
        <InfoModal
          isOpen={!!selectedAnomaly}
          onClose={() => setSelectedAnomaly(null)}
          title={`Genomic Window Detail: ${selectedAnomaly.sequenceId}`}
          badge="Isolation Forest Locus Inspector"
          description={selectedAnomaly.description || 'Outlier isolation metrics computed from partitioned sliding-window feature vectors.'}
          actionText="Close Inspector"
        >
          <div className="space-y-4">
            {/* Scientific Disclaimer Banner */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-300 font-semibold mb-0.5">Statistical Outlier Notice:</strong>
                This window was flagged as an unsupervised anomaly due to atypical k-mer frequency or compositional skew under the current Isolation Forest model. This represents a <em>computational anomaly score</em> and does <strong>not</strong> constitute a confirmed biological mutation, pathogenic variant, or clinical diagnosis.
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#050816]/70 border border-[#28D7FF]/20 text-xs font-mono">
              <div>
                <span className="text-[#A7B1C8] block text-[10px]">SEQUENCE ID</span>
                <span className="text-white font-bold">{selectedAnomaly.sequenceId}</span>
              </div>
              <div>
                <span className="text-[#A7B1C8] block text-[10px]">GENOMIC COORDINATES</span>
                <span className="text-[#28D7FF] font-bold">{selectedAnomaly.position || 'Locus 0 bp'}</span>
              </div>
              <div>
                <span className="text-[#A7B1C8] block text-[10px]">SEVERITY TIER</span>
                <StatusBadge severity={selectedAnomaly.severity} />
              </div>
              <div>
                <span className="text-[#A7B1C8] block text-[10px]">OUTLIER SCORE</span>
                <span className="text-rose-400 font-bold text-sm">{selectedAnomaly.score.toFixed(3)}</span>
              </div>
              <div>
                <span className="text-[#A7B1C8] block text-[10px]">ANOMALY TYPE</span>
                <span className="text-[#C084FC]">{selectedAnomaly.anomalyType}</span>
              </div>
              <div>
                <span className="text-[#A7B1C8] block text-[10px]">GC DEVIATION</span>
                <span className="text-white">{selectedAnomaly.gcDeviation || 'N/A'}</span>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <span className="text-[#A7B1C8] block text-[10px]">SOURCE DATASET</span>
                <span className="text-white truncate block">{selectedAnomaly.datasetName}</span>
              </div>
            </div>

            {/* Interpretation Card */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#A7B1C8] space-y-1.5 leading-relaxed">
              <span className="font-semibold text-white block">Computational Isolation Rationale:</span>
              <p>
                In an Isolation Forest ensemble, normal genomic windows require deep average decision tree traversal paths because they share recurring k-mer frequencies with the background dataset.
              </p>
              <p>
                This window required significantly shorter isolation depth (score: <span className="text-white font-mono">{selectedAnomaly.score.toFixed(3)}</span>), indicating statistically distinctive sequence properties relative to other windows in this dataset.
              </p>
            </div>
          </div>
        </InfoModal>
      )}
    </div>
  );
}
