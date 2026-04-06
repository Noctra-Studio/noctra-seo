'use client'

import { useState } from 'react'
import { Globe, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSite } from '@/lib/context/SiteContext'
import { InstallSnippetModal } from './InstallSnippetModal'
import type { Site } from '@/lib/types/sites'

interface AddSiteModalProps {
  open:    boolean
  onClose: () => void
}

export function AddSiteModal({ open, onClose }: AddSiteModalProps) {
  const { refetchSites, setActiveSite } = useSite()

  const [name,    setName]    = useState('')
  const [url,     setUrl]     = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // After creating a site, show the snippet modal
  const [newSite,        setNewSite]        = useState<Site | null>(null)
  const [snippetOpen,    setSnippetOpen]    = useState(false)

  function reset() {
    setName('')
    setUrl('')
    setError(null)
    setSaving(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) { setError('El nombre es obligatorio'); return }
    if (!url.trim())  { setError('La URL es obligatoria');    return }

    setSaving(true)
    try {
      const res  = await fetch('/api/sites', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url: url.trim(), display_name: name.trim() }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Error al crear el sitio')
        return
      }

      const site: Site = json.site

      // 1. Refresh site list in context
      await refetchSites()

      // 2. Close add modal
      handleClose()

      // 3. Select new site
      setActiveSite(site)

      // 4. Show snippet modal
      setNewSite(site)
      setSnippetOpen(true)
    } catch {
      setError('Error de red. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
        <DialogContent
          className="max-w-md border-white/[0.08]"
          style={{ background: '#0A0A0F', color: '#ffffff' }}
        >
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg text-white">
              Agregar sitio
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8B8B9A]">
                Nombre del sitio
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Clínica del Valle"
                disabled={saving}
                className="w-full rounded-xl px-4 py-3 text-sm text-[#F1F1F5] placeholder:text-[#555] outline-none transition-colors disabled:opacity-50"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)' }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
              />
            </div>

            {/* URL */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8B8B9A]">
                URL del sitio
              </label>
              <div className="relative">
                <Globe
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none"
                />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://ejemplo.com"
                  disabled={saving}
                  className="w-full rounded-xl pl-9 pr-4 py-3 text-sm text-[#F1F1F5] placeholder:text-[#555] outline-none transition-colors disabled:opacity-50"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)' }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-[#EF4444] rounded-lg px-3 py-2"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: '#10B981', color: '#000' }}
              onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = '#0ea572' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#10B981' }}
            >
              {saving
                ? <><Loader2 size={15} className="animate-spin" /> Creando...</>
                : 'Agregar sitio'
              }
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Snippet modal — shown right after creation */}
      {newSite && (
        <InstallSnippetModal
          site={newSite}
          open={snippetOpen}
          onClose={() => { setSnippetOpen(false); setNewSite(null) }}
        />
      )}
    </>
  )
}
