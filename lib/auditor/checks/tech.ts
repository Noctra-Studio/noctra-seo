// =====================
// NOCTRA SEO — Site Auditor: Tech Checks
// lib/auditor/checks/tech.ts
// =====================

import type { CheckResult } from '../types'

const GROUP = 'tech' as const
const FETCH_TIMEOUT_MS  = 10_000
const RDAP_TIMEOUT_MS   = 15_000
const HTML_MAX_BYTES    = 100_000  // 100 KB

// ----------------------
// Utilities
// ----------------------

function extractHostname(input: string): string {
  const trimmed = input.trim()
  if (/^https?:\/\//i.test(trimmed)) return new URL(trimmed).hostname
  return trimmed.split('/')[0]
}

function normalizeUrl(url: string): URL {
  const raw = url.trim()
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  return new URL(withScheme)
}

/** Strip leading 'www.' subdomain to get the registrable apex. */
function apexDomain(hostname: string): string {
  const parts = hostname.split('.')
  // Always take the last two labels (handles .com, .io, .studio, etc.)
  // For ccTLDs like .co.uk a more complete library would be needed,
  // but slice(-2) is sufficient for the vast majority of cases.
  return parts.slice(-2).join('.')
}

function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  )
}

function errorResult(check_key: string, err: unknown): CheckResult {
  return {
    check_key,
    group: GROUP,
    status: 'error',
    score: null,
    data: {},
    error: err instanceof Error ? err.message : String(err),
  }
}

// ----------------------
// checkWhois (via RDAP)
// ----------------------

interface RdapResponse {
  // RDAP spec fields (RFC 7483)
  ldhName?:    string
  status?:     string[]
  nameservers?: Array<{ ldhName?: string }>
  entities?:   Array<{
    roles?:   string[]
    vcardArray?: unknown[]
    publicIds?: Array<{ type: string; identifier: string }>
  }>
  events?:     Array<{ eventAction: string; eventDate: string }>
}

function rdapDate(events: RdapResponse['events'], action: string): string | null {
  return events?.find((e) => e.eventAction === action)?.eventDate ?? null
}

function rdapRegistrar(entities: RdapResponse['entities']): string | null {
  if (!entities) return null
  for (const entity of entities) {
    if (entity.roles?.includes('registrar')) {
      // registrar name is usually in publicIds or vcardArray[1][0][3]
      if (entity.publicIds?.length) {
        return entity.publicIds[0].identifier
      }
      // Try vCard FN field: vcardArray = ["vcard", [ ["fn", {}, "text", "Name"], ... ]]
      const vcard = entity.vcardArray as [string, Array<[string, object, string, string]>] | undefined
      const fn = vcard?.[1]?.find(([prop]) => prop === 'fn')
      if (fn) return fn[3]
    }
  }
  return null
}

function rdapRegistrantOrg(entities: RdapResponse['entities']): string | null {
  if (!entities) return null
  for (const entity of entities) {
    if (entity.roles?.includes('registrant')) {
      const vcard = entity.vcardArray as [string, Array<[string, object, string, string]>] | undefined
      const org = vcard?.[1]?.find(([prop]) => prop === 'org')
      if (org) return org[3]
      const fn = vcard?.[1]?.find(([prop]) => prop === 'fn')
      if (fn) return fn[3]
    }
  }
  return null
}

export async function checkWhois(domain: string): Promise<CheckResult> {
  const CHECK_KEY = 'whois'
  const hostname  = extractHostname(domain)
  const apex      = apexDomain(hostname)

  let rdap: RdapResponse

  try {
    const res = await fetchWithTimeout(
      `https://rdap.org/domain/${apex}`,
      { headers: { Accept: 'application/rdap+json' } },
      RDAP_TIMEOUT_MS,
    )
    if (!res.ok) throw new Error(`RDAP responded with HTTP ${res.status}`)
    rdap = (await res.json()) as RdapResponse
  } catch (err) {
    return errorResult(CHECK_KEY, err)
  }

  const createdAt  = rdapDate(rdap.events, 'registration')
  const expiresAt  = rdapDate(rdap.events, 'expiration')
  const registrar  = rdapRegistrar(rdap.entities)
  const registrantOrg = rdapRegistrantOrg(rdap.entities)
  const nameservers = (rdap.nameservers ?? [])
    .map((ns) => ns.ldhName ?? '')
    .filter(Boolean)
    .map((ns) => ns.toLowerCase())
  const status = rdap.status ?? []

  const msPerDay = 1000 * 60 * 60 * 24
  const daysUntilExpiry = expiresAt
    ? Math.floor((new Date(expiresAt).getTime() - Date.now()) / msPerDay)
    : null

  const data = {
    registrar,
    createdAt,
    expiresAt,
    daysUntilExpiry,
    nameservers,
    status,
    registrantOrg,
  }

  if (daysUntilExpiry === null) {
    // No expiry date found — treat as indeterminate but not failed
    return { check_key: CHECK_KEY, group: GROUP, status: 'warn', score: null, data }
  }

  if (daysUntilExpiry <= 0) {
    return { check_key: CHECK_KEY, group: GROUP, status: 'fail', score: 0, data }
  }

  if (daysUntilExpiry <= 90) {
    return { check_key: CHECK_KEY, group: GROUP, status: 'warn', score: 60, data }
  }

  return { check_key: CHECK_KEY, group: GROUP, status: 'pass', score: 100, data }
}

// ----------------------
// checkTechStack
// ----------------------

interface Fingerprint {
  pattern:  RegExp
  category: string
}

const FINGERPRINTS: Record<string, Fingerprint> = {
  'WordPress':            { pattern: /wp-content|wp-includes/i,                    category: 'CMS' },
  'Next.js':              { pattern: /__NEXT_DATA__|_next\/static/i,                category: 'Framework' },
  'React':                { pattern: /react\.development|react-dom/i,               category: 'Framework' },
  'Vue.js':               { pattern: /vue\.js|vue\.min\.js|__vue__/i,               category: 'Framework' },
  'Angular':              { pattern: /ng-version=|angular\.js/i,                    category: 'Framework' },
  'jQuery':               { pattern: /jquery\.min\.js|jquery-\d/i,                  category: 'Library' },
  'Bootstrap':            { pattern: /bootstrap\.min\.css|bootstrap\.bundle/i,      category: 'CSS Framework' },
  'Tailwind':             { pattern: /tailwindcss|tw-/i,                            category: 'CSS Framework' },
  'Shopify':              { pattern: /shopify\.com|cdn\.shopify/i,                  category: 'E-commerce' },
  'WooCommerce':          { pattern: /woocommerce|wc-ajax/i,                        category: 'E-commerce' },
  'Google Analytics':     { pattern: /google-analytics\.com|gtag|UA-\d{7}/i,       category: 'Analytics' },
  'Google Tag Manager':   { pattern: /googletagmanager\.com\/gtm/i,                 category: 'Analytics' },
  'Cloudflare':           { pattern: /cloudflare|__cf_bm/i,                         category: 'CDN/Security' },
  'HubSpot':              { pattern: /hs-scripts|hubspot\.com/i,                    category: 'Marketing' },
  'Intercom':             { pattern: /intercom\.io|intercomSettings/i,              category: 'Support' },
}

export async function checkTechStack(url: string): Promise<CheckResult> {
  const CHECK_KEY = 'tech_stack'

  let html: string
  let serverHeader:    string | null = null
  let poweredByHeader: string | null = null

  try {
    const target = normalizeUrl(url).href
    const res = await fetchWithTimeout(target, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'NoctraSEOBot/1.0',
        Accept:       'text/html',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    serverHeader    = res.headers.get('server')
    poweredByHeader = res.headers.get('x-powered-by')

    // Read only the first HTML_MAX_BYTES to avoid downloading huge pages
    const reader    = res.body?.getReader()
    const chunks: Uint8Array[] = []
    let bytesRead   = 0

    if (reader) {
      while (bytesRead < HTML_MAX_BYTES) {
        const { done, value } = await reader.read()
        if (done || !value) break
        const remaining = HTML_MAX_BYTES - bytesRead
        chunks.push(value.slice(0, remaining))
        bytesRead += value.byteLength
        if (bytesRead >= HTML_MAX_BYTES) {
          // Cancel the stream — we have enough
          await reader.cancel().catch(() => undefined)
          break
        }
      }
    }

    const combined = new Uint8Array(bytesRead)
    let offset = 0
    for (const chunk of chunks) {
      combined.set(chunk, offset)
      offset += chunk.byteLength
    }
    html = new TextDecoder().decode(combined)
  } catch (err) {
    return errorResult(CHECK_KEY, err)
  }

  // Fingerprint against HTML body
  const detected: Array<{ name: string; category: string }> = []

  for (const [name, { pattern, category }] of Object.entries(FINGERPRINTS)) {
    if (pattern.test(html)) {
      detected.push({ name, category })
    }
  }

  // Also surface server/powered-by hints that aren't covered by HTML patterns
  const serverHints: Array<{ name: string; category: string }> = []

  if (serverHeader) {
    const srv = serverHeader.toLowerCase()
    if (!detected.find((d) => d.name === 'Cloudflare') && srv.includes('cloudflare')) {
      serverHints.push({ name: 'Cloudflare', category: 'CDN/Security' })
    }
    if (srv.includes('nginx') && !detected.find((d) => d.name === 'Nginx')) {
      serverHints.push({ name: 'Nginx', category: 'Web Server' })
    }
    if (srv.includes('apache') && !detected.find((d) => d.name === 'Apache')) {
      serverHints.push({ name: 'Apache', category: 'Web Server' })
    }
  }

  if (poweredByHeader) {
    const pb = poweredByHeader.toLowerCase()
    if (pb.includes('php') && !detected.find((d) => d.name === 'PHP')) {
      serverHints.push({ name: 'PHP', category: 'Language' })
    }
    if ((pb.includes('asp.net') || pb.includes('aspnet')) && !detected.find((d) => d.name === 'ASP.NET')) {
      serverHints.push({ name: 'ASP.NET', category: 'Framework' })
    }
    if (pb.includes('express') && !detected.find((d) => d.name === 'Express')) {
      serverHints.push({ name: 'Express', category: 'Framework' })
    }
  }

  const allDetected = [...detected, ...serverHints]

  const data = {
    detected:      allDetected,
    serverInfo:    { server: serverHeader, poweredBy: poweredByHeader },
    totalDetected: allDetected.length,
  }

  return { check_key: CHECK_KEY, group: GROUP, status: 'info', score: null, data }
}

// ----------------------
// runTechChecks — public entry point
// ----------------------

export async function runTechChecks(url: string): Promise<CheckResult[]> {
  const host = extractHostname(url)

  const runners: Array<() => Promise<CheckResult>> = [
    () => checkWhois(host),
    () => checkTechStack(url),
  ]

  const results = await Promise.allSettled(runners.map((fn) => fn()))

  const keys = ['whois', 'tech_stack']

  return results.map((result, i) => {
    if (result.status === 'fulfilled') return result.value

    return {
      check_key: keys[i],
      group:     GROUP,
      status:    'error' as const,
      score:     null,
      data:      {},
      error:
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason),
    }
  })
}
