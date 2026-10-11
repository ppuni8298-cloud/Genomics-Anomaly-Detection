'use client';

import React, { useState } from 'react';
import { AnalysisVisualizationsData, WindowProfilePoint } from '@/lib/types/dashboard';
import {
  Activity,
  Layers,
  PieChart,
  BarChart2,
  TrendingUp,
  AlertTriangle,
  Info,
  Download,
  Dna,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface GenomicVisualizationsProps {
  data: AnalysisVisualizationsData | null;
  isLoading?: boolean;
  onDownloadReport?: () => void;
  onExportCsv?: () => void;
}

export default function GenomicVisualizations({
  data,
  isLoading = false,
  onDownloadReport,
  onExportCsv,
}: GenomicVisualizationsProps) {
  const [hoveredWindow, setHoveredWindow] = useState<WindowProfilePoint | null>(null);
  const [activeTab, setActiveTab] = useState<'anomaly-map' | 'gc-profile' | 'feature-comp'>('anomaly-map');

  if (isLoading) {
    return (
      <div className="rounded-3xl glass-panel p-8 border border-[#28D7FF]/20 flex flex-col items-center justify-center min-h-[350px] space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#28D7FF]/10 border border-[#28D7FF]/30 flex items-center justify-center text-[#28D7FF] animate-pulse">
          <Activity className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-mono text-[#A7B1C8]">Computing genomic window profiles &amp; feature matrices...</p>
      </div>
    );
  }

  if (!data || !data.windowsMap || data.windowsMap.length === 0) {
    return (
      <div className="rounded-3xl glass-panel p-8 border border-white/10 text-center flex flex-col items-center justify-center min-h-[250px] space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#A7B1C8]">
          <Layers className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-white">No Visualization Windows Available</h4>
        <p className="text-xs text-[#A7B1C8] max-w-md">
          Execute a genomic analysis run to generate interactive window anomaly maps, GC profiles, and feature comparisons.
        </p>
      </div>
    );
  }

  const { severityDistribution, windowsMap, featureComparison, scientificDisclaimer } = data;
  const totalWindows = data.totalWindows || windowsMap.length;
  const highCount = severityDistribution.high || 0;
  const medCount = severityDistribution.medium || 0;
  const lowCount = severityDistribution.low || 0;
  const normCount = severityDistribution.normal || Math.max(totalWindows - (highCount + medCount + lowCount), 0);

  // Donut chart calculation
  const totalSeverities = highCount + medCount + lowCount + normCount || 1;
  const donutSlices = [
    { label: 'High Severity', count: highCount, color: '#F43F5E', percent: (highCount / totalSeverities) * 100 },
    { label: 'Medium Severity', count: medCount, color: '#F59E0B', percent: (medCount / totalSeverities) * 100 },
    { label: 'Low Severity', count: lowCount, color: '#28D7FF', percent: (lowCount / totalSeverities) * 100 },
    { label: 'Normal Windows', count: normCount, color: '#10B981', percent: (normCount / totalSeverities) * 100 },
  ];

  // SVG Chart bounds
  const svgWidth = 800;
  const svgHeight = 260;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const minX = 0;
  const maxX = Math.max(windowsMap.length - 1, 1);

  return (
    <div className="space-y-6">

      {/* Top Bar: Overview Metrics & Actions */}
      <div className="rounded-3xl glass-panel p-6 border border-[#28D7FF]/20 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#28D7FF]" />
              <span>Interactive Genomic Analytics: {data.datasetName}</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#28D7FF]/10 text-[#28D7FF] border border-[#28D7FF]/30">
              {totalWindows.toLocaleString()} Windows Sampled
            </span>
          </div>
          <p className="text-xs text-[#A7B1C8] mt-1 max-w-2xl">
            Multi-dimensional sliding-window feature analysis using PySpark feature extraction and Scikit-learn Isolation Forest trees.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onDownloadReport && (
            <button
              onClick={onDownloadReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all cursor-pointer"
              title="Download comprehensive markdown analysis summary"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report (.md)</span>
            </button>
          )}

          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono border border-[#28D7FF]/30 bg-[#28D7FF]/10 text-[#28D7FF] hover:bg-[#28D7FF]/20 transition-all cursor-pointer"
              title="Export raw detected anomalies as RFC-4180 CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid: Donut Breakdown + Tabbed Detailed Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Card: Anomaly Severity Donut Distribution */}
        <div className="rounded-3xl glass-panel p-6 border border-[#28D7FF]/20 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#C084FC]" />
                <span>Severity Distribution</span>
              </h4>
              <span className="text-[11px] font-mono text-[#A7B1C8]">
                {((highCount + medCount + lowCount) / totalSeverities * 100).toFixed(1)}% flagged
              </span>
            </div>

            {/* Donut Graphic */}
            <div className="relative w-44 h-44 mx-auto my-4 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#1A234A"
                  strokeWidth="14"
                />
                {/* Donut Slices */}
                {(() => {
                  let accum = 0;
                  const circ = 2 * Math.PI * 38;
                  return donutSlices.map((slice, i) => {
                    if (slice.percent === 0) return null;
                    const strokeDasharray = `${(slice.percent / 100) * circ} ${circ}`;
                    const strokeDashoffset = -((accum / 100) * circ);
                    accum += slice.percent;
                    return (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth="14"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold font-mono text-white">
                  {highCount + medCount + lowCount}
                </span>
                <span className="text-[10px] uppercase font-mono text-[#A7B1C8]">
                  Outliers
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2 text-xs font-mono">
              {donutSlices.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-[#A7B1C8] text-[11px]">{s.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className="text-white font-bold">{s.count.toLocaleString()}</span>
                    <span className="text-[#A7B1C8]/60 text-[10px] w-12 text-right">({s.percent.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#28D7FF]/5 border border-[#28D7FF]/15 text-[11px] text-[#A7B1C8] leading-relaxed">
            <span className="text-white font-semibold block mb-0.5">Threshold Classification:</span>
            Scores &ge; 0.80 indicate extreme statistical variance; 0.65&ndash;0.79 denote moderate divergence.
          </div>
        </div>

        {/* Right 2 Columns: Main Interactive Visualizations (Anomaly Map / GC Profile / Feature Comp) */}
        <div className="lg:col-span-2 rounded-3xl glass-panel p-6 border border-[#28D7FF]/20 space-y-5 flex flex-col justify-between">

          <div>
            {/* Visualizer Mode Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('anomaly-map')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    activeTab === 'anomaly-map'
                      ? 'bg-[#28D7FF]/20 border border-[#28D7FF] text-[#28D7FF]'
                      : 'bg-white/5 text-[#A7B1C8] hover:text-white'
                  }`}
                >
                  Window Anomaly Map
                </button>
                <button
                  onClick={() => setActiveTab('gc-profile')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    activeTab === 'gc-profile'
                      ? 'bg-purple-500/20 border border-purple-500 text-purple-300'
                      : 'bg-white/5 text-[#A7B1C8] hover:text-white'
                  }`}
                >
                  GC Content Profile
                </button>
                <button
                  onClick={() => setActiveTab('feature-comp')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    activeTab === 'feature-comp'
                      ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
                      : 'bg-white/5 text-[#A7B1C8] hover:text-white'
                  }`}
                >
                  Feature Comparison
                </button>
              </div>

              {hoveredWindow && (
                <div className="text-[11px] font-mono text-[#28D7FF] bg-[#28D7FF]/10 px-2.5 py-1 rounded-lg border border-[#28D7FF]/30">
                  Locus: {hoveredWindow.positionLabel} | Score: {hoveredWindow.score.toFixed(3)}
                </div>
              )}
            </div>

            {/* TAB 1: Window Anomaly Map */}
            {activeTab === 'anomaly-map' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between text-xs text-[#A7B1C8]">
                  <span className="font-mono">X-Axis: Genomic Coordinate Window | Y-Axis: Isolation Outlier Score (0.0 - 1.0)</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> Outlier (&ge; 0.70)
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-[#28D7FF]/50" /> Normal (&lt; 0.70)
                    </span>
                  </div>
                </div>

                {/* SVG Chart */}
                <div className="w-full overflow-x-auto bg-[#050816]/70 rounded-2xl p-2 border border-white/5">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-auto select-none"
                    style={{ minWidth: '600px' }}
                  >
                    {/* Grid lines */}
                    {[0.0, 0.25, 0.5, 0.7, 0.8, 1.0].map((level, i) => {
                      const y = padding.top + plotHeight - level * plotHeight;
                      return (
                        <g key={i}>
                          <line
                            x1={padding.left}
                            y1={y}
                            x2={padding.left + plotWidth}
                            y2={y}
                            stroke={level === 0.7 ? '#F43F5E' : 'rgba(255,255,255,0.08)'}
                            strokeDasharray={level === 0.7 ? '4 3' : undefined}
                            strokeWidth="1"
                          />
                          <text
                            x={padding.left - 8}
                            y={y + 3}
                            textAnchor="end"
                            fill={level === 0.7 ? '#F43F5E' : '#A7B1C8'}
                            fontSize="9"
                            fontFamily="monospace"
                          >
                            {level.toFixed(2)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Threshold label */}
                    <text
                      x={padding.left + plotWidth - 10}
                      y={padding.top + plotHeight - 0.7 * plotHeight - 6}
                      textAnchor="end"
                      fill="#F43F5E"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      Threshold (0.70)
                    </text>

                    {/* Window Points */}
                    {windowsMap.map((win, idx) => {
                      const x = padding.left + (idx / maxX) * plotWidth;
                      const y = padding.top + plotHeight - win.score * plotHeight;
                      const isAnom = win.isAnomaly || win.score >= 0.7;
                      const pointColor = win.score >= 0.8 ? '#F43F5E' : win.score >= 0.65 ? '#F59E0B' : '#28D7FF';

                      return (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y}
                          r={isAnom ? 5 : 2.5}
                          fill={isAnom ? pointColor : 'rgba(40, 215, 255, 0.4)'}
                          stroke={isAnom ? '#FFFFFF' : 'transparent'}
                          strokeWidth={isAnom ? 1 : 0}
                          className="cursor-pointer transition-all hover:scale-150"
                          onMouseEnter={() => setHoveredWindow(win)}
                          onMouseLeave={() => setHoveredWindow(null)}
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>
            )}

            {/* TAB 2: GC Content Profile */}
            {activeTab === 'gc-profile' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between text-xs text-[#A7B1C8]">
                  <span className="font-mono">X-Axis: Genomic Coordinate Window | Y-Axis: Local GC Content (%)</span>
                  <span className="text-[11px] font-mono text-purple-300">
                    Mean Dataset GC: {(windowsMap.reduce((acc, w) => acc + w.gcContent, 0) / windowsMap.length).toFixed(1)}%
                  </span>
                </div>

                {/* SVG GC Curve */}
                <div className="w-full overflow-x-auto bg-[#050816]/70 rounded-2xl p-2 border border-white/5">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-auto select-none"
                    style={{ minWidth: '600px' }}
                  >
                    {/* Y-axis grid lines (0%, 25%, 50%, 75%, 100%) */}
                    {[0, 25, 50, 75, 100].map((val, i) => {
                      const y = padding.top + plotHeight - (val / 100) * plotHeight;
                      return (
                        <g key={i}>
                          <line
                            x1={padding.left}
                            y1={y}
                            x2={padding.left + plotWidth}
                            y2={y}
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="1"
                          />
                          <text
                            x={padding.left - 8}
                            y={y + 3}
                            textAnchor="end"
                            fill="#A7B1C8"
                            fontSize="9"
                            fontFamily="monospace"
                          >
                            {val}%
                          </text>
                        </g>
                      );
                    })}

                    {/* GC Polyline & Area */}
                    {(() => {
                      const points = windowsMap.map((win, idx) => {
                        const x = padding.left + (idx / maxX) * plotWidth;
                        const y = padding.top + plotHeight - (win.gcContent / 100) * plotHeight;
                        return `${x},${y}`;
                      });
                      const areaPoints = [
                        `${padding.left},${padding.top + plotHeight}`,
                        ...points,
                        `${padding.left + plotWidth},${padding.top + plotHeight}`
                      ].join(' ');

                      return (
                        <>
                          <defs>
                            <linearGradient id="gcGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <polygon points={areaPoints} fill="url(#gcGradient)" />
                          <polyline
                            points={points.join(' ')}
                            fill="none"
                            stroke="#8B5CF6"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </>
                      );
                    })()}

                    {/* Mark points */}
                    {windowsMap.map((win, idx) => {
                      const x = padding.left + (idx / maxX) * plotWidth;
                      const y = padding.top + plotHeight - (win.gcContent / 100) * plotHeight;
                      return (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y}
                          r={win.isAnomaly ? 4 : 2}
                          fill={win.isAnomaly ? '#F43F5E' : '#8B5CF6'}
                          className="cursor-pointer hover:scale-150 transition-all"
                          onMouseEnter={() => setHoveredWindow(win)}
                          onMouseLeave={() => setHoveredWindow(null)}
                        />
                      );
                    })}
                  </svg>
                </div>

                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-[#A7B1C8] leading-relaxed">
                  <span className="text-white font-semibold block mb-0.5">Biological Context Note:</span>
                  GC content varies naturally across genomic regions (e.g. isochores, CpG islands, promoter regions). Fluctuations reflect structural DNA composition and do not imply pathogenic mutations.
                </div>
              </div>
            )}

            {/* TAB 3: Feature Comparison */}
            {activeTab === 'feature-comp' && (
              <div className="space-y-4 pt-2">
                <div className="text-xs text-[#A7B1C8] font-mono">
                  Comparative summary of numerical features between Normal (inlier) and Flagged (outlier) genomic windows:
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* GC Content */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <span className="text-[10px] font-mono uppercase text-[#A7B1C8] block">GC Content</span>
                    <div className="text-xs font-mono space-y-1">
                      <div className="flex justify-between">
                        <span className="text-emerald-400">Normal:</span>
                        <span className="text-white font-bold">{featureComparison?.normal?.avgGcContent ?? 'N/A'}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-rose-400">Outlier:</span>
                        <span className="text-white font-bold">{featureComparison?.anomalous?.avgGcContent ?? 'N/A'}%</span>
                      </div>
                    </div>
                  </div>

                  {/* AT Content */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <span className="text-[10px] font-mono uppercase text-[#A7B1C8] block">AT Content</span>
                    <div className="text-xs font-mono space-y-1">
                      <div className="flex justify-between">
                        <span className="text-emerald-400">Normal:</span>
                        <span className="text-white font-bold">{featureComparison?.normal?.avgAtContent ?? 'N/A'}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-rose-400">Outlier:</span>
                        <span className="text-white font-bold">{featureComparison?.anomalous?.avgAtContent ?? 'N/A'}%</span>
                      </div>
                    </div>
                  </div>

                  {/* GC Skew */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <span className="text-[10px] font-mono uppercase text-[#A7B1C8] block">GC Skew (G-C)/(G+C)</span>
                    <div className="text-xs font-mono space-y-1">
                      <div className="flex justify-between">
                        <span className="text-emerald-400">Normal:</span>
                        <span className="text-white font-bold">{featureComparison?.normal?.avgGcSkew ?? 0.0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-rose-400">Outlier:</span>
                        <span className="text-white font-bold">{featureComparison?.anomalous?.avgGcSkew ?? 0.0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Homopolymer Repeat */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <span className="text-[10px] font-mono uppercase text-[#A7B1C8] block">Max Homopolymer Run</span>
                    <div className="text-xs font-mono space-y-1">
                      <div className="flex justify-between">
                        <span className="text-emerald-400">Normal:</span>
                        <span className="text-white font-bold">{featureComparison?.normal?.avgMaxHomopolymer ?? 4} bp</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-rose-400">Outlier:</span>
                        <span className="text-white font-bold">{featureComparison?.anomalous?.avgMaxHomopolymer ?? 6} bp</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[#A7B1C8] leading-relaxed">
                  <span className="text-white font-semibold block mb-0.5">Feature Differentiation:</span>
                  Isolation Forest partitions sequence loci with short tree path depths primarily when nucleotide skew or homopolymer repeats substantially deviate from background genomic density.
                </div>
              </div>
            )}
          </div>

          {/* Scientific Disclaimer Footer */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed text-[11px]">
              {scientificDisclaimer || "Notice: Detected sequence outliers represent statistical divergence under the unsupervised Isolation Forest model, not validated clinical mutations or pathologies."}
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
