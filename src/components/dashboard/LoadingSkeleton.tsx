import React from 'react';

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl glass-panel p-5 border border-[#28D7FF]/15 animate-pulse space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-white/10 rounded" />
          <div className="h-8 w-24 bg-white/15 rounded" />
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/10" />
      </div>
      <div className="h-3 w-32 bg-white/5 rounded pt-2" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="animate-pulse border-b border-white/5">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <div className="h-4 bg-white/10 rounded w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-2xl glass-panel p-6 border border-[#28D7FF]/15 animate-pulse space-y-4">
      <div className="flex justify-between">
        <div className="h-5 w-40 bg-white/15 rounded" />
        <div className="h-5 w-24 bg-white/10 rounded" />
      </div>
      <div className="h-64 w-full bg-white/5 rounded-xl flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#28D7FF]/30 border-t-[#28D7FF] rounded-full animate-spin" />
      </div>
    </div>
  );
}
