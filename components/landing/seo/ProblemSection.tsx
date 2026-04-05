'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';
import { stagger, slideRight } from '@/lib/animations';

export function ProblemSection() {
  const t = useTranslations('landing.problem');
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const pairs = t.raw('pairs') as Array<{ problem: string; solution: string }>;
  const heading = t('heading').split('\n');

  return (
    <section id="el-problema" className="max-w-3xl mx-auto px-5" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      <p className="text-xs tracking-widest mb-6 uppercase font-medium" style={{ color: '#10b981', fontFamily: 'var(--font-geist-mono, monospace)' }}>
        {t('label')}
      </p>

      <h2
        className="font-bold mb-12 leading-tight tracking-tighter"
        style={{ fontSize: 'clamp(28px, 4vw, 48px)', color: '#ffffff', letterSpacing: '-0.03em' }}
      >
        {heading.map((line, i) => <span key={i} className="block">{line}</span>)}
      </h2>

      <motion.div
        ref={ref}
        variants={stagger(0.1)}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
      >
        {pairs.map((pair, i) => (
          <motion.div
            key={i}
            variants={slideRight}
            className="py-6"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="text-sm font-medium mt-0.5" style={{ color: '#f87171' }}>✗</span>
              <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{pair.problem}</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-sm font-medium mt-0.5" style={{ color: '#4ade80' }}>✓</span>
              <p className="text-base font-medium leading-relaxed" style={{ color: '#ffffff' }}>{pair.solution}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
