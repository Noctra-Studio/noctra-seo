'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const NAV_LINKS = [
  { key: 'howItWorks', href: '#como-funciona' },
  { key: 'features', href: '#caracteristicas' },
  { key: 'alerts', href: '#alertas' },
  { key: 'forWho', href: '#para-quien' },
  { key: 'pricing', href: '#precios' },
];

export function NavBar() {
  const t = useTranslations('landing.nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const switchLanguage = () => {
    const newLocale = locale === 'es' ? 'en' : 'es';
    let newPath = pathname;
    if (pathname.startsWith(`/${locale}`)) {
      newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    } else {
      newPath = `/${newLocale}${pathname === '/' ? '' : pathname}`;
    }
    const hash = window.location.hash;
    router.push(`${newPath}${hash}`);
  };

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Desktop — floating pill, max-w-[1280px] matches CRM */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          className="pointer-events-auto w-full max-w-[1280px] mx-6 mt-6 hidden md:block"
        >
          <div
            className="flex items-center justify-between px-8 h-[60px] rounded-full transition-all duration-300"
            style={{
              background: scrolled ? 'rgba(5,5,5,0.85)' : 'rgba(5,5,5,0)',
              backdropFilter: scrolled ? 'blur(16px)' : 'none',
              border: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
            }}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 select-none">
              <Image src="/noctra-navbar-dark.svg" alt="Noctra" width={100} height={28} className="h-6 w-auto" priority />
              <span className="font-mono text-[10px] border-l border-white/20 pl-3 uppercase tracking-[0.3em] font-bold" style={{ color: '#10b981' }}>
                SEO
              </span>
            </Link>

            {/* Nav links */}
            <nav className="flex items-center gap-8">
              {NAV_LINKS.map(({ key, href }) => (
                <a
                  key={key}
                  href={href}
                  className="text-[10px] font-bold uppercase tracking-widest transition-colors duration-150"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.color = '#ffffff'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}
                >
                  {t(key)}
                </a>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-6">
              <button
                onClick={switchLanguage}
                className="text-[10px] font-bold uppercase tracking-[0.3em] transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}
                aria-label="Switch language"
              >
                {locale === 'es' ? 'EN' : 'ES'}
              </button>
              <Link
                href="/es/login"
                className="flex items-center justify-center px-8 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors duration-200"
                style={{ background: '#ffffff', color: '#000000' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.85)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#ffffff'; }}
              >
                {t('login')}
              </Link>
            </div>
          </div>
        </motion.header>
      </div>

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-16 md:hidden">
        <Link href="/" className="flex items-center gap-2.5 select-none">
          <Image src="/noctra-navbar-dark.svg" alt="Noctra" width={90} height={26} className="h-5 w-auto" priority />
          <span className="font-mono text-[9px] border-l border-white/20 pl-2.5 uppercase tracking-[0.3em] font-bold" style={{ color: '#10b981' }}>
            SEO
          </span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="w-11 h-11 flex items-center justify-center rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          aria-label={t('menuOpen')}
        >
          <div className="w-5 h-[14px] flex flex-col justify-between">
            <span className="w-full h-[1.5px] bg-white rounded-full" />
            <span className="w-full h-[1.5px] bg-white rounded-full" />
            <span className="w-full h-[1.5px] bg-white rounded-full" />
          </div>
        </button>
      </div>

      {/* Mobile fullscreen overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[60] flex flex-col px-6 pb-10"
            style={{ background: 'rgba(5,5,5,0.97)', backdropFilter: 'blur(24px)' }}
          >
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
                <Image src="/noctra-navbar-dark.svg" alt="Noctra" width={90} height={26} className="h-5 w-auto" priority />
                <span className="font-mono text-[9px] border-l border-white/20 pl-2.5 uppercase tracking-[0.3em] font-bold" style={{ color: '#10b981' }}>
                  SEO
                </span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="w-11 h-11 flex items-center justify-center rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)' }}
                aria-label={t('menuClose')}
              >
                <X size={18} className="text-white" />
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-10">
              {NAV_LINKS.map(({ key, href }, i) => (
                <motion.a
                  key={key}
                  href={href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className="text-4xl font-bold text-white"
                  onClick={() => setOpen(false)}
                >
                  {t(key)}
                </motion.a>
              ))}
            </div>

            <div className="border-t pt-6 flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => { switchLanguage(); setOpen(false); }}
                className="text-[10px] font-bold uppercase tracking-[0.3em]"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                {locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
              </button>
              <Link
                href="/es/login"
                className="px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
                style={{ background: '#ffffff', color: '#000000' }}
                onClick={() => setOpen(false)}
              >
                {t('login')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
