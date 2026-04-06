'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Globe, Cpu, FileBarChart2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { fadeUp, stagger } from '@/lib/animations';

const STEPS: { icon: LucideIcon; title: string; desc: string; detail: string }[] = [
  {
    icon: Globe,
    title: 'Enter the domain',
    desc: "Paste any website URL — yours, a client's or a competitor's.",
    detail: 'https://example.com',
  },
  {
    icon: Cpu,
    title: 'We run 19 checks',
    desc: 'SEO, DNS, security, performance, reputation and tech stack. All in parallel, in ~30 seconds.',
    detail: '19 checks · 6 categories · in parallel',
  },
  {
    icon: FileBarChart2,
    title: 'Get the diagnosis',
    desc: 'Score by category, AI-explained findings, and a prioritized action plan.',
    detail: 'Score · Claude Analysis · Remediation',
  },
];

export function HowItWorksAudit() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const lineRef = useRef<HTMLDivElement>(null);
  const lineInView = useInView(lineRef, { once: true, margin: '-100px' });

  return (
    <section
      id="como-audita"
      className="max-w-5xl mx-auto px-5"
      style={{ paddingTop: '120px', paddingBottom: '120px' }}
    >
      <motion.div
        ref={ref}
        variants={stagger(0.1)}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
      >
        <motion.p
          variants={fadeUp}
          className="text-[10px] font-bold uppercase tracking-[0.25em] mb-6"
          style={{ color: '#10b981', fontFamily: 'var(--font-geist-mono, monospace)' }}
        >
          HOW IT WORKS
        </motion.p>

        <motion.h2
          variants={fadeUp}
          className="font-bold mb-16 leading-tight tracking-tighter max-w-2xl"
          style={{ fontSize: 'clamp(28px, 4vw, 48px)', color: '#ffffff', letterSpacing: '-0.03em' }}
        >
          From URL to complete diagnosis
          <br />
          <span style={{ color: 'rgba(255,255,255,0.35)' }}>in three steps.</span>
        </motion.h2>
      </motion.div>

      {/* Desktop: horizontal connector line */}
      <div className="hidden md:block relative mb-0">
        {/* Track */}
        <div
          ref={lineRef}
          className="absolute top-5 left-[calc(16.666%-1px)] right-[calc(16.666%-1px)] h-px"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        />
        {/* Fill */}
        <motion.div
          className="absolute top-5 left-[calc(16.666%-1px)] h-px origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: lineInView ? 1 : 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: 'calc(100% - 33.333% + 2px)',
            background: '#10b981',
            transformOrigin: 'left',
          }}
        />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
        {STEPS.map(({ icon: Icon, title, desc, detail }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col"
          >
            {/* Number + icon */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 relative z-10"
                style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <Icon size={16} color="rgba(255,255,255,0.7)" strokeWidth={1.5} />
              </div>
              <span
                className="font-mono font-bold text-[11px]"
                style={{ color: 'rgba(255,255,255,0.2)' }}
              >
                0{i + 1}
              </span>
            </div>

            <h3 className="font-bold text-[17px] tracking-tight text-white mb-2">{title}</h3>
            <p className="text-[13px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {desc}
            </p>

            {/* Detail chip */}
            <div
              className="mt-auto inline-flex w-fit px-3 py-1.5 rounded-lg font-mono text-[11px]"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              {detail}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
