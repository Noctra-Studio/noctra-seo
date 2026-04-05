'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ExternalLink, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

function useCountUp(target: number, active: boolean, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) { setValue(0); return; }
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [active, target, duration]);
  return value;
}

function TabOverview({ active }: { active: boolean }) {
  const score = useCountUp(87, active);
  const traffic = useCountUp(2847, active, 1000);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>SEO Score</p>
          <p className="font-mono font-bold text-3xl" style={{ color: '#4ade80' }}>{score}</p>
          <p className="text-xs mt-1" style={{ color: '#4ade80' }}>↑ +12 esta semana</p>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Core Web Vitals</p>
          {[
            { l: 'LCP', v: '1.8s', ok: true },
            { l: 'CLS', v: '0.04', ok: true },
            { l: 'INP', v: '180ms', ok: true },
          ].map(({ l, v, ok }) => (
            <div key={l} className="flex justify-between items-center text-xs font-mono my-0.5">
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>{l}</span>
              <span style={{ color: ok ? '#4ade80' : '#f87171' }}>{v} {ok ? '✓' : '✗'}</span>
            </div>
          ))}
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Tráfico orgánico</p>
          <p className="font-mono font-bold text-3xl" style={{ color: '#ffffff' }}>{traffic.toLocaleString()}</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>visitas · <span style={{ color: '#4ade80' }}>↑ +23% mensual</span></p>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
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
      <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Tráfico por canal — últimos 30 días</p>
        <div className="flex items-end gap-1 h-12">
          {[30,45,38,52,48,60,55,42,50,58,65,70,62,55,68,72,65,80,75,70,85,82,78,90,88,85,92,88,95,90].map((v, i) => (
            <div key={i} className="flex-1 rounded-sm" style={{ height: `${(v / 100) * 100}%`, background: i % 3 === 0 ? '#10b981' : i % 3 === 1 ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.15)' }} />
          ))}
        </div>
        <div className="flex gap-4 mt-2">
          {[{ l: 'Orgánico', c: '#4ade80' }, { l: 'Directo', c: '#10b981' }, { l: 'Referral', c: 'rgba(255,255,255,0.3)' }].map(({ l, c }) => (
            <div key={l} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <div className="w-2 h-2 rounded-full" style={{ background: c }} />
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabIssues() {
  const ISSUES = [
    { type: 'CRÍTICO', icon: XCircle, color: '#f87171', bg: 'rgba(248,113,113,0.06)', code: 'missing_h1', path: '/servicios/web-design', visits: '1,240 visitas/mes', detail: 'La página no tiene etiqueta H1' },
    { type: 'WARNING', icon: AlertTriangle, color: '#fcd34d', bg: 'rgba(252,211,77,0.06)', code: 'long_title', path: '/blog/seo-para-pymes', visits: '890 visitas/mes', detail: 'Título de 68 caracteres — Google trunca a ~60' },
    { type: 'WARNING', icon: AlertTriangle, color: '#fcd34d', bg: 'rgba(252,211,77,0.06)', code: 'missing_meta', path: '/precios', visits: '654 visitas/mes', detail: 'Sin meta description — Google generará una automáticamente' },
    { type: 'INFO', icon: Info, color: '#34d399', bg: 'rgba(52,211,153,0.06)', code: 'missing_schema', path: '/about', visits: '432 visitas/mes', detail: 'No se detectó structured data (JSON-LD)' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium" style={{ color: '#ffffff' }}>23 issues en 14 páginas</p>
        <div className="flex gap-1.5">
          {['Todos', 'Críticos 4', 'Warnings 12', 'Info 7'].map((f, i) => (
            <button key={f} className="text-xs px-2 py-1 rounded-full" style={{
              background: i === 0 ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: i === 0 ? '#ffffff' : 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              {f}
            </button>
          ))}
        </div>
      </div>
      {ISSUES.map(({ type, icon: Icon, color, bg, code, path, visits, detail }) => (
        <div key={code} className="p-4 rounded-xl" style={{ background: bg, border: `1px solid ${color}30` }}>
          <div className="flex items-start gap-3">
            <Icon size={14} style={{ color, marginTop: 2 }} className="shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold" style={{ color }}>{type}</span>
                <code className="text-xs font-mono" style={{ color: '#ffffff' }}>{code}</code>
              </div>
              <p className="text-xs font-mono mb-1" style={{ color: '#10b981' }}>{path}</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{detail}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-geist-mono, monospace)' }}>{visits}</span>
                <button className="text-xs" style={{ color: '#10b981' }}>Cómo resolverlo →</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TabAlert() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)' }}>
        <XCircle size={16} style={{ color: '#f87171' }} />
        <div>
          <p className="text-sm font-medium" style={{ color: '#ffffff' }}>LCP degradado</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>CRÍTICO · Detectado hace 2 horas</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Actual</p>
          <p className="font-mono font-bold text-2xl" style={{ color: '#f87171' }}>4.2s</p>
        </div>
        <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Umbral</p>
          <p className="font-mono font-bold text-2xl" style={{ color: 'rgba(255,255,255,0.4)' }}>2.5s</p>
        </div>
      </div>

      <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: '#10b981' }}>✦ ANÁLISIS IA</span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: '#ffffff' }}>
          "Tu LCP en mobile subió de 1.9s a 4.2s en las últimas 6 horas. Para una agencia digital como la tuya, esto afecta directamente tu ranking local."
        </p>
        <div className="space-y-1">
          {['📉 Ranking en Google (CWV es factor de posicionamiento)', '📈 Tasa de rebote en mobile (+15-20% est.)', '💰 Conversiones desde tráfico orgánico'].map(item => (
            <p key={item} className="text-xs flex items-start gap-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <span>{item}</span>
            </p>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {[
          { step: 1, effort: 'Fácil', effortColor: '#4ade80', instruction: 'Agrega loading="lazy" a imágenes below the fold', result: 'Reduce LCP estimado en 0.8-1.2s' },
          { step: 2, effort: 'Medio', effortColor: '#fcd34d', instruction: 'Mueve el CSS crítico a <style> inline en el <head>', result: 'Elimina render-blocking de 340ms' },
        ].map(({ step, effort, effortColor, instruction, result }) => (
          <div key={step} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>{step}</div>
              <div className="flex-1">
                <p className="text-xs" style={{ color: '#ffffff' }}>{instruction}</p>
                <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>→ {result}</p>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0" style={{ background: `${effortColor}15`, color: effortColor }}>{effort}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
          Marcar como reconocida
        </button>
        <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
          Ver página <ExternalLink size={11} />
        </button>
      </div>
    </div>
  );
}

export function LiveDemoSection() {
  const t = useTranslations('landing.demo');
  const [activeTab, setActiveTab] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const TABS = [t('tabs.overview'), t('tabs.issues'), t('tabs.alert')];
  const heading = t('heading').split('\n');

  return (
    <section id="demo" className="max-w-6xl mx-auto px-5" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      <div className="text-center mb-12">
        <p className="text-xs tracking-widest mb-4 uppercase font-medium" style={{ color: '#10b981', fontFamily: 'var(--font-geist-mono, monospace)' }}>
          {t('label')}
        </p>
        <h2 className="font-bold mb-4 leading-tight tracking-tighter" style={{ fontSize: 'clamp(28px, 4vw, 48px)', color: '#ffffff', letterSpacing: '-0.03em' }}>
          {heading.map((line, i) => <span key={i} className="block">{line}</span>)}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>{t('subheading')}</p>
      </div>

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl mx-auto rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {['#f87171', '#fcd34d', '#4ade80'].map(c => (
            <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c + '80' }} />
          ))}
          <span className="ml-2 text-xs font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>dashboard.noctra.studio</span>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className="flex-1 px-4 py-3 text-sm font-medium transition-colors relative"
              style={{ color: activeTab === i ? '#ffffff' : 'rgba(255,255,255,0.4)' }}
            >
              {tab}
              {activeTab === i && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-px"
                  style={{ background: '#10b981' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 0 && <TabOverview active={activeTab === 0 && inView} />}
              {activeTab === 1 && <TabIssues />}
              {activeTab === 2 && <TabAlert />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}
