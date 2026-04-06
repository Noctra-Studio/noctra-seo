'use client'

import { useState } from 'react'
import { Copy, Check, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Site } from '@/lib/types/sites'

interface InstallSnippetModalProps {
  site:    Site
  open:    boolean
  onClose: () => void
}

const STEPS = [
  'Pega este script antes del cierre de </head> en tu sitio',
  'Para Next.js: agrégalo en el componente <Head> de tu layout.tsx',
  'Para WordPress: usa el plugin "Insert Headers and Footers"',
  'Los datos comenzarán a aparecer en minutos',
]

function buildSnippet(siteId: string): string {
  return `<!-- Noctra SEO Tracker -->
<script
  src="https://seo.noctra.studio/tracker.js"
  data-site-id="${siteId}"
  defer
></script>`
}

export function InstallSnippetModal({ site, open, onClose }: InstallSnippetModalProps) {
  const [copiedId,      setCopiedId]      = useState(false)
  const [copiedSnippet, setCopiedSnippet] = useState(false)

  const siteId  = site.site_id ?? site.id
  const snippet = buildSnippet(siteId)

  async function copyText(text: string, which: 'id' | 'snippet') {
    try {
      await navigator.clipboard.writeText(text)
      if (which === 'id') {
        setCopiedId(true)
        setTimeout(() => setCopiedId(false), 2000)
      } else {
        setCopiedSnippet(true)
        setTimeout(() => setCopiedSnippet(false), 2000)
      }
    } catch {}
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent
        className="max-w-xl border-white/[0.08]"
        style={{ background: '#0A0A0F', color: '#ffffff' }}
      >
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-lg text-white flex items-center gap-2">
            Instalar tracker
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full truncate max-w-[180px]"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}
            >
              {site.name}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-1">
          {/* Site ID */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8B8B9A] mb-2">
              Site ID
            </p>
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <code className="flex-1 font-mono text-sm text-[#F1F1F5] break-all select-all">
                {siteId}
              </code>
              <button
                onClick={() => copyText(siteId, 'id')}
                className="shrink-0 p-1.5 rounded-lg transition-colors hover:bg-white/[0.06]"
                title="Copiar Site ID"
              >
                {copiedId
                  ? <Check size={14} className="text-[#10B981]" />
                  : <Copy size={14} className="text-[#8B8B9A]" />
                }
              </button>
            </div>
          </div>

          {/* Snippet */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8B8B9A] mb-2">
              Snippet de instalación
            </p>
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <pre
                className="p-4 text-[12px] font-mono text-[#a3a3a3] overflow-x-auto leading-relaxed"
                style={{ background: 'rgba(0,0,0,0.4)' }}
              >
                <code>{snippet}</code>
              </pre>
            </div>
            <button
              onClick={() => copyText(snippet, 'snippet')}
              className="mt-2.5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: copiedSnippet ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                border: copiedSnippet ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
                color: copiedSnippet ? '#10B981' : '#F1F1F5',
              }}
            >
              {copiedSnippet
                ? <><Check size={14} /> Copiado</>
                : <><Copy size={14} /> Copiar snippet</>
              }
            </button>
          </div>

          {/* Instructions */}
          <div
            className="rounded-xl p-4 space-y-2"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8B8B9A] mb-3">
              Instrucciones
            </p>
            <ol className="space-y-2">
              {STEPS.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[#a3a3a3]">
                  <span
                    className="shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5"
                    style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
