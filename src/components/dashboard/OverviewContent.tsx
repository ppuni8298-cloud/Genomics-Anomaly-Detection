'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  DatasetItem,
  AnalysisRecord,
  AnomalyRecord,
  DashboardStats,
  NucleotideComposition,
} from '@/lib/types/dashboard';
import {
  getDashboardStats,
  getRecentAnalyses,
  getNucleotideComposition,
} from '@/lib/services/genomicsService';
import StatCard from './StatCard';
import GenomicCharts from './GenomicCharts';
import AnalysisTable from './AnalysisTable';
import {
  Database,
  Activity,
  ShieldAlert,
  Clock,
  PlusCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Sliders,
  Cpu,
  HelpCircle,
} from 'lucide-react';

// Dynamic 3D DNA Double Helix visual for the molecular panel
const DnaHelixCanvas = dynamic(() => import('@/components/3d/DnaHelixCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#28D7FF]/30 border-t-[#28D7FF] rounded-full animate-spin" />
    </div>
  ),
});

interface OverviewContentProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function OverviewContent({ user }: OverviewContentProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [nucleotides, setNucleotides] = useState<NucleotideComposition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [enableDemoMode, setEnableDemoMode] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [statsData, analysisData, nucData] = await Promise.all([
          getDashboardStats(enableDemoMode),
          getRecentAnalyses(enableDemoMode),
          getNucleotideComposition(enableDemoMode),
        ]);
        setStats(statsData);
        setAnalyses(analysisData);
        setNucleotides(nucData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [enableDemoMode]);

  return (
    <div className="space-y-8">

      {/* A. Welcome Banner Section */}
      <div className="relative rounded-3xl glass-panel p-6 sm:p-8 border border-[#28D7FF]/25 shadow-2xl overflow-hidden">
        {/* Ambient gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#28D7FF]/15 via-[#8B5CF6]/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Analyst Session Active &bull; {user.email}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#28D7FF] to-[#C084FC]">{user.name}</span>
            </h1>

            <p className="text-xs sm:text-sm text-[#A7B1C8] leading-relaxed">
              Genomic Intelligence Dashboard &mdash; Explore genomic datasets, process sequence features, and investigate potential anomalies.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/dashboard/new-analysis"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#28D7FF] to-[#8B5CF6] hover:opacity-95 shadow-[0_0_25px_rgba(40,215,255,0.35)] transition-all cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Analysis</span>
            </Link>

            {/* Demo Data Toggle */}
            <button
              type="button"
              onClick={() => setEnableDemoMode(!enableDemoMode)}
              className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-mono border transition-all cursor-pointer ${
                enableDemoMode
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-white/5 border-white/10 text-[#A7B1C8] hover:text-white hover:bg-white/10'
              }`}
              title="Toggle synthetic reference preview metrics"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{enableDemoMode ? 'Demo Mode Active' : 'Enable Demo Preview'}</span>
            </button>
          </div>
        </div>

        {enableDemoMode && (
          <div className="mt-4 pt-3 border-t border-amber-500/20 text-xs text-amber-300/90 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Currently previewing synthetic reference data for layout demonstration. Real records will display once Phase 4 backend runs complete.</span>
          </div>
        )}
      </div>

      {/* B. Four Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Datasets"
          value={stats?.totalDatasets ?? null}
          subtitle={stats?.totalDatasets !== null ? `${stats?.totalDatasets} registered file(s)` : 'Awaiting dataset upload'}
          icon={Database}
          iconColor="text-[#28D7FF]"
          accentGradient="from-[#28D7FF]/25 to-transparent"
          isDemo={enableDemoMode}
        />

        <StatCard
          title="Analyses Completed"
          value={stats?.analysesCompleted ?? null}
          subtitle={stats?.analysesCompleted !== null ? 'Successful batch runs' : 'No pipelines executed yet'}
          icon={Activity}
          iconColor="text-[#8B5CF6]"
          accentGradient="from-[#8B5CF6]/25 to-transparent"
          isDemo={enableDemoMode}
        />

        <StatCard
          title="Anomalies Detected"
          value={stats?.anomaliesDetected ?? null}
          subtitle={stats?.anomaliesDetected !== null ? 'Outliers isolated' : 'Awaiting anomaly scan'}
          icon={ShieldAlert}
          iconColor="text-rose-400"
          accentGradient="from-rose-500/20 to-transparent"
          isDemo={enableDemoMode}
        />

        <StatCard
          title="Last Analysis"
          value={
            stats?.lastAnalysisDate
              ? new Date(stats.lastAnalysisDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })
              : null
          }
          subtitle={stats?.lastAnalysisDate ? 'Most recent execution' : 'Never run'}
          icon={Clock}
          iconColor="text-emerald-400"
          accentGradient="from-emerald-500/20 to-transparent"
          isDemo={enableDemoMode}
        />
      </div>

      {/* C. Genomic Visualization & 3D Double Helix Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left: Nucleotide Composition & GC Content Chart (8 cols) */}
        <div className="lg:col-span-8">
          <GenomicCharts
            data={nucleotides}
            onUploadClick={() => window.location.assign('/dashboard/new-analysis')}
          />
        </div>

        {/* Right: 3D DNA Double Helix Molecular Viewer (4 cols) */}
        <div className="lg:col-span-4 rounded-3xl glass-panel p-5 border border-[#8B5CF6]/25 space-y-4 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#C084FC] bg-[#C084FC]/10 px-2 py-0.5 rounded border border-[#C084FC]/30">
                Three.js / R3F Engine
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              3D Double Helix Visual
            </h3>
            <p className="text-xs text-[#A7B1C8]">
              Interactive WebGL molecular viewport with real-time base pair rendering.
            </p>
          </div>

          {/* DNA Canvas with controlled container height */}
          <div className="w-full h-64 relative flex items-center justify-center my-1 rounded-2xl bg-[#050816]/60 border border-white/5 overflow-hidden">
            <DnaHelixCanvas />
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-[#A7B1C8] leading-tight">
            Rotate with drag controls. Illustrates canonical Watson-Crick base pairing (A-T, G-C).
          </div>
        </div>

      </div>

      {/* D. Recent Analysis Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Recent Analyses
            </h2>
            <p className="text-xs text-[#A7B1C8]">
              Status and anomaly count of recently processed sequence datasets.
            </p>
          </div>

          <Link
            href="/dashboard/history"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#28D7FF] hover:underline"
          >
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <AnalysisTable
          records={analyses}
          isLoading={isLoading}
        />
      </div>

      {/* E. Getting Started Section */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-[#28D7FF]/20 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#28D7FF] bg-[#28D7FF]/10 px-2.5 py-0.5 rounded border border-[#28D7FF]/25">
              Guided Pipeline
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Getting Started with Anomaly Detection
            </h3>
            <p className="text-xs sm:text-sm text-[#A7B1C8]">
              Follow the 5-step distributed analysis workflow to identify genomic sequence variations.
            </p>
          </div>

          <Link
            href="/dashboard/new-analysis"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-[#28D7FF] to-[#8B5CF6] hover:opacity-95 shadow-md transition-all shrink-0 cursor-pointer"
          >
            <span>Start First Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 5 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-2">

          <div className="p-4 rounded-2xl bg-[#050816]/70 border border-[#28D7FF]/20 space-y-2 relative">
            <span className="w-6 h-6 rounded-lg bg-[#28D7FF]/20 text-[#28D7FF] font-mono text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h4 className="text-xs font-bold text-white">Upload Dataset</h4>
            <p className="text-[11px] text-[#A7B1C8] leading-relaxed">
              Import FASTA or CSV formatted nucleotide sequence data.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#050816]/70 border border-[#8B5CF6]/20 space-y-2 relative">
            <span className="w-6 h-6 rounded-lg bg-[#8B5CF6]/20 text-[#8B5CF6] font-mono text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h4 className="text-xs font-bold text-white">Validate Sequence</h4>
            <p className="text-[11px] text-[#A7B1C8] leading-relaxed">
              Verify base integrity (A, C, G, T, N) and client file structure.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#050816]/70 border border-[#C084FC]/20 space-y-2 relative">
            <span className="w-6 h-6 rounded-lg bg-[#C084FC]/20 text-[#C084FC] font-mono text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h4 className="text-xs font-bold text-white">Extract Features</h4>
            <p className="text-[11px] text-[#A7B1C8] leading-relaxed">
              Extract GC-content, k-mer frequencies, and sliding-window vectors.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#050816]/70 border border-emerald-500/20 space-y-2 relative">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">
              4
            </span>
            <h4 className="text-xs font-bold text-white">Run Detection</h4>
            <p className="text-[11px] text-[#A7B1C8] leading-relaxed">
              Execute Isolation Forest anomaly scoring across partitions.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#050816]/70 border border-amber-500/20 space-y-2 relative">
            <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-xs font-bold flex items-center justify-center">
              5
            </span>
            <h4 className="text-xs font-bold text-white">Review &amp; Export</h4>
            <p className="text-[11px] text-[#A7B1C8] leading-relaxed">
              Inspect detected outliers, export metrics, and cross-reference loci.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
