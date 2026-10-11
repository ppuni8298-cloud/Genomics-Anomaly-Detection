import React from 'react';
import { Dna, AlertTriangle, Cpu, Layers, Sparkles, BookOpen } from 'lucide-react';

export default function AboutSection() {
  return (
    <section id="about" className="relative py-24 bg-[#050816] overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-[#28D7FF]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-[#8B5CF6]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono text-[#8B5CF6] bg-[#0B1026] border border-[#8B5CF6]/30">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Academic & Technical Context</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F8FAFC]">
            Understanding Genomics & Big Data Analytics
          </h2>
          <p className="text-base text-[#A7B1C8] leading-relaxed">
            A clear explanation of biological sequences, the importance of anomaly detection, and why Apache Spark provides the computational backbone for massive genomic pipelines.
          </p>
        </div>

        {/* 3 Core Conceptual Explanations */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Concept 1: What genomic sequences are */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#28D7FF]/20 to-[#28D7FF]/5 border border-[#28D7FF]/30 flex items-center justify-center text-[#28D7FF]">
                <Dna className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F8FAFC]">
                What Are Genomic Sequences?
              </h3>
              <p className="text-sm text-[#A7B1C8] leading-relaxed">
                Genomic sequences are the fundamental biological blueprints of life, composed of long chains of four chemical nucleotide bases: <span className="text-[#28D7FF] font-semibold">Adenine (A)</span>, <span className="text-[#28D7FF] font-semibold">Cytosine (C)</span>, <span className="text-[#8B5CF6] font-semibold">Guanine (G)</span>, and <span className="text-[#C084FC] font-semibold">Thymine (T)</span>. In digital bioinformatics, these are encoded as strings representing millions or billions of base pairs across genes and chromosomes.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#1A234A] flex items-center gap-2 text-xs font-mono text-[#28D7FF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#28D7FF]" />
              FASTA / FASTQ sequence models
            </div>
          </div>

          {/* Concept 2: Why unusual patterns matter */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#8B5CF6]/20 to-[#8B5CF6]/5 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6]">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F8FAFC]">
                Why Anomalies Are Worth Investigating
              </h3>
              <p className="text-sm text-[#A7B1C8] leading-relaxed">
                Unusual sequence patterns highlight structural variations, rare genetic mutations, sequencing read errors, abnormal GC content spikes, or unique biological markers. Identifying statistical outliers helps researchers flag critical sequence segments without manually scanning millions of nucleotide records.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#1A234A] flex items-center gap-2 text-xs font-mono text-[#8B5CF6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
              Unsupervised anomaly identification
            </div>
          </div>

          {/* Concept 3: Why Apache Spark is needed */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#C084FC]/20 to-[#C084FC]/5 border border-[#C084FC]/30 flex items-center justify-center text-[#C084FC]">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F8FAFC]">
                Why Apache Spark for Big Data?
              </h3>
              <p className="text-sm text-[#A7B1C8] leading-relaxed">
                A single human genome contains ~3 billion base pairs, and population datasets span hundreds of gigabytes. Traditional single-core Python scripts choke on this volume. Apache Spark distributes genomic datasets across memory partitions and cluster workers, enabling high-throughput parallel transformations and feature extraction in seconds.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#1A234A] flex items-center gap-2 text-xs font-mono text-[#C084FC]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C084FC]" />
              Parallel PySpark in-memory RDDs
            </div>
          </div>

        </div>

        {/* Informative summary card for college presentation */}
        <div className="mt-12 p-6 rounded-2xl bg-[#0B1026]/70 border border-[#28D7FF]/20 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#28D7FF]/10 text-[#28D7FF] shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-[#F8FAFC]">
                College Project Mini-Thesis
              </h4>
              <p className="text-xs sm:text-sm text-[#A7B1C8] mt-0.5">
                Combining distributed cluster computing (Apache Spark) with unsupervised machine learning (Isolation Forest) to solve bioinformatics bottlenecks.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-lg bg-[#050816] border border-[#28D7FF]/30 text-[#28D7FF]">
              Partitioned Datasets
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-[#050816] border border-[#8B5CF6]/30 text-[#C084FC]">
              Scalable Pipeline
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
