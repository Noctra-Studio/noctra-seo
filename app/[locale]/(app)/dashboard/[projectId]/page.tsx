'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ScoreCard } from '@/components/dashboard/ScoreCard';
import { TrafficChart } from '@/components/dashboard/TrafficChart';
import { TopPages } from '@/components/dashboard/TopPages';
import { IssuesList } from '@/components/dashboard/IssuesList';
import { AIInsightsCard } from '@/components/dashboard/AIInsightsCard';
import { VitalsGauge } from '@/components/vitals/VitalsGauge';
import { AlertPanel, type Alert } from '@/components/alerts/AlertPanel';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { subDays, format } from 'date-fns';

interface DomainData {
  id: string;
  hostname: string;
}

interface OverviewData {
  seoScore: number;
  seoScoreTrend: number;
  organicVisits: number;
  organicTrend: number;
  organicSparkline: number[];
  activeAlerts: { critical: number; warning: number };
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  trafficChart: Array<{ date: string; organic_search?: number; direct?: number; referral?: number; social?: number }>;
  topPages: Array<{ path: string; visits: number; seo_score: number }>;
  issues: Array<{ type: string; severity: 'critical' | 'warning' | 'info'; detail: string; path?: string; field?: string }>;
  latestInsight: { summary: string; actions: Array<{ step: number; instruction: string; effort: 'low' | 'medium' | 'high'; expected_result: string }> } | null;
}

export default function DashboardOverview() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const [days, setDays] = useState(30);
  const [domain, setDomain] = useState<DomainData | null>(null);
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!projectId) return;
    loadData();
  }, [projectId, days]);

  async function loadData() {
    setLoading(true);
    const since = subDays(new Date(), days).toISOString();

    // Load domain
    const { data: domains } = await supabase
      .from('domains')
      .select('id, hostname')
      .eq('project_id', projectId)
      .limit(1)
      .single();

    if (!domains) { setLoading(false); return; }
    setDomain(domains);

    const domainId = domains.id;

    // Parallel queries
    const [
      pageviewsRes,
      seoRes,
      vitalsRes,
      alertsRes,
    ] = await Promise.all([
      supabase
        .from('pageviews')
        .select('path, channel, visited_at')
        .eq('domain_id', domainId)
        .gte('visited_at', since)
        .order('visited_at', { ascending: true }),
      supabase
        .from('page_seo_signals')
        .select('path, seo_score, issues')
        .eq('domain_id', domainId)
        .order('seo_score', { ascending: true }),
      supabase
        .from('page_vitals_p75')
        .select('lcp_p75, cls_p75, inp_p75')
        .eq('domain_id', domainId)
        .limit(1)
        .single(),
      supabase
        .from('alerts')
        .select('*')
        .eq('domain_id', domainId)
        .eq('status', 'active')
        .order('detected_at', { ascending: false })
        .limit(20),
    ]);

    const pageviews = pageviewsRes.data ?? [];
    const seoSignals = seoRes.data ?? [];
    const vitals = vitalsRes.data;
    const alerts = alertsRes.data ?? [];

    // SEO score: average across pages
    const avgScore = seoSignals.length
      ? Math.round(seoSignals.reduce((s, p) => s + p.seo_score, 0) / seoSignals.length)
      : 0;

    // Organic visits
    const organicVisits = pageviews.filter(p => p.channel === 'organic_search').length;

    // Traffic by day for chart
    const byDay: Record<string, Record<string, number>> = {};
    pageviews.forEach(pv => {
      const day = format(new Date(pv.visited_at), 'dd MMM');
      if (!byDay[day]) byDay[day] = {};
      const ch = pv.channel ?? 'unknown';
      byDay[day][ch] = (byDay[day][ch] ?? 0) + 1;
    });
    const trafficChart = Object.entries(byDay).slice(-30).map(([date, channels]) => ({
      date,
      ...channels,
    }));

    // Sparkline: organic visits per day last 14 days
    const organicByDay: Record<string, number> = {};
    pageviews
      .filter(p => p.channel === 'organic_search')
      .forEach(pv => {
        const day = format(new Date(pv.visited_at), 'dd');
        organicByDay[day] = (organicByDay[day] ?? 0) + 1;
      });
    const organicSparkline = Object.values(organicByDay).slice(-14);

    // Issues: flatten all from SEO signals
    const allIssues = seoSignals.flatMap(s =>
      (s.issues as Array<{ type: string; severity: string; detail: string; field?: string }> ?? []).map(i => ({
        ...i,
        severity: i.severity as 'critical' | 'warning' | 'info',
        path: s.path,
      }))
    );
    const criticalIssues = allIssues.filter(i => i.severity === 'critical');

    // Top pages by visits
    const visitsByPath: Record<string, number> = {};
    pageviews.forEach(pv => {
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

    setData({
      seoScore: avgScore,
      seoScoreTrend: 2.4, // TODO: compare with previous period
      organicVisits,
      organicTrend: 5.1,
      organicSparkline,
      activeAlerts,
      lcp: vitals?.lcp_p75 ?? null,
      cls: vitals?.cls_p75 ?? null,
      inp: vitals?.inp_p75 ?? null,
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
      <div className="p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-[#14141C] border border-[#1E1E2A] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-5 pb-20 md:pb-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#F1F1F5]">
              {domain?.hostname ?? 'Dashboard'}
            </h1>
            <p className="text-xs text-[#8B8B9A] mt-0.5">Resumen del rendimiento</p>
          </div>
          <DateRangePicker value={days} onChange={setDays} />
        </div>

        {/* Fila 1 — 4 Score cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <ScoreCard
            title="SEO Score"
            score={data?.seoScore ?? 0}
            trend={data?.seoScoreTrend}
            showGauge
          />

          <VitalsGauge
            lcp={data?.lcp}
            cls={data?.cls}
            inp={data?.inp}
          />

          <ScoreCard
            title="Tráfico Orgánico"
            score={data?.organicVisits ?? 0}
            trend={data?.organicTrend}
            sparklineData={data?.organicSparkline}
            subtitle="visitas orgánicas"
          />

          <div
            className="bg-[#14141C] border border-[#1E1E2A] rounded-xl p-5 flex flex-col gap-3 hover:border-[#2A2A38] transition-colors cursor-pointer"
            onClick={() => {/* navigate to alerts */}}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs text-[#8B8B9A] font-medium uppercase tracking-wider">Alertas Activas</span>
              <Bell size={14} className="text-[#8B8B9A]" />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-3xl text-[#EF4444]">
                    {data?.activeAlerts.critical ?? 0}
                  </span>
                  <span className="text-xs text-[#EF4444] bg-[#EF444415] px-1.5 py-0.5 rounded">Críticas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xl text-[#F59E0B]">
                    {data?.activeAlerts.warning ?? 0}
                  </span>
                  <span className="text-xs text-[#F59E0B] bg-[#F59E0B15] px-1.5 py-0.5 rounded">Warnings</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fila 2 — Traffic chart + Top pages */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-8">
            <TrafficChart data={data?.trafficChart ?? []} />
          </div>
          <div className="xl:col-span-4">
            <TopPages pages={data?.topPages ?? []} />
          </div>
        </div>

        {/* Fila 3 — Issues + AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <IssuesList
            issues={data?.issues ?? []}
            onFix={(issue) => {
              // In a real scenario, open the alert that corresponds to this issue
            }}
          />
          <AIInsightsCard insight={data?.latestInsight} loading={false} />
        </div>
      </div>

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
