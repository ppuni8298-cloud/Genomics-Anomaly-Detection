'use client';

import React, { useState } from 'react';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';

interface DashboardLayoutClientProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  children: React.ReactNode;
}

export default function DashboardLayoutClient({ user, children }: DashboardLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] flex flex-row">
      {/* Sidebar Navigation */}
      <DashboardSidebar
        user={user}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          user={user}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>

        <footer className="px-4 sm:px-6 lg:px-8 py-6 border-t border-white/5 text-xs text-[#A7B1C8]/60 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
          <p>GenomeAI &bull; Genomics Anomaly Detection Using Apache Spark &bull; Phase 3</p>
          <span className="text-[11px] text-[#28D7FF]/80">Encrypted Session &bull; SQLite Persistence</span>
        </footer>
      </div>
    </div>
  );
}
