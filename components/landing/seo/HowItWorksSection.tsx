'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';

const DATA_PILLS = ['📄 SEO Signals', '⚡ Core Web Vitals', '🖱️ Comportamiento', '📡 Canal'];

type Step = { number: string; title: string; desc: string };

function StepItem({ step, i }: { step: Step; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -8 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
      transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
      className="relative pl-12"
    >
      {/* Number circle */}
      <div
        className="absolute left-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-mono font-bold"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }}
      >
        {step.number}
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2" style={{ color: '#ffffff' }}>{step.title}</h3>
        <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{step.desc}</p>

        {/* Step 1 — code snippet */}
        {i === 0 && (
          <div
            className="mt-4 p-4 rounded-xl text-xs font-mono overflow-x-auto"
            style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.08)', color: '#4ade80' }}
          >
            {'<script defer\n  src="cdn.noctra.studio/tracker.js"\n  data-site-id="abc123xyz">\n</script>'}
          </div>
        )}

        {/* Step 2 — data pills */}
        {i === 1 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {DATA_PILLS.map((pill, pi) => (
              <motion.span
                key={pill}
                initial={{ opacity: 0, y: 8 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                transition={{ delay: 0.2 + pi * 0.08 }}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }}
              >
                {pill}
              </motion.span>
            ))}
          </div>
        )}

        {/* Step 3 — issue card */}
        {i === 2 && (
          <div
            className="mt-4 p-3 rounded-xl flex items-center gap-3 text-sm"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span style={{ color: '#fcd34d' }}>⚠</span>
            <code className="font-mono text-xs" style={{ color: '#ffffff' }}>missing_h1</code>
            <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>CRÍTICO</span>
            <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>/servicios/</span>
            <span className="text-xs ml-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>847 visitas/mes</span>
          </div>
        )}

        {/* Step 4 — alert card preview */}
        {i === 3 && (
          <div
            className="mt-4 p-4 rounded-xl text-sm space-y-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#f87171' }} />
              <span className="font-medium text-xs" style={{ color: '#ffffff' }}>LCP degradado — /servicios/web-design</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
              "Tu LCP subió a 4.2s. Para una agencia digital, esto afecta tu ranking local en Querétaro."
            </p>
            <div className="text-xs" style={{ color: '#10b981' }}>Ver pasos para resolver →</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function HowItWorksSection() {
  const t = useTranslations('landing.howItWorks');
  const lineRef = useRef<HTMLDivElement>(null);
  const lineInView = useInView(lineRef, { once: true, margin: '-100px' });

  const steps = t.raw('steps') as Step[];
  const heading = t('heading').split('\n');

  return (
    <section id="como-funciona" className="max-w-3xl mx-auto px-5" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      <p className="text-xs tracking-widest mb-6 uppercase font-medium" style={{ color: '#10b981', fontFamily: 'var(--font-geist-mono, monospace)' }}>
        {t('label')}
      </p>

      <h2
        className="font-bold mb-16 leading-tight tracking-tighter"
        style={{ fontSize: 'clamp(28px, 4vw, 48px)', color: '#ffffff', letterSpacing: '-0.03em' }}
      >
        {heading.map((line, i) => <span key={i} className="block">{line}</span>)}
      </h2>

      <div className="relative">
        {/* Vertical line track */}
        <div
          className="absolute left-[19px] top-0 w-px"
          style={{ height: '100%', background: 'rgba(255,255,255,0.06)' }}
        />
        {/* Animated line fill */}
        <motion.div
          ref={lineRef}
          className="absolute left-[19px] top-0 w-px origin-top"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: lineInView ? 1 : 0 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: '100%', background: '#10b981', transformOrigin: 'top' }}
        />

        <div className="space-y-12">
          {steps.map((step, i) => (
            <StepItem key={i} step={step} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
