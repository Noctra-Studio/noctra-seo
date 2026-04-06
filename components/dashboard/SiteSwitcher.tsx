'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Globe, ChevronDown, Check, Plus } from 'lucide-react'
import { useSite } from '@/lib/context/SiteContext'
import { AddSiteModal } from './AddSiteModal'
import { cn } from '@/lib/utils'
import type { Site } from '@/lib/types/sites'

interface FaviconProps {
  url:      string | null
  name:     string
  size?:    number
}

function Favicon({ url, name, size = 20 }: FaviconProps) {
  const [failed, setFailed] = useState(false)

  if (!url || failed) {
    return (
      <div
        className="rounded-md flex items-center justify-center shrink-0 bg-white/[0.06]"
        style={{ width: size, height: size }}
      >
        <Globe size={size * 0.6} className="text-[#8B8B9A]" />
      </div>
    )
  }

  return (
    <div className="rounded-md overflow-hidden shrink-0" style={{ width: size, height: size }}>
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

interface SiteSwitcherProps {
  collapsed?: boolean
}

export function SiteSwitcher({ collapsed = false }: SiteSwitcherProps) {
  const { sites, activeSite, isLoading, setActiveSite } = useSite()

  const [open,         setOpen]         = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function selectSite(site: Site) {
    setActiveSite(site)
    setOpen(false)
  }

  const displayName = activeSite?.name ?? (isLoading ? '...' : 'Seleccionar sitio')
  const truncated   = displayName.length > 20 ? displayName.slice(0, 20) + '…' : displayName

  if (collapsed) {
    return (
      <>
        <div className="px-3 mb-2">
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-full flex items-center justify-center p-2 rounded-xl transition-colors hover:bg-white/[0.05] relative"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}
            title={displayName}
          >
            <Favicon url={activeSite?.favicon_url ?? null} name={displayName} size={20} />
          </button>
        </div>

        {/* Collapsed dropdown — positioned to the right */}
        {open && (
          <div
            ref={containerRef}
            className="absolute left-[78px] top-[64px] w-[220px] rounded-2xl shadow-2xl z-50 overflow-hidden"
            style={{ background: '#0E0E16', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <DropdownContent
              sites={sites}
              activeSite={activeSite}
              onSelect={selectSite}
              onAddSite={() => { setOpen(false); setAddModalOpen(true) }}
            />
          </div>
        )}

        <AddSiteModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
      </>
    )
  }

  return (
    <>
      <div ref={containerRef} className="px-3 mb-2 relative">
        {/* Trigger */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left',
            open ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]',
          )}
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Favicon url={activeSite?.favicon_url ?? null} name={displayName} size={18} />
          <span className="flex-1 text-sm font-medium text-[#F1F1F5] truncate">
            {truncated}
          </span>
          {activeSite?.is_default && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}
            >
              Default
            </span>
          )}
          <ChevronDown
            size={13}
            className={cn(
              'text-[#8B8B9A] shrink-0 transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div
            className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl shadow-2xl z-50 overflow-hidden"
            style={{ background: '#0E0E16', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <DropdownContent
              sites={sites}
              activeSite={activeSite}
              onSelect={selectSite}
              onAddSite={() => { setOpen(false); setAddModalOpen(true) }}
            />
          </div>
        )}
      </div>

      <AddSiteModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </>
  )
}

// ----------------------
// Shared dropdown content
// ----------------------

interface DropdownContentProps {
  sites:      Site[]
  activeSite: Site | null
  onSelect:   (site: Site) => void
  onAddSite:  () => void
}

function DropdownContent({ sites, activeSite, onSelect, onAddSite }: DropdownContentProps) {
  return (
    <div className="py-1.5">
      {sites.length === 0 && (
        <p className="px-4 py-3 text-sm text-[#555]">Sin sitios todavía</p>
      )}
      {sites.map((site) => {
        const isActive = activeSite?.id === site.id
        return (
          <button
            key={site.id}
            onClick={() => onSelect(site)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors',
              isActive ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]',
            )}
          >
            <Favicon url={site.favicon_url} name={site.name} size={18} />
            <span className="flex-1 text-sm text-[#F1F1F5] truncate">
              {site.name}
            </span>
            {site.is_default && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}
              >
                Default
              </span>
            )}
            {isActive && (
              <Check size={13} className="text-[#10B981] shrink-0" />
            )}
          </button>
        )
      })}

      {/* Divider + Add */}
      <div className="mx-3 my-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
      <button
        onClick={onAddSite}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-white/[0.03] transition-colors"
      >
        <div
          className="w-[18px] h-[18px] rounded-md flex items-center justify-center shrink-0"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <Plus size={10} className="text-[#10B981]" />
        </div>
        <span className="text-sm text-[#10B981] font-medium">Agregar sitio</span>
      </button>
    </div>
  )
}
