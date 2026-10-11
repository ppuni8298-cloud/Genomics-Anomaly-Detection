import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { AnalysisStatus, AnomalySeverity } from '@/lib/types/dashboard';

interface StatusBadgeProps {
  status?: AnalysisStatus;
  severity?: AnomalySeverity;
  label?: string;
  className?: string;
}

export default function StatusBadge({ status, severity, label, className = '' }: StatusBadgeProps) {
  if (severity) {
    switch (severity) {
      case 'high':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 ${className}`}
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>{label || 'High Severity'}</span>
          </span>
        );
      case 'medium':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 ${className}`}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{label || 'Medium Severity'}</span>
          </span>
        );
      case 'low':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#28D7FF]/15 text-[#28D7FF] border border-[#28D7FF]/30 ${className}`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{label || 'Low Severity'}</span>
          </span>
        );
    }
  }

  if (status) {
    switch (status) {
      case 'completed':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ${className}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{label || 'Completed'}</span>
          </span>
        );
      case 'running':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#28D7FF]/15 text-[#28D7FF] border border-[#28D7FF]/30 animate-pulse ${className}`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0 animate-spin" />
            <span>{label || 'Processing'}</span>
          </span>
        );
      case 'queued':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 ${className}`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{label || 'Queued'}</span>
          </span>
        );
      case 'failed':
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 ${className}`}
          >
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{label || 'Failed'}</span>
          </span>
        );
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono text-[#A7B1C8] bg-white/5 border border-white/10 ${className}`}
    >
      {label || 'Unknown'}
    </span>
  );
}
