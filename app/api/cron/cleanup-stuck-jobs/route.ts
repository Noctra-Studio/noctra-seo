import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Cleanup CRON: Marks jobs as 'failed' if they've been running for > 30 minutes.
 * Triggered via Vercel Cron.
 */
export async function GET() {
  const TIMEOUT_MINUTES = 30
  const cutoff = new Date(Date.now() - TIMEOUT_MINUTES * 60 * 1000).toISOString()
  const now = new Date().toISOString()

  try {
    const supabase = await createClient()

    console.info(`[Cleanup Cron] Starting cleanup for jobs stuck since ${cutoff}...`)

    const { data, error, count } = await supabase
      .from('audit_jobs')
      .update({ 
        status: 'failed', 
        completed_at: now 
      })
      .eq('status', 'running')
      .lt('created_at', cutoff)
      .select('id')

    if (error) {
      console.error('[Cleanup Cron] Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.info(`[Cleanup Cron] Successfully failed ${data?.length || 0} stuck jobs.`)

    return NextResponse.json({ 
      ok: true, 
      processed: data?.length || 0,
      timestamp: now 
    })
  } catch (err) {
    console.error('[Cleanup Cron] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
