'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AnalysisRecord, DatasetItem } from '@/lib/types/dashboard';
import { uploadDataset, submitAnalysis } from '@/lib/services/genomicsService';

export interface AnalysisJob {
  id: string;
  name: string;
  datasetId: string;
  datasetName: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  step: string;
  progress: number;
  durationSeconds: number;
  result: AnalysisRecord | null;
  error: string | null;
  startedAt: number;
}

interface StartAnalysisParams {
  file?: File | null;
  datasetId?: string;
  datasetName?: string;
  name: string;
  windowSize?: number;
  windowStep?: number;
  kmerSize?: number;
  contaminationRate?: number;
  randomSeed?: number;
}

interface AnalysisContextType {
  activeJob: AnalysisJob | null;
  startAnalysis: (params: StartAnalysisParams) => Promise<AnalysisRecord>;
  dismissActiveJob: () => void;
  inspectedRecord: AnalysisRecord | null;
  setInspectedRecord: (rec: AnalysisRecord | null) => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [activeJob, setActiveJob] = useState<AnalysisJob | null>(null);
  const [inspectedRecord, setInspectedRecord] = useState<AnalysisRecord | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Restore active job from sessionStorage if present
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('genome_active_job');
      if (stored) {
        const parsed: AnalysisJob = JSON.parse(stored);
        if (parsed.status === 'running') {
          // If it was stored as running, keep it or mark completed if enough time passed
          setActiveJob(parsed);
        } else if (parsed.status === 'completed') {
          setActiveJob(parsed);
        }
      }
    } catch {}
  }, []);

  // Update sessionStorage whenever activeJob changes
  useEffect(() => {
    try {
      if (activeJob) {
        sessionStorage.setItem('genome_active_job', JSON.stringify(activeJob));
      } else {
        sessionStorage.removeItem('genome_active_job');
      }
    } catch {}
  }, [activeJob]);

  // Timer tick for running job
  useEffect(() => {
    if (activeJob?.status === 'running') {
      timerRef.current = setInterval(() => {
        setActiveJob((prev) => {
          if (!prev || prev.status !== 'running') return prev;
          const elapsed = Math.floor((Date.now() - prev.startedAt) / 1000);
          return { ...prev, durationSeconds: elapsed };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeJob?.status]);

  const startAnalysis = async (params: StartAnalysisParams): Promise<AnalysisRecord> => {
    const jobStartTime = Date.now();
    const jobId = `job-${Math.random().toString(36).substring(2, 9)}`;
    const jobName = params.name.trim();

    const initialJob: AnalysisJob = {
      id: jobId,
      name: jobName,
      datasetId: params.datasetId || '',
      datasetName: params.datasetName || params.file?.name || 'Dataset Sequence',
      status: 'running',
      step: 'Step 1/3: Ingesting dataset and validating sequence integrity...',
      progress: 25,
      durationSeconds: 0,
      result: null,
      error: null,
      startedAt: jobStartTime,
    };

    setActiveJob(initialJob);

    try {
      let dsId = params.datasetId;
      let dsName = params.datasetName;

      // Step 1: Upload dataset if file provided
      if (params.file) {
        const ds = await uploadDataset(params.file, `Uploaded from console: ${jobName}`);
        dsId = ds.id;
        dsName = ds.name;
        setActiveJob((prev) =>
          prev
            ? {
                ...prev,
                datasetId: ds.id,
                datasetName: ds.name,
                step: 'Step 2/3: Partitioning sequence & executing PySpark + Isolation Forest pipeline...',
                progress: 60,
              }
            : null
        );
      } else {
        setActiveJob((prev) =>
          prev
            ? {
                ...prev,
                step: 'Step 2/3: Partitioning sequence & executing PySpark + Isolation Forest pipeline...',
                progress: 60,
              }
            : null
        );
      }

      if (!dsId) {
        throw new Error('No dataset identifier available for analysis.');
      }

      // Step 2: Submit PySpark pipeline
      const wSize = params.windowSize ?? 500;
      const wStep = params.windowStep ?? Math.max(Math.floor(wSize / 2), 50);
      const kSize = params.kmerSize ?? 7;
      const cRate = params.contaminationRate ?? 0.05;
      const rSeed = params.randomSeed ?? 42;

      const record = await submitAnalysis({
        datasetId: dsId,
        name: jobName,
        windowSize: wSize,
        windowStep: wStep,
        kmerSize: kSize,
        contaminationRate: cRate,
        randomSeed: rSeed,
      });

      // Step 3: Finished
      const completedJob: AnalysisJob = {
        ...initialJob,
        datasetId: dsId,
        datasetName: dsName || record.datasetName || 'Dataset Sequence',
        status: 'completed',
        step: 'Step 3/3: Pipeline complete! All genomic loci indexed.',
        progress: 100,
        result: record,
        durationSeconds: Math.floor((Date.now() - jobStartTime) / 1000),
      };

      setActiveJob(completedJob);
      return record;
    } catch (err: any) {
      console.error('Background analysis error:', err);
      const errorMsg = err.message || 'Analysis pipeline execution failed.';
      setActiveJob((prev) =>
        prev
          ? {
              ...prev,
              status: 'failed',
              error: errorMsg,
              step: 'Pipeline execution halted due to an error.',
            }
          : null
      );
      throw err;
    }
  };

  const dismissActiveJob = () => {
    setActiveJob(null);
  };

  return (
    <AnalysisContext.Provider
      value={{
        activeJob,
        startAnalysis,
        dismissActiveJob,
        inspectedRecord,
        setInspectedRecord,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}

