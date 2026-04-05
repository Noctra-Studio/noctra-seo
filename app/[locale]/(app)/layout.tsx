'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useParams } from 'next/navigation';
import {
  Zap, FileText, Activity, Key, Globe, Bell, BarChart2,
  Settings, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Zap, label: 'Resumen', href: '' },
  { icon: FileText, label: 'Páginas', href: '/pages' },
  { icon: Activity, label: 'Core Web Vitals', href: '/vitals' },
  { icon: Key, label: 'Keywords', href: '/keywords' },
  { icon: Globe, label: 'GEO', href: '/geo' },
  { icon: Bell, label: 'Alertas', href: '/alerts' },
  { icon: BarChart2, label: 'Reportes', href: '/reports' },
  { icon: Settings, label: 'Configuración', href: '/settings' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const params = useParams();
  const projectId = params?.projectId as string;
  const locale = params?.locale as string ?? 'es';

  const basePath = `/${locale}/dashboard/${projectId ?? ''}`;

  return (
    <div className="flex h-screen bg-[#0A0A0F] overflow-hidden">
      {/* Sidebar — desktop */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-[#1E1E2A] bg-[#111118] transition-all duration-200 shrink-0',
          collapsed ? 'w-[60px]' : 'w-[240px]'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center h-14 px-4 border-b border-[#1E1E2A]',
          collapsed ? 'justify-center' : 'gap-2'
        )}>
          <Image src="/favicon-light.svg" alt="Noctra" width={28} height={28} className="shrink-0" />
          {!collapsed && (
            <span className="font-bold text-base tracking-tight">Noctra SEO</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto">
          {navItems.map(({ icon: Icon, label, href }) => {
            const fullHref = `${basePath}${href}`;
            const isActive = href === '' ? pathname === basePath || pathname === `${basePath}/` : pathname.startsWith(`${basePath}${href}`);

            return (
              <Link
                key={href}
                href={fullHref}
                className={cn(
                  'flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-base transition-all group relative',
                  isActive
                    ? 'bg-[#10B98115] text-[#10B981] font-medium'
                    : 'text-[#8B8B9A] hover:text-[#F1F1F5] hover:bg-[#1A1A24]'
                )}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && (
                  <span className="flex-1">{label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-3 border-t border-[#1E1E2A]">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-lg text-[#8B8B9A] hover:text-[#F1F1F5] hover:bg-[#1A1A24] transition-colors text-base font-medium"
          >
            {collapsed ? <ChevronRight size={18} /> : (
              <>
                <ChevronLeft size={18} />
                <span>Colapsar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-[#1E1E2A] flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-base font-medium text-[#8B8B9A]">
              {projectId ? `Proyecto` : 'Dashboard'}
            </span>
          </div>
          <button className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#10B98115] border border-[#10B98130] text-[#10B981] text-base font-semibold hover:bg-[#10B98125] transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Sparkles size={16} />
            Analizar con IA
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111118] border-t border-[#1E1E2A] flex items-center justify-around px-2 h-16 z-50">
        {navItems.slice(0, 5).map(({ icon: Icon, label, href }) => {
          const fullHref = `${basePath}${href}`;
          const isActive = href === '' ? pathname === basePath : pathname.startsWith(`${basePath}${href}`);
          return (
            <Link
              key={href}
              href={fullHref}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-md transition-colors',
                isActive ? 'text-[#10B981]' : 'text-[#8B8B9A]'
              )}
            >
              <Icon size={20} />
              <span className="text-[10px]">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
