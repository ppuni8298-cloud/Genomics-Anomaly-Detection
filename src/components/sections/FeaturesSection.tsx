import React from 'react';
import { Server, Binary, Compass, BarChart3, UploadCloud, History, CheckCircle2, Clock, type LucideIcon } from 'lucide-react';

interface FeatureItem {
  id: number;
  title: string;
  category: string;
  description: string;
  icon: LucideIcon;
  accentColor: string;
  status: 'Ready' | 'Planned (Phase 2)';
  bullets: string[];
}

const features: FeatureItem[] = [
  {
    id: 1,
    title: 'Big Data Processing',
    category: 'Apache Spark & PySpark',
    description:
      'Distributed in-memory computing cluster architecture capable of partitioning and processing massive volumes of genomic sequences concurrently.',
    icon: Server,
    accentColor: '#28D7FF',
    status: 'Ready',
    bullets: [
      'Spark RDD and DataFrame pipeline',
      'Worker node partitioning for horizontal scalability',
      'High-throughput sequence batch execution',
    ],
  },
  {
    id: 2,
    title: 'Genomic Feature Extraction',
    category: 'Bioinformatics Vectorization',
    description:
      'Converts raw nucleotide strings into multidimensional numerical feature vectors suitable for statistical machine learning algorithms.',
    icon: Binary,
    accentColor: '#8B5CF6',
    status: 'Ready',
    bullets: [
      'GC-Content percentage calculation',
      'Individual nucleotide frequency counts (A, T, G, C)',
      'Sequence length & k-mer composition patterns',
    ],
  },
  {
    id: 3,
    title: 'Anomaly Detection',
    category: 'Isolation Forest & Outlier Scoring',
    description:
      'Unsupervised anomaly detection isolating anomalous genomic sequences based on multi-feature deviation without requiring labeled training datasets.',
    icon: Compass,
    accentColor: '#C084FC',
    status: 'Ready',
    bullets: [
      'Isolation Forest tree partitioning',
      'Quantitative anomaly score generation',
      'Automated threshold classification (Normal vs Flagged)',
    ],
  },
  {
    id: 4,
    title: 'Interactive Analytics',
    category: 'Data Exploration Dashboard',
    description:
      'Visual breakdown of sequence distributions, anomaly scores, GC percentages, and filterable tabular views of all processed records.',
    icon: BarChart3,
    accentColor: '#28D7FF',
    status: 'Ready',
    bullets: [
      'Visual distribution histograms & scatter plots',
      'Filterable records with anomaly tags',
      'Real-time aggregate metric summaries',
    ],
  },
  {
    id: 5,
    title: 'Dataset Upload',
    category: 'Input Ingestion System',
    description:
      'Upload and ingest standard genomic datasets in CSV or multi-record FASTA formats with client-side validation and schema checks.',
    icon: UploadCloud,
    accentColor: '#8B5CF6',
    status: 'Planned (Phase 2)',
    bullets: [
      'FASTA (.fasta / .fa) file streaming parser',
      'Tabular CSV genomic dataset upload',
      'Input validation & automated sequence cleaning',
    ],
  },
  {
    id: 6,
    title: 'Reports and History',
    category: 'Audit & Analysis Logs',
    description:
      'Downloadable anomaly reports, exportable flagged sequence subsets, and historical audit logs of previous Spark analysis jobs.',
    icon: History,
    accentColor: '#C084FC',
    status: 'Planned (Phase 2)',
    bullets: [
      'Exportable JSON and CSV anomaly reports',
      'Persistent job history via SQLite database',
      'Comparative inspection across historical runs',
    ],
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 bg-[#0B1026]/50 overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#28D7FF]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#8B5CF6]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono text-[#28D7FF] bg-[#050816] border border-[#28D7FF]/30">
            <Compass className="w-3.5 h-3.5" />
            <span>Architecture Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F8FAFC]">
            End-to-End Genomic Anomaly Pipeline
          </h2>
          <p className="text-base text-[#A7B1C8] leading-relaxed">
            From distributed big data ingestion with Apache Spark to unsupervised machine learning scoring and visual exploration.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            const isPlanned = feature.status.includes('Planned');

            return (
              <div
                key={feature.id}
                className={`glass-panel glass-panel-hover rounded-2xl p-7 flex flex-col justify-between border ${
                  isPlanned ? 'border-[#1A234A] opacity-90' : 'border-[#28D7FF]/20'
                }`}
              >
                <div>
                  {/* Top Header & Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl p-2.5 flex items-center justify-center border"
                      style={{
                        backgroundColor: `${feature.accentColor}15`,
                        borderColor: `${feature.accentColor}40`,
                        color: feature.accentColor,
                      }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    {isPlanned ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono text-[#C084FC] bg-[#C084FC]/10 border border-[#C084FC]/30">
                        <Clock className="w-3 h-3" />
                        Planned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        Core Feature
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-mono text-[#A7B1C8]/80 block mb-1">
                    {feature.category}
                  </span>
                  <h3 className="text-xl font-bold text-[#F8FAFC] mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[#A7B1C8] leading-relaxed mb-6">
                    {feature.description}
                  </p>
                </div>

                {/* Bullets */}
                <div className="pt-4 border-t border-[#1A234A] space-y-2">
                  {feature.bullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[#A7B1C8]">
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: feature.accentColor }}
                      />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
