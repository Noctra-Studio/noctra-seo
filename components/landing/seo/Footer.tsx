'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

const PRODUCT_LINKS = [
  { key: 'howItWorks', href: '#como-funciona' },
  { key: 'features', href: '#caracteristicas' },
  { key: 'alerts', href: '#alertas' },
  { key: 'forWho', href: '#para-quien' },
  { key: 'pricing', href: '#precios' },
];

const ECOSYSTEM_LINKS = [
  { label: 'Noctra Social ↗', href: 'https://social.noctra.studio' },
  { label: 'Noctra CRM ↗', href: 'https://crm.noctra.studio' },
  { label: 'Noctra Academy ↗', href: 'https://academy.noctra.studio' },
  { label: 'noctra.studio ↗', href: 'https://noctra.studio' },
];

export function Footer() {
  const t = useTranslations('landing');
  const locale = useLocale();

  return (
    <footer className="relative z-10" style={{ background: '#050505', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-24">
          {/* Col 1 — Logo + tagline */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 select-none group">
              <span className="font-bold text-xl tracking-tighter text-white">Noctra</span>
              <span className="font-mono text-[10px] border-l border-white/20 pl-2.5 uppercase tracking-[0.3em] font-bold" style={{ color: '#10b981' }}>
                SEO
              </span>
            </Link>
            <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {t('footer.tagline')}
            </p>
          </div>

          {/* Col 2 — Producto */}
          <div className="space-y-6">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-geist-mono, monospace)' }}>
              {t('footer.sections.product')}
            </p>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map(({ key, href }) => (
                <li key={key}>
                  <a
                    href={href}
                    className="text-[13px] transition-colors duration-200"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.color = '#ffffff'; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}
                  >
                    {t(`nav.${key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Noctra Studio */}
          <div className="space-y-6">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-geist-mono, monospace)' }}>
              {t('footer.sections.ecosystem')}
            </p>
            <ul className="space-y-3">
              {ECOSYSTEM_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] transition-colors duration-200"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.color = '#ffffff'; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Contacto */}
          <div className="space-y-6">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-geist-mono, monospace)' }}>
              {t('footer.sections.contact')}
            </p>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:hola@noctra.studio"
                  className="text-[13px] transition-colors duration-200"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.color = '#ffffff'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}
                >
                  hola@noctra.studio
                </a>
              </li>
              <li>
                <Link
                  href={`/${locale}/privacidad`}
                  className="text-[13px] transition-colors duration-200"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.color = '#ffffff'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}
                >
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/terminos`}
                  className="text-[13px] transition-colors duration-200"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.color = '#ffffff'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}
                >
                  {t('footer.terms')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-24 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.15)', fontFamily: 'var(--font-geist-mono, monospace)' }}>
              {t('footer.copyright')}
            </p>
            <span className="hidden sm:block w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.15)', fontFamily: 'var(--font-geist-mono, monospace)' }}>
              Diseñado en Querétaro con ☕
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.3em]">
            <Link href="/es" className="transition-colors" style={{ color: locale === 'es' ? '#ffffff' : 'rgba(255,255,255,0.2)' }}>ES</Link>
            <span style={{ color: 'rgba(255,255,255,0.05)' }}>/</span>
            <Link href="/en" className="transition-colors" style={{ color: locale === 'en' ? '#ffffff' : 'rgba(255,255,255,0.2)' }}>EN</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
