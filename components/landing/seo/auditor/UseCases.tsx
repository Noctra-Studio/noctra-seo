'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Building2, Code2, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { fadeUp, stagger } from '@/lib/animations';

const CASES: { icon: LucideIcon; title: string; subtitle: string; body: string; points: string[] }[] = [
  {
    icon: Building2,
    title: 'Digital agencies',
    subtitle: 'Audit before you pitch',
    body: "Walk into meetings with concrete technical facts, not opinions. Show exactly what's broken and what it's costing the client.",
    points: [
      'Audit prospect sites before the proposal',
      'Catch issues before your client does',
      'Generate exportable reports with your branding',
    ],
  },
  {
    icon: Code2,
    title: 'Developers',
    subtitle: 'Validate before you ship',
    body: 'A complete security, DNS and performance checklist before every deploy. No more juggling 10 different tools.',
    points: [
      'Verify security headers and TLS in staging',
      'Confirm DNS setup after migrations',
      'Catch unnecessary redirects and long chains',
    ],
  },
  {
    icon: User,
    title: 'Business owners',
    subtitle: 'Understand your site without jargon',
    body: "Knowing your site's real health shouldn't require knowing what DNSSEC is. The AI analysis translates results into plain business language.",
    points: [
      'Simple 0–100 overall score',
      'Findings explained in terms of business impact',
      'Prioritized action plan for your technical team',
    ],
  },
];

export function UseCases() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      id="para-quien"
      className="max-w-6xl mx-auto px-5"
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
          WHO IT'S FOR
        </motion.p>

        <motion.h2
          variants={fadeUp}
          className="font-bold mb-16 leading-tight tracking-tighter max-w-2xl"
          style={{ fontSize: 'clamp(28px, 4vw, 48px)', color: '#ffffff', letterSpacing: '-0.03em' }}
        >
          Built for agencies, developers
          <br />
          <span style={{ color: 'rgba(255,255,255,0.35)' }}>and business owners.</span>
        </motion.h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CASES.map(({ icon: Icon, title, subtitle, body, points }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3 }}
            className="group p-8 rounded-3xl transition-all duration-300 flex flex-col"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)';
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
            }}
          >
            {/* Icon */}
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Icon size={18} color="rgba(255,255,255,0.7)" strokeWidth={1.5} />
            </div>

            <p
              className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1"
              style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-geist-mono, monospace)' }}
            >
              {subtitle}
            </p>
            <h3 className="font-bold text-[17px] tracking-tight text-white mb-3">{title}</h3>
            <p
              className="text-[13px] leading-relaxed mb-6 transition-colors group-hover:text-white/55"
              style={{ color: 'rgba(255,255,255,0.38)' }}
            >
              {body}
            </p>

            {/* Points */}
            <div className="mt-auto space-y-2">
              {points.map(point => (
                <div key={point} className="flex items-start gap-2.5">
                  <span
                    className="shrink-0 mt-1 w-1 h-1 rounded-full"
                    style={{ background: '#10b981' }}
                  />
                  <span className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {point}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
