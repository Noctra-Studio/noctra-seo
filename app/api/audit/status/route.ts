// GET /api/audit/status?site_id=<domain_uuid>
// Returns the most recent audit_job for the given domain, with basic scores.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get('site_id')

  if (!siteId) {
    return NextResponse.json({ error: 'site_id is required' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    console.info(`[API /audit/status] Checking job for site_id: ${siteId}`);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[API /audit/status] Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: job, error } = await supabase
      .from('audit_jobs')
      .select('id, status, score_overall, score_seo, score_dns, score_security, score_tech, created_at, completed_at')
      .eq('domain_id', siteId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[API /audit/status] Supabase error:', error.message, error.details, error.hint)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!job) {
      return NextResponse.json({ job: null })
    }

    return NextResponse.json({ job })
  } catch (err) {
    console.error('[API /audit/status] Runtime error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
