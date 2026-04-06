// =====================
// NOCTRA SEO — Sites API
// app/api/sites/route.ts
//
// GET  /api/sites  — list all sites (projects + domains) for authenticated user
// POST /api/sites  — create new project + domain
// =====================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Site } from '@/lib/types/sites'

// ----------------------
// Helpers
// ----------------------

function normalizeHostname(raw: string): string {
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(withScheme)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return raw.trim().replace(/^www\./, '').split('/')[0]
  }
}

function buildSiteUrl(hostname: string): string {
  return `https://${hostname}`
}

async function fetchFaviconUrl(hostname: string): Promise<string> {
  return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`
}

function jsonError(message: string, status: number, code?: string) {
  return NextResponse.json({ error: message, ...(code ? { code } : {}) }, { status })
}

// ----------------------
// Row shape from Supabase join
// ----------------------

interface ProjectRow {
  id:          string
  name:        string
  is_default:  boolean
  favicon_url: string | null
  owner_email: string | null
  org_id:      string
  created_at:  string
  domains: Array<{
    id:                string
    hostname:          string
    site_id:           string
    tracker_installed: boolean
  }>
}

function rowToSite(row: ProjectRow): Site {
  const domain = row.domains?.[0] ?? null
  return {
    id:                row.id,
    name:              row.name,
    is_default:        row.is_default ?? false,
    favicon_url:       row.favicon_url,
    owner_email:       row.owner_email,
    org_id:            row.org_id,
    created_at:        row.created_at,
    domain_id:         domain?.id         ?? null,
    hostname:          domain?.hostname   ?? null,
    site_id:           domain?.site_id    ?? null,
    tracker_installed: domain?.tracker_installed ?? false,
  }
}

// ----------------------
// GET /api/sites
// ----------------------

export async function GET() {
  try {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!userData?.org_id) {
    return NextResponse.json({ sites: [] })
  }

  const { data: rows, error } = await supabase
    .from('projects')
    .select(`
      id, name, is_default, favicon_url, owner_email, org_id, created_at,
      domains ( id, hostname, site_id, tracker_installed )
    `)
    .eq('org_id', userData.org_id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[API /sites] Supabase error:', error.message, error.details, error.hint)
    return jsonError(error.message, 500)
  }

  const sites: Site[] = (rows as unknown as ProjectRow[]).map(rowToSite)

  return NextResponse.json({ sites })
  } catch (err: unknown) {
    console.error('[API /sites] UNCAUGHT ERROR:', err)
    return jsonError(String(err), 500)
  }
}

// ----------------------
// POST /api/sites
// ----------------------

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return jsonError('Unauthorized', 401)

  // Parse body
  let body: { url?: unknown; display_name?: unknown }
  try { body = await req.json() }
  catch { return jsonError('Invalid JSON', 400) }

  const rawUrl       = typeof body.url          === 'string' ? body.url.trim()          : ''
  const displayName  = typeof body.display_name === 'string' ? body.display_name.trim() : ''

  if (!rawUrl)       return jsonError('url es obligatorio', 400)
  if (!displayName)  return jsonError('display_name es obligatorio', 400)

  // Validate URL
  let hostname: string
  try {
    hostname = normalizeHostname(rawUrl)
    if (!hostname) throw new Error('invalid')
  } catch {
    return jsonError('URL inválida', 400)
  }

  // Get user's org
  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!userData?.org_id) {
    return jsonError('Completa el onboarding primero', 400)
  }

  const orgId = userData.org_id

  // Check duplicate hostname in this org
  const { data: existing } = await supabase
    .from('domains')
    .select('id, project_id')
    .eq('hostname', hostname)
    .maybeSingle()

  if (existing) {
    // Verify the project belongs to this org
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('id', existing.project_id)
      .eq('org_id', orgId)
      .maybeSingle()

    if (existingProject) {
      return jsonError('Ya tienes un sitio con esa URL', 409, 'DUPLICATE_URL')
    }
  }

  // Fetch favicon (best-effort — always returns a URL)
  const faviconUrl = await fetchFaviconUrl(hostname)

  // Create project
  const { data: project, error: projError } = await supabase
    .from('projects')
    .insert({
      org_id:      orgId,
      name:        displayName,
      favicon_url: faviconUrl,
      is_default:  false,
      owner_email: user.email ?? null,
      created_by:  user.id,
    })
    .select('id, name, is_default, favicon_url, owner_email, org_id, created_at')
    .single()

  if (projError || !project) {
    return jsonError(projError?.message ?? 'No se pudo crear el proyecto', 500)
  }

  // Create domain
  const { data: domain, error: domError } = await supabase
    .from('domains')
    .insert({
      project_id: project.id,
      hostname,
    })
    .select('id, hostname, site_id, tracker_installed')
    .single()

  if (domError || !domain) {
    // Rollback project (best-effort)
    await supabase.from('projects').delete().eq('id', project.id)
    return jsonError(domError?.message ?? 'No se pudo crear el dominio', 500)
  }

  const site: Site = {
    id:                project.id,
    name:              project.name,
    is_default:        project.is_default ?? false,
    favicon_url:       project.favicon_url,
    owner_email:       project.owner_email,
    org_id:            project.org_id,
    created_at:        project.created_at,
    domain_id:         domain.id,
    hostname:          domain.hostname,
    site_id:           domain.site_id,
    tracker_installed: domain.tracker_installed ?? false,
  }

  return NextResponse.json({ site }, { status: 201 })
}
