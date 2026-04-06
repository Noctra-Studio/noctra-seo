'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { AuditInput } from './AuditInput';
import { fadeUp, stagger } from '@/lib/animations';

export function AuditCtaSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      style={{
        background: 'rgba(255,255,255,0.015)',
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
        className="max-w-2xl mx-auto px-5 flex flex-col items-center text-center"
      >
        <motion.p
          variants={fadeUp}
          className="text-[10px] font-bold uppercase tracking-[0.25em] mb-8"
          style={{ color: '#10b981', fontFamily: 'var(--font-geist-mono, monospace)' }}
        >
          SITE AUDITOR · NOCTRA SEO
        </motion.p>

        <motion.h2
          variants={fadeUp}
          className="font-bold mb-5 leading-tight tracking-tighter"
          style={{ fontSize: 'clamp(28px, 4.5vw, 52px)', color: '#ffffff', letterSpacing: '-0.03em' }}
        >
          Ready to understand how healthy your site is?
        </motion.h2>

        <motion.p
          variants={fadeUp}
          className="text-base mb-10 max-w-md"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          Enter any URL. The analysis takes less than a minute.
        </motion.p>

        <motion.div variants={fadeUp} className="w-full">
          <AuditInput size="large" buttonLabel="Analyze now" />
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="text-[11px] mt-6 tracking-[0.12em] uppercase font-mono"
          style={{ color: 'rgba(255,255,255,0.15)' }}
        >
          Part of the Noctra ecosystem · seo.noctra.studio
        </motion.p>
      </motion.div>
    </section>
  );
}
