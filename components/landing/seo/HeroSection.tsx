'use client';

import { useRef, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';
import { Check, ArrowRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';

function useCountUp(target: number, inView: boolean, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return value;
}

function HeroMetrics({ inView }: { inView: boolean }) {
  const seoScore = useCountUp(87, inView);
  const traffic = useCountUp(2847, inView, 1500);

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, scale: 0.97 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
      className="w-full max-w-2xl mx-auto mt-16 rounded-2xl overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
      style={{ background: '#0a0a0a' }}
    >
      <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
        <div className="flex gap-1.5">
          {['rgba(248,113,113,0.5)', 'rgba(252,211,77,0.5)', 'rgba(74,222,128,0.5)'].map(c => (
            <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
          ))}
        </div>
        <div className="flex-1 bg-white/5 rounded px-3 py-1 text-[10px] text-white/20 text-center mx-8 font-mono">
          dashboard.noctra.studio
        </div>
      </div>
      <div className="p-5 grid grid-cols-2 gap-3">
        {/* SEO Score */}
        <div className="p-4 rounded-xl bg-white/[0.04] border border-white/5">
          <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>SEO Score</p>
          <p className="font-mono font-bold text-3xl" style={{ color: '#4ade80' }}>{seoScore}</p>
          <p className="text-xs mt-1" style={{ color: '#4ade80' }}>↑ +12 esta semana</p>
        </div>
        {/* CWV */}
        <div className="p-4 rounded-xl bg-white/[0.04] border border-white/5">
          <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Core Web Vitals</p>
          {[{ l: 'LCP', v: '1.8s' }, { l: 'CLS', v: '0.04' }, { l: 'INP', v: '180ms' }].map(({ l, v }) => (
            <div key={l} className="flex justify-between items-center text-xs font-mono my-0.5">
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>{l}</span>
              <span style={{ color: '#4ade80' }}>{v} ✓</span>
            </div>
          ))}
        </div>
        {/* Traffic */}
        <div className="p-4 rounded-xl bg-white/[0.04] border border-white/5">
          <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Tráfico orgánico</p>
          <p className="font-mono font-bold text-3xl text-white">{traffic.toLocaleString()}</p>
          <p className="text-xs mt-1" style={{ color: '#4ade80' }}>↑ +23% mensual</p>
        </div>
        {/* Alerts */}
        <div className="p-4 rounded-xl bg-white/[0.04] border border-white/5">
          <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Alertas</p>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-bold text-2xl" style={{ color: '#4ade80' }}>0</span>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(74,222,128,0.08)', color: '#4ade80' }}>críticas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xl" style={{ color: '#fcd34d' }}>2</span>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(252,211,77,0.08)', color: '#fcd34d' }}>warnings</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function HeroSection() {
  const t = useTranslations('landing.hero');
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  const headline = t('headline').split('\n');
  const trustItems: string[] = (t.raw('trustItems') as string[] | undefined) ?? [];

  return (
    <section
      ref={ref}
      className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative overflow-hidden pt-36 md:pt-32"
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_60%)' }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-5xl mx-auto w-full">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="flex flex-col items-center gap-6 w-full"
        >
          {/* Badge */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: -8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
            className="flex items-center gap-2 rounded-full px-4 py-1.5"
            style={{ border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10b981' }} />
            <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold" style={{ color: '#10b981', fontFamily: 'var(--font-geist-mono, monospace)' }}>
              {t('label')}
            </span>
          </motion.div>

          {/* H1 — matches CRM text-5xl md:text-7xl lg:text-8xl */}
          <motion.h1
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22,1,0.36,1] } } }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tighter max-w-[16ch] md:max-w-5xl leading-[0.94] md:leading-[0.96] text-balance"
          >
            {headline.map((line, i) => (
              <span key={i} className="block">{line}</span>
            ))}
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
            className="text-base sm:text-lg md:text-xl max-w-[34rem] md:max-w-2xl leading-relaxed text-balance"
            style={{ color: 'rgba(163,163,163,1)' }}
          >
            {t('subheadline')}
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1 } } }}
            className="flex flex-col sm:flex-row items-center gap-4 flex-wrap justify-center w-full"
          >
            <Link
              href="/es/onboarding"
              className="flex items-center justify-center gap-2 rounded-full h-12 px-10 text-[13px] font-bold uppercase tracking-widest transition-all duration-300 w-full sm:w-auto bg-white text-black hover:bg-white/90 active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.15)]"
            >
              {t('ctaPrimary')} <ArrowRight size={16} />
            </Link>
            <a
              href="#como-funciona"
              className="flex items-center justify-center gap-2 rounded-full h-12 px-10 text-[13px] font-bold uppercase tracking-widest transition-all duration-300 w-full sm:w-auto border border-white/10 text-white/40 hover:text-white hover:border-white/40 active:scale-95"
            >
              {t('ctaSecondary')} <ChevronDown size={14} />
            </a>
          </motion.div>

          {/* Trust indicators */}
          {trustItems.length > 0 && (
            <motion.div
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4 } } }}
              className="flex items-center flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-medium pt-2"
              style={{ color: 'rgba(163,163,163,1)' }}
            >
              {trustItems.map((item, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <Check size={14} style={{ color: '#10b981' }} /> {item}
                </span>
              ))}
            </motion.div>
          )}

          {/* Dashboard preview */}
          <HeroMetrics inView={inView} />
        </motion.div>
      </div>
    </section>
  );
}
