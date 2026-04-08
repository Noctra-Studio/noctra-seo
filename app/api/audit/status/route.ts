// GET /api/audit/status?site_id=<domain_uuid>
// Returns the most recent audit_job for the given domain, with basic scores.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get('site_id')

  if (!siteId) {
    return NextResponse.json({ error: 'site_id is required' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    console.info(`[API /audit/status] Checking job for site_id: ${siteId}`);

    // Auth check - made more resilient
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.warn('[API /audit/status] Auth failed or missing user:', authError?.message)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } catch (authRuntimeErr) {
      console.error('[API /audit/status] Critical Auth runtime error:', authRuntimeErr)
      return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 500 })
    }

    // UUID validation to prevent Supabase 400 (Bad Input)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(siteId)) {
      console.error(`[API /audit/status] Invalid site_id format: ${siteId}`);
      return NextResponse.json({ error: 'Invalid site_id format' }, { status: 400 });
    }

    const { data: job, error } = await supabase
      .from('audit_jobs')
      .select('id, status, score_overall, score_seo, score_dns, score_security, score_tech, created_at, completed_at')
      .eq('domain_id', siteId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[API /audit/status] Supabase query error:', error.message)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    if (!job) {
      return NextResponse.json({ job: null })
    }

    return NextResponse.json({ job })
  } catch (err) {
    console.error('[API /audit/status] General runtime error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
