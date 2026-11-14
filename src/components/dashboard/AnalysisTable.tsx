'use client';

import React, { useState, useEffect } from 'react';
import { AnalysisRecord, AnalysisDetailRecord, AnalysisVisualizationsData } from '@/lib/types/dashboard';
import StatusBadge from './StatusBadge';
import { TableRowSkeleton } from './LoadingSkeleton';
import EmptyState from './EmptyState';
import ErrorBanner from './ErrorBanner';
import InfoModal from './InfoModal';
import GenomicVisualizations from './GenomicVisualizations';
import ExportPreviewModal from './ExportPreviewModal';
import { useAnalysis } from '@/context/AnalysisContext';
import { getAnalysisDetails, getAnalysisVisualizations } from '@/lib/services/genomicsService';
import {
  History,
  Eye,
  ArrowUpDown,
  Calendar,
  FileText,
  Cpu,
  AlertTriangle,
  Download,
  BarChart2,
  ShieldAlert,
  ArrowLeft,
  Table,
} from 'lucide-react';

interface AnalysisTableProps {
  records: AnalysisRecord[];
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  searchTerm?: string;
  statusFilter?: string;
}

export default function AnalysisTable({
  records,
  isLoading = false,
  error = null,
  searchTerm = '',
  statusFilter = 'all',
}: AnalysisTableProps) {
  const { inspectedRecord, setInspectedRecord } = useAnalysis();
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);
  const [recordDetails, setRecordDetails] = useState<AnalysisDetailRecord | null>(null);
  const [vizData, setVizData] = useState<AnalysisVisualizationsData | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);

  // Export Preview Form state
  const [exportPreviewOpen, setExportPreviewOpen] = useState(false);
  const [exportPreviewFormat, setExportPreviewFormat] = useState<'csv' | 'markdown'>('csv');

  // Sync with global inspectedRecord if triggered from background banner
  useEffect(() => {
    if (inspectedRecord) {
      setSelectedRecord(inspectedRecord);
    }
  }, [inspectedRecord]);

  // Fetch details when selectedRecord changes
  useEffect(() => {
    if (!selectedRecord) {
      setRecordDetails(null);
      setVizData(null);
      setShowVisualizer(false);
      return;
    }

    async function loadData() {
      setIsLoadingDetails(true);
      try {
        const [details, viz] = await Promise.all([
          getAnalysisDetails(selectedRecord!.id),
          getAnalysisVisualizations(selectedRecord!.id),
        ]);
        setRecordDetails(details);
        setVizData(viz);
      } catch (err) {
        console.error('Failed to load analysis details:', err);
      } finally {
        setIsLoadingDetails(false);
      }
    }

    loadData();
  }, [selectedRecord]);

  // Filter logic
  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.datasetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.algorithm.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || rec.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCloseInspector = () => {
    setSelectedRecord(null);
    setInspectedRecord(null);
    setShowVisualizer(false);
  };

  const openExportModal = (format: 'csv' | 'markdown') => {
    setExportPreviewFormat(format);
    setExportPreviewOpen(true);
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
              <th className="py-3 px-4">Analysis Name</th>
              <th className="py-3 px-4">Dataset</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Anomalies</th>
              <th className="py-3 px-4">Created Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <TableRowSkeleton cols={6} />
            <TableRowSkeleton cols={6} />
            <TableRowSkeleton cols={6} />
          </tbody>
        </table>
      </div>
    );
  }

  if (records.length === 0 || filteredRecords.length === 0) {
    return (
      <EmptyState
        icon={History}
        title={records.length === 0 ? "No Past Analyses Recorded" : "No Matching Analysis Records"}
        description={
          records.length === 0
            ? "Your completed and running PySpark genomic feature jobs will appear here. Launch your first analysis to begin."
            : "No analysis runs match your current search and filter criteria."
        }
        actionText={records.length === 0 ? "Start New Analysis" : undefined}
        actionHref="/dashboard/new-analysis"
      />
    );
  }

  return (
    <div className="rounded-2xl glass-panel border border-[#28D7FF]/20 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-[11px] font-mono text-[#A7B1C8] uppercase tracking-wider">
              <th className="py-3.5 px-4 font-semibold">Analysis Name</th>
              <th className="py-3.5 px-4 font-semibold">Target Dataset</th>
              <th className="py-3.5 px-4 font-semibold">Pipeline Status</th>
              <th className="py-3.5 px-4 font-semibold">Outliers Flagged</th>
              <th className="py-3.5 px-4 font-semibold">Execution Date</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {filteredRecords.map((record) => (
              <tr
                key={record.id}
                className="hover:bg-white/[0.03] transition-colors group"
              >
                <td className="py-4 px-4 font-medium text-white">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{record.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#A7B1C8] block truncate max-w-xs mt-0.5">
                    {record.algorithm}
                  </span>
                </td>
                <td className="py-4 px-4 font-mono text-[#28D7FF]">
                  {record.datasetName}
                </td>
                <td className="py-4 px-4">
                  <StatusBadge status={record.status} />
                </td>
                <td className="py-4 px-4 font-mono">
                  <span
                    className={`font-bold ${
                      record.anomaliesFound > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {record.anomaliesFound}
                  </span>
                  <span className="text-[#A7B1C8]/60 text-[10px] ml-1">loci</span>
                </td>
                <td className="py-4 px-4 text-[#A7B1C8] font-mono">
                  {new Date(record.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="py-4 px-4 text-right">
                  <button
                    onClick={() => setSelectedRecord(record)}
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

      {/* Analysis Details & Inspector Modal */}
      {selectedRecord && (
        <InfoModal
          isOpen={!!selectedRecord}
          onClose={handleCloseInspector}
          title={`Analysis: ${selectedRecord.name}`}
          badge="Detailed Analysis Inspection"
          description={`Comprehensive metrics and execution hyperparameters for dataset: ${selectedRecord.datasetName}.`}
          actionText="Close Inspector"
          size={showVisualizer ? '5xl' : '4xl'}
          allowFullscreen={true}
          showBackButton={true}
          onBack={() => {
            if (showVisualizer) {
              setShowVisualizer(false);
            } else {
              handleCloseInspector();
            }
          }}
        >
          <div className="space-y-5">
            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#050816]/70 border border-[#28D7FF]/20 text-xs font-mono">
              <div>
                <span className="text-[#A7B1C8] block text-[10px]">ANALYSIS ID</span>
                <span className="text-white font-bold">{selectedRecord.id}</span>
              </div>
              <div>
                <span className="text-[#A7B1C8] block text-[10px]">DATASET</span>
                <span className="text-[#28D7FF] truncate block">{selectedRecord.datasetName}</span>
              </div>
              <div>
                <span className="text-[#A7B1C8] block text-[10px]">STATUS</span>
                <StatusBadge status={selectedRecord.status} />
              </div>
              <div>
                <span className="text-[#A7B1C8] block text-[10px]">TOTAL WINDOWS</span>
                <span className="text-white font-bold">{recordDetails?.totalWindows ?? '—'}</span>
              </div>
              <div>
                <span className="text-[#A7B1C8] block text-[10px]">ANOMALIES DETECTED</span>
                <span className="text-rose-400 font-bold">
                  {selectedRecord.anomaliesFound}{' '}
                  {recordDetails?.anomalyPercentage !== undefined && (
                    <span className="text-[10px] text-[#A7B1C8]">({recordDetails.anomalyPercentage}%)</span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-[#A7B1C8] block text-[10px]">COMPUTATION DURATION</span>
                <span className="text-white">{selectedRecord.duration || '—'}</span>
              </div>
              <div>
                <span className="text-[#A7B1C8] block text-[10px]">AVERAGE GC CONTENT</span>
                <span className="text-white">{selectedRecord.gcContent ? `${selectedRecord.gcContent}%` : '—'}</span>
              </div>
              <div>
                <span className="text-[#A7B1C8] block text-[10px]">TOTAL BASES</span>
                <span className="text-white">{recordDetails?.totalBases ? `${recordDetails.totalBases.toLocaleString()} bp` : '—'}</span>
              </div>
              <div>
                <span className="text-[#A7B1C8] block text-[10px]">WINDOW / STEP</span>
                <span className="text-white">
                  {recordDetails?.windowSize ?? 500}bp / {recordDetails?.windowStep ?? 250}bp
                </span>
              </div>
            </div>

            {/* Severity Breakdown Badges */}
            {recordDetails && (
              <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-mono">
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <span className="text-rose-300 block text-[10px] uppercase">High Severity</span>
                  <span className="text-white font-bold text-base mt-0.5 block">{recordDetails.highSeverityCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-amber-300 block text-[10px] uppercase">Medium Severity</span>
                  <span className="text-white font-bold text-base mt-0.5 block">{recordDetails.mediumSeverityCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                  <span className="text-cyan-300 block text-[10px] uppercase">Low Severity</span>
                  <span className="text-white font-bold text-base mt-0.5 block">{recordDetails.lowSeverityCount}</span>
                </div>
              </div>
            )}

            {/* Action Buttons: Visualizations + Export/Preview Form Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowVisualizer(!showVisualizer)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    showVisualizer
                      ? 'border border-[#28D7FF] bg-[#28D7FF]/20 text-[#28D7FF] font-bold shadow-sm'
                      : 'border border-[#28D7FF]/30 bg-[#28D7FF]/10 text-[#28D7FF] hover:bg-[#28D7FF]/20'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>{showVisualizer ? 'Hide Visualizations' : 'Show Interactive Visualizations'}</span>
                </button>

                {showVisualizer && (
                  <button
                    type="button"
                    onClick={() => setShowVisualizer(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono border border-white/10 bg-white/5 text-[#A7B1C8] hover:text-white transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Summary</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openExportModal('markdown')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all cursor-pointer"
                  title="Inspect report before downloading"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Report (.md)</span>
                </button>

                <button
                  type="button"
                  onClick={() => openExportModal('csv')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono border border-[#28D7FF]/30 bg-[#28D7FF]/10 text-[#28D7FF] hover:bg-[#28D7FF]/20 transition-all cursor-pointer"
                  title="Preview outlier data table before downloading CSV"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Toggleable Visualizations Panel */}
            {showVisualizer && (
              <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                <GenomicVisualizations
                  data={vizData}
                  isLoading={isLoadingDetails}
                  onBack={() => setShowVisualizer(false)}
                  backButtonText="Back to Metrics Overview"
                  allowFullscreen={true}
                />
              </div>
            )}
          </div>
        </InfoModal>
      )}

      {/* Export & Data Preview Form Modal */}
      {selectedRecord && (
        <ExportPreviewModal
          isOpen={exportPreviewOpen}
          onClose={() => setExportPreviewOpen(false)}
          analysisId={selectedRecord.id}
          analysisName={selectedRecord.name}
          datasetName={selectedRecord.datasetName}
          initialFormat={exportPreviewFormat}
        />
      )}
    </div>
  );
}
