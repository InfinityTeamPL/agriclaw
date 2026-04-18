import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { DataSources } from '@/components/landing/DataSources';
import { Cta } from '@/components/landing/Cta';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <div id="jak">
        <HowItWorks />
      </div>
      <Features />
      <DataSources />
      <Cta />
      <Footer />
    </main>
  );
}
