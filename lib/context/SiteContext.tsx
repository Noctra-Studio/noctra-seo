'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Site } from '@/lib/types/sites'

// ----------------------
// Context value shape
// ----------------------

interface SiteContextValue {
  sites:          Site[]
  activeSite:     Site | null          // derived from current URL's projectId
  isLoading:      boolean
  setActiveSite:  (site: Site) => void // navigates to /[locale]/dashboard/[site.id]
  refetchSites:   () => Promise<void>
}

// ----------------------
// Context
// ----------------------

const SiteContext = createContext<SiteContextValue>({
  sites:         [],
  activeSite:    null,
  isLoading:     true,
  setActiveSite: () => {},
  refetchSites:  async () => {},
})

// ----------------------
// Provider
// ----------------------

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [sites, setSites]     = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()
  const params = useParams()
  const projectId = params?.projectId as string | undefined
  const locale    = (params?.locale as string | undefined) ?? 'es'

  // ---- Fetch sites ----
  const fetchSites = useCallback(async () => {
    setIsLoading(true)
    try {
      const res  = await fetch('/api/sites')
      const json = await res.json()
      if (res.ok) setSites(json.sites ?? [])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchSites() }, [fetchSites])

  // ---- Active site: derived from URL ----
  const activeSite = useMemo<Site | null>(() => {
    if (!projectId || sites.length === 0) return null
    return sites.find((s) => s.id === projectId) ?? null
  }, [sites, projectId])

  // ---- Switch site: navigate to new project dashboard ----
  const setActiveSite = useCallback(
    (site: Site) => {
      // Persist last active site so the dashboard root can redirect there
      try { localStorage.setItem('noctra_active_site_id', site.id) } catch {}
      router.push(`/${locale}/dashboard/${site.id}`)
    },
    [router, locale],
  )

  const value = useMemo<SiteContextValue>(
    () => ({ sites, activeSite, isLoading, setActiveSite, refetchSites: fetchSites }),
    [sites, activeSite, isLoading, setActiveSite, fetchSites],
  )

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

// ----------------------
// Hook
// ----------------------

export function useSite(): SiteContextValue {
  return useContext(SiteContext)
}
