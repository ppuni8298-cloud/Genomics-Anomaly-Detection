'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, Sparkles, Activity, ShieldCheck, AlertCircle, Database, ChevronDown } from 'lucide-react';

// Dynamic import with SSR false for Three.js client canvas
const DnaHelixCanvas = dynamic(() => import('../3d/DnaHelixCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] sm:h-[450px] lg:h-[540px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full border-2 border-[#28D7FF]/30 border-t-[#28D7FF] animate-spin" />
        <span className="text-xs font-mono text-[#A7B1C8]">Initializing 3D Molecular Engine...</span>
      </div>
    </div>
  ),
});

export default function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-5rem)] pt-24 pb-12 lg:pt-28 lg:pb-16 flex items-center overflow-hidden">
      {/* Background radial gradients & glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] lg:w-[900px] lg:h-[900px] bg-gradient-to-br from-[#28D7FF]/10 via-[#8B5CF6]/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-12 left-10 w-72 h-72 bg-[#28D7FF]/5 rounded-full blur-2xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Floating decorative nucleotide badges: A, T, G, C */}
      <div className="absolute top-24 right-1/3 hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold text-[#28D7FF] bg-[#0B1026]/80 border border-[#28D7FF]/30 backdrop-blur-md shadow-[0_0_15px_rgba(40,215,255,0.2)] animate-pulse">
        <span className="w-2 h-2 rounded-full bg-[#28D7FF]" />
        Nucleotide: Adenine (A)
      </div>

      <div className="absolute top-44 right-12 hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold text-[#C084FC] bg-[#0B1026]/80 border border-[#C084FC]/30 backdrop-blur-md shadow-[0_0_15px_rgba(192,132,252,0.2)]">
        <span className="w-2 h-2 rounded-full bg-[#C084FC]" />
        Nucleotide: Thymine (T)
      </div>

      <div className="absolute bottom-24 left-1/3 hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold text-[#8B5CF6] bg-[#0B1026]/80 border border-[#8B5CF6]/30 backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
        Base: Guanine (G)
      </div>

      <div className="absolute bottom-36 right-1/4 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold text-[#28D7FF] bg-[#0B1026]/80 border border-[#28D7FF]/30 backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-[#28D7FF]" />
        Base: Cytosine (C)
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left Column: Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Category tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wide text-[#28D7FF] bg-[#0B1026] border border-[#28D7FF]/30 shadow-[0_0_12px_rgba(40,215,255,0.15)]">
              <Database className="w-3.5 h-3.5 text-[#28D7FF]" />
              <span>Big Data Analytics &bull; Distributed PySpark</span>
            </div>

            {/* Official Project Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#F8FAFC] leading-[1.12]">
              Genomics Anomaly Detection Using{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#28D7FF] via-[#C084FC] to-[#8B5CF6]">
                Apache Spark
              </span>
            </h1>

            {/* Exact Required Supporting Description */}
            <p className="text-base sm:text-lg text-[#A7B1C8] leading-relaxed max-w-2xl">
              Explore genomic data at scale. Use distributed processing and machine learning to identify unusual sequence patterns and gain meaningful analytical insights.
            </p>

            {/* Primary Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#28D7FF] to-[#8B5CF6] hover:opacity-95 shadow-[0_0_25px_rgba(40,215,255,0.35)] hover:shadow-[0_0_35px_rgba(139,92,246,0.6)] transition-all transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#28D7FF]"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-[#F8FAFC] bg-[#0B1026] border border-[#28D7FF]/25 hover:border-[#28D7FF]/60 hover:bg-[#111838] transition-all transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#28D7FF]"
              >
                <span>Explore Features</span>
              </a>
            </div>

            {/* Sample Analysis-Status Visual (Sample preview, NO fabricated statistics) */}
            <div className="pt-4">
              <div className="p-4 rounded-2xl bg-[#0B1026]/90 border border-[#28D7FF]/20 shadow-xl backdrop-blur-md max-w-xl">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1A234A]">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#28D7FF]" />
                    <span className="text-xs font-semibold text-[#F8FAFC]">
                      Sample Sequence Analysis Preview
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#A7B1C8] px-2 py-0.5 rounded bg-[#050816] border border-[#1A234A]">
                    Simulated Status
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {/* Normal Status */}
                  <div className="p-2.5 rounded-xl bg-[#050816]/80 border border-emerald-500/20 flex flex-col items-start gap-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Normal</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#A7B1C8]">
                      Standard GC %
                    </span>
                    <span className="text-[10px] text-[#A7B1C8]/70">
                      Expected baseline
                    </span>
                  </div>

                  {/* Flagged Status */}
                  <div className="p-2.5 rounded-xl bg-[#050816]/80 border border-amber-500/30 flex flex-col items-start gap-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Flagged</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#A7B1C8]">
                      Atypical Score
                    </span>
                    <span className="text-[10px] text-[#A7B1C8]/70">
                      Outlier detected
                    </span>
                  </div>

                  {/* Processing Status */}
                  <div className="p-2.5 rounded-xl bg-[#050816]/80 border border-[#28D7FF]/30 flex flex-col items-start gap-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-[#28D7FF]">
                      <span className="w-2 h-2 rounded-full bg-[#28D7FF] animate-ping" />
                      <span>Processing</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#A7B1C8]">
                      PySpark Job
                    </span>
                    <span className="text-[10px] text-[#A7B1C8]/70">
                      RDD partition
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: 3D DNA Double Helix */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-lg lg:max-w-none">
              <DnaHelixCanvas />
            </div>
          </div>

        </div>
      </div>

      {/* Down arrow scroll helper */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-1 text-[#A7B1C8]/60 text-xs">
        <a
          href="#about"
          className="flex flex-col items-center hover:text-[#28D7FF] transition-colors focus:outline-none"
          aria-label="Scroll to About section"
        >
          <span className="font-mono text-[11px]">Learn More</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </a>
      </div>
    </section>
  );
}
