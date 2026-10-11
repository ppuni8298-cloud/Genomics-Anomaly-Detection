import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number | null;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  accentGradient?: string;
  isDemo?: boolean;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-[#28D7FF]',
  accentGradient = 'from-[#28D7FF]/20 to-[#8B5CF6]/10',
  isDemo = false,
}: StatCardProps) {
  const hasValue = value !== null && value !== undefined;
  const displayValue = hasValue ? value : '—';

  return (
    <div className="relative group rounded-2xl glass-panel p-5 border border-[#28D7FF]/15 hover:border-[#28D7FF]/40 transition-all duration-300 shadow-lg hover:shadow-[0_8px_30px_rgba(40,215,255,0.15)] flex flex-col justify-between overflow-hidden">
      {/* Background soft glow gradient */}
      <div
        className={`absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br ${accentGradient} rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500`}
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#A7B1C8] tracking-wide">
              {title}
            </span>
            {isDemo && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Demo
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                hasValue ? 'text-white' : 'text-[#A7B1C8]/60 font-mono'
              }`}
            >
              {displayValue}
            </span>
          </div>
        </div>

        <div
          className={`w-11 h-11 rounded-xl bg-[#0B1026] border border-[#28D7FF]/25 flex items-center justify-center shrink-0 ${iconColor} group-hover:scale-105 transition-transform duration-300 shadow-inner`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="relative z-10 mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-[#A7B1C8]/70">
        <span>{subtitle || (hasValue ? 'Active in workspace' : 'Awaiting first dataset')}</span>
        {!hasValue && (
          <span className="text-[10px] font-mono text-[#28D7FF]/70">No records</span>
        )}
      </div>
    </div>
  );
}
