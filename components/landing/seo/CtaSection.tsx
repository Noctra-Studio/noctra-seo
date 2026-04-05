'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { fadeUp, stagger } from '@/lib/animations';

export function CtaSection() {
  const t = useTranslations('landing.cta');
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const heading = t('heading').split('\n');

  return (
    <section
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingTop: '120px',
        paddingBottom: '120px',
      }}
    >
      <motion.div
        ref={ref}
        variants={stagger(0.1)}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        className="max-w-3xl mx-auto px-5 flex flex-col items-center text-center"
      >
        <motion.p
          variants={fadeUp}
          className="text-xs tracking-widest mb-6 uppercase font-medium"
          style={{ color: '#10b981', fontFamily: 'var(--font-geist-mono, monospace)' }}
        >
          {t('label')}
        </motion.p>

        <motion.h2
          variants={fadeUp}
          className="font-bold mb-5 leading-tight tracking-tighter"
          style={{ fontSize: 'clamp(32px, 5vw, 56px)', color: '#ffffff', letterSpacing: '-0.03em' }}
        >
          {heading.map((line, i) => <span key={i} className="block">{line}</span>)}
        </motion.h2>

        <motion.p
          variants={fadeUp}
          className="text-lg mb-10 max-w-md"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          {t('subheading')}
        </motion.p>

        <motion.div variants={fadeUp}>
          <Link
            href="/es/onboarding"
            className="relative inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold transition-all duration-300"
            style={{
              background: '#10b981',
              color: '#000000',
              boxShadow: '0 0 0 1px rgba(16,185,129,0.35), 0 18px 40px rgba(16,185,129,0.28)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = '#34d399';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 1px rgba(52,211,153,0.5), 0 22px 48px rgba(16,185,129,0.36)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = '#10b981';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 1px rgba(16,185,129,0.35), 0 18px 40px rgba(16,185,129,0.28)';
            }}
          >
            {t('button')} <ArrowRight size={18} />
          </Link>
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="text-xs mt-6 tracking-widest uppercase"
          style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-geist-mono, monospace)' }}
        >
          {t('trust')}
        </motion.p>
      </motion.div>
    </section>
  );
}
