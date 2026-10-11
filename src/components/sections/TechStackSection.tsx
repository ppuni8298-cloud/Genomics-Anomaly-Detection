import React from 'react';
import { Layers, Terminal, Sparkles, Database, Code2, Cpu } from 'lucide-react';

const technologies = [
  {
    name: 'Next.js & React',
    role: 'Frontend & UI Engineering',
    description:
      'App Router architecture, React Server/Client Components, Tailwind CSS, and React Three Fiber 3D visuals for real-time exploratory dashboards.',
    tag: 'TypeScript / WebGL',
    accent: '#28D7FF',
    icon: Code2,
  },
  {
    name: 'Python & FastAPI',
    role: 'Backend API Gateway',
    description:
      'High-performance asynchronous REST endpoints orchestrating Spark job submission, payload parsing, and analytical result formatting.',
    tag: 'Async / Pydantic',
    accent: '#8B5CF6',
    icon: Terminal,
  },
  {
    name: 'Apache Spark / PySpark',
    role: 'Distributed Big Data Engine',
    description:
      'Parallel sequence transformations, GC-content computation, and distributed DataFrame operations handling high-throughput genomic files.',
    tag: 'Cluster Processing',
    accent: '#C084FC',
    icon: Cpu,
  },
  {
    name: 'Scikit-learn',
    role: 'Machine Learning Model',
    description:
      'Unsupervised Isolation Forest algorithm isolating atypical genomic sequences based on multi-dimensional numerical feature deviance.',
    tag: 'Isolation Forest',
    accent: '#28D7FF',
    icon: Sparkles,
  },
  {
    name: 'SQLite Database',
    role: 'Local Persistence (Phase 1/2)',
    description:
      'Lightweight structured SQL storage for sequence jobs, audit history, and user sessions. Production PostgreSQL/Data Connect ready.',
    tag: 'Local Structured Storage',
    accent: '#8B5CF6',
    icon: Database,
  },
];

export default function TechStackSection() {
  return (
    <section id="tech-stack" className="relative py-24 bg-[#0B1026]/40 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-[#8B5CF6]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono text-[#28D7FF] bg-[#050816] border border-[#28D7FF]/30">
            <Layers className="w-3.5 h-3.5" />
            <span>Technology Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F8FAFC]">
            Project Technology Stack
          </h2>
          <p className="text-base text-[#A7B1C8] leading-relaxed">
            The multi-tier system architecture engineered for Phase 1 and the upcoming backend and cluster modules.
          </p>
        </div>

        {/* Tech Stack Cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technologies.map((tech) => {
            const Icon = tech.icon;

            return (
              <div
                key={tech.name}
                className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between border border-[#28D7FF]/15"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-11 h-11 rounded-xl p-2.5 flex items-center justify-center border"
                      style={{
                        backgroundColor: `${tech.accent}15`,
                        borderColor: `${tech.accent}40`,
                        color: tech.accent,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <span
                      className="text-[11px] font-mono px-2.5 py-0.5 rounded-full border"
                      style={{
                        color: tech.accent,
                        backgroundColor: `${tech.accent}10`,
                        borderColor: `${tech.accent}30`,
                      }}
                    >
                      {tech.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#F8FAFC]">
                    {tech.name}
                  </h3>
                  <span className="text-xs font-mono text-[#A7B1C8]/80 block mb-3">
                    {tech.role}
                  </span>
                  <p className="text-sm text-[#A7B1C8] leading-relaxed">
                    {tech.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-[#1A234A] flex items-center gap-2 text-xs font-mono text-[#A7B1C8]/70">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tech.accent }}
                  />
                  <span>Integrated Specification</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
