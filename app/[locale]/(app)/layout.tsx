'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { usePathname } from 'next/navigation';
import { useParams } from 'next/navigation';
import {
  Zap, FileText, Activity, Key, Globe, Bell, BarChart2,
  Settings, ChevronLeft, ChevronRight, Sparkles, ScanSearch, LayoutGrid
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { SiteProvider, useSite } from '@/lib/context/SiteContext';
import { SiteSwitcher } from '@/components/dashboard/SiteSwitcher';
import { LocaleSwitcher } from '@/components/dashboard/LocaleSwitcher';
import { useTranslations } from 'next-intl';

// Nav items removed from global scope to be defined inside component with translations

function LayoutContent({ children }: { children: React.ReactNode }) {
  const t = useTranslations('nav');
  const td = useTranslations('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const params = useParams();
  const projectId = params?.projectId as string;
  const locale = (params?.locale as string) ?? 'es';
  const [userName, setUserName] = useState<string | null>(null);
  
  const { activeSite } = useSite();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const navItems = [
    { icon: Zap,         label: t('overview'),    href: '' },
    { icon: FileText,    label: t('pages'),       href: '/pages' },
    { icon: Activity,    label: t('vitals'),      href: '/vitals' },
    { icon: Key,         label: t('keywords'),    href: '/keywords' },
    { icon: Globe,       label: t('geo'),         href: '/geo' },
    { icon: ScanSearch,  label: t('audit'),       href: '/audit' },
    { icon: Bell,        label: t('alerts'),      href: '/alerts' },
    { icon: BarChart2,   label: t('reports'),     href: '/reports' },
    { icon: Settings,    label: t('settings'),    href: '/settings' },
  ];

  const topLevelItems = [
    { icon: LayoutGrid, label: t('sites'), href: '/sites' },
  ];

  const handleAnalyze = async () => {
    console.log('[Header] Analizar IA clicked. activeSite:', activeSite);
    if (!activeSite?.domain_id || !activeSite?.hostname) {
      console.warn('[Header] No active site or hostname found for audit', activeSite);
      return;
    }
    
    setIsAnalyzing(true);
    // Notify all banners to show "running" state immediately
    window.dispatchEvent(new CustomEvent('noctra:audit_started'));
    try {
      console.log('[Header] Sending POST /api/audit/run for:', activeSite.hostname);
      const res = await fetch('/api/audit/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: activeSite.domain_id,
          url: activeSite.hostname,
          triggered_by: 'manual'
        }),
      });

      console.log('[Header] POST /api/audit/run response status:', res.status);
      if (!res.ok) {
        const error = await res.json();
        console.error('[Header] Audit failed to start:', error);
        // Optional: show alert or another event
      } else {
        console.log('[Header] Audit started successfully');
      }
    } catch (err) {
      console.error('[Header] Audit trigger error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (profile?.full_name) {
          setUserName(profile.full_name.split(' ')[0]);
        }
      }
    }
    loadUser();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('greeting.morning');
    if (hour >= 12 && hour < 19) return t('greeting.afternoon');
    return t('greeting.evening');
  };

  const basePath = `/${locale}/dashboard/${projectId ?? ''}`;

  return (
    <div className="flex h-screen bg-[#0A0A0F] overflow-hidden">
      {/* Sidebar — desktop */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-white/[0.05] bg-[#080808] transition-all duration-300 ease-in-out shrink-0 z-40',
          collapsed ? 'w-[70px]' : 'w-[220px]'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center h-16 px-5 border-b border-white/[0.05]',
          collapsed ? 'justify-center' : 'gap-3'
        )}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-lg shadow-[#10B98120] squircle">
            <Image src="/favicon-light.svg" alt="Noctra" width={20} height={20} className="brightness-200" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight text-[#F1F1F5] font-display">Noctra</span>
          )}
        </div>

        {/* Site switcher — below logo, above nav */}
        <div className="pt-3 relative">
          <SiteSwitcher collapsed={collapsed} />
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          {/* Top-level links (not project-scoped) */}
          {topLevelItems.map(({ icon: Icon, label, href }) => {
            const fullHref = `/${locale}${href}`;
            const isActive = pathname.startsWith(fullHref);
            return (
              <Link
                key={href}
                href={fullHref}
                className={cn(
                  'flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm transition-all group relative',
                  isActive
                    ? 'bg-[#10B98110] text-[#10B981] font-semibold'
                    : 'text-[#8B8B9A] hover:text-[#F1F1F5] hover:bg-white/[0.03]'
                )}
              >
                <Icon size={18} className={cn('transition-all', isActive ? 'scale-110' : 'group-hover:scale-110')} />
                {!collapsed && <span className="flex-1 truncate">{label}</span>}
                {isActive && !collapsed && (
                  <div className="absolute right-2 w-1 h-4 bg-[#10B981] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                )}
              </Link>
            );
          })}

          {/* Divider before project-scoped nav */}
          {!collapsed && projectId && (
            <div className="mx-1 my-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
          )}

          {/* Project-scoped nav items */}
          {navItems.map(({ icon: Icon, label, href }) => {
            const fullHref = `${basePath}${href}`;
            const isActive = href === '' ? pathname === basePath || pathname === `${basePath}/` : pathname.startsWith(`${basePath}${href}`);

            return (
              <Link
                key={href}
                href={fullHref}
                className={cn(
                  'flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm transition-all group relative',
                  isActive
                    ? 'bg-[#10B98110] text-[#10B981] font-semibold'
                    : 'text-[#8B8B9A] hover:text-[#F1F1F5] hover:bg-white/[0.03]'
                )}
              >
                <Icon size={18} className={cn('transition-all', isActive ? 'scale-110' : 'group-hover:scale-110')} />
                {!collapsed && (
                  <span className="flex-1 truncate">{label}</span>
                )}
                {isActive && !collapsed && (
                  <div className="absolute right-2 w-1 h-4 bg-[#10B981] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Language & Collapse toggle */}
        <div className="p-3 border-t border-[#1E1E2A] space-y-1">
          <LocaleSwitcher />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-lg text-[#8B8B9A] hover:text-[#F1F1F5] hover:bg-[#1A1A24] transition-colors text-base font-medium"
          >
            {collapsed ? <ChevronRight size={18} /> : (
              <>
                <ChevronLeft size={18} />
                <span>{t('collapse')}</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 md:h-20 border-b border-white/[0.05] flex items-center justify-between px-6 md:px-10 shrink-0 sticky top-0 bg-[#0A0A0F]/80 backdrop-blur-xl z-30">
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
            <span className="text-xs md:text-sm font-medium text-[#8B8B9A] flex items-center gap-2">
              <span className="opacity-60">{getGreeting()},</span>
              <span className="text-[#F1F1F5] font-bold">{userName || t('userPlaceholder')}</span>
            </span>
          </div>
          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className={cn(
              "flex items-center gap-2 px-3 py-2 md:px-5 md:py-2.5 rounded-2xl transition-all shadow-lg shadow-[#10B98105] group",
              isAnalyzing 
                ? "bg-[#10B98125] text-[#10B981] cursor-wait animate-pulse" 
                : "bg-gradient-to-br from-[#10B98115] to-[#10B98105] border border-[#10B98125] text-[#10B981] hover:from-[#10B98125] hover:to-[#10B98110] hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            <Sparkles size={14} className={cn("transition-transform", isAnalyzing ? "animate-spin" : "group-hover:rotate-12")} />
            <span className="tracking-tight">{isAnalyzing ? t('analyzing') : td('analyzeWithAI')}</span>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile refined */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass-premium rounded-[2rem] px-4 h-16 z-50 flex items-center justify-around shadow-2xl">
        {navItems.slice(0, 5).map(({ icon: Icon, label, href }) => {
          const fullHref = `${basePath}${href}`;
          const isActive = href === '' ? pathname === basePath : pathname.startsWith(`${basePath}${href}`);
          return (
            <Link
              key={href}
              href={fullHref}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 relative overflow-hidden',
                isActive ? 'text-[#10B981] scale-110' : 'text-[#8B8B9A] opacity-60'
              )}
            >
              <Icon size={20} className={cn('transition-all', isActive && 'emerald-glow')} />
              <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
              {isActive && (
                <div className="absolute inset-0 bg-[#10B98108] animate-in fade-in duration-500" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteProvider>
      <LayoutContent>{children}</LayoutContent>
    </SiteProvider>
  );
}
