'use client'

import { useEffect, useState } from 'react'
import { Globe, Copy, Check, Trash2, ExternalLink, Plus, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { useSite } from '@/lib/context/SiteContext'
import { AddSiteModal } from '@/components/dashboard/AddSiteModal'
import { InstallSnippetModal } from '@/components/dashboard/InstallSnippetModal'
import { cn } from '@/lib/utils'
import type { Site } from '@/lib/types/sites'

// ----------------------
// Favicon component (matches SiteSwitcher)
// ----------------------

function SiteFavicon({ url, name, size = 32 }: { url: string | null; name: string; size?: number }) {
  const [failed, setFailed] = useState(false)

  if (!url || failed) {
    return (
      <div
        className="rounded-xl flex items-center justify-center shrink-0"
        style={{ width: size, height: size, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Globe size={size * 0.45} className="text-[#8B8B9A]" />
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden shrink-0" style={{ width: size, height: size }}>
      <Image
        src={url}
        alt={name}
        width={size}
        height={size}
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
        unoptimized
      />
    </div>
  )
}

// ----------------------
// Site Card
// ----------------------

function SiteCard({
  site,
  onViewData,
  onViewSnippet,
  onDelete,
}: {
  site:          Site
  onViewData:    (site: Site) => void
  onViewSnippet: (site: Site) => void
  onDelete:      (site: Site) => void
}) {
  const [copiedId, setCopiedId] = useState(false)

  const trackerId   = site.site_id ?? site.id
  const truncatedId = trackerId.length > 18
    ? trackerId.slice(0, 18) + '…'
    : trackerId

  async function copyId() {
    try {
      await navigator.clipboard.writeText(trackerId)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    } catch {}
  }

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 transition-all"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <SiteFavicon url={site.favicon_url} name={site.name} size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-[#F1F1F5] truncate text-sm leading-tight">
              {site.name}
            </h3>
            {site.is_default && (
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}
              >
                Default
              </span>
            )}
          </div>
          {site.hostname && (
            <a
              href={`https://${site.hostname}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-[#8B8B9A] hover:text-[#10B981] transition-colors mt-0.5 w-fit"
            >
              {site.hostname}
              <ExternalLink size={9} />
            </a>
          )}
        </div>
        {/* Tracker status dot */}
        <div
          className="w-2 h-2 rounded-full shrink-0 mt-1"
          title={site.tracker_installed ? 'Tracker instalado' : 'Tracker pendiente'}
          style={{
            background: site.tracker_installed ? '#10B981' : '#8B8B9A',
            boxShadow:  site.tracker_installed ? '0 0 6px rgba(16,185,129,0.5)' : 'none',
          }}
        />
      </div>

      {/* Site ID */}
      <div
        className="rounded-xl px-3 py-2.5 flex items-center gap-2"
        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#555] shrink-0">
          Site ID
        </p>
        <code className="flex-1 text-[11px] font-mono text-[#a3a3a3] truncate">
          {truncatedId}
        </code>
        <button
          onClick={copyId}
          className="shrink-0 p-1 rounded-md hover:bg-white/[0.05] transition-colors"
          title="Copiar Site ID"
        >
          {copiedId
            ? <Check size={12} className="text-[#10B981]" />
            : <Copy size={12} className="text-[#8B8B9A]" />
          }
        </button>
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-2 pt-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <button
          onClick={() => onViewData(site)}
          className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: 'rgba(16,185,129,0.08)',
            border:     '1px solid rgba(16,185,129,0.15)',
            color:      '#10B981',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.15)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)' }}
        >
          Ver datos
        </button>
        <button
          onClick={() => onViewSnippet(site)}
          className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border:     '1px solid rgba(255,255,255,0.08)',
            color:      '#F1F1F5',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
        >
          Ver snippet
        </button>
        {!site.is_default && (
          <button
            onClick={() => onDelete(site)}
            className="p-2 rounded-xl transition-all"
            style={{
              background: 'rgba(239,68,68,0.06)',
              border:     '1px solid rgba(239,68,68,0.1)',
              color:      '#EF4444',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)' }}
            title="Eliminar sitio"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

// ----------------------
// Delete confirmation dialog
// ----------------------

function DeleteConfirmDialog({
  site,
  onConfirm,
  onCancel,
  deleting,
}: {
  site:     Site
  onConfirm: () => void
  onCancel:  () => void
  deleting:  boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
        style={{ background: '#0E0E16', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <h3 className="font-bold text-[#F1F1F5] text-base">¿Eliminar sitio?</h3>
        <p className="text-sm text-[#8B8B9A]">
          Se eliminará <span className="text-[#F1F1F5] font-semibold">{site.name}</span> y todos
          sus datos (historial de auditorías, métricas, alertas). Esta acción es irreversible.
        </p>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#F1F1F5' }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}
          >
            {deleting ? <><Loader2 size={14} className="animate-spin" /> Eliminando…</> : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ----------------------
// Page
// ----------------------

export default function SitesPage() {
  const { sites, isLoading, refetchSites, setActiveSite } = useSite()
  const router  = useRouter()
  const params  = useParams()
  const locale  = (params?.locale as string) ?? 'es'

  const [addOpen,      setAddOpen]      = useState(false)
  const [snippetSite,  setSnippetSite]  = useState<Site | null>(null)
  const [deleteSite,   setDeleteSite]   = useState<Site | null>(null)
  const [deleting,     setDeleting]     = useState(false)
  const [deleteError,  setDeleteError]  = useState<string | null>(null)

  // Ensure sites are loaded
  useEffect(() => { refetchSites() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleViewData(site: Site) {
    setActiveSite(site)
    router.push(`/${locale}/dashboard/${site.id}`)
  }

  async function handleDelete() {
    if (!deleteSite) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const res  = await fetch(`/api/sites/${deleteSite.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) { setDeleteError(json.error ?? 'Error al eliminar'); return }
      await refetchSites()
      setDeleteSite(null)
    } catch {
      setDeleteError('Error de red. Intenta de nuevo.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-8 max-w-[1200px] mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F1F5] tracking-tight font-display">
            Mis Sitios
          </h1>
          <p className="text-sm text-[#8B8B9A] mt-1">
            {isLoading ? 'Cargando…' : `${sites.length} sitio${sites.length !== 1 ? 's' : ''} registrado${sites.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: '#10B981', color: '#000' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#0ea572' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#10B981' }}
        >
          <Plus size={15} />
          Agregar sitio
        </button>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-52 rounded-2xl animate-pulse"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sites.length === 0 && (
        <div className="text-center py-24">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Globe size={24} className="text-[#8B8B9A]" />
          </div>
          <p className="text-[#F1F1F5] font-semibold mb-1">Sin sitios todavía</p>
          <p className="text-sm text-[#8B8B9A] mb-6">Agrega tu primer sitio para empezar a monitorear</p>
          <button
            onClick={() => setAddOpen(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: '#10B981', color: '#000' }}
          >
            Agregar sitio
          </button>
        </div>
      )}

      {/* Site grid */}
      {!isLoading && sites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              onViewData={handleViewData}
              onViewSnippet={(s) => setSnippetSite(s)}
              onDelete={(s) => { setDeleteSite(s); setDeleteError(null) }}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddSiteModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />

      {snippetSite && (
        <InstallSnippetModal
          site={snippetSite}
          open={!!snippetSite}
          onClose={() => setSnippetSite(null)}
        />
      )}

      {deleteSite && (
        <DeleteConfirmDialog
          site={deleteSite}
          onConfirm={handleDelete}
          onCancel={() => { setDeleteSite(null); setDeleteError(null) }}
          deleting={deleting}
        />
      )}

      {deleteError && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg z-50"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}
        >
          {deleteError}
        </div>
      )}
    </div>
  )
}
