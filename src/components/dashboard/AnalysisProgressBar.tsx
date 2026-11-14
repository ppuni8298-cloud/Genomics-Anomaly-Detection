'use client';

import React from 'react';
import Link from 'next/link';
import { useAnalysis } from '@/context/AnalysisContext';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';

export default function AnalysisProgressBar() {
  const { activeJob, dismissActiveJob, setInspectedRecord } = useAnalysis();

  if (!activeJob || activeJob.status === 'idle') {
    return null;
  }

  const isRunning = activeJob.status === 'running';
  const isCompleted = activeJob.status === 'completed';
  const isFailed = activeJob.status === 'failed';

  return (
    <div className="w-full transition-all duration-300">
      {isRunning && (
        <div className="rounded-2xl glass-panel p-4 sm:p-5 border border-[#28D7FF]/40 bg-gradient-to-r from-[#0B1026]/95 via-[#050816]/90 to-[#0B1026]/95 shadow-[0_0_25px_rgba(40,215,255,0.18)] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#28D7FF]/15 border border-[#28D7FF]/30 flex items-center justify-center text-[#28D7FF] shrink-0">
                <Activity className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#28D7FF] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#28D7FF] animate-ping" />
                    Distributed Spark Job In Progress
                  </span>
                  <span className="text-[10px] font-mono text-[#A7B1C8]/60 bg-white/5 px-2 py-0.5 rounded">
                    Elapsed: {activeJob.durationSeconds}s
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5">
                  {activeJob.name} <span className="text-xs font-mono text-[#A7B1C8] font-normal">({activeJob.datasetName})</span>
                </h4>
              </div>
            </div>

            <span className="text-[11px] font-mono text-[#A7B1C8] bg-[#050816] px-3 py-1.5 rounded-xl border border-white/10 self-start sm:self-auto">
              Active in background &bull; feel free to inspect datasets
            </span>
          </div>

          {/* Step description */}
          <p className="text-xs font-mono text-[#A7B1C8] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C084FC]" />
            <span>{activeJob.step}</span>
          </p>

          {/* Animated Progress Bar */}
          <div className="w-full bg-[#050816] rounded-full h-2 overflow-hidden border border-[#28D7FF]/20 relative">
            <div
              className="h-full bg-gradient-to-r from-[#28D7FF] via-[#8B5CF6] to-[#C084FC] transition-all duration-500 rounded-full"
              style={{ width: `${activeJob.progress}%` }}
            />
            <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="rounded-2xl glass-panel p-4 sm:p-5 border border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 via-[#0B1026]/90 to-emerald-500/5 shadow-[0_0_25px_rgba(16,185,129,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                  Analysis Pipeline Completed
                </span>
                <span className="text-[10px] font-mono text-[#A7B1C8]/60 bg-white/5 px-2 py-0.5 rounded">
                  Duration: {activeJob.durationSeconds}s
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {activeJob.name} — <span className="text-emerald-400">{activeJob.result?.anomaliesFound ?? 0} outliers detected</span>
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {activeJob.result && (
              <button
                type="button"
                onClick={() => setInspectedRecord(activeJob.result)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#28D7FF] to-[#8B5CF6] hover:opacity-95 shadow-md transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Inspect Results</span>
              </button>
            )}

            <button
              type="button"
              onClick={dismissActiveJob}
              className="p-2 rounded-xl text-[#A7B1C8] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Dismiss completion notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isFailed && (
        <div className="rounded-2xl glass-panel p-4 sm:p-5 border border-rose-500/40 bg-gradient-to-r from-rose-500/10 via-[#0B1026]/90 to-rose-500/5 shadow-[0_0_25px_rgba(244,63,94,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400">
                Pipeline Execution Stopped
              </span>
              <p className="text-xs text-rose-200 mt-0.5">
                {activeJob.error || 'Pipeline execution failed. Please verify the backend cluster and parameters.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={dismissActiveJob}
            className="p-2 rounded-xl text-[#A7B1C8] hover:text-white hover:bg-white/10 transition-colors cursor-pointer self-end sm:self-auto"
            aria-label="Dismiss error notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

