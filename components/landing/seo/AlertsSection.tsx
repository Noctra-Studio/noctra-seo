'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence, useInView } from 'framer-motion';

const ALERT_STATES = [
  {
    channel: '📧 Email',
    title: 'Noctra SEO Alert',
    content: (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span style={{ color: '#fcd34d' }}>⚠</span>
          <span className="text-sm font-medium" style={{ color: '#ffffff' }}>LCP degradado en /servicios/</span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Tu LCP en mobile subió a 4.2s. Para una agencia digital, esto afecta tu ranking local en Querétaro.
        </p>
        <div className="space-y-1 mt-2">
          <p className="text-xs" style={{ color: '#ffffff' }}>Pasos para resolver:</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>1. loading="lazy" en imágenes (Fácil)</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>2. CSS crítico inline (Medio)</p>
        </div>
        <button className="text-xs mt-2" style={{ color: '#10b981' }}>Ver en dashboard →</button>
      </div>
    ),
  },
  {
    channel: '🔔 Push',
    title: 'Noctra SEO',
    content: (
      <div className="space-y-2">
        <p className="text-sm font-medium" style={{ color: '#ffffff' }}>CLS crítico en /blog/seo-para-pymes</p>
        <p className="text-xs font-mono" style={{ color: '#f87171' }}>CLS: 0.31 · Umbral: 0.1</p>
        <button className="text-xs" style={{ color: '#10b981' }}>Ver análisis completo →</button>
      </div>
    ),
  },
  {
    channel: '💬 WhatsApp',
    title: 'Noctra SEO · ahora',
    content: (
      <div className="space-y-2">
        <p className="text-sm" style={{ color: '#f87171' }}>🔴 Alerta crítica: SEO Score cayó a 48</p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>en /precios (antes: 72)</p>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Impacto: Posicionamiento para "precios agencia web" en riesgo.
        </p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Causa: 3 issues críticos nuevos (missing H1, noindex, no canonical)
        </p>
        <button className="text-xs" style={{ color: '#10b981' }}>Ver solución completa →</button>
      </div>
    ),
  },
];

const CHANNELS = [
  { icon: '📧', label: 'Email — alertas críticas inmediatas + digest diario' },
  { icon: '💬', label: 'WhatsApp — para quien necesita saber en el momento' },
  { icon: '#', label: 'Slack — integración directa a tu canal de equipo' },
  { icon: '🔔', label: 'Push — notificaciones en el browser' },
];

export function AlertsSection() {
  const t = useTranslations('landing.alerts');
  const [currentState, setCurrentState] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const heading = t('heading').split('\n');

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      setCurrentState(s => (s + 1) % ALERT_STATES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [inView]);

  return (
    <section
      id="alertas"
      className="relative z-10"
      style={{
        background: '#050505',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        paddingTop: '120px',
        paddingBottom: '120px',
      }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 items-center">
          {/* Left — copy */}
          <div>
            <p className="text-[11px] tracking-[0.2em] mb-6 uppercase font-bold" style={{ color: '#10b981', fontFamily: 'var(--font-geist-mono, monospace)' }}>
              {t('label')}
            </p>
            <h2
              className="font-bold mb-8 leading-[0.95] tracking-tighter"
              style={{ fontSize: 'clamp(32px, 4.5vw, 56px)', color: '#ffffff' }}
            >
              {heading.map((line, i) => <span key={i} className="block">{line}</span>)}
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {t('para1')}
            </p>
            <p className="text-lg leading-relaxed font-bold mb-10" style={{ color: '#ffffff' }}>
              {t('para2')}
            </p>

            <div className="space-y-4 mb-10">
              {CHANNELS.map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm shrink-0" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {icon}
                  </div>
                  <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-geist-mono, monospace)' }}>→ {t('criticalLabel')}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-geist-mono, monospace)' }}>→ {t('warningLabel')}</p>
            </div>
          </div>

          {/* Right — animated alert states */}
          <div ref={ref}>
            <div className="flex flex-wrap gap-2 mb-6">
              {ALERT_STATES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentState(i)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300"
                  style={{
                    background: currentState === i ? '#ffffff' : 'rgba(255,255,255,0.03)',
                    color: currentState === i ? '#000000' : 'rgba(255,255,255,0.4)',
                    border: `1px solid ${currentState === i ? '#ffffff' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  {s.channel}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentState}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="p-8 rounded-[32px] overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-3 mb-6 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#f87171' }} />
                  <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {ALERT_STATES[currentState].title}
                  </span>
                </div>
                <div>
                  {ALERT_STATES[currentState].content}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex gap-2 mt-8 justify-center">
              {ALERT_STATES.map((_, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: currentState === i ? '32px' : '8px',
                    background: currentState === i ? '#ffffff' : 'rgba(255,255,255,0.1)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
