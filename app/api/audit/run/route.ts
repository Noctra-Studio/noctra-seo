// =====================
// NOCTRA SEO — Site Auditor: Orchestration Route Handler
// POST /api/audit/run
// =====================
// NOTE: runtime is intentionally NOT 'edge' — checks use node:tls and node:dns

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runSeoChecks }         from '@/lib/auditor/checks/seo'
import { runDnsChecks }         from '@/lib/auditor/checks/dns'
import { runSecurityChecks }    from '@/lib/auditor/checks/security'
import { runTechChecks }        from '@/lib/auditor/checks/tech'
import { runPerformanceChecks } from '@/lib/auditor/checks/performance'
import { runReputationChecks }  from '@/lib/auditor/checks/reputation'
import { analyzeAuditResults, generateAuditSummary } from '@/lib/auditor/analyzer'
import {
  calculateGroupScore,
  calculateOverallScore,
  type AuditJob,
  type CheckGroup,
  type CheckResult,
  type TriggeredBy,
} from '@/lib/auditor/types'

// ----------------------
// Helpers
// ----------------------

function extractHostname(url: string): string {
  try {
    const raw = /^https?:\/\//i.test(url) ? url : `https://${url}`
    return new URL(raw).hostname
  } catch {
    return url.trim().split('/')[0]
  }
}

function jsonError(
  message: string,
  code: 'UNAUTHORIZED' | 'NOT_FOUND' | 'ALREADY_RUNNING' | 'INTERNAL_ERROR',
  status: number,
) {
  return NextResponse.json({ error: message, code }, { status })
}

// ----------------------
// POST handler
// ----------------------

export async function POST(req: NextRequest) {
  console.info('[API /audit/run] Incoming POST request');
  const t0 = performance.now()

  // 1. Parse & validate request body
  let body: { site_id?: unknown; url?: unknown; triggered_by?: unknown }
  try {
    body = await req.json()
    console.info('[API /audit/run] Body parsed:', body);
  } catch {
    console.error('[API /audit/run] Failed to parse JSON body');
    return jsonError('Invalid JSON body', 'INTERNAL_ERROR', 400)
  }

  const siteId      = typeof body.site_id      === 'string' ? body.site_id.trim()      : null
  const url         = typeof body.url          === 'string' ? body.url.trim()          : null
  const triggeredBy = typeof body.triggered_by === 'string' ? body.triggered_by as TriggeredBy : 'manual'

  if (!siteId || !url) {
    return jsonError('site_id and url are required', 'INTERNAL_ERROR', 400)
  }

  const validTriggers: TriggeredBy[] = ['manual', 'onboarding', 'scheduled']
  if (!validTriggers.includes(triggeredBy)) {
    return jsonError('Invalid triggered_by value', 'INTERNAL_ERROR', 400)
  }

  // 2. Authenticate
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return jsonError('Unauthorized', 'UNAUTHORIZED', 401)
  }

  // 3. Verify domain belongs to this user (via org membership chain)
  //    domains → projects → org_id = user's org_id
  const { data: domain, error: domainError } = await supabase
    .from('domains')
    .select('id, hostname')
    .eq('id', siteId)
    .single()

  if (domainError || !domain) {
    return jsonError('Domain not found or access denied', 'NOT_FOUND', 404)
  }

  // 4. Deduplication — reject if a job is already running for this domain
  const { data: runningJob } = await supabase
    .from('audit_jobs')
    .select('id')
    .eq('domain_id', siteId)
    .eq('status', 'running')
    .maybeSingle()

  if (runningJob) {
    return jsonError(
      'An audit is already running for this domain',
      'ALREADY_RUNNING',
      409,
    )
  }

  // 5. Create audit_job in 'pending' state
  const { data: job, error: jobCreateError } = await supabase
    .from('audit_jobs')
    .insert({
      domain_id:    siteId,
      user_id:      user.id,
      status:       'pending',
      triggered_by: triggeredBy,
    })
    .select('id')
    .single()

  if (jobCreateError || !job) {
    return jsonError('Failed to create audit job', 'INTERNAL_ERROR', 500)
  }

  const jobId = job.id

  // 6. Transition to 'running'
  console.info(`[Audit ${jobId}] Starting audit for ${url}...`);
  await supabase
    .from('audit_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', jobId)

  // ---- Execute checks ----
  try {
    const domain_hostname = extractHostname(url)
    console.info(`[Audit ${jobId}] Domain hostname: ${domain_hostname}`);

    // 7. Run all check groups in parallel
    console.info(`[Audit ${jobId}] Running parallel check groups...`);
    const [seoResult, dnsResult, secResult, techResult, perfResult, repResult] =
      await Promise.allSettled([
        runSeoChecks(url),
        runDnsChecks(domain_hostname),
        runSecurityChecks(url),
        runTechChecks(url),
        runPerformanceChecks(url),
        runReputationChecks(domain_hostname),
      ])
    
    console.info(`[Audit ${jobId}] All check groups settled.`);

    // Flatten results — settled rejections become error CheckResults
    const GROUP_KEYS: CheckGroup[] = ['seo', 'dns', 'security', 'tech', 'performance', 'reputation']

    function settledToChecks(
      result: PromiseSettledResult<CheckResult[]>,
      group: CheckGroup,
    ): CheckResult[] {
      if (result.status === 'fulfilled') return result.value
      // Entire group runner threw — emit a single error result for the group
      return [{
        check_key: `${group}_runner`,
        group,
        status:    'error',
        score:     null,
        data:      {},
        error:     result.reason instanceof Error
          ? result.reason.message
          : String(result.reason),
      }]
    }

    const allChecks: CheckResult[] = [
      ...settledToChecks(seoResult,  'seo'),
      ...settledToChecks(dnsResult,  'dns'),
      ...settledToChecks(secResult,  'security'),
      ...settledToChecks(techResult, 'tech'),
      ...settledToChecks(perfResult, 'performance'),
      ...settledToChecks(repResult,  'reputation'),
    ]

    // 8. Calculate scores
    const checksByGroup = (group: CheckGroup) =>
      allChecks.filter((c) => c.group === group)

    const groupScores: Partial<Record<CheckGroup, number>> = {}
    for (const group of GROUP_KEYS) {
      const checks = checksByGroup(group)
      if (checks.length > 0) {
        const score = calculateGroupScore(checks)
        // Only record the group score if at least one check contributed
        if (score > 0 || checks.some((c) => c.status !== 'error')) {
          groupScores[group] = score
        }
      }
    }

    const overallScore = calculateOverallScore(groupScores)

    // 9. Enrich checks with Claude summaries and recommendations
    console.info(`[Audit ${jobId}] Analyzing results with AI (Claude)...`);
    const enrichedChecks = await analyzeAuditResults(allChecks, url)
    console.info(`[Audit ${jobId}] AI enrichment complete.`);

    // 9b. Generate executive summary (best-effort, won't block completion)
    const partialJob: AuditJob = {
      id: jobId, domain_id: siteId, user_id: user.id,
      status: 'completed', triggered_by: triggeredBy,
      started_at: null, completed_at: null,
      score_overall: overallScore,
      score_seo: groupScores.seo ?? null,
      score_dns: groupScores.dns ?? null,
      score_security: groupScores.security ?? null,
      score_performance: groupScores.performance ?? null,
      score_tech: groupScores.tech ?? null,
      score_reputation: groupScores.reputation ?? null,
      created_at: new Date().toISOString(),
    }
    console.info(`[Audit ${jobId}] Generating executive summary...`);
    const executiveSummary = await generateAuditSummary(partialJob, enrichedChecks)
    console.info(`[Audit ${jobId}] Executive summary complete.`);

    // 10. Persist all checks
    console.info(`[Audit ${jobId}] Persisting ${enrichedChecks.length} checks to DB...`);
    const checksToInsert = enrichedChecks.map((c) => ({
      job_id:          jobId,
      check_key:       c.check_key,
      group:           c.group,
      status:          c.status,
      score:           c.score,
      data:            c.data,
      summary:         c.summary         || null,
      recommendations: c.recommendations?.length ? c.recommendations : null,
    }))

    if (checksToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('audit_checks')
        .insert(checksToInsert)

      if (insertError) throw new Error(`Failed to insert checks: ${insertError.message}`)
    }

    // 11. Mark job completed with all scores
    const completedAt = new Date().toISOString()
    console.info(`[Audit ${jobId}] Marking job as completed.`);

    await supabase
      .from('audit_jobs')
      .update({
        status:           'completed',
        completed_at:     completedAt,
        ...(executiveSummary ? { executive_summary: executiveSummary } : {}),
        score_overall:    overallScore,
        score_seo:        groupScores.seo         ?? null,
        score_dns:        groupScores.dns         ?? null,
        score_security:   groupScores.security    ?? null,
        score_performance: groupScores.performance ?? null,
        score_tech:       groupScores.tech        ?? null,
        score_reputation: groupScores.reputation  ?? null,
      })
      .eq('id', jobId)

    const duration_ms = Math.round(performance.now() - t0)
    console.info(`[Audit ${jobId}] AUDIT FINISHED perfectly in ${duration_ms}ms.`);

    return NextResponse.json({
      job_id:       jobId,
      status:       'completed',
      scores: {
        overall:     overallScore,
        seo:         groupScores.seo         ?? 0,
        dns:         groupScores.dns         ?? 0,
        security:    groupScores.security    ?? 0,
        tech:        groupScores.tech        ?? 0,
        performance: groupScores.performance ?? 0,
        reputation:  groupScores.reputation  ?? 0,
      },
      checks_count: checksToInsert.length,
      duration_ms,
    })
  } catch (err) {
    // 11. Mark job failed on unhandled error
    await supabase
      .from('audit_jobs')
      .update({ status: 'failed', completed_at: new Date().toISOString() })
      .eq('id', jobId)

    const message = err instanceof Error ? err.message : 'Unknown error'
    return jsonError(message, 'INTERNAL_ERROR', 500)
  }
}
