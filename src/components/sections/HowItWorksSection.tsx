import React from 'react';
import { UploadCloud, Cpu, BrainCircuit, LayoutDashboard, ArrowRight } from 'lucide-react';

const steps = [
  {
    step: '01',
    title: 'Upload Genomic Data',
    subtitle: 'FASTA / CSV Ingestion',
    description:
      'Input nucleotide sequences from bioinformatics repositories or experimental runs. Sequences are validated and prepared for distributed streaming.',
    icon: UploadCloud,
    accent: '#28D7FF',
  },
  {
    step: '02',
    title: 'Process Data with Apache Spark',
    subtitle: 'PySpark Parallel Execution',
    description:
      'Apache Spark partitions the dataset across cluster workers to perform concurrent GC-content calculation, nucleotide frequency counting, and feature vectorization.',
    icon: Cpu,
    accent: '#8B5CF6',
  },
  {
    step: '03',
    title: 'Detect Unusual Patterns',
    subtitle: 'Isolation Forest ML',
    description:
      'Unsupervised machine learning constructs isolation trees to score sequence anomalies based on multi-feature deviance and statistical outliers.',
    icon: BrainCircuit,
    accent: '#C084FC',
  },
  {
    step: '04',
    title: 'Explore Results in Dashboard',
    subtitle: 'Visual Analytics & Records',
    description:
      'Interactive frontend displays sequence health distributions, flags atypical segments, and provides detailed inspection records with export options.',
    icon: LayoutDashboard,
    accent: '#28D7FF',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-24 bg-[#050816] overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-[#28D7FF]/5 via-[#8B5CF6]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono text-[#C084FC] bg-[#0B1026] border border-[#C084FC]/30">
            <span>Execution Lifecycle</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F8FAFC]">
            How It Works
          </h2>
          <p className="text-base text-[#A7B1C8] leading-relaxed">
            A seamless four-stage distributed pipeline transforming raw DNA nucleotide sequences into actionable biological anomaly insights.
          </p>
        </div>

        {/* 4-Step Visual Workflow */}
        <div className="mt-20 relative">

          {/* Connecting Line for Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-0.5 -translate-y-6 bg-gradient-to-r from-[#28D7FF]/40 via-[#8B5CF6]/40 to-[#28D7FF]/40 -z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.step}
                  className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between relative group"
                >
                  {/* Step Number Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <span
                      className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg border"
                      style={{
                        color: item.accent,
                        backgroundColor: `${item.accent}15`,
                        borderColor: `${item.accent}30`,
                      }}
                    >
                      STEP {item.step}
                    </span>

                    {/* Step Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center p-2.5 border group-hover:scale-110 transition-transform"
                      style={{
                        backgroundColor: `${item.accent}20`,
                        borderColor: `${item.accent}50`,
                        color: item.accent,
                      }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Step Description */}
                  <div className="space-y-2">
                    <span className="text-xs font-mono text-[#A7B1C8]/80 block">
                      {item.subtitle}
                    </span>
                    <h3 className="text-lg font-bold text-[#F8FAFC]">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#A7B1C8] leading-relaxed pt-1">
                      {item.description}
                    </p>
                  </div>

                  {/* Flow arrow on mobile / tablet */}
                  {index < steps.length - 1 && (
                    <div className="lg:hidden pt-4 flex justify-center text-[#28D7FF]/60">
                      <ArrowRight className="w-5 h-5 rotate-90 md:rotate-0" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Distributed Computing Performance Highlight */}
        <div className="mt-16 p-6 rounded-2xl bg-[#0B1026]/80 border border-[#8B5CF6]/25 backdrop-blur-md text-center max-w-2xl mx-auto">
          <p className="text-xs sm:text-sm text-[#A7B1C8]">
            <span className="font-semibold text-[#28D7FF]">Key Advantage:</span> By offloading extraction calculations to Apache Spark worker threads, dataset processing scales with compute nodes rather than single-threaded hardware limitations.
          </p>
        </div>

      </div>
    </section>
  );
}
