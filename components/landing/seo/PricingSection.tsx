'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { Check } from 'lucide-react';

export function PricingSection() {
  const t = useTranslations('landing.pricing');
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const plans = t.raw('plans') as Array<{
    name: string; price: string; period: string;
    features: string[]; cta: string; highlighted?: boolean;
  }>;
  const ctas = t.raw('cta') as Record<string, string>;

  return (
    <section id="precios" className="max-w-6xl mx-auto px-5" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      <p className="text-xs tracking-widest mb-6 uppercase font-medium" style={{ color: '#10b981', fontFamily: 'var(--font-geist-mono, monospace)' }}>
        {t('label')}
      </p>
      <h2
        className="font-bold mb-4 leading-tight tracking-tighter"
        style={{ fontSize: 'clamp(28px, 4vw, 48px)', color: '#ffffff', letterSpacing: '-0.03em' }}
      >
        {t('heading')}
      </h2>

      {/* Honest note */}
      <div
        className="max-w-xl p-4 rounded-xl mb-12 text-sm leading-relaxed"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
      >
        {t('note')}
      </div>

      <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className={`relative p-8 rounded-3xl flex flex-col transition-all duration-300 ${plan.highlighted ? "shadow-[0_20px_80px_rgba(255,255,255,0.05)]" : ""}`}
            style={{
              background: plan.highlighted ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.01)",
              border: plan.highlighted ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.05)",
            }}
          >
            {plan.highlighted && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap uppercase tracking-[0.2em]"
                style={{ background: "#ffffff", color: "#000000" }}
              >
                {t("mostPopular")}
              </div>
            )}

            <div className="mb-6">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>{plan.name}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono font-bold text-4xl text-white">{plan.price}</span>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>{plan.period}</span>
              </div>
              {plan.highlighted && (
                <p className="text-[11px] mt-2 font-bold uppercase tracking-widest" style={{ color: "#10b981" }}>{t("trialNote")}</p>
              )}
            </div>

            <ul className="space-y-3.5 flex-1 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: plan.highlighted ? "#10b981" : "rgba(255,255,255,0.2)" }} />
                  <p className="text-[13px] leading-snug" style={{ color: "rgba(255,255,255,0.5)" }}>{feature}</p>
                </li>
              ))}
            </ul>

            <Link
              href="/es/onboarding"
              className="block text-center py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-200"
              style={{
                background: plan.highlighted ? "#ffffff" : "transparent",
                border: plan.highlighted ? "none" : "1px solid rgba(255,255,255,0.1)",
                color: plan.highlighted ? "#000000" : "rgba(255,255,255,0.4)",
              }}
              onMouseEnter={(e) => {
                if (plan.highlighted) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.9)";
                else {
                  (e.currentTarget as HTMLElement).style.color = "#ffffff";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (plan.highlighted) (e.currentTarget as HTMLElement).style.background = "#ffffff";
                else {
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                }
              }}
            >
              {ctas[plan.cta]}
            </Link>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-geist-mono, monospace)' }}>
        {t('currencyNote')}
      </p>
    </section>
  );
}
