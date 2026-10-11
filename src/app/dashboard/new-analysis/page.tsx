'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import FileUploadArea from '@/components/dashboard/FileUploadArea';
import { uploadDataset, submitAnalysis } from '@/lib/services/genomicsService';
import { AnalysisRecord } from '@/lib/types/dashboard';
import {
  Sparkles,
  Sliders,
  Cpu,
  Layers,
  AlertCircle,
  Play,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldAlert,
  Clock,
} from 'lucide-react';

export default function NewAnalysisPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisName, setAnalysisName] = useState('');
  const [windowSize, setWindowSize] = useState('500');
  const [windowStep, setWindowStep] = useState('250');
  const [kmerSize, setKmerSize] = useState('7');
  const [contaminationRate, setContaminationRate] = useState('0.05');
  const [randomSeed, setRandomSeed] = useState('42');
  const [formError, setFormError] = useState<string | null>(null);

  // Real execution state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [completedAnalysis, setCompletedAnalysis] = useState<AnalysisRecord | null>(null);

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setCompletedAnalysis(null);

    if (!selectedFile) {
      setFormError('Please select a valid FASTA or CSV sequence file before starting analysis.');
      return;
    }

    if (!analysisName.trim()) {
      setFormError('Please provide a descriptive name for this analysis run.');
      return;
    }

    const wSize = parseInt(windowSize, 10);
    const wStep = parseInt(windowStep, 10);
    const kSize = parseInt(kmerSize, 10);
    const cRate = parseFloat(contaminationRate);
    const rSeed = parseInt(randomSeed, 10);

    if (isNaN(wSize) || wSize < 100 || wSize > 10000) {
      setFormError('Window size must be an integer between 100 and 10,000 base pairs.');
      return;
    }

    if (isNaN(wStep) || wStep < 50 || wStep > 5000) {
      setFormError('Window step must be an integer between 50 and 5,000 base pairs.');
      return;
    }

    if (wStep > wSize) {
      setFormError('Window step cannot exceed window size (would skip genomic loci).');
      return;
    }

    if (isNaN(kSize) || kSize < 3 || kSize > 10) {
      setFormError('K-mer word size must be an integer between 3 and 10.');
      return;
    }

    if (isNaN(cRate) || cRate <= 0.0 || cRate > 0.5) {
      setFormError('Contamination rate must be between 0.1% (0.001) and 50% (0.50).');
      return;
    }

    if (isNaN(rSeed) || rSeed < 0 || rSeed > 1000000) {
      setFormError('Random seed must be a positive integer between 0 and 1,000,000.');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Upload dataset to backend
      setProcessingStep('1/3: Ingesting dataset and validating sequence integrity...');
      const ds = await uploadDataset(selectedFile, `Uploaded from console: ${analysisName}`);

      // Step 2: Submit PySpark feature extraction & anomaly detection
      setProcessingStep('2/3: Partitioning sequence & executing PySpark + Isolation Forest pipeline...');
      const result = await submitAnalysis({
        datasetId: ds.id,
        name: analysisName.trim(),
        windowSize: wSize,
        windowStep: wStep,
        kmerSize: kSize,
        contaminationRate: cRate,
        randomSeed: rSeed,
      });

      // Step 3: Finished
      setProcessingStep('3/3: Pipeline complete! Storing detected loci...');
      setCompletedAnalysis(result);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setFormError(err.message || 'Analysis pipeline execution failed. Ensure the FastAPI backend is running on port 8000.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">

      {/* Page Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono text-[#28D7FF] bg-[#28D7FF]/10 border border-[#28D7FF]/25">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Distributed Genomics Pipeline</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          New Genomic Analysis
        </h1>
        <p className="text-xs sm:text-sm text-[#A7B1C8] leading-relaxed">
          Upload a FASTA or CSV dataset, configure sequence sliding-window parameters, and execute an unsupervised anomaly detection job using Apache Spark and Isolation Forest.
        </p>
      </div>

      {/* Completion Notification Card */}
      {completedAnalysis && (
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-emerald-500/40 bg-emerald-500/5 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-emerald-400 tracking-wider font-semibold">
                Spark Execution Successful
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {completedAnalysis.name} Completed
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#050816]/70 border border-emerald-500/20 text-xs font-mono">
            <div>
              <span className="text-[#A7B1C8] block text-[10px]">ANOMALIES</span>
              <span className={`font-bold text-base ${completedAnalysis.anomaliesFound > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {completedAnalysis.anomaliesFound} loci
              </span>
            </div>
            <div>
              <span className="text-[#A7B1C8] block text-[10px]">DURATION</span>
              <span className="text-white text-base font-bold">{completedAnalysis.duration || '0.8s'}</span>
            </div>
            <div>
              <span className="text-[#A7B1C8] block text-[10px]">DATASET</span>
              <span className="text-[#28D7FF] truncate block">{completedAnalysis.datasetName}</span>
            </div>
            <div>
              <span className="text-[#A7B1C8] block text-[10px]">STATUS</span>
              <span className="text-emerald-400 font-bold uppercase">{completedAnalysis.status}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/dashboard/anomalies"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-rose-500 to-[#8B5CF6] hover:opacity-95 shadow-md transition-all cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Inspect Anomalies in Explorer</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-[#28D7FF] bg-[#28D7FF]/10 border border-[#28D7FF]/30 hover:bg-[#28D7FF]/20 transition-all cursor-pointer"
            >
              <span>View Dashboard Overview</span>
            </Link>

            <button
              onClick={() => {
                setCompletedAnalysis(null);
                setSelectedFile(null);
                setAnalysisName('');
              }}
              className="px-4 py-2.5 rounded-xl text-xs text-[#A7B1C8] hover:text-white transition-colors cursor-pointer"
            >
              Launch Another Run
            </button>
          </div>
        </div>
      )}

      {/* Main Analysis Form */}
      {!completedAnalysis && (
        <form onSubmit={handleStartAnalysis} className="space-y-6">

          {/* Step 1: Upload Dataset Panel */}
          <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-[#28D7FF]/20 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-[#28D7FF]/20 text-[#28D7FF] font-mono text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Select Genomic Dataset
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#A7B1C8]">
                Formats: .fasta, .fa, .fna, .csv (Max 50MB)
              </span>
            </div>

            <FileUploadArea
              selectedFile={selectedFile}
              onFileSelected={(file) => {
                setSelectedFile(file);
                setFormError(null);
                if (file && !analysisName) {
                  const baseName = file.name.replace(/\.[^/.]+$/, '');
                  setAnalysisName(`${baseName.toUpperCase()}_SPARK_SCAN`);
                }
              }}
            />
          </div>

          {/* Step 2: Job Identification */}
          <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-[#8B5CF6]/20 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-[#8B5CF6]/20 text-[#8B5CF6] font-mono text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Run Configuration
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#A7B1C8]">
                Metadata Tagging
              </span>
            </div>

            <div>
              <label
                htmlFor="analysis-name-input"
                className="block text-xs font-semibold text-[#A7B1C8] mb-1.5"
              >
                Analysis Job Identifier Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="analysis-name-input"
                type="text"
                required
                disabled={isProcessing}
                value={analysisName}
                onChange={(e) => {
                  setAnalysisName(e.target.value);
                  setFormError(null);
                }}
                placeholder="e.g. E_COLI_K12_SKEW_WINDOW_SWEEP"
                className="w-full bg-[#050816]/80 border border-[#1A234A] focus:border-[#28D7FF] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#A7B1C8]/40 focus:outline-none focus:ring-1 focus:ring-[#28D7FF] font-mono transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Step 3: Sequence Parameter Tuning */}
          <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-[#28D7FF]/20 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-[#28D7FF]/20 text-[#28D7FF] font-mono text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Model &amp; Feature Parameters
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#A7B1C8]">
                Isolation Forest Settings
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

              {/* Sliding Window Size */}
              <div className="space-y-1.5">
                <label htmlFor="window-size-select" className="block text-xs font-semibold text-[#A7B1C8]">
                  Sliding Window Size
                </label>
                <select
                  id="window-size-select"
                  value={windowSize}
                  disabled={isProcessing}
                  onChange={(e) => setWindowSize(e.target.value)}
                  className="w-full bg-[#050816]/80 border border-[#1A234A] focus:border-[#28D7FF] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#28D7FF] font-mono disabled:opacity-50"
                >
                  <option value="250">250 base pairs (High resolution)</option>
                  <option value="500">500 base pairs (Standard)</option>
                  <option value="1000">1,000 base pairs (Macro sweep)</option>
                  <option value="2500">2,500 base pairs (Large scale)</option>
                </select>
                <span className="text-[10px] text-[#A7B1C8]/60 block font-mono">
                  Loci segment length for GC skew and k-mer vectors (100–10,000 bp)
                </span>
              </div>

              {/* Window Step */}
              <div className="space-y-1.5">
                <label htmlFor="window-step-select" className="block text-xs font-semibold text-[#A7B1C8]">
                  Window Step (Stride)
                </label>
                <select
                  id="window-step-select"
                  value={windowStep}
                  disabled={isProcessing}
                  onChange={(e) => setWindowStep(e.target.value)}
                  className="w-full bg-[#050816]/80 border border-[#1A234A] focus:border-[#28D7FF] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#28D7FF] font-mono disabled:opacity-50"
                >
                  <option value="100">100 bp (Dense sliding overlap)</option>
                  <option value="250">250 bp (Standard 50% overlap)</option>
                  <option value="500">500 bp (Non-overlapping for 500bp)</option>
                  <option value="1000">1,000 bp (Fast sparse sweep)</option>
                </select>
                <span className="text-[10px] text-[#A7B1C8]/60 block font-mono">
                  Interval between consecutive window starts (50–5,000 bp, &le; window size)
                </span>
              </div>

              {/* K-mer Size */}
              <div className="space-y-1.5">
                <label htmlFor="kmer-size-select" className="block text-xs font-semibold text-[#A7B1C8]">
                  K-mer Word Length (k)
                </label>
                <select
                  id="kmer-size-select"
                  value={kmerSize}
                  disabled={isProcessing}
                  onChange={(e) => setKmerSize(e.target.value)}
                  className="w-full bg-[#050816]/80 border border-[#1A234A] focus:border-[#28D7FF] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#28D7FF] font-mono disabled:opacity-50"
                >
                  <option value="5">k = 5 (1,024 feature dimensions)</option>
                  <option value="6">k = 6 (4,096 feature dimensions)</option>
                  <option value="7">k = 7 (16,384 dimensions &mdash; Recommended)</option>
                  <option value="8">k = 8 (65,536 feature dimensions)</option>
                </select>
                <span className="text-[10px] text-[#A7B1C8]/60 block font-mono">
                  Sub-sequence frequency tokenization depth
                </span>
              </div>

              {/* Contamination Rate */}
              <div className="space-y-1.5">
                <label htmlFor="contamination-select" className="block text-xs font-semibold text-[#A7B1C8]">
                  Contamination Assumption
                </label>
                <select
                  id="contamination-select"
                  value={contaminationRate}
                  disabled={isProcessing}
                  onChange={(e) => setContaminationRate(e.target.value)}
                  className="w-full bg-[#050816]/80 border border-[#1A234A] focus:border-[#28D7FF] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#28D7FF] font-mono disabled:opacity-50"
                >
                  <option value="0.01">1% (Very conservative)</option>
                  <option value="0.03">3% (Strict filtering)</option>
                  <option value="0.05">5% (Balanced outlier sensitivity)</option>
                  <option value="0.10">10% (Broad exploration)</option>
                </select>
                <span className="text-[10px] text-[#A7B1C8]/60 block font-mono">
                  Expected proportion of outliers in sequence (0.1%–50%)
                </span>
              </div>

              {/* Random Seed */}
              <div className="space-y-1.5">
                <label htmlFor="random-seed-input" className="block text-xs font-semibold text-[#A7B1C8]">
                  Pseudo-Random Seed
                </label>
                <input
                  id="random-seed-input"
                  type="number"
                  min="0"
                  max="999999"
                  value={randomSeed}
                  disabled={isProcessing}
                  onChange={(e) => setRandomSeed(e.target.value)}
                  className="w-full bg-[#050816]/80 border border-[#1A234A] focus:border-[#28D7FF] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#28D7FF] font-mono disabled:opacity-50"
                  placeholder="42"
                />
                <span className="text-[10px] text-[#A7B1C8]/60 block font-mono">
                  Deterministic seed for reproducible Isolation Forest trees (0–999,999)
                </span>
              </div>

            </div>

            {/* Spark Cluster Preview Info Box */}
            <div className="p-4 rounded-2xl bg-[#050816]/60 border border-[#28D7FF]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#28D7FF]/10 border border-[#28D7FF]/30 flex items-center justify-center text-[#28D7FF] shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-white block">Execution Cluster Architecture</span>
                  <span className="text-[#A7B1C8] text-[11px]">
                    PySpark Resilient Distributed Dataset (RDD) sequence partitioning
                  </span>
                </div>
              </div>
              <span className="font-mono text-[11px] text-[#28D7FF] bg-[#28D7FF]/10 px-2.5 py-1 rounded-lg border border-[#28D7FF]/25 self-start sm:self-center">
                Apache Spark &bull; Isolation Forest
              </span>
            </div>

          </div>

          {/* Live Progress Banner */}
          {isProcessing && (
            <div className="p-4 rounded-2xl bg-[#28D7FF]/10 border border-[#28D7FF]/30 flex items-center gap-3 text-xs text-[#28D7FF] font-mono animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              <span>{processingStep}</span>
            </div>
          )}

          {/* Error Feedback */}
          {formError && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-xs text-[#A7B1C8]">
              Dispatches job to local FastAPI backend with PySpark worker nodes.
            </p>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#28D7FF] to-[#8B5CF6] hover:opacity-95 shadow-[0_0_25px_rgba(40,215,255,0.4)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing with Spark...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Execute Analysis</span>
                </>
              )}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
