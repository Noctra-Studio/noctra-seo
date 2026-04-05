import type { Metadata } from 'next';
import { NavBar } from '@/components/landing/seo/NavBar';
import { HeroSection } from '@/components/landing/seo/HeroSection';
import { ProblemSection } from '@/components/landing/seo/ProblemSection';
import { HowItWorksSection } from '@/components/landing/seo/HowItWorksSection';
import { LiveDemoSection } from '@/components/landing/seo/LiveDemoSection';
import { FeaturesSection } from '@/components/landing/seo/FeaturesSection';
import { AlertsSection } from '@/components/landing/seo/AlertsSection';
import { ComparativaSection } from '@/components/landing/seo/ComparativaSection';
import { ForWhoSection } from '@/components/landing/seo/ForWhoSection';
import { PricingSection } from '@/components/landing/seo/PricingSection';
import { CtaSection } from '@/components/landing/seo/CtaSection';
import { Footer } from '@/components/landing/seo/Footer';

export const metadata: Metadata = {
  title: 'Noctra SEO — Inteligencia de Búsqueda para Agencias y SMBs',
  description:
    'Un tracker ligero en tu sitio. Métricas reales de SEO, velocidad y visibilidad en IA. Alertas con análisis de Claude que explican el problema, el impacto y cómo resolverlo.',
  openGraph: {
    title: 'Noctra SEO — Inteligencia de Búsqueda',
    description: 'Métricas reales de SEO + Core Web Vitals + GEO Intelligence. Alertas con IA que explican exactamente qué hacer.',
    url: 'https://seo.noctra.studio',
    siteName: 'Noctra SEO',
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Noctra SEO — Inteligencia de Búsqueda',
    description: 'Tracker ligero + alertas inteligentes con Claude. Para agencias y SMBs latinoamericanos.',
  },
};

export default function LandingPage() {
  return (
    <>
      <NavBar />
      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <LiveDemoSection />
        <FeaturesSection />
        <AlertsSection />
        <ComparativaSection />
        <ForWhoSection />
        <PricingSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
