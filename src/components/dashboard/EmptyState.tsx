import React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  actionHref,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`glass-panel rounded-2xl p-8 sm:p-12 border border-[#28D7FF]/15 text-center flex flex-col items-center justify-center max-w-xl mx-auto ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#28D7FF]/10 to-[#8B5CF6]/20 border border-[#28D7FF]/25 flex items-center justify-center text-[#28D7FF] mb-4 shadow-[0_0_25px_rgba(40,215,255,0.15)]">
        <Icon className="w-8 h-8" />
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mb-2">
        {title}
      </h3>

      <p className="text-sm text-[#A7B1C8] leading-relaxed max-w-md mb-6">
        {description}
      </p>

      {actionText && (
        <div>
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-[#28D7FF] to-[#8B5CF6] hover:opacity-95 shadow-[0_0_20px_rgba(40,215,255,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all cursor-pointer"
            >
              <span>{actionText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-[#28D7FF] to-[#8B5CF6] hover:opacity-95 shadow-[0_0_20px_rgba(40,215,255,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all cursor-pointer"
            >
              <span>{actionText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
