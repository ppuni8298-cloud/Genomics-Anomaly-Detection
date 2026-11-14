'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CheckCircle, Info, Maximize2, Minimize2, ArrowLeft } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  badge?: string;
  actionText?: string;
  onAction?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl' | '6xl' | 'full';
  allowFullscreen?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  children?: React.ReactNode;
}

export default function InfoModal({
  isOpen,
  onClose,
  title,
  description,
  badge = 'System Notice',
  actionText = 'Understood',
  onAction,
  size = 'lg',
  allowFullscreen = false,
  showBackButton = false,
  onBack,
  children,
}: InfoModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    '4xl': 'max-w-6xl',
    '5xl': 'max-w-7xl',
    '6xl': 'max-w-[90vw]',
    full: 'modal-fullscreen',
  };

  const containerClass = isFullscreen
    ? 'modal-fullscreen'
    : `${sizeClasses[size] || 'max-w-4xl'} max-h-[92vh] overflow-y-auto`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#050816]/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className={`relative z-10 w-full glass-panel rounded-3xl p-5 sm:p-7 md:p-8 border border-[#28D7FF]/30 shadow-2xl space-y-5 transition-all duration-300 ${containerClass}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-2 border-b border-white/5">
              <div className="flex items-center gap-3">
                {showBackButton && (
                  <button
                    type="button"
                    onClick={onBack || onClose}
                    className="p-2 rounded-xl text-[#A7B1C8] hover:text-white hover:bg-white/5 border border-white/10 transition-colors flex items-center gap-1.5 text-xs font-mono cursor-pointer shrink-0"
                    title="Return to previous view"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#28D7FF]" />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                )}

                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono text-[#28D7FF] bg-[#28D7FF]/10 border border-[#28D7FF]/30">
                    <Info className="w-3.5 h-3.5" />
                    <span>{badge}</span>
                  </span>
                  <h3 id="modal-title" className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight pt-0.5">
                    {title}
                  </h3>
                </div>
              </div>

              {/* Window Controls: Maximize/Minimize + Close */}
              <div className="flex items-center gap-2">
                {allowFullscreen && (
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2 rounded-xl text-[#A7B1C8] hover:text-white hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                    title={isFullscreen ? 'Restore view' : 'Maximize full screen'}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-[#A7B1C8] hover:text-white hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Description / Content */}
            {description && (
              <p className="text-xs sm:text-sm text-[#A7B1C8] leading-relaxed">
                {description}
              </p>
            )}

            {children}

            {/* Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onBack || onClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono border border-white/15 bg-white/5 text-[#A7B1C8] hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onAction) onAction();
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-[#28D7FF] to-[#8B5CF6] hover:opacity-95 shadow-[0_0_20px_rgba(40,215,255,0.3)] transition-all cursor-pointer"
              >
                {actionText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
