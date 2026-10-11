'use client';

import React from 'react';
import Link from 'next/link';
import { Dna, ShieldAlert, ExternalLink, Terminal, GitBranch } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative bg-[#0B1026]/90 border-t border-[#28D7FF]/15 text-[#A7B1C8] pt-16 pb-12 overflow-hidden">
      {/* Subtle glow accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#28D7FF]/40 to-transparent" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#8B5CF6]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#1A234A]">
          {/* Brand & Project Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#28D7FF]/20 to-[#8B5CF6]/30 p-2 flex items-center justify-center border border-[#28D7FF]/30">
                <Dna className="w-5 h-5 text-[#28D7FF]" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Genome<span className="text-[#28D7FF]">AI</span>
              </span>
            </div>

            <p className="text-xs font-mono text-[#28D7FF] uppercase tracking-wider">
              Big Data College Mini-Project &bull; Phase 1
            </p>

            <h3 className="text-base font-semibold text-[#F8FAFC]">
              Genomics Anomaly Detection Using Apache Spark
            </h3>

            <p className="text-sm text-[#A7B1C8] leading-relaxed max-w-md">
              A high-performance big data architecture leveraging Apache Spark, PySpark, and machine learning to analyze large-scale genomic nucleotide sequences and detect atypical patterns.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[#F8FAFC] uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-[#28D7FF] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <a href="#about" className="hover:text-[#28D7FF] transition-colors">
                  About Spark & Genomics
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#28D7FF] transition-colors">
                  Core Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#28D7FF] transition-colors">
                  Processing Workflow
                </a>
              </li>
              <li>
                <a href="#tech-stack" className="hover:text-[#28D7FF] transition-colors">
                  Project Technology Stack
                </a>
              </li>
            </ul>
          </div>

          {/* Platform Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[#F8FAFC] uppercase tracking-wider">
              Platform
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/login" className="hover:text-[#28D7FF] transition-colors">
                  Sign In (Phase 1 Preview)
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-[#28D7FF] transition-colors">
                  Create Account (Phase 1 Preview)
                </Link>
              </li>
              <li className="pt-2 text-xs text-[#A7B1C8]/70 flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Frontend: Next.js App Router
              </li>
              <li className="text-xs text-[#A7B1C8]/70 flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-[#28D7FF]" />
                Engine: Apache Spark / PySpark
              </li>
            </ul>
          </div>
        </div>

        {/* Medical and Clinical Disclaimer Requirement */}
        <div className="mt-8 p-4 rounded-xl bg-[#050816]/70 border border-[#8B5CF6]/20 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs text-[#A7B1C8]">
          <ShieldAlert className="w-5 h-5 text-[#C084FC] shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-relaxed">
            <span className="font-semibold text-[#F8FAFC]">Medical Disclaimer:</span> Statistical anomalies identified by this software represent algorithmic variance in genomic sequence data for research and computational education. They do not constitute a medical diagnosis, clinical prognosis, or clinical guidance.
          </p>
        </div>

        {/* Copyright and Metadata */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#A7B1C8]/70 gap-4">
          <p>
            &copy; 2026 GenomeAI &bull; Big Data Genomics Anomaly Detection Mini-Project
          </p>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>Apache Spark 3.x</span>
            <span>&bull;</span>
            <span>PySpark</span>
            <span>&bull;</span>
            <span>Isolation Forest</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
