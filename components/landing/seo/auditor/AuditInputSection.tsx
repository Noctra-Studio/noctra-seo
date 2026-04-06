'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { AuditInput } from './AuditInput';
import { fadeUp, stagger } from '@/lib/animations';

export function AuditInputSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section
      id="input-auditor"
      style={{
        paddingTop: '80px',
        paddingBottom: '80px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(255,255,255,0.01)',
      }}
    >
      <motion.div
        ref={ref}
        variants={stagger(0.1)}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        className="max-w-2xl mx-auto px-5 flex flex-col items-center gap-6 text-center"
      >
        <motion.p
          variants={fadeUp}
          className="text-[10px] font-bold uppercase tracking-[0.25em]"
          style={{ color: '#10b981', fontFamily: 'var(--font-geist-mono, monospace)' }}
        >
          FREE ANALYSIS
        </motion.p>

        <motion.h2
          variants={fadeUp}
          className="font-bold tracking-tighter leading-tight"
          style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', color: '#ffffff', letterSpacing: '-0.03em' }}
        >
          Enter any URL and get the complete diagnosis.
        </motion.h2>

        <motion.div variants={fadeUp} className="w-full">
          <AuditInput size="large" buttonLabel="Analyze now" />
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="text-[11px] font-mono"
          style={{ color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}
        >
          Complete analysis in ~30 seconds · 19 checks · No sign-up required for preview
        </motion.p>
      </motion.div>
    </section>
  );
}
