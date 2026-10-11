'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Dna, Menu, X, ArrowRight, Sparkles } from 'lucide-react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Check user auth state
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#050816]/85 backdrop-blur-md border-b border-[#28D7FF]/15 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Name */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#28D7FF] rounded-lg"
          >
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-[#28D7FF]/20 via-[#8B5CF6]/30 to-[#C084FC]/20 p-2 flex items-center justify-center border border-[#28D7FF]/30 shadow-[0_0_15px_rgba(40,215,255,0.25)] group-hover:border-[#28D7FF]/60 transition-colors">
              <Dna className="w-6 h-6 text-[#28D7FF] group-hover:text-white transition-colors" />
              <div className="absolute inset-0 rounded-xl bg-[#28D7FF]/20 blur-sm -z-10 group-hover:bg-[#28D7FF]/40 transition-colors" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5 font-sans">
                Genome<span className="text-[#28D7FF]">AI</span>
                <span className="inline-block px-1.5 py-0.5 text-[9px] font-mono tracking-wider text-[#28D7FF] bg-[#28D7FF]/10 rounded border border-[#28D7FF]/30 uppercase">
                  Spark
                </span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-8 text-sm font-medium text-[#A7B1C8]"
          >
            <Link
              href="/"
              className="text-[#F8FAFC] hover:text-[#28D7FF] transition-colors"
            >
              Home
            </Link>
            <a
              href="#about"
              className="hover:text-[#28D7FF] transition-colors"
            >
              About
            </a>
            <a
              href="#features"
              className="hover:text-[#28D7FF] transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#28D7FF] transition-colors"
            >
              How It Works
            </a>
            {user && (
              <Link
                href="/dashboard"
                className="text-[#28D7FF] hover:text-white transition-colors font-semibold"
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="relative inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#28D7FF] to-[#8B5CF6] rounded-xl hover:opacity-95 shadow-[0_0_20px_rgba(40,215,255,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#28D7FF]"
              >
                <span>Dashboard ({user.name.split(' ')[0]})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-[#F8FAFC] hover:text-[#28D7FF] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#28D7FF] rounded-lg"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="relative inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#28D7FF] to-[#8B5CF6] rounded-xl hover:opacity-95 shadow-[0_0_20px_rgba(40,215,255,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#28D7FF]"
                >
                  <span>Sign Up</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="p-2.5 rounded-xl bg-[#0B1026] text-[#A7B1C8] hover:text-white border border-[#28D7FF]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#28D7FF]"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#050816]/95 backdrop-blur-xl border-b border-[#28D7FF]/20 px-4 pt-3 pb-6 space-y-4 shadow-2xl animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col space-y-3 text-base font-medium text-[#A7B1C8]">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#0B1026] text-[#F8FAFC] hover:text-[#28D7FF] transition-colors"
            >
              Home
            </Link>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#0B1026] hover:text-[#28D7FF] transition-colors"
            >
              About
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#0B1026] hover:text-[#28D7FF] transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#0B1026] hover:text-[#28D7FF] transition-colors"
            >
              How It Works
            </a>
            {user && (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#0B1026] text-[#28D7FF] font-semibold transition-colors"
              >
                Dashboard
              </Link>
            )}
          </nav>

          <div className="pt-4 border-t border-[#0B1026] flex flex-col gap-3">
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#28D7FF] to-[#8B5CF6] shadow-lg shadow-[#28D7FF]/20"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 px-4 rounded-xl text-sm font-medium text-[#F8FAFC] bg-[#0B1026] border border-[#28D7FF]/20 hover:border-[#28D7FF]/50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#28D7FF] to-[#8B5CF6] shadow-lg shadow-[#28D7FF]/20"
                >
                  <span>Sign Up</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
