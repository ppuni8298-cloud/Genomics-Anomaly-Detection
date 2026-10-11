'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AnalysisRecord, AnalysisVisualizationsData } from '@/lib/types/dashboard';
import { getRecentAnalyses, getAnalysisVisualizations, downloadAnalysisReport, exportAnomaliesCsv } from '@/lib/services/genomicsService';
import AnalysisTable from '@/components/dashboard/AnalysisTable';
import GenomicVisualizations from '@/components/dashboard/GenomicVisualizations';
import {
  History,
  Search,
  Filter,
  PlusCircle,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  BarChart2,
} from 'lucide-react';

export default function HistoryPage() {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'anomalies'>('date-desc');
  const [enableDemoMode, setEnableDemoMode] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [vizData, setVizData] = useState<AnalysisVisualizationsData | null>(null);
  const [isLoadingViz, setIsLoadingViz] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
      try {
        const data = await getRecentAnalyses(enableDemoMode);
        setRecords(data);
        if (data.length > 0 && !selectedAnalysisId) {
          const completed = data.find(d => d.status === 'completed') || data[0];
          setSelectedAnalysisId(completed.id);
        }
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, [enableDemoMode]);

  useEffect(() => {
    if (!selectedAnalysisId) {
      setVizData(null);
      return;
    }

    async function loadViz() {
      setIsLoadingViz(true);
      try {
        const viz = await getAnalysisVisualizations(selectedAnalysisId!);
        setVizData(viz);
      } catch (err) {
        console.error('Failed to load visualizations:', err);
      } finally {
        setIsLoadingViz(false);
      }
    }

    loadViz();
  }, [selectedAnalysisId]);

  // Apply sorting
  const sortedRecords = [...records].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'date-asc') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'anomalies') {
      return b.anomaliesFound - a.anomaliesFound;
    }
    return 0;
  });

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Analysis History &amp; Visual Analytics
            </h1>
            {enableDemoMode && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Synthetic Records Preview
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#A7B1C8]">
            Log of all completed, running, and historical genomic anomaly detection jobs with interactive visual exploration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setEnableDemoMode(!enableDemoMode)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
              enableDemoMode
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-[#A7B1C8] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{enableDemoMode ? 'Demo Active' : 'Preview Demo Records'}</span>
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

      {/* Featured Interactive Visualizer for Selected Analysis */}
      {selectedAnalysisId && vizData && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#A7B1C8] flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#28D7FF]" />
              <span>Active Run Visualizer</span>
            </h3>

            {records.length > 1 && (
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-[#A7B1C8]">Select Run:</span>
                <select
                  value={selectedAnalysisId}
                  onChange={(e) => setSelectedAnalysisId(e.target.value)}
                  className="bg-[#050816]/90 border border-[#28D7FF]/30 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none"
                >
                  {records.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.datasetName})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <GenomicVisualizations
            data={vizData}
            isLoading={isLoadingViz}
            onDownloadReport={() => downloadAnalysisReport(selectedAnalysisId)}
            onExportCsv={() => exportAnomaliesCsv(selectedAnalysisId)}
          />
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-2xl glass-panel p-4 border border-[#28D7FF]/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#A7B1C8]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by analysis name or dataset..."
            className="w-full bg-[#050816]/80 border border-[#1A234A] focus:border-[#28D7FF] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#A7B1C8]/40 focus:outline-none focus:ring-1 focus:ring-[#28D7FF] transition-all"
          />
        </div>

        {/* Status and Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#A7B1C8]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#050816]/80 border border-[#1A234A] focus:border-[#28D7FF] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="running">Processing</option>
              <option value="queued">Queued</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#A7B1C8]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#050816]/80 border border-[#1A234A] focus:border-[#28D7FF] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="anomalies">Most Anomalies</option>
            </select>
          </div>

        </div>

      </div>

      {/* Main Analysis Table */}
      <AnalysisTable
        records={sortedRecords}
        isLoading={isLoading}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
      />

    </div>
  );
}
