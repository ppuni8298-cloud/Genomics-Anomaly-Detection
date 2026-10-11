'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dna,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { validateLoginInput, normalizeEmail } from '@/lib/validations';

// Dynamically import 3D DNA Double Helix for side visual
const DnaHelixCanvas = dynamic(() => import('@/components/3d/DnaHelixCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[360px] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#28D7FF]/30 border-t-[#28D7FF] rounded-full animate-spin" />
    </div>
  ),
});

export default function LoginPage() {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & error handling
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    // Client-side validation
    const validation = validateLoginInput({ email, password });
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizeEmail(email),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Invalid email or password.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Authentication verified! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 800);
    } catch {
      setErrorMessage('Network connection error. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-gradient-to-tr from-[#28D7FF]/10 via-[#8B5CF6]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-gradient-to-tl from-[#8B5CF6]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between pb-4 relative z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#A7B1C8] hover:text-[#28D7FF] transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#28D7FF] rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Return to Landing Page</span>
        </Link>

        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#28D7FF]/20 to-[#8B5CF6]/30 flex items-center justify-center border border-[#28D7FF]/30">
            <Dna className="w-4 h-4 text-[#28D7FF]" />
          </div>
          <span className="font-bold text-lg text-white">
            Genome<span className="text-[#28D7FF]">AI</span>
          </span>
        </Link>
      </header>

      {/* Main Two-Column Layout */}
      <main className="max-w-7xl mx-auto w-full my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">

        {/* Left Column: Form */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-6 w-full max-w-md mx-auto"
        >
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-[#28D7FF]/25 shadow-2xl backdrop-blur-xl space-y-6">

            {/* Header */}
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#28D7FF] bg-[#28D7FF]/10 px-2.5 py-0.5 rounded-full border border-[#28D7FF]/25">
                Secure Session Gateway
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight pt-2">
                Sign In to GenomeAI
              </h1>
              <p className="text-xs sm:text-sm text-[#A7B1C8]">
                Authenticate to access distributed sequence analysis jobs.
              </p>
            </div>

            {/* Error & Success Feedback Banners */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}

              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300"
                  role="status"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-[#A7B1C8] mb-1.5"
                >
                  Researcher Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#A7B1C8]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="analyst@genomics-spark.edu"
                    disabled={isSubmitting}
                    className={`w-full bg-[#050816]/80 border ${
                      fieldErrors.email ? 'border-red-400' : 'border-[#1A234A] focus:border-[#28D7FF]'
                    } rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F8FAFC] placeholder-[#A7B1C8]/40 focus:outline-none focus:ring-1 focus:ring-[#28D7FF] transition-all`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[11px] text-red-400 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-[#A7B1C8] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#A7B1C8]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                    className={`w-full bg-[#050816]/80 border ${
                      fieldErrors.password ? 'border-red-400' : 'border-[#1A234A] focus:border-[#28D7FF]'
                    } rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#F8FAFC] placeholder-[#A7B1C8]/40 focus:outline-none focus:ring-1 focus:ring-[#28D7FF] transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A7B1C8] hover:text-white p-1 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] text-red-400 mt-1">{fieldErrors.password}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[#28D7FF] to-[#8B5CF6] hover:opacity-95 shadow-[0_0_20px_rgba(40,215,255,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer pt-3"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Link */}
            <div className="text-center pt-2 border-t border-[#1A234A]">
              <p className="text-xs text-[#A7B1C8]">
                Don&apos;t have an account yet?{' '}
                <Link
                  href="/signup"
                  className="text-[#28D7FF] hover:underline font-semibold focus:outline-none focus:ring-1 focus:ring-[#28D7FF] rounded"
                >
                  Create an account
                </Link>
              </p>
            </div>

          </div>
        </motion.div>

        {/* Right Column: 3D Graphic */}
        <div className="hidden lg:flex lg:col-span-6 flex-col items-center justify-center relative">
          <div className="w-full max-w-lg relative">
            <DnaHelixCanvas />

            <div className="p-4 rounded-2xl bg-[#0B1026]/80 border border-[#8B5CF6]/20 backdrop-blur-md text-center max-w-md mx-auto -mt-6 shadow-xl">
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#C084FC] mb-1">
                <Shield className="w-4 h-4" />
                <span>Zero-Trust Session Integrity</span>
              </div>
              <p className="text-xs text-[#A7B1C8]">
                Sessions are cryptographically verified against the persistent database with HTTP-only security flags.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full text-center text-xs text-[#A7B1C8]/60 font-mono py-2">
        GenomeAI &bull; Genomics Anomaly Detection Using Apache Spark &bull; Phase 2 Authentication
      </footer>
    </div>
  );
}
