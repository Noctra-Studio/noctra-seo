'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface AuditProgressBannerProps {
  domainId: string   // domains.id UUID
}

type BannerState = 'running' | 'completed' | 'failed' | 'idle'

const POLL_INTERVAL_MS = 10_000
const MAX_ERRORS       = 10   // Stop if we hit 10 consecutive network errors
const MAX_POLLS        = 24   // 24 polls * 10s = 4 minutes max wait
// Delay before first poll after a trigger — gives the API time to create the job record
const TRIGGER_DELAY_MS = 3_000

export function AuditProgressBanner({ domainId }: AuditProgressBannerProps) {
  const t = useTranslations('audit')
  const [state, _setState]       = useState<BannerState>('idle')
  const [dismissed, _setDismissed] = useState(false)
  const router = useRouter()

  // Refs mirror state values so poll() reads the current value even from a stale closure
  const stateRef       = useRef<BannerState>('idle')
  const dismissedRef   = useRef(false)
  const errorCountRef  = useRef(0)
  const attemptsRef    = useRef(0)
  const timerRef       = useRef<ReturnType<typeof setTimeout> | null>(null)

  function setState(s: BannerState) {
    stateRef.current = s
    _setState(s)
  }

  function setDismissed(d: boolean) {
    dismissedRef.current = d
    _setDismissed(d)
  }

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  async function poll() {
    if (dismissedRef.current) return

    if (errorCountRef.current >= MAX_ERRORS || attemptsRef.current >= MAX_POLLS) {
      if (errorCountRef.current >= MAX_ERRORS) {
        console.error('[AuditProgressBanner] Max errors reached, stopping poll.')
      } else {
        console.warn('[AuditProgressBanner] Audit timed out after 4 minutes.')
      }
      setState('failed')
      clearTimer()
      return
    }
    attemptsRef.current++

    try {
      const res = await fetch(`/api/audit/status?site_id=${domainId}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const job  = data?.job
      errorCountRef.current = 0

      // No active job, or job already finished
      if (!job || (job.status !== 'running' && job.status !== 'pending')) {
        const currentState = stateRef.current  // always fresh via ref

        if (job?.status === 'completed' && currentState === 'running') {
          setState('completed')
          console.log('[AuditProgressBanner] Audit finished! Refreshing data...')
          router.refresh()
          clearTimer()
          timerRef.current = setTimeout(() => setState('idle'), 5000)
        } else if (job?.status === 'failed' && currentState === 'running') {
          setState('failed')
          clearTimer()
          timerRef.current = setTimeout(() => setState('idle'), 5000)
        } else if (currentState !== 'completed' && currentState !== 'failed') {
          setState('idle')
          clearTimer()
        }
        return // STOP POLLING
      }

      // Job is active — keep polling
      setState('running')
      clearTimer()
      timerRef.current = setTimeout(poll, POLL_INTERVAL_MS)

    } catch (err: any) {
      const isNetworkError =
        err.name === 'TypeError' ||
        err.name === 'AbortError' ||
        err.message?.includes('Failed to fetch')
      if (!isNetworkError) console.error('[AuditProgressBanner] Poll error:', err)
      errorCountRef.current++
      clearTimer()
      timerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
    }
  }

  useEffect(() => {
    // Initial check on mount
    poll()

    const handleGlobalTrigger = () => {
      console.log('[AuditProgressBanner] Global trigger received')
      setState('running')           // Optimistic UI immediately
      attemptsRef.current  = 0
      errorCountRef.current = 0
      clearTimer()
      // Delay first poll so the API has time to insert the job record in DB
      timerRef.current = setTimeout(poll, TRIGGER_DELAY_MS)
    }

    window.addEventListener('noctra:audit_started', handleGlobalTrigger)
    return () => {
      clearTimer()
      window.removeEventListener('noctra:audit_started', handleGlobalTrigger)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainId])

  if (dismissed || state === 'idle') return null

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-5 py-3 rounded-2xl border text-sm font-medium transition-all',
        state === 'running'   && 'bg-[#F59E0B10] border-[#F59E0B40] text-[#F59E0B]',
        state === 'completed' && 'bg-[#10B98110] border-[#10B98140] text-[#10B981]',
        state === 'failed'    && 'bg-[#EF444410] border-[#EF444440] text-[#EF4444]',
      )}
    >
      {state === 'running'   && <Loader2 size={15} className="animate-spin shrink-0" />}
      {state === 'completed' && <CheckCircle size={15} className="shrink-0" />}
      {state === 'failed'    && <AlertCircle size={15} className="shrink-0" />}

      <span>
        {state === 'running'   && t('running')}
        {state === 'completed' && t('completed')}
        {state === 'failed'    && t('failed')}
      </span>

      <button
        onClick={() => setDismissed(true)}
        className="ml-auto shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label={t('close')}
      >
        <X size={14} />
      </button>
    </div>
  )
}
