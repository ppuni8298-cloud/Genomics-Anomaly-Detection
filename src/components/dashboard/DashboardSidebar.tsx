'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Dna,
  LayoutDashboard,
  PlusCircle,
  History,
  ShieldAlert,
  Database,
  Settings,
  LogOut,
  User,
  X,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  isOpen?: boolean;
  onClose?: () => void;
}

const NAV_ITEMS = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'New Analysis',
    href: '/dashboard/new-analysis',
    icon: PlusCircle,
  },
  {
    name: 'Analysis History',
    href: '/dashboard/history',
    icon: History,
  },
  {
    name: 'Anomaly Explorer',
    href: '/dashboard/anomalies',
    icon: ShieldAlert,
  },
  {
    name: 'Dataset Manager',
    href: '/dashboard/datasets',
    icon: Database,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export default function DashboardSidebar({ user, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#050816]/95 backdrop-blur-xl border-r border-[#28D7FF]/15 text-[#F8FAFC] select-none">

      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-white/5">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-3 group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#28D7FF]/20 to-[#8B5CF6]/30 flex items-center justify-center border border-[#28D7FF]/30 group-hover:border-[#28D7FF] transition-all shadow-[0_0_15px_rgba(40,215,255,0.2)]">
            <Dna className="w-5 h-5 text-[#28D7FF] group-hover:rotate-45 transition-transform duration-500" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              Genome<span className="text-[#28D7FF]">AI</span>
            </span>
            <span className="text-[10px] font-mono text-[#A7B1C8]/70 uppercase tracking-wider">
              Analytics Console
            </span>
          </div>
        </Link>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-[#A7B1C8] hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-[#A7B1C8]/60 font-semibold">
          Platform Navigation
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-[#28D7FF]/15 to-[#8B5CF6]/10 text-white border border-[#28D7FF]/40 shadow-[0_0_15px_rgba(40,215,255,0.15)]'
                  : 'text-[#A7B1C8] hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[#28D7FF]' : 'text-[#A7B1C8] group-hover:text-white'
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#28D7FF] shadow-[0_0_8px_#28D7FF]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout Section */}
      <div className="p-4 border-t border-white/5 bg-[#0B1026]/40 space-y-3">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#28D7FF]/20 to-[#8B5CF6]/20 border border-[#28D7FF]/30 flex items-center justify-center text-[#28D7FF] font-bold text-xs uppercase shrink-0">
            {user.name ? user.name.slice(0, 2) : <User className="w-4 h-4" />}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-bold text-white truncate leading-none">
              {user.name}
            </span>
            <span className="text-[10px] font-mono text-[#A7B1C8] truncate mt-1">
              {user.email}
            </span>
          </div>
        </div>

        {/* Logout Form using standard server action / POST */}
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </form>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-[#050816]/80 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
