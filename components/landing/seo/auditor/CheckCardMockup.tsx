'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { fadeUp, stagger } from '@/lib/animations';

// ── Static mockup of a single enriched AuditCheck ──────────────────────────

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex-1 h-1 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span
        className="font-mono font-bold text-[13px] w-8 text-right shrink-0"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}

export function CheckCardMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section
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
          AI ANALYSIS
        </motion.p>

        <motion.h2
          variants={fadeUp}
          className="font-bold mb-6 leading-tight tracking-tighter max-w-2xl"
          style={{ fontSize: 'clamp(28px, 4vw, 48px)', color: '#ffffff', letterSpacing: '-0.03em' }}
        >
          Every finding comes with context
          <br />
          <span style={{ color: 'rgba(255,255,255,0.35)' }}>and clear instructions.</span>
        </motion.h2>

        <motion.p
          variants={fadeUp}
          className="text-base leading-relaxed mb-16 max-w-xl"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          Not just pass/fail. Each check includes a 0–100 score, a summary in business
          impact terms, and action steps ordered by priority.
        </motion.p>

        {/* 3-column value props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px mb-16"
          style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' }}
        >
          {[
            { num: '01', label: 'Score by category', desc: 'Not just pass/fail. A 0–100 score per group to track over time.' },
            { num: '02', label: "Claude's interpretation", desc: 'Each issue explained in business impact terms. No technical jargon.' },
            { num: '03', label: 'Prioritized steps', desc: 'Actions ordered by impact: high, medium, low priority. Always clear what to fix first.' },
          ].map(({ num, label, desc }) => (
            <motion.div
              key={num}
              variants={fadeUp}
              className="p-8"
              style={{ background: '#000000' }}
            >
              <p
                className="font-mono text-[11px] font-bold mb-3"
                style={{ color: 'rgba(255,255,255,0.15)' }}
              >
                {num}
              </p>
              <h4 className="font-bold text-[15px] tracking-tight text-white mb-2">{label}</h4>
              <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Static check card mockup */}
        <motion.div variants={fadeUp}>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.25em] mb-6"
            style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-geist-mono, monospace)' }}
          >
            EJEMPLO — CHECK: SECURITY HEADERS
          </p>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0a0a0a' }}
          >
            {/* Card header */}
            <div
              className="flex items-center gap-4 px-6 py-5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] shrink-0"
                style={{ background: 'rgba(252,211,77,0.1)', border: '1px solid rgba(252,211,77,0.2)' }}
              >
                ⚠
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold text-[15px] text-white tracking-tight">Security Headers</span>
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest"
                    style={{ background: 'rgba(252,211,77,0.1)', color: '#fcd34d', border: '1px solid rgba(252,211,77,0.2)' }}
                  >
                    warn
                  </span>
                </div>
                <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  group: security
                </p>
              </div>
              {/* Score */}
              <div className="text-right shrink-0">
                <div className="font-mono font-bold text-2xl" style={{ color: '#fcd34d' }}>62</div>
                <div className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>/ 100</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x"
              style={{ '--tw-divide-opacity': '1', borderColor: 'rgba(255,255,255,0.06)' } as React.CSSProperties}
            >
              {/* Score breakdown */}
              <div className="px-6 py-5 space-y-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-geist-mono, monospace)' }}>
                  Score breakdown
                </p>
                {[
                  { label: 'CSP', score: 0, note: 'missing' },
                  { label: 'X-Frame-Options', score: 20, note: 'SAMEORIGIN' },
                  { label: 'X-Content-Type', score: 20, note: 'nosniff' },
                  { label: 'Referrer-Policy', score: 15, note: 'origin' },
                  { label: 'Permissions-Policy', score: 0, note: 'missing' },
                ].map(({ label, score, note }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
                      <span className="font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{note}</span>
                    </div>
                    <ScoreBar
                      value={score}
                      color={score >= 15 ? '#4ade80' : '#f87171'}
                    />
                  </div>
                ))}
              </div>

              {/* AI summary */}
              <div className="px-6 py-5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-geist-mono, monospace)' }}>
                  AI Interpretation
                </p>
                <div
                  className="text-[13px] leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.55)' }}
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full mr-2 mb-0.5"
                    style={{ background: '#10b981' }}
                  />
                  Your site has no Content Security Policy configured. This leaves pages
                  exposed to XSS attacks — the most common cause of session hijacking
                  and user data theft in web applications.
                </div>

                <div
                  className="mt-4 pt-4 text-[12px]"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.15)', fontFamily: 'var(--font-geist-mono, monospace)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                    Generado por Claude Sonnet
                  </span>
                </div>
              </div>

              {/* Recommendations */}
              <div className="px-6 py-5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-geist-mono, monospace)' }}>
                  Remediation steps
                </p>
                <div className="space-y-3">
                  {[
                    {
                      priority: 'high',
                      color: '#f87171',
                      bg: 'rgba(248,113,113,0.08)',
                      border: 'rgba(248,113,113,0.2)',
                      action: "Add Content-Security-Policy: default-src 'self' to your server or CDN headers.",
                    },
                    {
                      priority: 'medium',
                      color: '#fcd34d',
                      bg: 'rgba(252,211,77,0.08)',
                      border: 'rgba(252,211,77,0.2)',
                      action: "Add Permissions-Policy: camera=(), microphone=(), geolocation=() to restrict browser APIs.",
                    },
                    {
                      priority: 'low',
                      color: 'rgba(255,255,255,0.3)',
                      bg: 'rgba(255,255,255,0.03)',
                      border: 'rgba(255,255,255,0.08)',
                      action: "Consider adding X-XSS-Protection: 0 to disable compatibility mode in legacy browsers.",
                    },
                  ].map(({ priority, color, bg, border, action }) => (
                    <div key={priority} className="flex gap-3 items-start">
                      <span
                        className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shrink-0 mt-0.5"
                        style={{ background: bg, color, border: `1px solid ${border}` }}
                      >
                        {priority}
                      </span>
                      <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {action}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
