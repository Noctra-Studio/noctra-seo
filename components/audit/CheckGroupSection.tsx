'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, CheckCircle, AlertTriangle, XCircle, Info, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHECK_REGISTRY, type AuditCheck, type CheckGroup, type CheckStatus } from '@/lib/auditor/types'

interface CheckGroupSectionProps {
  group:       CheckGroup
  checks:      AuditCheck[]
  defaultOpen?: boolean
}

const GROUP_LABELS: Record<CheckGroup, string> = {
  seo:         'SEO',
  dns:         'DNS',
  security:    'Seguridad',
  performance: 'Rendimiento',
  tech:        'Tecnología',
  reputation:  'Reputación',
}

const PRIORITY_COLORS = {
  high:   'bg-[#EF444420] text-[#EF4444] border-[#EF444440]',
  medium: 'bg-[#F59E0B20] text-[#F59E0B] border-[#F59E0B40]',
  low:    'bg-[#8B8B9A20] text-[#8B8B9A] border-[#8B8B9A40]',
}

function StatusIcon({ status, size = 16 }: { status: CheckStatus; size?: number }) {
  switch (status) {
    case 'pass':    return <CheckCircle   size={size} className="text-[#10B981] shrink-0" />
    case 'warn':    return <AlertTriangle size={size} className="text-[#F59E0B] shrink-0" />
    case 'fail':    return <XCircle       size={size} className="text-[#EF4444] shrink-0" />
    case 'info':    return <Info          size={size} className="text-[#8B8B9A] shrink-0" />
    case 'error':   return <AlertCircle   size={size} className="text-[#EF444480] shrink-0" />
    case 'skipped': return <Info          size={size} className="text-[#8B8B9A40] shrink-0" />
    default:        return null
  }
}

function statusBg(status: CheckStatus): string {
  switch (status) {
    case 'pass':    return 'border-[#10B98120]'
    case 'warn':    return 'border-[#F59E0B20]'
    case 'fail':    return 'border-[#EF444420]'
    case 'info':    return 'border-[#1E1E2A]'
    case 'error':   return 'border-[#EF444420] opacity-60'
    case 'skipped': return 'border-[#1E1E2A] opacity-40'
    default:        return 'border-[#1E1E2A]'
  }
}

function DataTable({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== '')

  if (entries.length === 0) return null

  return (
    <div className="rounded-xl overflow-hidden border border-[#1E1E2A]">
      <table className="w-full text-sm">
        <tbody>
          {entries.map(([key, value], i) => (
            <tr
              key={key}
              className={cn(
                'border-b border-[#1E1E2A] last:border-0',
                i % 2 === 0 ? 'bg-[#0A0A0F]' : 'bg-[#14141C]',
              )}
            >
              <td className="px-4 py-2.5 text-[#8B8B9A] font-medium w-1/3 align-top whitespace-nowrap">
                {key}
              </td>
              <td className="px-4 py-2.5 text-[#C5C5D0] font-mono break-all">
                {Array.isArray(value)
                  ? value.length === 0
                    ? <span className="text-[#8B8B9A] italic">empty</span>
                    : value.map((v, j) => (
                        <div key={j} className="mb-0.5">
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </div>
                      ))
                  : typeof value === 'boolean'
                  ? <span className={value ? 'text-[#10B981]' : 'text-[#EF4444]'}>{String(value)}</span>
                  : typeof value === 'object'
                  ? <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(value, null, 2)}</pre>
                  : String(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CheckRow({ check }: { check: AuditCheck }) {
  const [expanded, setExpanded] = useState(false)
  const meta = CHECK_REGISTRY[check.check_key]
  const label = meta?.label ?? check.check_key
  const hasDetails = (check.data && Object.keys(check.data).length > 0) ||
                     (check.recommendations && check.recommendations.length > 0)

  return (
    <div className={cn('border rounded-xl overflow-hidden transition-colors', statusBg(check.status))}>
      {/* Row header */}
      <div
        className={cn(
          'flex items-start gap-3 p-4',
          hasDetails ? 'cursor-pointer hover:bg-white/[0.02]' : '',
        )}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <div className="mt-0.5">
          <StatusIcon status={check.status} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[#F1F1F5]">{label}</span>
            {check.score != null && (
              <span className={cn(
                'text-xs font-bold px-1.5 py-0.5 rounded',
                check.score >= 80 ? 'bg-[#10B98120] text-[#10B981]' :
                check.score >= 50 ? 'bg-[#F59E0B20] text-[#F59E0B]' :
                'bg-[#EF444420] text-[#EF4444]',
              )}>
                {check.score}
              </span>
            )}
          </div>

          {check.summary && (
            <p className="text-sm text-[#8B8B9A] mt-1 leading-relaxed">{check.summary}</p>
          )}
        </div>

        {hasDetails && (
          <div className="shrink-0 text-[#8B8B9A] mt-0.5">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        )}
      </div>

      {/* Expanded panel */}
      {expanded && hasDetails && (
        <div className="border-t border-[#1E1E2A] px-4 pb-4 pt-3 space-y-4 bg-[#0A0A0F]">
          {/* Recommendations */}
          {check.recommendations && check.recommendations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-[#8B8B9A]">
                Recomendaciones
              </p>
              <div className="space-y-2">
                {check.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className={cn(
                      'text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border shrink-0 mt-0.5',
                      PRIORITY_COLORS[rec.priority],
                    )}>
                      {rec.priority}
                    </span>
                    <p className="text-sm text-[#C5C5D0] leading-relaxed">{rec.action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw data table */}
          {check.data && Object.keys(check.data).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-[#8B8B9A]">
                Datos del check
              </p>
              <DataTable data={check.data as Record<string, unknown>} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function CheckGroupSection({ group, checks, defaultOpen = false }: CheckGroupSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  const passCount = checks.filter((c) => c.status === 'pass').length
  const failCount = checks.filter((c) => c.status === 'fail').length
  const warnCount = checks.filter((c) => c.status === 'warn').length

  if (checks.length === 0) return null

  return (
    <div className="bg-[#14141C] border border-[#1E1E2A] rounded-2xl overflow-hidden">
      {/* Group header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-[#F1F1F5]">
            {GROUP_LABELS[group]}
          </span>
          <div className="flex items-center gap-1.5">
            {failCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EF444420] text-[#EF4444]">
                {failCount} fail
              </span>
            )}
            {warnCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#F59E0B20] text-[#F59E0B]">
                {warnCount} warn
              </span>
            )}
            {failCount === 0 && warnCount === 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#10B98120] text-[#10B981]">
                {passCount} ok
              </span>
            )}
          </div>
        </div>
        {open ? <ChevronDown size={18} className="text-[#8B8B9A]" /> : <ChevronRight size={18} className="text-[#8B8B9A]" />}
      </button>

      {/* Checks list */}
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-[#1E1E2A]">
          <div className="pt-3 space-y-2">
            {checks.map((check) => (
              <CheckRow key={check.id} check={check} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
