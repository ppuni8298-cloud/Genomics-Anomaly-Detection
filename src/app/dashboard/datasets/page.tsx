'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DatasetItem, DatasetComparisonData } from '@/lib/types/dashboard';
import { getDatasets, compareDatasets } from '@/lib/services/genomicsService';
import EmptyState from '@/components/dashboard/EmptyState';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { TableRowSkeleton } from '@/components/dashboard/LoadingSkeleton';
import InfoModal from '@/components/dashboard/InfoModal';
import {
  Database,
  Search,
  Filter,
  PlusCircle,
  FileCode,
  HardDrive,
  Sparkles,
  Info,
  Calendar,
  GitCompare,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [enableDemoMode, setEnableDemoMode] = useState(false);

  // Dataset Comparison State
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareDs1Id, setCompareDs1Id] = useState<string>('');
  const [compareDs2Id, setCompareDs2Id] = useState<string>('');
  const [comparisonData, setComparisonData] = useState<DatasetComparisonData | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDatasetList() {
      setIsLoading(true);
      try {
        const data = await getDatasets(enableDemoMode);
        setDatasets(data);
        if (data.length >= 2) {
          setCompareDs1Id(data[0].id);
          setCompareDs2Id(data[1].id);
        }
      } catch (err) {
        console.error('Failed to fetch datasets:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDatasetList();
  }, [enableDemoMode]);

  const handleRunComparison = async () => {
    if (!compareDs1Id || !compareDs2Id) {
      setCompareError('Please select two distinct datasets to compare.');
      return;
    }
    if (compareDs1Id === compareDs2Id) {
      setCompareError('Please select two different datasets for side-by-side comparison.');
      return;
    }

    setIsComparing(true);
    setCompareError(null);
    try {
      const result = await compareDatasets(compareDs1Id, compareDs2Id);
      setComparisonData(result);
    } catch (err: unknown) {
      console.error('Dataset comparison failed:', err);
      const msg = err instanceof Error ? err.message : 'Failed to compare datasets.';
      setCompareError(msg);
    } finally {
      setIsComparing(false);
    }
  };

  const filteredDatasets = datasets.filter((ds) => {
    const matchesSearch =
      ds.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ds.description && ds.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFormat =
      formatFilter === 'all' || ds.format.toLowerCase() === formatFilter.toLowerCase();

    return matchesSearch && matchesFormat;
  });

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Dataset Manager
            </h1>
            {enableDemoMode && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Synthetic References Preview
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#A7B1C8]">
            Manage imported FASTA sequence assemblies, benchmark control files, and CSV feature matrices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setEnableDemoMode(!enableDemoMode)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
              enableDemoMode
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-[#A7B1C8] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{enableDemoMode ? 'Demo Active' : 'Preview Demo Datasets'}</span>
          </button>

          {datasets.length >= 2 && (
            <button
              onClick={() => {
                setIsCompareOpen(true);
                setCompareError(null);
                if (compareDs1Id && compareDs2Id && compareDs1Id !== compareDs2Id && !comparisonData) {
                  handleRunComparison();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono border border-[#C084FC]/30 bg-[#C084FC]/10 text-[#C084FC] hover:bg-[#C084FC]/20 transition-all cursor-pointer"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare Datasets</span>
            </button>
          )}

          <Link
            href="/dashboard/new-analysis"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#28D7FF] to-[#8B5CF6] hover:opacity-95 shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Import Dataset</span>
          </Link>
        </div>
      </div>

      {/* Storage Architecture Honest Notice */}
      <div className="p-4 rounded-2xl bg-[#0B1026] border border-[#28D7FF]/20 flex items-start gap-3 text-xs text-[#A7B1C8]">
        <Info className="w-4 h-4 text-[#28D7FF] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="text-white font-semibold block">Dataset Storage &amp; Isolation:</span>
          Uploaded sequence files are safely isolated per authenticated researcher in local storage. Feature vectors and sliding-window profiles are indexed deterministically.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl glass-panel p-4 border border-[#28D7FF]/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#A7B1C8]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by dataset name or description..."
            className="w-full bg-[#050816]/80 border border-[#1A234A] focus:border-[#28D7FF] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#A7B1C8]/40 focus:outline-none focus:ring-1 focus:ring-[#28D7FF] transition-all font-mono"
          />
        </div>

        {/* Format Selector */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#A7B1C8]" />
          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="bg-[#050816]/80 border border-[#1A234A] focus:border-[#28D7FF] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
          >
            <option value="all">All Formats</option>
            <option value="fasta">FASTA (.fasta)</option>
            <option value="fa">FA (.fa)</option>
            <option value="csv">CSV (.csv)</option>
          </select>
        </div>

      </div>

      {/* Dataset Content Table or Empty State */}
      {isLoading ? (
        <div className="rounded-2xl glass-panel border border-[#28D7FF]/20 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[11px] font-mono text-[#A7B1C8] uppercase">
                <th className="py-3 px-4">Dataset Name</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Total Bases</th>
                <th className="py-3 px-4">Upload Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              <TableRowSkeleton cols={6} />
              <TableRowSkeleton cols={6} />
            </tbody>
          </table>
        </div>
      ) : datasets.length === 0 || filteredDatasets.length === 0 ? (
        <EmptyState
          icon={Database}
          title={datasets.length === 0 ? "No Datasets Registered" : "No Matching Datasets"}
          description={
            datasets.length === 0
              ? "No genomic datasets have been registered in this workspace yet. Import your first FASTA or CSV sequence to initiate feature extraction."
              : "No registered datasets match your search and format filter."
          }
          actionText={datasets.length === 0 ? "Import New Dataset" : undefined}
          actionHref="/dashboard/new-analysis"
        />
      ) : (
        <div className="rounded-2xl glass-panel border border-[#28D7FF]/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[11px] font-mono text-[#A7B1C8] uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Dataset Identifier</th>
                  <th className="py-3.5 px-4 font-semibold">Format</th>
                  <th className="py-3.5 px-4 font-semibold">File Size</th>
                  <th className="py-3.5 px-4 font-semibold">Total Bases</th>
                  <th className="py-3.5 px-4 font-semibold">Registered Date</th>
                  <th className="py-3.5 px-4 font-semibold">Cluster State</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredDatasets.map((ds) => (
                  <tr
                    key={ds.id}
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    <td className="py-4 px-4 font-semibold text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#28D7FF]/10 border border-[#28D7FF]/30 flex items-center justify-center text-[#28D7FF] shrink-0">
                          <FileCode className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-mono text-sm block">{ds.name}</span>
                          {ds.description && (
                            <span className="text-[11px] text-[#A7B1C8]/70 block max-w-sm truncate mt-0.5">
                              {ds.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/10 text-white border border-white/15">
                        {ds.format}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-[#A7B1C8]">
                      {formatBytes(ds.sizeBytes)}
                    </td>
                    <td className="py-4 px-4 font-mono text-[#28D7FF]">
                      {ds.totalBases ? `${ds.totalBases.toLocaleString()} bp` : 'Pending scan'}
                    </td>
                    <td className="py-4 px-4 font-mono text-[#A7B1C8]">
                      {new Date(ds.uploadedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={ds.status === 'ready' ? 'completed' : 'running'} label={ds.status === 'ready' ? 'Ready' : 'Ingesting'} />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href="/dashboard/new-analysis"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#28D7FF] bg-[#28D7FF]/10 border border-[#28D7FF]/30 hover:bg-[#28D7FF]/20 transition-all"
                      >
                        Run Analysis
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dataset Comparison Modal */}
      {isCompareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl glass-panel p-6 sm:p-8 border border-[#C084FC]/30 bg-[#0B1026]/95 space-y-6 shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#C084FC]/15 border border-[#C084FC]/30 flex items-center justify-center text-[#C084FC]">
                  <GitCompare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Dataset Comparative Analytics
                  </h2>
                  <p className="text-xs text-[#A7B1C8]">
                    Compare composition, window counts, and anomaly distributions between two authenticated datasets.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCompareOpen(false)}
                className="p-2 rounded-xl text-[#A7B1C8] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dataset Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#050816]/70 border border-white/10">
              <div>
                <label className="block text-xs font-semibold text-[#28D7FF] mb-1.5 font-mono">
                  DATASET 1 (REFERENCE)
                </label>
                <select
                  value={compareDs1Id}
                  onChange={(e) => setCompareDs1Id(e.target.value)}
                  className="w-full bg-[#0B1026] border border-[#28D7FF]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                >
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id} disabled={d.id === compareDs2Id}>
                      {d.name} ({d.format.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#C084FC] mb-1.5 font-mono">
                  DATASET 2 (COMPARISON TARGET)
                </label>
                <select
                  value={compareDs2Id}
                  onChange={(e) => setCompareDs2Id(e.target.value)}
                  className="w-full bg-[#0B1026] border border-[#C084FC]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                >
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id} disabled={d.id === compareDs1Id}>
                      {d.name} ({d.format.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 flex justify-end pt-1">
                <button
                  onClick={handleRunComparison}
                  disabled={isComparing || compareDs1Id === compareDs2Id}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#28D7FF] to-[#C084FC] hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isComparing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Comparing...</span>
                    </>
                  ) : (
                    <>
                      <GitCompare className="w-3.5 h-3.5" />
                      <span>Execute Comparison</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {compareError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{compareError}</span>
              </div>
            )}

            {/* Comparison Results Card */}
            {comparisonData && (
              <div className="space-y-4">

                {/* Configuration Mismatch Warning */}
                {comparisonData.configurationWarning && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-amber-300 font-semibold mb-0.5">Configuration Divergence Warning:</strong>
                      {comparisonData.configurationWarning}
                    </div>
                  </div>
                )}

                {/* Side-by-Side Comparison Table */}
                <div className="rounded-2xl border border-white/10 overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-[#A7B1C8]">
                        <th className="py-3 px-4 font-semibold uppercase text-[11px]">Metric Field</th>
                        <th className="py-3 px-4 font-semibold text-[#28D7FF] uppercase text-[11px]">
                          {comparisonData.dataset1.name}
                        </th>
                        <th className="py-3 px-4 font-semibold text-[#C084FC] uppercase text-[11px]">
                          {comparisonData.dataset2.name}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="py-3 px-4 text-[#A7B1C8]">Format &amp; File Size</td>
                        <td className="py-3 px-4 text-white">
                          {comparisonData.dataset1.format.toUpperCase()} &bull; {formatBytes(comparisonData.dataset1.sizeBytes)}
                        </td>
                        <td className="py-3 px-4 text-white">
                          {comparisonData.dataset2.format.toUpperCase()} &bull; {formatBytes(comparisonData.dataset2.sizeBytes)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-[#A7B1C8]">Sequence Count</td>
                        <td className="py-3 px-4 text-white font-bold">
                          {comparisonData.dataset1.sequenceCount} sequence(s)
                        </td>
                        <td className="py-3 px-4 text-white font-bold">
                          {comparisonData.dataset2.sequenceCount} sequence(s)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-[#A7B1C8]">Total Bases (bp)</td>
                        <td className="py-3 px-4 text-[#28D7FF] font-bold">
                          {comparisonData.dataset1.totalBases?.toLocaleString() || 'N/A'} bp
                        </td>
                        <td className="py-3 px-4 text-[#C084FC] font-bold">
                          {comparisonData.dataset2.totalBases?.toLocaleString() || 'N/A'} bp
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-[#A7B1C8]">Sliding Windows Analyzed</td>
                        <td className="py-3 px-4 text-white">
                          {comparisonData.dataset1.totalWindows !== undefined ? `${comparisonData.dataset1.totalWindows.toLocaleString()} windows` : 'No analysis run'}
                        </td>
                        <td className="py-3 px-4 text-white">
                          {comparisonData.dataset2.totalWindows !== undefined ? `${comparisonData.dataset2.totalWindows.toLocaleString()} windows` : 'No analysis run'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-[#A7B1C8]">Global GC Content</td>
                        <td className="py-3 px-4 text-white">
                          {comparisonData.dataset1.gcContent !== undefined ? `${comparisonData.dataset1.gcContent}%` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-white">
                          {comparisonData.dataset2.gcContent !== undefined ? `${comparisonData.dataset2.gcContent}%` : 'N/A'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-[#A7B1C8]">Detected Anomalies</td>
                        <td className="py-3 px-4 font-bold text-rose-400">
                          {comparisonData.dataset1.anomaliesFound !== undefined ? `${comparisonData.dataset1.anomaliesFound} loci (${comparisonData.dataset1.anomalyPercentage || 0}%)` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-bold text-rose-400">
                          {comparisonData.dataset2.anomaliesFound !== undefined ? `${comparisonData.dataset2.anomaliesFound} loci (${comparisonData.dataset2.anomalyPercentage || 0}%)` : 'N/A'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-[#A7B1C8]">High Severity Count (&ge;0.80)</td>
                        <td className="py-3 px-4 text-rose-400 font-bold">
                          {comparisonData.dataset1.highSeverityCount ?? 0}
                        </td>
                        <td className="py-3 px-4 text-rose-400 font-bold">
                          {comparisonData.dataset2.highSeverityCount ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-[#A7B1C8]">Medium Severity Count (0.70-0.79)</td>
                        <td className="py-3 px-4 text-amber-400 font-bold">
                          {comparisonData.dataset1.mediumSeverityCount ?? 0}
                        </td>
                        <td className="py-3 px-4 text-amber-400 font-bold">
                          {comparisonData.dataset2.mediumSeverityCount ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-[#A7B1C8]">Analysis Parameters</td>
                        <td className="py-3 px-4 text-[#A7B1C8] text-[11px]">
                          {comparisonData.dataset1.windowSize ? `Window: ${comparisonData.dataset1.windowSize}bp, Step: ${comparisonData.dataset1.windowStep}bp, k: ${comparisonData.dataset1.kmerSize}` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-[#A7B1C8] text-[11px]">
                          {comparisonData.dataset2.windowSize ? `Window: ${comparisonData.dataset2.windowSize}bp, Step: ${comparisonData.dataset2.windowStep}bp, k: ${comparisonData.dataset2.kmerSize}` : 'N/A'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Scientific Disclaimer */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#A7B1C8] leading-relaxed">
                  <strong className="block text-white font-semibold mb-0.5">Scientific Responsibility Note:</strong>
                  Differences in computational outlier density reflect mathematical variations in k-mer tree paths and sequence nucleotide composition under the configured parameters. They do not signify comparative pathogenicity, biological defect, or mutation rate.
                </div>

              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsCompareOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-mono text-[#A7B1C8] hover:text-white bg-white/5 border border-white/10 transition-colors cursor-pointer"
              >
                Close Comparison
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
