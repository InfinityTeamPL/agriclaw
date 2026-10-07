import { LandingNav } from '@/components/landing/LandingNav';
import { Hero } from '@/components/landing/Hero';
import { SatelliteSection } from '@/components/landing/SatelliteSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Features } from '@/components/landing/Features';
import { DataSources } from '@/components/landing/DataSources';
import { Cta } from '@/components/landing/Cta';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { manrope, playfair } from '@/components/landing/fonts';

// Landing w stylu „filmowym": ciemne tło, zdjęcie pola w hero, wielka typografia.
// Animacja satelity (SatelliteScanner) siedzi w SatelliteSection.
export default function LandingPage() {
  return (
    <main
      className={`${manrope.variable} ${playfair.variable} min-h-screen bg-[#101b13] text-[#f1f4e9]`}
    >
      <LandingNav />
      <Hero />
      <SatelliteSection />
      <HowItWorks />
      <Features />
      <DataSources />
      <Cta />
      <LandingFooter />
    </main>
  );
}
