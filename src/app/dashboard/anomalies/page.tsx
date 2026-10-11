'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AnomalyRecord } from '@/lib/types/dashboard';
import { getAnomalies, queryAnomalies, exportAnomaliesCsv } from '@/lib/services/genomicsService';
import AnomalyTable from '@/components/dashboard/AnomalyTable';
import {
  ShieldAlert,
  Search,
  Filter,
  PlusCircle,
  Sparkles,
  Layers,
  Download,
  AlertCircle,
  Sliders,
  RotateCcw,
} from 'lucide-react';

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [minScore, setMinScore] = useState<number>(0.0);
  const [enableDemoMode, setEnableDemoMode] = useState(false);

  useEffect(() => {
    async function fetchAnomaliesData() {
      setIsLoading(true);
      try {
        if (enableDemoMode) {
          const data = await getAnomalies(true);
          setAnomalies(data);
        } else {
          // Fetch real anomalies from backend
          const res = await queryAnomalies({ limit: 100 }).catch(() => null);
          if (res && res.items) {
            setAnomalies(res.items);
          } else {
            const data = await getAnomalies(false);
            setAnomalies(data);
          }
        }
      } catch (err) {
        console.error('Failed to load anomalies:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnomaliesData();
  }, [enableDemoMode]);

  const handleExportCsv = async () => {
    setExportError(null);
    setIsExporting(true);
    try {
      await exportAnomaliesCsv();
    } catch (err: unknown) {
      console.error('Export CSV error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to export anomalies CSV.';
      setExportError(msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSeverityFilter('all');
    setTypeFilter('all');
    setMinScore(0.0);
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Anomaly Explorer
            </h1>
            {enableDemoMode && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Synthetic Outliers Preview
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#A7B1C8]">
            Investigate sequence outlier loci discovered by unsupervised Isolation Forest decision trees.
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
            <span>{enableDemoMode ? 'Demo Active' : 'Preview Demo Outliers'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono border border-[#28D7FF]/30 bg-[#28D7FF]/10 text-[#28D7FF] hover:bg-[#28D7FF]/20 transition-all cursor-pointer disabled:opacity-50"
            title="Download CSV export of detected anomalies"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <Link
            href="/dashboard/new-analysis"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#28D7FF] to-[#8B5CF6] hover:opacity-95 shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Analysis</span>
          </Link>
        </div>
      </div>

      {exportError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-2xl glass-panel p-4 border border-[#28D7FF]/15 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#A7B1C8]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by locus identifier (e.g. CHR_01) or dataset..."
              className="w-full bg-[#050816]/80 border border-[#1A234A] focus:border-[#28D7FF] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#A7B1C8]/40 focus:outline-none focus:ring-1 focus:ring-[#28D7FF] transition-all font-mono"
            />
          </div>

          {/* Severity & Type Controls */}
          <div className="flex flex-wrap items-center gap-3">

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#A7B1C8]" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-[#050816]/80 border border-[#1A234A] focus:border-[#28D7FF] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
              >
                <option value="all">All Severities</option>
                <option value="high">High Severity (&ge;0.80)</option>
                <option value="medium">Medium Severity (0.70-0.79)</option>
                <option value="low">Low Severity (&lt;0.70)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#A7B1C8]" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-[#050816]/80 border border-[#1A234A] focus:border-[#28D7FF] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
              >
                <option value="all">All Anomaly Types</option>
                <option value="skew">GC-Skew Outliers</option>
                <option value="k-mer">K-mer Frequency</option>
                <option value="homopolymer">Homopolymers</option>
              </select>
            </div>

          </div>

        </div>

        {/* Score Threshold Slider Row */}
        <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[#A7B1C8]">
              <Sliders className="w-3.5 h-3.5 text-[#28D7FF]" />
              <span>Min Outlier Score:</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.95"
              step="0.05"
              value={minScore}
              onChange={(e) => setMinScore(parseFloat(e.target.value))}
              className="w-32 accent-[#28D7FF] cursor-pointer"
            />
            <span className="font-bold text-white px-2 py-0.5 rounded bg-white/5 border border-white/10">
              &ge; {minScore.toFixed(2)}
            </span>
          </div>

          {(searchTerm || severityFilter !== 'all' || typeFilter !== 'all' || minScore > 0.0) && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[11px] text-[#A7B1C8] hover:text-[#28D7FF] transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

      </div>

      {/* Main Anomaly Table with Sorting & Pagination */}
      <AnomalyTable
        records={anomalies}
        isLoading={isLoading}
        searchTerm={searchTerm}
        severityFilter={severityFilter}
        typeFilter={typeFilter}
        minScoreFilter={minScore}
      />

    </div>
  );
}
