'use client';

import React, { useState } from 'react';
import { NucleotideComposition } from '@/lib/types/dashboard';
import { SYNTHETIC_DEMO_NUCLEOTIDES } from '@/lib/services/genomicsService';
import { BarChart3, PieChart, Sparkles, Database, Info } from 'lucide-react';

interface GenomicChartsProps {
  data: NucleotideComposition | null;
  onUploadClick?: () => void;
}

export default function GenomicCharts({ data, onUploadClick }: GenomicChartsProps) {
  // Allow toggling synthetic reference sample to inspect chart visualization
  const [showDemoReference, setShowDemoReference] = useState(false);
  const [activeBase, setActiveBase] = useState<string | null>(null);

  const activeData: NucleotideComposition | null = showDemoReference
    ? SYNTHETIC_DEMO_NUCLEOTIDES
    : data;

  if (!activeData) {
    return (
      <div className="rounded-3xl glass-panel p-8 sm:p-10 border border-[#28D7FF]/20 text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#28D7FF]/10 border border-[#28D7FF]/30 flex items-center justify-center text-[#28D7FF] shadow-[0_0_20px_rgba(40,215,255,0.2)]">
          <BarChart3 className="w-7 h-7" />
        </div>

        <div className="space-y-1.5 max-w-md">
          <h3 className="text-lg font-bold text-white tracking-tight">
            Nucleotide Composition &amp; GC Analysis
          </h3>
          <p className="text-xs sm:text-sm text-[#A7B1C8] leading-relaxed">
            Upload a genomic dataset to visualize nucleotide composition (A, T, G, C) and sequence GC-content distribution.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onUploadClick ? (
            <button
              onClick={onUploadClick}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#28D7FF] to-[#8B5CF6] hover:opacity-95 shadow-md transition-all cursor-pointer"
            >
              Upload Dataset
            </button>
          ) : null}

          <button
            onClick={() => setShowDemoReference(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-[#28D7FF] bg-[#28D7FF]/10 border border-[#28D7FF]/30 hover:bg-[#28D7FF]/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preview with Synthetic Reference Sample</span>
          </button>
        </div>
      </div>
    );
  }

  // Calculate angles for Donut Chart
  const bases = [
    { key: 'A', name: 'Adenine (A)', percent: activeData.adenine, color: '#28D7FF', pair: 'Thymine' },
    { key: 'T', name: 'Thymine (T)', percent: activeData.thymine, color: '#8B5CF6', pair: 'Adenine' },
    { key: 'G', name: 'Guanine (G)', percent: activeData.guanine, color: '#10B981', pair: 'Cytosine' },
    { key: 'C', name: 'Cytosine (C)', percent: activeData.cytosine, color: '#F59E0B', pair: 'Guanine' },
  ];

  // SVG Donut calculation
  const radius = 70;
  const strokeWidth = 24;
  const center = 100;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-[#28D7FF]/20 space-y-6">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Genomic Nucleotide Profile &amp; GC-Content
            </h3>
            {showDemoReference && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Synthetic Preview
              </span>
            )}
          </div>
          <p className="text-xs text-[#A7B1C8] mt-0.5">
            Base-pair frequencies and GC-ratio distribution metrics across the sequence.
          </p>
        </div>

        {showDemoReference && (
          <button
            onClick={() => setShowDemoReference(false)}
            className="text-xs text-[#A7B1C8] hover:text-white underline font-mono cursor-pointer"
          >
            Clear Demo Preview
          </button>
        )}
      </div>

      {showDemoReference && (
        <div className="p-3 rounded-xl bg-[#28D7FF]/10 border border-[#28D7FF]/30 text-xs text-[#28D7FF] flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>
            Viewing synthetic E. coli reference metrics for layout verification. Real metrics will load once an active dataset is processed.
          </span>
        </div>
      )}

      {/* Main Visual Panels: Donut + GC Content Meter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

        {/* Left: Responsive Donut Chart (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-56 h-56 flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
              {/* Background ring */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth={strokeWidth}
              />

              {/* Segments */}
              {bases.map((base) => {
                const strokeDasharray = `${(base.percent / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                accumulatedPercent += base.percent;

                const isHovered = activeBase === base.key;

                return (
                  <circle
                    key={base.key}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={base.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="butt"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setActiveBase(base.key)}
                    onMouseLeave={() => setActiveBase(null)}
                  />
                );
              })}
            </svg>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[11px] font-mono text-[#A7B1C8] uppercase tracking-wider">
                {activeBase ? `Base ${activeBase}` : 'Total Composition'}
              </span>
              <span className="text-2xl font-extrabold text-white">
                {activeBase
                  ? `${bases.find((b) => b.key === activeBase)?.percent}%`
                  : '100%'}
              </span>
              <span className="text-[10px] font-mono text-[#28D7FF]">
                {activeBase
                  ? `Pairs with ${bases.find((b) => b.key === activeBase)?.pair}`
                  : '4 Nucleotides'}
              </span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="grid grid-cols-2 gap-3 mt-4 w-full max-w-xs">
            {bases.map((b) => (
              <div
                key={b.key}
                onMouseEnter={() => setActiveBase(b.key)}
                onMouseLeave={() => setActiveBase(null)}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                  activeBase === b.key ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: b.color }}
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white leading-tight">
                    {b.name}
                  </span>
                  <span className="text-[11px] font-mono text-[#A7B1C8]">
                    {b.percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: GC Content Meter & Bar Distribution (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* GC-Content Key Metric Box */}
          <div className="p-5 rounded-2xl bg-[#050816]/70 border border-[#28D7FF]/25 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-[#A7B1C8] block">
                  GC Content Ratio (Guanine + Cytosine)
                </span>
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] via-[#28D7FF] to-[#8B5CF6]">
                  {activeData.gcContent}%
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                Typical Mesophilic Range
              </span>
            </div>

            {/* Linear Progress / Gauge */}
            <div className="space-y-1.5">
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-[#10B981] to-[#28D7FF] transition-all duration-500"
                  style={{ width: `${activeData.gcContent}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#C084FC] opacity-40 transition-all duration-500"
                  style={{ width: `${100 - activeData.gcContent}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-[#A7B1C8]">
                <span>0% GC (AT-rich)</span>
                <span>Reference Mean: 50%</span>
                <span>100% GC (GC-rich)</span>
              </div>
            </div>

            <p className="text-xs text-[#A7B1C8] leading-relaxed pt-1">
              Genomic regions exhibiting sudden variance in GC-content skew are primary candidates for horizontal gene transfers, island insertions, and structural anomalies.
            </p>
          </div>

          {/* Individual Base Distribution Bars */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Base Proportion Breakdown
            </h4>

            {bases.map((base) => (
              <div key={base.key} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-white flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: base.color }}
                    />
                    {base.name}
                  </span>
                  <span className="font-mono text-[#A7B1C8]">{base.percent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${base.percent * 2.5}%`,
                      backgroundColor: base.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
