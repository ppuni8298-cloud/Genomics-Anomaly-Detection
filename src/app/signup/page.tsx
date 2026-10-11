'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dna,
  ArrowLeft,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  validateSignupInput,
  evaluatePasswordStrength,
  normalizeEmail,
} from '@/lib/validations';

// Dynamically import 3D DNA Double Helix for the side visual
const DnaHelixCanvas = dynamic(() => import('@/components/3d/DnaHelixCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[360px] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#28D7FF]/30 border-t-[#28D7FF] rounded-full animate-spin" />
    </div>
  ),
});

export default function SignUpPage() {
  const router = useRouter();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & error handling
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Live password strength analysis
  const passwordStrength = evaluatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setServerError(null);
    setSuccessMessage(null);

    // Client-side validation
    const clientValidation = validateSignupInput({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!clientValidation.isValid) {
      setFieldErrors(clientValidation.errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: normalizeEmail(email),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
        } else {
          setServerError(data.error || 'Failed to create account. Please check your details.');
        }
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Account created successfully! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1000);
    } catch {
      setServerError('A network error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const getStrengthBarColor = (score: number) => {
    if (score <= 1) return 'bg-red-500';
    if (score === 2) return 'bg-amber-400';
    if (score === 3) return 'bg-[#28D7FF]';
    return 'bg-emerald-400';
  };

  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-[#28D7FF]/10 via-[#8B5CF6]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-gradient-to-bl from-[#8B5CF6]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

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

        {/* Left Column: Polished Signup Form */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-6 w-full max-w-xl mx-auto"
        >
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-[#28D7FF]/25 shadow-2xl backdrop-blur-xl space-y-6">

            {/* Form Header */}
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#28D7FF] bg-[#28D7FF]/10 px-2.5 py-0.5 rounded-full border border-[#28D7FF]/25">
                Phase 2 &bull; Authenticated Access
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight pt-2">
                Create Researcher Account
              </h1>
              <p className="text-xs sm:text-sm text-[#A7B1C8]">
                Access distributed genomic anomaly analytics powered by Apache Spark.
              </p>
            </div>

            {/* Error & Success Feedback Banners */}
            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{serverError}</span>
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

            {/* Interactive Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* Full Name Field */}
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-semibold text-[#A7B1C8] mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#A7B1C8]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="signup-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    placeholder="Dr. Rosalind Franklin"
                    disabled={isSubmitting}
                    className={`w-full bg-[#050816]/80 border ${
                      fieldErrors.name ? 'border-red-400' : 'border-[#1A234A] focus:border-[#28D7FF]'
                    } rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F8FAFC] placeholder-[#A7B1C8]/40 focus:outline-none focus:ring-1 focus:ring-[#28D7FF] transition-all`}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-[11px] text-red-400 mt-1">{fieldErrors.name}</p>
                )}
              </div>

              {/* Email Address Field */}
              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-semibold text-[#A7B1C8] mb-1.5"
                >
                  Institutional / Researcher Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#A7B1C8]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="researcher@genomics.edu"
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

              {/* Password Field */}
              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-semibold text-[#A7B1C8] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#A7B1C8]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    placeholder="Minimum 8 characters"
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

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#A7B1C8]">Strength:</span>
                      <span
                        className={`font-semibold ${
                          passwordStrength.score >= 3 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#1A234A] rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full flex-1 transition-colors duration-300 ${
                            passwordStrength.score >= step
                              ? getStrengthBarColor(passwordStrength.score)
                              : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="signup-confirm-password"
                  className="block text-xs font-semibold text-[#A7B1C8] mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-[#A7B1C8]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }
                    }}
                    placeholder="Repeat your password"
                    disabled={isSubmitting}
                    className={`w-full bg-[#050816]/80 border ${
                      fieldErrors.confirmPassword ? 'border-red-400' : 'border-[#1A234A] focus:border-[#28D7FF]'
                    } rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#F8FAFC] placeholder-[#A7B1C8]/40 focus:outline-none focus:ring-1 focus:ring-[#28D7FF] transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A7B1C8] hover:text-white p-1 focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-[11px] text-red-400 mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[#28D7FF] to-[#8B5CF6] hover:opacity-95 shadow-[0_0_20px_rgba(40,215,255,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer pt-3"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Link to Login */}
            <div className="text-center pt-2 border-t border-[#1A234A]">
              <p className="text-xs text-[#A7B1C8]">
                Already registered?{' '}
                <Link
                  href="/login"
                  className="text-[#28D7FF] hover:underline font-semibold focus:outline-none focus:ring-1 focus:ring-[#28D7FF] rounded"
                >
                  Sign in here
                </Link>
              </p>
            </div>

          </div>
        </motion.div>

        {/* Right Column: 3D DNA Double Helix Animation */}
        <div className="hidden lg:flex lg:col-span-6 flex-col items-center justify-center relative">
          <div className="w-full max-w-lg relative">
            <DnaHelixCanvas />

            <div className="p-4 rounded-2xl bg-[#0B1026]/80 border border-[#28D7FF]/20 backdrop-blur-md text-center max-w-md mx-auto -mt-6 shadow-xl">
              <h3 className="text-sm font-bold text-[#F8FAFC]">
                Apache Spark Big Data Infrastructure
              </h3>
              <p className="text-xs text-[#A7B1C8] mt-1">
                Your credentials are encrypted using industry-standard salted hashing and protected with secure HTTP-only session tokens.
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
