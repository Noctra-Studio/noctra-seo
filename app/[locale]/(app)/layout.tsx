'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useParams } from 'next/navigation';
import {
  Zap, FileText, Activity, Key, Globe, Bell, BarChart2,
  Settings, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Zap, label: 'Resumen', href: '' },
  { icon: FileText, label: 'Páginas', href: '/pages' },
  { icon: Activity, label: 'Core Web Vitals', href: '/vitals' },
  { icon: Key, label: 'Keywords', href: '/keywords', soon: true },
  { icon: Globe, label: 'GEO', href: '/geo', soon: true },
  { icon: Bell, label: 'Alertas', href: '/alerts' },
  { icon: BarChart2, label: 'Reportes', href: '/reports', soon: true },
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
          <div className="w-7 h-7 rounded-lg bg-[#6366F1] flex items-center justify-center shrink-0">
            <Zap size={14} className="text-white" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm tracking-tight">Noctra SEO</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ icon: Icon, label, href, soon }) => {
            const fullHref = `${basePath}${href}`;
            const isActive = href === '' ? pathname === basePath || pathname === `${basePath}/` : pathname.startsWith(`${basePath}${href}`);

            return (
              <Link
                key={href}
                href={soon ? '#' : fullHref}
                className={cn(
                  'flex items-center gap-3 px-2.5 py-2 rounded-md text-sm transition-colors group relative',
                  isActive
                    ? 'bg-[#6366F115] text-[#6366F1]'
                    : 'text-[#8B8B9A] hover:text-[#F1F1F5] hover:bg-[#1A1A24]',
                  soon && 'opacity-40 cursor-not-allowed'
                )}
              >
                <Icon size={16} className="shrink-0" />
                {!collapsed && (
                  <span className="flex-1">{label}</span>
                )}
                {!collapsed && soon && (
                  <span className="text-[10px] bg-[#1E1E2A] text-[#8B8B9A] px-1.5 py-0.5 rounded">
                    Soon
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-[#1E1E2A]">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-2.5 py-2 rounded-md text-[#8B8B9A] hover:text-[#F1F1F5] hover:bg-[#1A1A24] transition-colors text-sm"
          >
            {collapsed ? <ChevronRight size={16} /> : (
              <>
                <ChevronLeft size={16} />
                <span>Colapsar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-[#1E1E2A] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#8B8B9A]">
              {projectId ? `Proyecto` : 'Dashboard'}
            </span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#6366F115] border border-[#6366F130] text-[#6366F1] text-sm hover:bg-[#6366F125] transition-colors">
            <Sparkles size={14} />
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
        {navItems.slice(0, 5).map(({ icon: Icon, label, href, soon }) => {
          const fullHref = `${basePath}${href}`;
          const isActive = href === '' ? pathname === basePath : pathname.startsWith(`${basePath}${href}`);
          return (
            <Link
              key={href}
              href={soon ? '#' : fullHref}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-md transition-colors',
                isActive ? 'text-[#6366F1]' : 'text-[#8B8B9A]'
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
