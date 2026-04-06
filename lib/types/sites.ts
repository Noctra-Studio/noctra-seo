// =====================
// NOCTRA SEO — Multi-site types
// lib/types/sites.ts
//
// A "Site" in the UI = a project + its domain combined.
//   - site.id         → projects.id    (used in /dashboard/[projectId] URL)
//   - site.site_id    → domains.site_id (tracker text ID for data-site-id attribute)
//   - site.hostname   → domains.hostname
//   - site.name       → projects.name  (display name)
// =====================

export interface Site {
  // From projects
  id:           string          // projects.id — used for dashboard routing
  name:         string          // projects.name — display name
  is_default:   boolean         // projects.is_default
  favicon_url:  string | null   // projects.favicon_url
  owner_email:  string | null   // projects.owner_email
  org_id:       string
  created_at:   string

  // From domains (null when project has no domain yet)
  domain_id:          string | null
  hostname:           string | null   // e.g. "noctra.studio"
  site_id:            string | null   // tracker text ID — goes in data-site-id
  tracker_installed:  boolean
}

export interface SiteWithStats extends Site {
  pageviews_last_30d?: number
  last_audit_score?:   number | null
  last_audit_at?:      string | null
}

// Shape returned by /api/sites
export interface SitesResponse {
  sites: Site[]
}

export interface CreateSiteBody {
  url:          string
  display_name: string
}

export interface CreateSiteResponse {
  site: Site
}
