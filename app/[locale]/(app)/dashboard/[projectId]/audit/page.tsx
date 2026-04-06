import { createClient } from '@/lib/supabase/server'
import { redirect }      from 'next/navigation'
import Link              from 'next/link'
import { format }        from 'date-fns'
import { es }            from 'date-fns/locale'
import { RunAuditButton } from '@/components/audit/RunAuditButton'
import { cn }             from '@/lib/utils'
import type { AuditJob } from '@/lib/auditor/types'

interface PageProps {
  params: { locale: string; projectId: string }
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-[#8B8B9A] text-sm">—</span>
  const color =
    score >= 80 ? 'bg-[#10B98120] text-[#10B981] border-[#10B98140]' :
    score >= 50 ? 'bg-[#F59E0B20] text-[#F59E0B] border-[#F59E0B40]' :
                  'bg-[#EF444420] text-[#EF4444] border-[#EF444440]'
  return (
    <span className={cn('text-sm font-bold px-2.5 py-1 rounded-lg border', color)}>
      {score}
    </span>
  )
}

function StatusBadge({ status }: { status: AuditJob['status'] }) {
  const map = {
    pending:   'bg-[#8B8B9A20] text-[#8B8B9A] border-[#8B8B9A40]',
    running:   'bg-[#F59E0B20] text-[#F59E0B] border-[#F59E0B40]',
    completed: 'bg-[#10B98120] text-[#10B981] border-[#10B98140]',
    failed:    'bg-[#EF444420] text-[#EF4444] border-[#EF444440]',
  }
  const labels = {
    pending:   'Pendiente',
    running:   'En progreso',
    completed: 'Completada',
    failed:    'Fallida',
  }
  return (
    <span className={cn('text-xs font-bold uppercase tracking-widest px-2 py-1 rounded border', map[status])}>
      {labels[status]}
    </span>
  )
}

export default async function AuditListPage({ params }: PageProps) {
  const { locale, projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect(`/${locale}/login`)

  // Get domain for this project
  const { data: domain } = await supabase
    .from('domains')
    .select('id, hostname')
    .eq('project_id', projectId)
    .limit(1)
    .maybeSingle()

  if (!domain) return redirect(`/${locale}/dashboard`)

  // Fetch audit jobs for this domain
  const { data: jobs } = await supabase
    .from('audit_jobs')
    .select('*')
    .eq('domain_id', domain.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const auditJobs = (jobs ?? []) as AuditJob[]

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#F1F1F5] tracking-tight font-display">
            Auditorías
          </h1>
          <p className="text-sm text-[#8B8B9A] mt-1">{domain.hostname}</p>
        </div>
        <RunAuditButton
          domainId={domain.id}
          siteUrl={`https://${domain.hostname}`}
        />
      </div>

      {/* List */}
      {auditJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-[#14141C] border border-[#1E1E2A] flex items-center justify-center mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B8B9A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/>
            </svg>
          </div>
          <p className="text-base font-semibold text-[#F1F1F5]">Sin auditorías aún</p>
          <p className="text-sm text-[#8B8B9A] mt-1 max-w-xs">
            Ejecuta tu primera auditoría para ver el estado técnico completo de {domain.hostname}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {auditJobs.map((job) => (
            <div
              key={job.id}
              className="bg-[#14141C] border border-[#1E1E2A] rounded-2xl p-5 flex items-center gap-5 hover:border-[#2A2A38] transition-colors"
            >
              {/* Score ring (small) */}
              <div className="shrink-0 w-14 h-14 relative flex items-center justify-center">
                {job.score_overall != null ? (
                  <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="28" cy="28" r="22" fill="none" stroke="#1E1E2A" strokeWidth="5" />
                    <circle
                      cx="28" cy="28" r="22" fill="none"
                      stroke={job.score_overall >= 80 ? '#10B981' : job.score_overall >= 50 ? '#F59E0B' : '#EF4444'}
                      strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 22}
                      strokeDashoffset={2 * Math.PI * 22 * (1 - job.score_overall / 100)}
                    />
                    <text
                      x="28" y="28" textAnchor="middle" dominantBaseline="central"
                      style={{
                        transform: 'rotate(90deg)',
                        transformOrigin: '28px 28px',
                        fill: job.score_overall >= 80 ? '#10B981' : job.score_overall >= 50 ? '#F59E0B' : '#EF4444',
                        fontSize: 13, fontWeight: 800,
                      }}
                    >
                      {job.score_overall}
                    </text>
                  </svg>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#1E1E2A] flex items-center justify-center text-[#8B8B9A] text-xs font-bold">
                    —
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={job.status} />
                  <span className="text-xs text-[#8B8B9A]">
                    {format(new Date(job.created_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                  </span>
                </div>
                {job.score_overall != null && (
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {([['SEO', job.score_seo], ['DNS', job.score_dns], ['Seg', job.score_security], ['Tech', job.score_tech]] as [string, number | null][]).map(([label, score]) =>
                      score != null ? (
                        <span key={label} className="text-xs text-[#8B8B9A]">
                          <span className="font-bold text-[#C5C5D0]">{label}</span>{' '}
                          <ScoreBadge score={score} />
                        </span>
                      ) : null
                    )}
                  </div>
                )}
              </div>

              {/* CTA */}
              {job.status === 'completed' && (
                <Link
                  href={`/${locale}/dashboard/${projectId}/audit/${job.id}`}
                  className="shrink-0 text-sm font-semibold text-[#10B981] hover:text-[#34d399] transition-colors"
                >
                  Ver detalle →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
