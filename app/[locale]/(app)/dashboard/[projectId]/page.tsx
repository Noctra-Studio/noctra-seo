'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Bell, CheckCircle, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ScoreCard } from '@/components/dashboard/ScoreCard';
import { TrafficChart } from '@/components/dashboard/TrafficChart';
import { TopPages } from '@/components/dashboard/TopPages';
import { IssuesList } from '@/components/dashboard/IssuesList';
import { AIInsightsCard } from '@/components/dashboard/AIInsightsCard';
import { VitalsGauge } from '@/components/vitals/VitalsGauge';
import { AlertPanel, type Alert } from '@/components/alerts/AlertPanel';
import { ProjectSettingsModal } from '@/components/dashboard/ProjectSettingsModal';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { subDays, format, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { AuditProgressBanner } from '@/components/audit/AuditProgressBanner';

interface DomainData {
  id: string;
  hostname: string;
  tracker_installed: boolean;
  first_pageview_at: string | null;
}

interface ProjectData {
  id: string;
  name: string;
  logo_url: string | null;
}

interface OverviewData {
  seoScore: number;
  seoScoreTrend: number;
  organicVisits: number;
  organicTrend: number;
  organicSparkline: number[];
  activeAlerts: { critical: number; warning: number };
  vitals: {
    lcp: { value: number | null; trend: number };
    cls: { value: number | null; trend: number };
    inp: { value: number | null; trend: number };
  };
  trafficChart: Array<{ date: string; organic_search?: number; direct?: number; referral?: number; social?: number }>;
  topPages: Array<{ path: string; visits: number; seo_score: number }>;
  issues: Array<{ type: string; severity: 'critical' | 'warning' | 'info'; detail: string; path?: string; field?: string }>;
  latestInsight: { summary: string; actions: Array<{ step: number; instruction: string; effort: 'low' | 'medium' | 'high'; expected_result: string }> } | null;
}

export default function DashboardOverview() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const [days, setDays] = useState(30);
  const [domain, setDomain] = useState<DomainData | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!projectId) return;
    loadData();
  }, [projectId, days]);

  async function loadData() {
    setLoading(true);
    const now = new Date();
    const sinceCurrent = subDays(now, days).toISOString();
    const sincePrevious = subDays(now, days * 2).toISOString();

    // Load domain and project
    const [{ data: domains }, { data: projectData }] = await Promise.all([
      supabase
        .from('domains')
        .select('id, hostname, tracker_installed, first_pageview_at')
        .eq('project_id', projectId)
        .limit(1)
        .single(),
      supabase
        .from('projects')
        .select('id, name, logo_url')
        .eq('id', projectId)
        .maybeSingle()
    ]);

    if (!domains) { setLoading(false); return; }
    setDomain(domains);
    setProject(projectData as ProjectData);

    const domainId = domains.id;

    // Parallel queries
    const [
      pageviewsRes,
      seoRes,
      vitalsCurrentRes,
      vitalsPreviousRes,
      alertsRes,
    ] = await Promise.all([
      supabase
        .from('pageviews')
        .select('path, channel, visited_at')
        .eq('domain_id', domainId)
        .gte('visited_at', sincePrevious)
        .order('visited_at', { ascending: true }),
      supabase
        .from('page_seo_signals')
        .select('path, seo_score, issues, first_seen_at')
        .eq('domain_id', domainId)
        .order('seo_score', { ascending: true }),
      supabase.rpc('get_domain_vitals_p75', {
        p_domain_id: domainId,
        p_since: sinceCurrent,
        p_until: now.toISOString()
      }),
      supabase.rpc('get_domain_vitals_p75', {
        p_domain_id: domainId,
        p_since: sincePrevious,
        p_until: sinceCurrent
      }),
      supabase
        .from('alerts')
        .select('*')
        .eq('domain_id', domainId)
        .eq('status', 'active')
        .order('detected_at', { ascending: false })
        .limit(20),
    ]);

    const allPageviews = pageviewsRes.data ?? [];
    const seoSignals = seoRes.data ?? [];
    const currentVitals = vitalsCurrentRes.data?.[0];
    const previousVitals = vitalsPreviousRes.data?.[0];
    const alerts = alertsRes.data ?? [];

    // Filter pageviews by period
    const currentPageviews = allPageviews.filter(pv => isAfter(new Date(pv.visited_at), new Date(sinceCurrent)));
    const previousPageviews = allPageviews.filter(pv => !isAfter(new Date(pv.visited_at), new Date(sinceCurrent)));

    // SEO score: average across pages
    const avgScore = seoSignals.length
      ? Math.round(seoSignals.reduce((s, p) => s + p.seo_score, 0) / seoSignals.length)
      : 0;

    // SEO Score Trend: compare current avg with avg of pages seen before the current period
    const oldPages = seoSignals.filter(s => !isAfter(new Date(s.first_seen_at), new Date(sinceCurrent)));
    const previousAvgScore = oldPages.length
      ? Math.round(oldPages.reduce((s, p) => s + p.seo_score, 0) / oldPages.length)
      : avgScore;
    const seoScoreTrend = previousAvgScore === 0 ? 0 : Math.round((avgScore - previousAvgScore) * 10) / 10;

    // Organic visits calculation
    const currentOrganic = currentPageviews.filter(p => p.channel === 'organic_search').length;
    const previousOrganic = previousPageviews.filter(p => p.channel === 'organic_search').length;
    const organicTrend = previousOrganic === 0 
      ? (currentOrganic > 0 ? 100 : 0) 
      : Math.round(((currentOrganic - previousOrganic) / previousOrganic) * 1000) / 10;

    // Traffic by day for chart (last 30 days of data fetched)
    const byDay: Record<string, Record<string, number>> = {};
    currentPageviews.forEach(pv => {
      const day = format(new Date(pv.visited_at), 'dd MMM');
      if (!byDay[day]) byDay[day] = {};
      const ch = pv.channel ?? 'unknown';
      byDay[day][ch] = (byDay[day][ch] ?? 0) + 1;
    });
    const trafficChart = Object.entries(byDay).map(([date, channels]) => ({
      date,
      ...channels,
    }));

    // Sparkline: organic visits per day current period
    const organicByDay: Record<string, number> = {};
    currentPageviews
      .filter(p => p.channel === 'organic_search')
      .forEach(pv => {
        const day = format(new Date(pv.visited_at), 'dd');
        organicByDay[day] = (organicByDay[day] ?? 0) + 1;
      });
    const organicSparkline = Object.values(organicByDay);

    // Issues: flatten all from SEO signals
    const allIssues = seoSignals.flatMap(s =>
      (s.issues as Array<{ type: string; severity: string; detail: string; field?: string }> ?? []).map(i => ({
        ...i,
        severity: i.severity as 'critical' | 'warning' | 'info',
        path: s.path,
      }))
    );
    const criticalIssues = allIssues.filter(i => i.severity === 'critical');

    // Top pages by visits in current period
    const visitsByPath: Record<string, number> = {};
    currentPageviews.forEach(pv => {
      visitsByPath[pv.path] = (visitsByPath[pv.path] ?? 0) + 1;
    });
    const topPages = Object.entries(visitsByPath)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([path, visits]) => ({
        path,
        visits,
        seo_score: seoSignals.find(s => s.path === path)?.seo_score ?? 0,
      }));

    // Alert counts
    const activeAlerts = {
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
    };

    // Latest AI insight
    const latestInsight = alerts.find(a => a.ai_analysis_status === 'generated')?.ai_analysis ?? null;

    // Vitals trend calculation helper
    const calcTrend = (curr: number | null | undefined, prev: number | null | undefined, invert = true) => {
      if (curr === null || curr === undefined || prev === null || prev === undefined || prev === 0) return 0;
      const pct = ((curr - prev) / prev) * 100;
      return invert ? -pct : pct; // For vitals, lower is better, so decrease is positive trend
    };

    setData({
      seoScore: avgScore,
      seoScoreTrend,
      organicVisits: currentOrganic,
      organicTrend,
      organicSparkline,
      activeAlerts,
      vitals: {
        lcp: { value: currentVitals?.lcp ?? null, trend: calcTrend(currentVitals?.lcp, previousVitals?.lcp) },
        cls: { value: currentVitals?.cls ?? null, trend: calcTrend(currentVitals?.cls, previousVitals?.cls) },
        inp: { value: currentVitals?.inp ?? null, trend: calcTrend(currentVitals?.inp, previousVitals?.inp) },
      },
      trafficChart,
      topPages,
      issues: criticalIssues,
      latestInsight,
    });

    setLoading(false);
  }

  function openAlert(alert: Alert) {
    setSelectedAlert(alert);
    setAlertPanelOpen(true);
  }

  if (loading) {
    return (
      <div className="p-8 space-y-10">
        <div className="flex items-center justify-between pb-4">
          <div className="space-y-2">
            <div className="h-10 w-64 bg-[#14141C] rounded-lg animate-pulse" />
            <div className="h-4 w-48 bg-[#14141C] rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-[#14141C] border border-[#1E1E2A] rounded-2xl animate-pulse shadow-sm" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-80 bg-[#14141C] border border-[#1E1E2A] rounded-2xl animate-pulse shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-8 space-y-10 pb-20 md:pb-12 max-w-[1600px] mx-auto">
        {domain && <AuditProgressBanner domainId={domain.id} />}
        {/* Header row refinement */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4"
        >
          <div className="flex items-center gap-8">
            {/* Project Logo - Squircle */}
            <div className="relative group cursor-pointer" onClick={() => setSettingsOpen(true)}>
              <div className="w-24 h-24 bg-gradient-to-br from-white/[0.08] to-transparent border border-white/[0.1] shadow-2xl group-hover:border-[#10B98150] transition-all flex items-center justify-center squircle relative overflow-hidden">
                {project?.logo_url ? (
                  <img src={project.logo_url} alt={project.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-4xl font-bold text-[#10B981] opacity-30 group-hover:opacity-100 transition-opacity font-display">
                    {project?.name?.charAt(0) || 'P'}
                  </div>
                )}
                {/* Upload overlay */}
                <div className="absolute inset-0 bg-[#10B98120] backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-[10px] font-extrabold text-white uppercase tracking-widest bg-[#10B981] px-2 py-1 rounded-md">Editar</span>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#0A0A0F] border border-white/[0.05] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Settings size={14} className="text-[#8B8B9A]" />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Tracker/CDN Status */}
              <div className="flex items-center">
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[0.15em] glass-premium",
                    domain?.tracker_installed 
                      ? "border-[#10B98140] text-[#10B981]" 
                      : domain?.first_pageview_at 
                        ? "border-[#EF444440] text-[#EF4444]"
                        : "border-[#8B8B9A40] text-[#8B8B9A]"
                  )}
                >
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_8px_currentColor]",
                    domain?.tracker_installed ? "bg-[#10B981]" : domain?.first_pageview_at ? "bg-[#EF4444]" : "bg-[#8B8B9A] animate-pulse"
                  )} />
                  {domain?.tracker_installed ? 'Network Healthy' : domain?.first_pageview_at ? 'Network Disconnected' : 'Pending Setup'}
                </motion.div>
              </div>

              <div className="flex flex-col gap-1">
                <a 
                  href={`https://${domain?.hostname}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-2xl md:text-3xl text-[#F1F1F5] font-extrabold tracking-tight hover:text-[#10B981] transition-colors flex items-center gap-3 group/link font-display"
                >
                  {domain?.hostname}
                  <div className="p-1.5 bg-white/[0.03] rounded-xl group-hover/link:bg-[#10B98110] transition-all group-hover/link:translate-x-1 group-hover/link:-translate-y-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 group-hover/link:opacity-100"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </div>
                </a>
                <p className="text-[10px] text-[#8B8B9A] font-bold uppercase tracking-[0.2em] opacity-60">Global Performance Insights</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-4">
            <DateRangePicker value={days} onChange={setDays} />
          </div>
        </motion.div>

        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch"
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="h-full">
            <ScoreCard
              title="SEO Score"
              score={data?.seoScore ?? 0}
              trend={data?.seoScoreTrend ?? 0}
              showGauge
              className="h-full"
            />
          </motion.div>
          
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="h-full">
            <VitalsGauge
              lcp={data?.vitals.lcp.value}
              lcpTrend={data?.vitals.lcp.trend}
              cls={data?.vitals.cls.value}
              clsTrend={data?.vitals.cls.trend}
              inp={data?.vitals.inp.value}
              inpTrend={data?.vitals.inp.trend}
              className="h-full"
            />
          </motion.div>
          
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="h-full">
            <ScoreCard
              title="Tráfico Orgánico"
              score={data?.organicVisits ?? 0}
              trend={data?.organicTrend ?? 0}
              sparklineData={data?.organicSparkline}
              subtitle="visitas orgánicas"
              className="h-full"
            />
          </motion.div>
          
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="h-full">
            <div
              className="glass p-7 flex flex-col h-full gap-6 hover:border-[#10B98150] transition-all cursor-pointer shadow-2xl group relative overflow-hidden rounded-2xl"
              onClick={() => router.push(`/dashboard/${projectId}/alerts`)}
            >
              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] text-[#8B8B9A] font-black uppercase tracking-[0.15em]">Security & Alerts</span>
                <div className="p-2 bg-white/[0.03] rounded-xl group-hover:bg-[#10B98110] transition-colors border border-white/[0.05]">
                  <Bell size={18} className="text-[#8B8B9A] group-hover:text-[#10B981]" />
                </div>
              </div>
              
              <div className="flex flex-col gap-5 z-10">
                {data?.activeAlerts.critical === 0 && data?.activeAlerts.warning === 0 ? (
                  <div className="flex flex-col items-center justify-center py-2 gap-4 text-center">
                    <div className="w-14 h-14 bg-[#10B98108] border border-[#10B98120] rounded-full flex items-center justify-center emerald-glow">
                      <CheckCircle size={28} className="text-[#10B981]" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[#F1F1F5] font-display">System Healthy</p>
                      <p className="text-[10px] text-[#8B8B9A] px-2 leading-tight font-medium opacity-60 uppercase tracking-widest">No issues detected</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl font-display font-black text-[#EF4444] tracking-tighter">
                          {data?.activeAlerts.critical ?? 0}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-[#EF4444] uppercase tracking-widest">Critical</span>
                          <span className="text-[9px] text-[#8B8B9A] uppercase tracking-tighter opacity-50">Action required</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl font-display font-black text-[#F59E0B] tracking-tighter">
                          {data?.activeAlerts.warning ?? 0}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-[#F59E0B] uppercase tracking-widest">Warnings</span>
                          <span className="text-[9px] text-[#8B8B9A] uppercase tracking-tighter opacity-50">Optimizable</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#10B98105] blur-3xl rounded-full" />
            </div>
          </motion.div>
        </motion.div>

        {/* Fila 2 — Traffic chart + Top pages */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8">
            <TrafficChart data={data?.trafficChart ?? []} />
          </div>
          <div className="xl:col-span-4">
            <TopPages pages={data?.topPages ?? []} />
          </div>
        </div>

        {/* Fila 3 — Issues + AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
          <IssuesList
            issues={data?.issues ?? []}
            onFix={(issue) => {
              router.push(`/dashboard/${projectId}/pages?path=${encodeURIComponent(issue.path || '/')}`);
            }}
          />
          <AIInsightsCard insight={data?.latestInsight} loading={false} />
        </div>
      </div>

      {/* Project Settings Modal */}
      <ProjectSettingsModal
        open={settingsOpen}
        project={project}
        onClose={() => setSettingsOpen(false)}
        onUpdate={() => loadData()}
      />

      {/* Alert slide-over */}
      <AlertPanel
        alert={selectedAlert}
        open={alertPanelOpen}
        onClose={() => setAlertPanelOpen(false)}
        onAcknowledge={async (id) => {
          await createClient()
            .from('alerts')
            .update({ status: 'acknowledged', acknowledged_at: new Date().toISOString() })
            .eq('id', id);
          setAlertPanelOpen(false);
          loadData();
        }}
      />
    </>
  );
}
