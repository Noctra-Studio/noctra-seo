'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Languages } from 'lucide-react';

export function LocaleSwitcher() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const nextLocale = locale === 'es' ? 'en' : 'es';
    // Replace the locale part of the path
    // e.g. /es/dashboard/123 -> /en/dashboard/123
    const newPath = pathname.replace(`/${locale}`, `/${nextLocale}`);
    router.push(newPath);
  };

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[#8B8B9A] hover:text-[#F1F1F5] hover:bg-[#1A1A24] transition-colors text-base font-medium w-full"
      title={t('switchLocale')}
    >
      <Languages size={18} />
      <span className="uppercase text-xs font-bold tracking-widest">
        {locale === 'es' ? 'EN' : 'ES'}
      </span>
    </button>
  );
}
