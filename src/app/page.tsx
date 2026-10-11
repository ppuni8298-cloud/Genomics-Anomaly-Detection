import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import FeaturesSection from '@/components/sections/FeaturesSection';
import HowItWorksSection from '@/components/sections/HowItWorksSection';
import TechStackSection from '@/components/sections/TechStackSection';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#050816] text-[#F8FAFC]">
      {/* Top Sticky Navigation */}
      <Navbar />

      {/* Main Landing Page Content */}
      <main className="flex-1">
        <HeroSection />
        <AboutSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TechStackSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
