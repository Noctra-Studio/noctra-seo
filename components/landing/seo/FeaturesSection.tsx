'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';

const FEATURES = [
  { icon: '⚡', title: 'Tracker de 8KB', desc: 'Sin cookies. Sin impacto en rendimiento. Compatible con cualquier CMS o framework. Instala en 30 segundos.', soon: false },
  { icon: '📄', title: 'Señales SEO en cada visita', desc: 'Detecta automáticamente: título, meta, H1, canonical, schema, og:image, indexabilidad — en cada pageview.', soon: false },
  { icon: '📊', title: 'CWV reales, no estimados', desc: 'LCP, CLS, INP medidos desde el browser real del usuario. P75 calculado como lo hace Google. Por página y dispositivo.', soon: false },
  { icon: '🤖', title: 'Visibilidad en IA', desc: 'Mide si tu dominio aparece en respuestas de ChatGPT, Gemini y Perplexity. Score por motor, tendencia, sentiment.', soon: false },
  { icon: '🔔', title: 'Alertas que explican', desc: 'Claude analiza cada alerta con el contexto de tu negocio. No solo te dice qué falló — te dice por qué importa y cómo resolverlo.', soon: false },
  { icon: '🔑', title: 'Keywords reales', desc: 'Conecta tu Search Console. Posiciones, CTR, impresiones y variación histórica — correlacionados con tus páginas.', soon: false },
  { icon: '🖱️', title: 'Scroll, tiempo y rebote', desc: 'Sabe hasta dónde leen tus páginas, cuánto tiempo pasan en ellas y desde qué canal llegan los que más convierten.', soon: false },
  { icon: '⚙️', title: 'La IA conoce tu negocio', desc: 'Configuras: tipo de negocio, objetivos, competidores, páginas prioritarias. Las alertas y recomendaciones se adaptan a ese contexto.', soon: false },
  { icon: '📋', title: 'Reportes para clientes', desc: 'Genera PDF con métricas seleccionadas. Comparte por URL pública sin que el cliente necesite login.', soon: true },
];

export function FeaturesSection() {
  const t = useTranslations('landing.features');
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const heading = t('heading').split('\n');

  return (
    <section id="caracteristicas" className="max-w-6xl mx-auto px-5" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      <p className="text-xs tracking-widest mb-6 uppercase font-medium" style={{ color: '#10b981', fontFamily: 'var(--font-geist-mono, monospace)' }}>
        {t('label')}
      </p>

      <h2
        className="font-bold mb-16 leading-tight tracking-tighter max-w-2xl"
        style={{ fontSize: 'clamp(28px, 4vw, 48px)', color: '#ffffff', letterSpacing: '-0.03em' }}
      >
        {heading.map((line, i) => <span key={i} className="block">{line}</span>)}
      </h2>

      <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((feature, i) => {
          const row = Math.floor(i / 3);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.08 + row * 0.1 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="group p-8 rounded-3xl transition-all duration-300 cursor-default"
              style={{
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.01)';
              }}
            >
              <div className="flex flex-col gap-5">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {feature.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-[15px] tracking-tight text-white">{feature.title}</h3>
                    {feature.soon && (
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest"
                        style={{ background: '#fcd34d', color: '#000000' }}
                      >
                        {t('comingSoon')}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] leading-relaxed text-white/40 group-hover:text-white/60 transition-colors">{feature.desc}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
