'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  User,
  LogOut,
  Settings,
  ChevronRight,
  Activity,
  ShieldCheck,
  Server,
} from 'lucide-react';

interface HeaderProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  onOpenMobileMenu: () => void;
}

const ROUTE_INFO: Record<string, { title: string; description: string; breadcrumb: string }> = {
  '/dashboard': {
    title: 'Genomic Intelligence Dashboard',
    description: 'Explore genomic datasets, process sequence features, and investigate potential anomalies.',
    breadcrumb: 'Overview',
  },
  '/dashboard/new-analysis': {
    title: 'New Genomic Analysis',
    description: 'Import FASTA or CSV sequence files and configure outlier detection parameters.',
    breadcrumb: 'New Analysis',
  },
  '/dashboard/history': {
    title: 'Analysis History',
    description: 'Review historical Spark batch pipeline executions and sequence anomaly runs.',
    breadcrumb: 'History',
  },
  '/dashboard/anomalies': {
    title: 'Anomaly Explorer',
    description: 'Filter, inspect, and investigate genomic loci isolated by the Isolation Forest model.',
    breadcrumb: 'Anomalies',
  },
  '/dashboard/datasets': {
    title: 'Dataset Manager',
    description: 'Manage imported reference sequences, benchmark FASTA matrices, and raw reads.',
    breadcrumb: 'Datasets',
  },
  '/dashboard/settings': {
    title: 'Analyst Account Settings',
    description: 'View active session credentials, security policies, and UI preferences.',
    breadcrumb: 'Settings',
  },
};

export default function DashboardHeader({ user, onOpenMobileMenu }: HeaderProps) {
  const pathname = usePathname();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const routeInfo = ROUTE_INFO[pathname] || {
    title: 'Genomics Console',
    description: 'Genomics Anomaly Detection Using Apache Spark',
    breadcrumb: 'Dashboard',
  };

  const [clusterStatus, setClusterStatus] = useState<{ status: string; spark: boolean }>({
    status: 'checking',
    spark: false,
  });

  React.useEffect(() => {
    import('@/lib/services/genomicsService').then(({ checkClusterHealth }) => {
      checkClusterHealth().then((health) => {
        setClusterStatus({
          status: health.status,
          spark: health.spark_available,
        });
      });
    });
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-[#050816]/90 backdrop-blur-md border-b border-[#28D7FF]/15 px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="flex items-center justify-between gap-4">

        {/* Left: Hamburger (mobile) + Page Titles & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-[#A7B1C8] hover:text-white bg-white/5 border border-white/10 transition-colors"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            {/* Breadcrumb trail */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-[#A7B1C8]/70">
              <Link href="/dashboard" className="hover:text-[#28D7FF] transition-colors">
                Console
              </Link>
              <ChevronRight className="w-3 h-3 text-[#A7B1C8]/40" />
              <span className="text-[#28D7FF]">{routeInfo.breadcrumb}</span>
            </div>

            {/* Page Title */}
            <h1 className="text-base sm:text-xl font-bold text-white tracking-tight leading-tight">
              {routeInfo.title}
            </h1>
          </div>
        </div>

        {/* Right: Live System Status + User Menu */}
        <div className="flex items-center gap-3 sm:gap-4">

          {/* Live System Status Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0B1026] border border-[#28D7FF]/20 text-[11px] font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                clusterStatus.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-[#A7B1C8]">Spark:</span>
            <span className={`font-semibold ${clusterStatus.status === 'healthy' ? 'text-emerald-400' : 'text-amber-300'}`}>
              {clusterStatus.status === 'healthy' ? (clusterStatus.spark ? 'Active' : 'Ready') : 'Standby'}
            </span>
            <span className="text-[9px] text-[#28D7FF]/80 bg-[#28D7FF]/10 px-1.5 py-0.2 rounded border border-[#28D7FF]/30 uppercase">
              PySpark local[*]
            </span>
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#0B1026] border border-[#28D7FF]/20 hover:border-[#28D7FF]/50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#28D7FF]/50"
              aria-expanded={isProfileMenuOpen}
              aria-label="Open user profile options"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#28D7FF]/20 to-[#8B5CF6]/30 flex items-center justify-center text-[#28D7FF] text-xs font-bold uppercase border border-[#28D7FF]/30">
                {user.name ? user.name.slice(0, 2) : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-white leading-none">
                  {user.name}
                </span>
                <span className="text-[10px] font-mono text-[#A7B1C8] mt-0.5 max-w-[120px] truncate">
                  {user.email}
                </span>
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <>
                <div
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="fixed inset-0 z-20"
                />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel p-2 border border-[#28D7FF]/30 shadow-2xl z-30 space-y-1">
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[10px] font-mono text-[#A7B1C8] truncate">{user.email}</p>
                  </div>

                  <Link
                    href="/dashboard/settings"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#A7B1C8] hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#28D7FF]" />
                    <span>Account Settings</span>
                  </Link>

                  <form action="/api/auth/logout" method="POST">
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Log Out</span>
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
