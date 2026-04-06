import type { Metadata } from 'next';
import { NavBar } from '@/components/landing/seo/NavBar';
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

// ── Site Auditor sections ────────────────────────────────────────────────────
import { AuditorHero } from '@/components/landing/seo/auditor/AuditorHero';
import { AuditInputSection } from '@/components/landing/seo/auditor/AuditInputSection';
import { ChecksGrid } from '@/components/landing/seo/auditor/ChecksGrid';
import { CheckCardMockup } from '@/components/landing/seo/auditor/CheckCardMockup';
import { HowItWorksAudit } from '@/components/landing/seo/auditor/HowItWorksAudit';
import { UseCases } from '@/components/landing/seo/auditor/UseCases';
import { AuditCtaSection } from '@/components/landing/seo/auditor/AuditCtaSection';

export const metadata: Metadata = {
  title: 'Noctra SEO — Auditoría técnica completa para cualquier sitio',
  description:
    'Analiza SEO, DNS, seguridad, rendimiento y tech stack de cualquier sitio web. 19 checks, análisis con IA, remediación priorizada.',
  openGraph: {
    title: 'Noctra SEO — Auditoría técnica completa',
    description: 'Entiende, optimiza y protege cualquier sitio web en segundos.',
    url: 'https://seo.noctra.studio',
    siteName: 'Noctra SEO',
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Noctra SEO — Auditoría técnica completa',
    description: 'Analiza SEO, DNS, seguridad y tech stack de cualquier sitio. 19 checks, análisis con Claude AI.',
  },
};

export default function LandingPage() {
  return (
    <>
      <NavBar />
      <main>
        {/* ── Site Auditor (nuevo módulo) ────────────────────────────────── */}
        <AuditorHero />
        <AuditInputSection />
        <ChecksGrid />
        <CheckCardMockup />
        <HowItWorksAudit />
        <UseCases />

        {/* Divider between auditor and platform sections */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', margin: '0 auto', maxWidth: '1280px' }} />

        {/* ── Plataforma de monitoreo (existente) ───────────────────────── */}
        <ProblemSection />
        <HowItWorksSection />
        <LiveDemoSection />
        <FeaturesSection />
        <AlertsSection />
        <ComparativaSection />
        <ForWhoSection />
        <PricingSection />

        {/* ── CTAs finales ──────────────────────────────────────────────── */}
        <AuditCtaSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
