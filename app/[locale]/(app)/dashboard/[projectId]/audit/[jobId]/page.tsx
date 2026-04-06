import { createClient }         from '@/lib/supabase/server'
import { notFound, redirect }   from 'next/navigation'
import Link                     from 'next/link'
import { format }               from 'date-fns'
import { es }                   from 'date-fns/locale'
import { ScoreRing }             from '@/components/audit/ScoreRing'
import { CheckGroupSection }     from '@/components/audit/CheckGroupSection'
import { RunAuditButton }        from '@/components/audit/RunAuditButton'
import { cn }                    from '@/lib/utils'
import type { AuditCheck, AuditJob, CheckGroup } from '@/lib/auditor/types'

interface PageProps {
  params: { locale: string; projectId: string; jobId: string }
}

const GROUP_ORDER: CheckGroup[] = ['seo', 'dns', 'security', 'tech', 'performance', 'reputation']

const GROUP_LABELS: Record<CheckGroup, string> = {
  seo:         'SEO',
  dns:         'DNS',
  security:    'Seguridad',
  performance: 'Rendimiento',
  tech:        'Tecnología',
  reputation:  'Reputación',
}

function ScoreCard({ label, score }: { label: string; score: number | null }) {
  if (score == null) return null
  const color =
    score >= 80 ? 'text-[#10B981]' :
    score >= 50 ? 'text-[#F59E0B]' :
                  'text-[#EF4444]'
  return (
    <div className="bg-[#14141C] border border-[#1E1E2A] rounded-2xl p-5 flex flex-col items-center gap-3">
      <span className="text-xs font-black uppercase tracking-widest text-[#8B8B9A]">{label}</span>
      <span className={cn('text-4xl font-extrabold font-display', color)}>{score}</span>
      <div className="w-full bg-[#1E1E2A] rounded-full h-1.5">
        <div
          className={cn('h-1.5 rounded-full transition-all', score >= 80 ? 'bg-[#10B981]' : score >= 50 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]')}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

export default async function AuditDetailPage({ params }: PageProps) {
  const { locale, projectId, jobId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect(`/${locale}/login`)

  const [{ data: job }, { data: rawChecks }, { data: domain }] = await Promise.all([
    supabase.from('audit_jobs').select('*').eq('id', jobId).single(),
    supabase.from('audit_checks').select('*').eq('job_id', jobId).order('group', { ascending: true }),
    supabase.from('domains').select('id, hostname').eq('project_id', projectId).limit(1).maybeSingle(),
  ])

  if (!job) return notFound()

  const auditJob   = job as AuditJob
  const checks     = (rawChecks ?? []) as AuditCheck[]
  const checksByGroup = GROUP_ORDER.reduce<Record<CheckGroup, AuditCheck[]>>((acc, g) => {
    acc[g] = checks.filter((c) => c.group === g)
    return acc
  }, {} as Record<CheckGroup, AuditCheck[]>)

  const groupScores: Partial<Record<CheckGroup, number | null>> = {
    seo:         auditJob.score_seo,
    dns:         auditJob.score_dns,
    security:    auditJob.score_security,
    performance: auditJob.score_performance,
    tech:        auditJob.score_tech,
    reputation:  auditJob.score_reputation,
  }

  // executive_summary may be stored in the job data — handled gracefully
  const executiveSummary = (auditJob as unknown as { executive_summary?: string }).executive_summary

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10 pb-24">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#8B8B9A]">
        <Link href={`/${locale}/dashboard/${projectId}`} className="hover:text-[#F1F1F5] transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link href={`/${locale}/dashboard/${projectId}/audit`} className="hover:text-[#F1F1F5] transition-colors">
          Auditorías
        </Link>
        <span>/</span>
        <span className="text-[#F1F1F5]">
          {format(new Date(auditJob.created_at), "d MMM yyyy", { locale: es })}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start gap-8">
        {/* Score ring */}
        <div className="shrink-0">
          <ScoreRing
            score={auditJob.score_overall ?? 0}
            size={140}
            label="Score general"
          />
        </div>

        {/* Meta */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold text-[#F1F1F5] tracking-tight font-display">
              {domain?.hostname ?? 'Auditoría'}
            </h1>
            <span className={cn(
              'text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded border',
              auditJob.status === 'completed' ? 'bg-[#10B98120] text-[#10B981] border-[#10B98140]' :
              auditJob.status === 'running'   ? 'bg-[#F59E0B20] text-[#F59E0B] border-[#F59E0B40]' :
                                               'bg-[#EF444420] text-[#EF4444] border-[#EF444440]',
            )}>
              {auditJob.status}
            </span>
          </div>

          <p className="text-sm text-[#8B8B9A]">
            {format(new Date(auditJob.created_at), "d 'de' MMMM yyyy 'a las' HH:mm", { locale: es })}
            {auditJob.completed_at && auditJob.started_at && (
              <> · {Math.round((new Date(auditJob.completed_at).getTime() - new Date(auditJob.started_at).getTime()) / 1000)}s</>
            )}
          </p>

          {executiveSummary && (
            <p className="text-sm text-[#C5C5D0] leading-relaxed max-w-2xl bg-[#14141C] border border-[#1E1E2A] rounded-xl px-4 py-3">
              {executiveSummary}
            </p>
          )}

          {domain && (
            <RunAuditButton
              domainId={domain.id}
              siteUrl={`https://${domain.hostname}`}
              className="mt-1"
            />
          )}
        </div>
      </div>

      {/* Group score cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {GROUP_ORDER.map((g) => {
          const s = groupScores[g]
          return s != null ? (
            <ScoreCard key={g} label={GROUP_LABELS[g]} score={s} />
          ) : null
        })}
      </div>

      {/* Checks per group */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#F1F1F5]">
          Detalle de checks
          <span className="ml-2 text-sm font-normal text-[#8B8B9A]">
            ({checks.length} checks)
          </span>
        </h2>
        <div className="space-y-3">
          {GROUP_ORDER.map((g) => {
            const groupChecks = checksByGroup[g]
            if (!groupChecks || groupChecks.length === 0) return null
            const hasFails = groupChecks.some((c) => c.status === 'fail' || c.status === 'warn')
            return (
              <CheckGroupSection
                key={g}
                group={g}
                checks={groupChecks}
                defaultOpen={hasFails}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
