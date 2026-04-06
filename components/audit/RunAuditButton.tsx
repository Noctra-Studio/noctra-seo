'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Scan } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface RunAuditButtonProps {
  domainId:  string   // domains.id UUID — used as site_id in the API
  siteUrl:   string   // full URL for the audit
  className?: string
}

export function RunAuditButton({ domainId, siteUrl, className }: RunAuditButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const hostname = (() => {
    try { return new URL(siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`).hostname }
    catch { return siteUrl }
  })()

  async function handleClick() {
    if (loading) return
    setLoading(true)

    const toastId = toast.loading(`Analizando ${hostname}...`, {
      description: 'Esto puede tomar 15-30 segundos',
    })

    try {
      const res = await fetch('/api/audit/run', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ site_id: domainId, url: siteUrl, triggered_by: 'manual' }),
      })

      const data = await res.json()

      if (!res.ok) {
        const code = data?.code ?? 'INTERNAL_ERROR'
        if (code === 'ALREADY_RUNNING') {
          toast.dismiss(toastId)
          toast.warning('Ya hay una auditoría en curso para este sitio.')
        } else {
          toast.dismiss(toastId)
          toast.error('Error al ejecutar la auditoría', { description: data?.error ?? 'Error desconocido' })
        }
        return
      }

      toast.dismiss(toastId)
      toast.success('Auditoría completada', {
        description: `Score general: ${data.scores?.overall ?? '—'}/100 · ${data.checks_count} checks en ${(data.duration_ms / 1000).toFixed(1)}s`,
      })

      router.refresh()
    } catch (err) {
      toast.dismiss(toastId)
      toast.error('Error de red al ejecutar la auditoría')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
        loading
          ? 'bg-[#10B98120] text-[#10B981] cursor-wait'
          : 'bg-[#10B981] text-white hover:bg-[#059669] active:scale-[0.98] shadow-lg shadow-[#10B98120]',
        className,
      )}
    >
      {loading ? (
        <>
          <Loader2 size={15} className="animate-spin" />
          Analizando...
        </>
      ) : (
        <>
          <Scan size={15} />
          Nueva auditoría
        </>
      )}
    </button>
  )
}
