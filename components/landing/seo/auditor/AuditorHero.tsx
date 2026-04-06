'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { AuditInput } from './AuditInput';
import { fadeUp, stagger } from '@/lib/animations';
import { ChevronDown } from 'lucide-react';

const TERMINAL_LINES = [
  { symbol: '✓', label: 'SSL chain',        detail: 'valid, expires in 312 days',     color: '#4ade80' },
  { symbol: '✓', label: 'robots.txt',       detail: 'found, 3 Disallow rules',        color: '#4ade80' },
  { symbol: '✓', label: 'HSTS',             detail: 'enabled, max-age=31536000',      color: '#4ade80' },
  { symbol: '⚠', label: 'Security headers', detail: 'score 62/100',                  color: '#fcd34d' },
  { symbol: '✗', label: 'DNSSEC',           detail: 'not configured',                 color: '#f87171' },
  { symbol: '✓', label: 'Sitemap XML',      detail: '247 URLs indexed',               color: '#4ade80' },
  { symbol: '⚠', label: 'Redirect chain',  detail: '3 hops detected',                color: '#fcd34d' },
];

const LINE_DELAY_MS = 600;
const PAUSE_MS = 2800;

function TerminalLine({ symbol, label, detail, color, visible }: {
  symbol: string; label: string; detail: string; color: string; visible: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={visible ? { opacity: 1, x: 0 } : { opacity: 0, x: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex items-center gap-3 font-mono text-[12px] sm:text-[13px]"
    >
      <span style={{ color, minWidth: '12px', textAlign: 'center', fontSize: '11px' }}>{symbol}</span>
      <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{label}</span>
      <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>
      <span style={{ color: 'rgba(255,255,255,0.45)' }}>{detail}</span>
    </motion.div>
  );
}

function AnimatedTerminal() {
  const [visibleCount, setVisibleCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let count = 0;

    function tick() {
      count++;
      setVisibleCount(count);

      if (count < TERMINAL_LINES.length) {
        timerRef.current = setTimeout(tick, LINE_DELAY_MS);
      } else {
        // Pause then restart
        timerRef.current = setTimeout(() => {
          count = 0;
          setVisibleCount(0);
          timerRef.current = setTimeout(tick, LINE_DELAY_MS);
        }, PAUSE_MS);
      }
    }

    timerRef.current = setTimeout(tick, 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <div
      className="w-full max-w-xl mx-auto rounded-2xl overflow-hidden"
      style={{
        background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 40px 80px rgba(0,0,0,0.7)',
      }}
    >
      {/* Window chrome */}
      <div
        className="flex items-center gap-3 px-5 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex gap-1.5">
          {['rgba(248,113,113,0.45)', 'rgba(252,211,77,0.45)', 'rgba(74,222,128,0.45)'].map(c => (
            <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
          ))}
        </div>
        <div
          className="flex-1 rounded px-4 py-1 text-center"
          style={{
            background: 'rgba(255,255,255,0.04)',
            fontFamily: 'var(--font-geist-mono, monospace)',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.2)',
          }}
        >
          noctra — audit — seo.noctra.studio
        </div>
        {/* Running indicator */}
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#10b981' }}
          />
          <span
            style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: '9px', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.15em' }}
          >
            running
          </span>
        </div>
      </div>

      {/* Terminal body */}
      <div className="p-6 space-y-3 min-h-[200px]">
        <div
          className="font-mono text-[10px] mb-4"
          style={{ color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}
        >
          $ noctra audit https://example.com
        </div>

        <div className="space-y-2.5">
          {TERMINAL_LINES.map((line, i) => (
            <TerminalLine key={i} {...line} visible={i < visibleCount} />
          ))}
        </div>

        {/* Cursor */}
        {visibleCount >= TERMINAL_LINES.length && (
          <div className="flex items-center gap-2 mt-3">
            <span className="font-mono text-[12px]" style={{ color: '#10b981' }}>
              Score: 74/100
            </span>
            <span
              className="inline-block w-1.5 h-4 animate-pulse"
              style={{ background: 'rgba(255,255,255,0.5)' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function AuditorHero() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <section
      id="auditor"
      ref={ref}
      className="relative overflow-hidden flex flex-col items-center justify-center text-center px-5"
      style={{ paddingTop: '160px', paddingBottom: '100px' }}
    >
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16,185,129,0.04), transparent)' }}
      />

      <motion.div
        variants={stagger(0.1)}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        className="relative z-10 flex flex-col items-center gap-8 max-w-4xl w-full mx-auto"
      >
        {/* Eyebrow */}
        <motion.div variants={fadeUp}>
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5"
            style={{ border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#10b981' }}
            />
            <span
              className="text-[10px] uppercase tracking-[0.25em] font-bold"
              style={{ color: '#10b981', fontFamily: 'var(--font-geist-mono, monospace)' }}
            >
              NOCTRA SEO · TECHNICAL AUDIT
            </span>
          </div>
        </motion.div>

        {/* H1 */}
        <motion.h1
          variants={fadeUp}
          className="font-bold text-white leading-[0.95] tracking-tighter text-balance max-w-3xl"
          style={{ fontSize: 'clamp(36px, 6vw, 72px)', letterSpacing: '-0.035em' }}
        >
          Understand, optimize and secure any site.{' '}
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>In seconds.</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          variants={fadeUp}
          className="text-base sm:text-lg leading-relaxed text-balance max-w-2xl"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          Complete technical analysis: SEO, DNS, security, performance and tech stack.
          With AI interpretation and prioritized remediation steps.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <a
            href="#input-auditor"
            className="flex items-center gap-2 rounded-full font-bold uppercase tracking-widest transition-all duration-200 active:scale-95"
            style={{
              background: '#ffffff',
              color: '#000000',
              padding: '14px 32px',
              fontSize: '11px',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.88)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#ffffff'; }}
          >
            Analyze a site
          </a>
          <a
            href="#como-audita"
            className="flex items-center gap-2 rounded-full font-bold uppercase tracking-widest transition-all duration-200 active:scale-95"
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.4)',
              padding: '14px 32px',
              fontSize: '11px',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = '#ffffff';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.35)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          >
            See how it works <ChevronDown size={13} />
          </a>
        </motion.div>

        {/* Terminal */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 24, scale: 0.98 },
            visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] } },
          }}
          className="w-full mt-4"
        >
          <AnimatedTerminal />
        </motion.div>
      </motion.div>
    </section>
  );
}
