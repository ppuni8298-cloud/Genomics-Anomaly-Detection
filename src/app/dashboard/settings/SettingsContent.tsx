'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Key,
  LogOut,
  Sliders,
  CheckCircle2,
  Lock,
  Database,
  Cpu,
  Info,
} from 'lucide-react';

interface SettingsContentProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  sessionId: string;
}

export default function SettingsContent({ user, sessionId }: SettingsContentProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [themeMode, setThemeMode] = useState('dark-navy');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMotion = localStorage.getItem('genome_reduced_motion') === 'true';
      setReducedMotion(savedMotion);
      const savedTheme = localStorage.getItem('genome_theme_mode') || 'dark-navy';
      setThemeMode(savedTheme);
    }
  }, []);

  const toggleReducedMotion = () => {
    const nextVal = !reducedMotion;
    setReducedMotion(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('genome_reduced_motion', String(nextVal));
    }
  };

  const handleThemeChange = (mode: string) => {
    setThemeMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('genome_theme_mode', mode);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">

      {/* Page Title */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Analyst Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#A7B1C8]">
          Manage your researcher profile, session tokens, and local console preferences.
        </p>
      </div>

      {/* Account Details Panel */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-[#28D7FF]/20 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#28D7FF]/20 to-[#8B5CF6]/30 flex items-center justify-center text-[#28D7FF] font-bold text-sm uppercase border border-[#28D7FF]/30">
              {user.name ? user.name.slice(0, 2) : <User className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Researcher Identity
              </h2>
              <span className="text-xs text-[#A7B1C8]">
                Authenticated via Phase 2 SQLite Credentials
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
            Active Session
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[#A7B1C8]">Full Name</label>
              <span className="text-[10px] font-mono text-[#A7B1C8]/60 bg-white/5 px-1.5 py-0.5 rounded">
                Read-Only
              </span>
            </div>
            <input
              type="text"
              readOnly
              value={user.name}
              className="w-full bg-[#050816]/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-medium cursor-not-allowed select-all"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[#A7B1C8]">Email Address</label>
              <span className="text-[10px] font-mono text-[#A7B1C8]/60 bg-white/5 px-1.5 py-0.5 rounded">
                Read-Only
              </span>
            </div>
            <input
              type="email"
              readOnly
              value={user.email}
              className="w-full bg-[#050816]/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono cursor-not-allowed select-all"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[#A7B1C8]">User ID Reference</label>
              <span className="text-[10px] font-mono text-[#A7B1C8]/60 bg-white/5 px-1.5 py-0.5 rounded">
                Database CUID
              </span>
            </div>
            <input
              type="text"
              readOnly
              value={user.id}
              className="w-full bg-[#050816]/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-[#28D7FF] font-mono text-[11px] cursor-not-allowed select-all"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[#A7B1C8]">Workspace Role</label>
              <span className="text-[10px] font-mono text-[#A7B1C8]/60 bg-white/5 px-1.5 py-0.5 rounded">
                Assigned
              </span>
            </div>
            <input
              type="text"
              readOnly
              value="Bioinformatics Lead / Genomic Analyst"
              className="w-full bg-[#050816]/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-medium cursor-not-allowed"
            />
          </div>

        </div>

        {/* Read-only notification */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#A7B1C8] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#28D7FF] shrink-0 mt-0.5" />
          <span>
            Identity modifications (e.g. changing name or password) will connect to dedicated backend mutation endpoints in future phases.
          </span>
        </div>

      </div>

      {/* Security & Active Session Credentials */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-emerald-500/20 space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Cryptographic &amp; Session Security
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">

          <div className="p-4 rounded-2xl bg-[#050816]/70 border border-white/5 space-y-1">
            <span className="text-[#A7B1C8] text-[10px] uppercase block">Cookie Transport</span>
            <span className="text-white font-bold block">HTTP-Only JWT</span>
            <p className="text-[11px] text-[#A7B1C8]/80 font-sans mt-1">
              Encrypted JSON Web Token with SameSite Lax protection against CSRF and XSS.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#050816]/70 border border-white/5 space-y-1">
            <span className="text-[#A7B1C8] text-[10px] uppercase block">Database Session</span>
            <span className="text-emerald-400 font-bold block">Active in SQLite</span>
            <p className="text-[11px] text-[#A7B1C8]/80 font-sans mt-1">
              ID: {sessionId.slice(0, 16)}... with automatic 7-day expiration policy.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#050816]/70 border border-white/5 space-y-1">
            <span className="text-[#A7B1C8] text-[10px] uppercase block">Password Protection</span>
            <span className="text-[#28D7FF] font-bold block">Bcrypt / Salted</span>
            <p className="text-[11px] text-[#A7B1C8]/80 font-sans mt-1">
              Work factor 12 salt rounds with zero plaintext storage.
            </p>
          </div>

        </div>

        {/* Terminate Session Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5">
          <span className="text-xs text-[#A7B1C8]">
            Sign out of this computer and invalidate current database session token.
          </span>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-500/60 transition-all flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Terminate Active Session</span>
            </button>
          </form>
        </div>

      </div>

      {/* Visual & Accessibility Preferences */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-[#8B5CF6]/20 space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
          <Sliders className="w-5 h-5 text-[#8B5CF6]" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Console Preferences
          </h2>
        </div>

        <div className="space-y-4">

          {/* Theme Palette */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#050816]/60 border border-white/5">
            <div>
              <span className="text-xs font-bold text-white block">Theme Palette</span>
              <span className="text-[11px] text-[#A7B1C8]">
                Console dark mode background and biotech accent gradients.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleThemeChange('dark-navy')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  themeMode === 'dark-navy'
                    ? 'bg-[#28D7FF]/20 border border-[#28D7FF] text-white shadow-sm'
                    : 'bg-white/5 text-[#A7B1C8] hover:text-white border border-transparent'
                }`}
              >
                Dark Navy (Default)
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('midnight-violet')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  themeMode === 'midnight-violet'
                    ? 'bg-[#8B5CF6]/20 border border-[#8B5CF6] text-white shadow-sm'
                    : 'bg-white/5 text-[#A7B1C8] hover:text-white border border-transparent'
                }`}
              >
                Midnight Violet
              </button>
            </div>
          </div>

          {/* Reduced Motion Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#050816]/60 border border-white/5">
            <div>
              <span className="text-xs font-bold text-white block">Respect Reduced Motion</span>
              <span className="text-[11px] text-[#A7B1C8]">
                Pause continuous 3D helix animations and dampen motion effects for accessibility.
              </span>
            </div>

            <button
              type="button"
              onClick={toggleReducedMotion}
              className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono transition-all border ${
                reducedMotion
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-white/5 text-[#A7B1C8] border-white/10 hover:text-white'
              }`}
            >
              {reducedMotion ? 'Reduced Motion: ON' : 'Reduced Motion: Standard'}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
