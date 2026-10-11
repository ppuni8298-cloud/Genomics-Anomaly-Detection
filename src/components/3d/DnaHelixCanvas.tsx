'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { DnaHelixScene } from './DnaHelixScene';

function WebGlFallback() {
  return (
    <div
      role="img"
      aria-label="3D DNA double helix fallback illustration"
      className="relative w-full h-full flex flex-col items-center justify-center p-6 select-none"
    >
      <div className="relative w-64 h-80 flex items-center justify-center">
        {/* Animated glowing decorative helix representation */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#28D7FF]/20 via-[#8B5CF6]/15 to-transparent rounded-full blur-2xl animate-pulse" />

        <svg
          viewBox="0 0 200 320"
          className="w-full h-full drop-shadow-[0_0_20px_rgba(40,215,255,0.4)]"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="strandA" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#28D7FF" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient id="strandB" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#C084FC" />
            </linearGradient>
          </defs>

          {/* Rungs connecting base pairs */}
          {[40, 80, 120, 160, 200, 240, 280].map((y, idx) => {
            const spread = Math.sin(idx * 0.9) * 45;
            return (
              <line
                key={`line-${idx}`}
                x1={100 - spread}
                y1={y}
                x2={100 + spread}
                y2={y}
                stroke="#C084FC"
                strokeWidth="2.5"
                strokeOpacity="0.6"
              />
            );
          })}

          {/* Strand Waves */}
          <path
            d="M 60,20 Q 140,80 60,160 T 60,300"
            fill="none"
            stroke="url(#strandA)"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path
            d="M 140,20 Q 60,80 140,160 T 140,300"
            fill="none"
            stroke="url(#strandB)"
            strokeWidth="4.5"
            strokeLinecap="round"
          />

          {/* Base Pair Spheres */}
          {[40, 80, 120, 160, 200, 240, 280].map((y, idx) => {
            const spread = Math.sin(idx * 0.9) * 45;
            return (
              <g key={`spheres-${idx}`}>
                <circle cx={100 - spread} cy={y} r="5" fill="#28D7FF" />
                <circle cx={100 + spread} cy={y} r="5" fill="#8B5CF6" />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex items-center space-x-2 text-xs font-mono text-[#A7B1C8]/80">
        <span className="w-2 h-2 rounded-full bg-[#28D7FF] animate-ping" />
        <span>Molecular Visualization Engine</span>
      </div>
    </div>
  );
}

export default function DnaHelixCanvas() {
  const [hasMounted, setHasMounted] = useState(false);
  const [webGlSupported, setWebGlSupported] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    // Check for reduced motion preference
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handleChange);

      // Check WebGL availability
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
          setWebGlSupported(false);
        }
      } catch {
        setWebGlSupported(false);
      }

      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  if (!hasMounted || !webGlSupported) {
    return <WebGlFallback />;
  }

  return (
    <div
      className="relative w-full h-[380px] sm:h-[450px] lg:h-[540px] flex items-center justify-center select-none"
      aria-label="Interactive 3D DNA Double Helix graphic representing genomic sequence analysis"
    >
      {/* Ambient background glow ring */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-[#28D7FF]/15 via-[#8B5CF6]/15 to-transparent blur-3xl pointer-events-none" />

      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        dpr={[1, 1.75]} // limit DPR for mobile battery & performance
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <Suspense fallback={null}>
          <DnaHelixScene reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>

      {/* Floating interactive indicator */}
      <div className="absolute bottom-3 right-4 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono tracking-wide text-[#A7B1C8] bg-[#0B1026]/80 border border-[#28D7FF]/20 backdrop-blur-md pointer-events-none shadow-md">
        <span className="w-1.5 h-1.5 rounded-full bg-[#28D7FF] animate-pulse" />
        Interactive R3F 3D Viewport
      </div>
    </div>
  );
}
