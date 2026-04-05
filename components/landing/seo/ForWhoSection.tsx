'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';

export function ForWhoSection() {
  const t = useTranslations('landing.forWho');
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const cards = t.raw('cards') as Array<{ title: string; challenge: string; solution: string }>;
  const heading = t('heading').split('\n');

  return (
    <section id="para-quien" className="max-w-5xl mx-auto px-5" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      <p className="text-xs tracking-widest mb-6 uppercase font-medium" style={{ color: '#10b981', fontFamily: 'var(--font-geist-mono, monospace)' }}>
        {t('label')}
      </p>
      <h2
        className="font-bold mb-12 leading-tight tracking-tighter max-w-2xl"
        style={{ fontSize: 'clamp(28px, 4vw, 48px)', color: '#ffffff', letterSpacing: '-0.03em' }}
      >
        {heading.map((line, i) => <span key={i} className="block">{line}</span>)}
      </h2>

      <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="p-7 rounded-2xl transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)';
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
            }}
          >
            <h3 className="font-semibold text-lg mb-4" style={{ color: '#ffffff' }}>{card.title}</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium mt-0.5 shrink-0" style={{ color: '#f87171' }}>Reto</span>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{card.challenge}</p>
              </div>
              <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium mt-0.5 shrink-0" style={{ color: '#4ade80' }}>Solución</span>
                <p className="text-sm leading-relaxed font-medium" style={{ color: '#ffffff' }}>{card.solution}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
