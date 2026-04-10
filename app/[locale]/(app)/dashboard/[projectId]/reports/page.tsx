'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, Clock, FileText, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { RunAuditButton } from '@/components/audit/RunAuditButton';
import { cn } from '@/lib/utils';

interface AuditJobSummary {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  completed_at: string | null;
  score_overall: number | null;
  executive_summary: string | null;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
}

interface AuditCheckSummary {
  check_key: string;
  status: 'pass' | 'warn' | 'fail' | 'info' | 'error';
  summary: string | null;
  recommendations: Recommendation[] | null;
}

interface ReportData {
  domainId: string | null;
  hostname: string | null;
  latestAudit: AuditJobSummary | null;
  latestChecks: AuditCheckSummary[];
  auditHistory: AuditJobSummary[];
  activeAlerts: number;
}

const PRIORITY_ORDER: Record<Recommendation['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function getStatusColor(status: AuditJobSummary['status']) {
  switch (status) {
    case 'completed':
      return 'text-[#10B981] bg-[#10B98110] border-[#10B98130]';
    case 'running':
      return 'text-[#F59E0B] bg-[#F59E0B10] border-[#F59E0B30]';
    case 'failed':
      return 'text-[#EF4444] bg-[#EF444410] border-[#EF444430]';
    default:
      return 'text-[#8B8B9A] bg-[#8B8B9A10] border-[#8B8B9A30]';
  }
}

function buildFallbackSummary(latestAudit: AuditJobSummary | null, latestChecks: AuditCheckSummary[]): string {
  if (!latestAudit) {
    return 'Aun no hay una auditoria completada para este dominio. Ejecuta un analisis para generar un resumen ejecutivo real.';
  }

  const criticalFindings = latestChecks.filter((check) => check.status === 'fail').length;
  const warningFindings = latestChecks.filter((check) => check.status === 'warn').length;

  if (criticalFindings === 0 && warningFindings === 0) {
    return 'La auditoria mas reciente no detecto hallazgos prioritarios. Puedes revisar el detalle tecnico para confirmar oportunidades menores de mejora.';
  }

  return `La auditoria mas reciente detecto ${criticalFindings} hallazgos criticos y ${warningFindings} advertencias. Revisa las recomendaciones priorizadas para corregir primero los problemas con mayor impacto.`;
}

export default function ReportsPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const locale = (params?.locale as string) ?? 'es';

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData>({
    domainId: null,
    hostname: null,
    latestAudit: null,
    latestChecks: [],
    auditHistory: [],
    activeAlerts: 0,
  });

  const loadData = useCallback(async () => {
    if (!projectId) {
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data: project } = await supabase
      .from('projects')
      .select('domains(id, hostname)')
      .eq('id', projectId)
      .maybeSingle();

    const primaryDomain = (project?.domains as Array<{ id: string; hostname: string }> | null)?.[0] ?? null;

    if (!primaryDomain) {
      setReport({
        domainId: null,
        hostname: null,
        latestAudit: null,
        latestChecks: [],
        auditHistory: [],
        activeAlerts: 0,
      });
      setLoading(false);
      return;
    }

    const [{ data: audits }, { count: alertCount }] = await Promise.all([
      supabase
        .from('audit_jobs')
        .select('id, status, created_at, completed_at, score_overall, executive_summary')
        .eq('domain_id', primaryDomain.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('domain_id', primaryDomain.id)
        .eq('status', 'active'),
    ]);

    const auditHistory = (audits ?? []) as AuditJobSummary[];
    const latestAudit = auditHistory.find((audit) => audit.status === 'completed') ?? null;

    let latestChecks: AuditCheckSummary[] = [];

    if (latestAudit) {
      const { data: checks } = await supabase
        .from('audit_checks')
        .select('check_key, status, summary, recommendations')
        .eq('job_id', latestAudit.id)
        .order('created_at', { ascending: true });

      latestChecks = (checks ?? []) as AuditCheckSummary[];
    }

    setReport({
      domainId: primaryDomain.id,
      hostname: primaryDomain.hostname,
      latestAudit,
      latestChecks,
      auditHistory,
      activeAlerts: alertCount ?? 0,
    });

    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const siteUrl = report.hostname ? `https://${report.hostname}` : null;
  const findingsCount = report.latestChecks.filter(
    (check) => check.status === 'warn' || check.status === 'fail',
  ).length;

  const priorityActions = report.latestChecks
    .flatMap((check) => (check.recommendations ?? []).map((recommendation) => ({
      ...recommendation,
      check_key: check.check_key,
    })))
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    .slice(0, 3);

  const executiveSummary = report.latestAudit?.executive_summary?.trim()
    || buildFallbackSummary(report.latestAudit, report.latestChecks);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-[#8B8B9A]">
        <Loader2 className="animate-spin mr-2" />
        <span>Preparando reportes reales...</span>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-[#F1F1F5] tracking-tight mb-2">Centro de Reportes</h1>
          <p className="text-lg text-[#8B8B9A]">
            {report.hostname
              ? `Ultimo reporte disponible para ${report.hostname}.`
              : 'Agrega un dominio para empezar a generar reportes.'}
          </p>
        </div>

        {report.domainId && siteUrl ? (
          <RunAuditButton
            domainId={report.domainId}
            siteUrl={siteUrl}
            onStarted={() => {
              void loadData();
            }}
          />
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#14141C] border border-[#1E1E2A] rounded-xl p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/5 blur-[60px] rounded-full -mr-16 -mt-16" />
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-[#10B98115] rounded-lg">
              <FileText size={22} className="text-[#10B981]" />
            </div>
            <h3 className="text-xl font-bold text-[#F1F1F5]">Resumen Ejecutivo</h3>
          </div>

          <div className="space-y-6">
            <p className="text-base text-[#C5C5D0] leading-relaxed">
              {executiveSummary}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-y border-[#1E1E2A]">
              <div className="space-y-1">
                <p className="text-xs text-[#8B8B9A] font-bold uppercase tracking-wider">Score General</p>
                <span className="text-2xl font-bold text-[#F1F1F5]">
                  {report.latestAudit?.score_overall ?? '—'}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-[#8B8B9A] font-bold uppercase tracking-wider">Hallazgos</p>
                <span className="text-2xl font-bold text-[#F59E0B]">
                  {report.latestAudit ? findingsCount : '—'}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-[#8B8B9A] font-bold uppercase tracking-wider">Alertas Activas</p>
                <span className={cn(
                  'text-2xl font-bold',
                  report.activeAlerts > 0 ? 'text-[#EF4444]' : 'text-[#10B981]',
                )}>
                  {report.activeAlerts}
                </span>
              </div>
            </div>

            {priorityActions.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-[#8B8B9A] font-bold uppercase tracking-wider">
                  Acciones Prioritarias
                </p>

                {priorityActions.map((action, index) => (
                  <div
                    key={`${action.check_key}-${index}`}
                    className="flex items-start gap-3 p-4 bg-[#0A0A0F] border border-[#1E1E2A] rounded-xl"
                  >
                    <span className={cn(
                      'text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border',
                      action.priority === 'high' && 'text-[#EF4444] bg-[#EF444410] border-[#EF444430]',
                      action.priority === 'medium' && 'text-[#F59E0B] bg-[#F59E0B10] border-[#F59E0B30]',
                      action.priority === 'low' && 'text-[#8B8B9A] bg-[#8B8B9A10] border-[#8B8B9A30]',
                    )}>
                      {action.priority}
                    </span>
                    <p className="text-sm text-[#F1F1F5] leading-relaxed">{action.action}</p>
                  </div>
                ))}
              </div>
            ) : report.latestAudit ? (
              <div className="flex items-center gap-3 p-4 bg-[#0A0A0F] border border-[#1E1E2A] rounded-xl text-[#8B8B9A]">
                <CheckCircle size={18} className="text-[#10B981]" />
                <span>No hay recomendaciones pendientes en la auditoria mas reciente.</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-[#0A0A0F] border border-[#1E1E2A] rounded-xl text-[#8B8B9A]">
                <AlertTriangle size={18} className="text-[#F59E0B]" />
                <span>Ejecuta una auditoria para habilitar este reporte.</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#14141C] border border-[#1E1E2A] rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#F1F1F5] mb-6 flex items-center gap-2">
            <Clock size={18} className="text-[#8B8B9A]" />
            Historial de Auditorias
          </h3>

          <div className="space-y-4">
            {report.auditHistory.length === 0 ? (
              <div className="p-4 bg-[#0A0A0F] border border-[#1E1E2A] rounded-xl text-center text-[#8B8B9A] text-xs">
                No hay auditorias previas registradas.
              </div>
            ) : report.auditHistory.map((audit) => {
              const content = (
                <>
                  <div className="flex justify-between items-start mb-2 gap-3">
                    <span className="text-xs text-[#8B8B9A]">
                      {new Date(audit.created_at).toLocaleString('es-MX')}
                    </span>
                    <span className={cn(
                      'text-[10px] font-bold capitalize px-2 py-1 rounded border',
                      getStatusColor(audit.status),
                    )}>
                      {audit.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[#F1F1F5]">
                      Score general: {audit.score_overall ?? '—'}
                    </p>
                    <p className="text-xs text-[#8B8B9A]">ID: {audit.id.slice(0, 8)}</p>
                  </div>
                </>
              );

              if (audit.status === 'completed') {
                return (
                  <Link
                    key={audit.id}
                    href={`/${locale}/dashboard/${projectId}/audit/${audit.id}`}
                    className="block p-4 bg-[#0A0A0F] border border-[#1E1E2A] rounded-xl hover:border-[#10B98130] transition-colors"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <div
                  key={audit.id}
                  className="p-4 bg-[#0A0A0F] border border-[#1E1E2A] rounded-xl"
                >
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
