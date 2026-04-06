// =====================
// NOCTRA SEO — Site Auditor: SEO Checks
// lib/auditor/checks/seo.ts
// =====================

import type { CheckResult } from '../types'

const GROUP = 'seo' as const
const FETCH_TIMEOUT_MS = 10_000

// ----------------------
// Utilities
// ----------------------

function normalizeUrl(url: string): URL {
  const raw = url.trim()
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  return new URL(withScheme)
}

function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
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
// robots.txt
// ----------------------

export async function checkRobotsTxt(url: string): Promise<CheckResult> {
  const CHECK_KEY = 'robots_txt'
  const origin = normalizeUrl(url).origin

  let rawContent = ''
  let exists = false

  try {
    const res = await fetchWithTimeout(`${origin}/robots.txt`, {
      redirect: 'follow',
      headers: { 'User-Agent': 'NoctraSEOBot/1.0' },
    })

    if (!res.ok) {
      return {
        check_key: CHECK_KEY,
        group: GROUP,
        status: 'fail',
        score: 0,
        data: { exists: false, size: 0, sitemapRefs: [], disallowCount: 0, rawContent: '' },
      }
    }

    rawContent = await res.text()
    exists = true
  } catch (err) {
    return errorResult(CHECK_KEY, err)
  }

  const trimmed = rawContent.trim()
  const size = new TextEncoder().encode(trimmed).length

  // Parse directives
  const sitemapRefs: string[] = []
  let disallowCount = 0
  const lines = trimmed.split(/\r?\n/)

  for (const line of lines) {
    const clean = line.trim()
    const lower = clean.toLowerCase()

    if (lower.startsWith('sitemap:')) {
      const ref = clean.slice('sitemap:'.length).trim()
      if (ref) sitemapRefs.push(ref)
    } else if (lower.startsWith('disallow:')) {
      const rule = clean.slice('disallow:'.length).trim()
      if (rule) disallowCount++
    }
  }

  const data = {
    exists,
    size,
    sitemapRefs,
    disallowCount,
    rawContent: trimmed.slice(0, 2000),
  }

  // Empty or only "User-agent: *" with no meaningful directives
  const meaningfulLines = lines.filter((l) => {
    const t = l.trim().toLowerCase()
    return t && !t.startsWith('#') && t !== 'user-agent: *'
  })

  if (size === 0 || meaningfulLines.length === 0) {
    return { check_key: CHECK_KEY, group: GROUP, status: 'warn', score: 60, data }
  }

  return { check_key: CHECK_KEY, group: GROUP, status: 'pass', score: 100, data }
}

// ----------------------
// XML Sitemap
// ----------------------

type SitemapParseResult = {
  urlCount: number
  isIndex: boolean
  lastModified: string | null
}

function parseSitemapXml(xml: string): SitemapParseResult {
  // Count <url> entries (regular sitemap) and <sitemap> entries (sitemap index)
  const urlMatches = xml.match(/<url[\s>]/gi)
  const sitemapMatches = xml.match(/<sitemap[\s>]/gi)
  const isIndex = /<sitemapindex[\s>]/i.test(xml)

  const urlCount = isIndex
    ? (sitemapMatches?.length ?? 0)
    : (urlMatches?.length ?? 0)

  // Grab the first <lastmod> value
  const lastModMatch = xml.match(/<lastmod>([^<]+)<\/lastmod>/i)
  const lastModified = lastModMatch ? lastModMatch[1].trim() : null

  return { urlCount, isIndex, lastModified }
}

async function fetchSitemap(
  sitemapUrl: string,
): Promise<{ xml: string; finalUrl: string } | null> {
  try {
    const res = await fetchWithTimeout(sitemapUrl, {
      redirect: 'follow',
      headers: { 'User-Agent': 'NoctraSEOBot/1.0' },
    })
    if (!res.ok) return null
    const xml = await res.text()
    // Minimal sanity: must look like XML
    if (!xml.trim().startsWith('<')) return null
    return { xml, finalUrl: res.url }
  } catch {
    return null
  }
}

export async function checkSitemap(url: string): Promise<CheckResult> {
  const CHECK_KEY = 'sitemap'
  const origin = normalizeUrl(url).origin

  const candidates = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
  ]

  // Also grab any sitemap refs from robots.txt (best-effort, no throw)
  try {
    const robotsRes = await fetchWithTimeout(`${origin}/robots.txt`, {
      headers: { 'User-Agent': 'NoctraSEOBot/1.0' },
    })
    if (robotsRes.ok) {
      const text = await robotsRes.text()
      for (const line of text.split(/\r?\n/)) {
        const lower = line.trim().toLowerCase()
        if (lower.startsWith('sitemap:')) {
          const ref = line.trim().slice('sitemap:'.length).trim()
          if (ref && !candidates.includes(ref)) candidates.push(ref)
        }
      }
    }
  } catch {
    // robots.txt unreachable — continue with default candidates
  }

  let found: { xml: string; finalUrl: string } | null = null

  for (const candidate of candidates) {
    found = await fetchSitemap(candidate)
    if (found) break
  }

  if (!found) {
    return {
      check_key: CHECK_KEY,
      group: GROUP,
      status: 'fail',
      score: 0,
      data: { found: false, url: null, urlCount: 0, isIndex: false, lastModified: null },
    }
  }

  let parsed: SitemapParseResult
  try {
    parsed = parseSitemapXml(found.xml)
  } catch {
    // XML is present but unparseable
    return {
      check_key: CHECK_KEY,
      group: GROUP,
      status: 'warn',
      score: 50,
      data: {
        found: true,
        url: found.finalUrl,
        urlCount: 0,
        isIndex: false,
        lastModified: null,
      },
    }
  }

  const data = {
    found: true,
    url: found.finalUrl,
    urlCount: parsed.urlCount,
    isIndex: parsed.isIndex,
    lastModified: parsed.lastModified,
  }

  if (parsed.urlCount === 0) {
    return { check_key: CHECK_KEY, group: GROUP, status: 'warn', score: 50, data }
  }

  if (parsed.urlCount < 3) {
    return { check_key: CHECK_KEY, group: GROUP, status: 'warn', score: 70, data }
  }

  return { check_key: CHECK_KEY, group: GROUP, status: 'pass', score: 100, data }
}

// ----------------------
// Redirect Chain
// ----------------------

interface Hop {
  url: string
  statusCode: number
  location: string | null
}

export async function checkRedirectChain(url: string): Promise<CheckResult> {
  const CHECK_KEY = 'redirect_chain'
  const MAX_HOPS = 10

  let current: string
  try {
    current = normalizeUrl(url).href
  } catch (err) {
    return errorResult(CHECK_KEY, err)
  }

  const hops: Hop[] = []
  const visited = new Set<string>()
  let hasHttpsRedirect = false

  try {
    while (hops.length < MAX_HOPS) {
      if (visited.has(current)) {
        // Loop detected
        const data = {
          hops,
          finalUrl: current,
          finalStatusCode: 0,
          hasHttpsRedirect,
          hopCount: hops.length,
        }
        return { check_key: CHECK_KEY, group: GROUP, status: 'fail', score: 0, data }
      }
      visited.add(current)

      const res = await fetchWithTimeout(current, {
        redirect: 'manual',
        headers: { 'User-Agent': 'NoctraSEOBot/1.0' },
      })

      const isRedirect = res.status >= 300 && res.status < 400
      const location = res.headers.get('location')

      hops.push({ url: current, statusCode: res.status, location })

      if (current.startsWith('http://') && location?.startsWith('https://')) {
        hasHttpsRedirect = true
      }

      if (!isRedirect || !location) {
        // End of chain
        const finalUrl = current
        const finalStatusCode = res.status
        const hopCount = hops.length - 1 // hops before the final response

        const data = { hops, finalUrl, finalStatusCode, hasHttpsRedirect, hopCount }

        const endsInHttps = finalUrl.startsWith('https://')
        const finalOk = finalStatusCode === 200

        if (!finalOk) {
          return { check_key: CHECK_KEY, group: GROUP, status: 'fail', score: 0, data }
        }
        if (hopCount >= 4) {
          return { check_key: CHECK_KEY, group: GROUP, status: 'fail', score: 20, data }
        }
        if (hopCount >= 2 || !endsInHttps) {
          return { check_key: CHECK_KEY, group: GROUP, status: 'warn', score: 60, data }
        }
        return { check_key: CHECK_KEY, group: GROUP, status: 'pass', score: 100, data }
      }

      // Resolve relative redirects
      current = new URL(location, current).href
    }

    // Exceeded MAX_HOPS
    const data = {
      hops,
      finalUrl: current,
      finalStatusCode: 0,
      hasHttpsRedirect,
      hopCount: hops.length,
    }
    return { check_key: CHECK_KEY, group: GROUP, status: 'fail', score: 0, data }
  } catch (err) {
    return errorResult(CHECK_KEY, err)
  }
}

// ----------------------
// Social Tags
// ----------------------

function extractMeta(html: string, attr: string, value: string): string {
  // Matches <meta property="og:title" content="..."> and variants
  const re = new RegExp(
    `<meta[^>]+${attr}\\s*=\\s*["']${value}["'][^>]+content\\s*=\\s*["']([^"']*)["']`,
    'i',
  )
  const m = html.match(re)
  if (m) return m[1]

  // Also try reversed attribute order: content first, then attr
  const re2 = new RegExp(
    `<meta[^>]+content\\s*=\\s*["']([^"']*)["'][^>]+${attr}\\s*=\\s*["']${value}["']`,
    'i',
  )
  const m2 = html.match(re2)
  return m2 ? m2[1] : ''
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return m ? m[1].trim() : ''
}

function extractCanonical(html: string): string {
  const m = html.match(/<link[^>]+rel\s*=\s*["']canonical["'][^>]+href\s*=\s*["']([^"']*)["']/i)
  if (m) return m[1]
  const m2 = html.match(/<link[^>]+href\s*=\s*["']([^"']*)["'][^>]+rel\s*=\s*["']canonical["']/i)
  return m2 ? m2[1] : ''
}

export async function checkSocialTags(url: string): Promise<CheckResult> {
  const CHECK_KEY = 'social_tags'

  let html: string
  try {
    const target = normalizeUrl(url).href
    const res = await fetchWithTimeout(target, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'NoctraSEOBot/1.0',
        Accept: 'text/html',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    html = await res.text()
  } catch (err) {
    return errorResult(CHECK_KEY, err)
  }

  // Open Graph
  const ogKeys = ['title', 'description', 'image', 'url', 'type'] as const
  const og: Record<string, string> = {}
  for (const key of ogKeys) {
    const val = extractMeta(html, 'property', `og:${key}`)
    if (val) og[key] = val
  }

  // Twitter Card
  const twitterKeys = ['card', 'title', 'description', 'image'] as const
  const twitter: Record<string, string> = {}
  for (const key of twitterKeys) {
    const val = extractMeta(html, 'name', `twitter:${key}`)
    if (val) twitter[key] = val
  }

  // Basic SEO
  const basic = {
    title:       extractTitle(html),
    description: extractMeta(html, 'name', 'description'),
    canonical:   extractCanonical(html),
  }

  const data = { og, twitter, basic }

  const hasTitle       = basic.title.length > 0
  const hasDescription = basic.description.length > 0
  const hasOgTitle     = Boolean(og.title)
  const hasOgImage     = Boolean(og.image)
  const hasCanonical   = Boolean(basic.canonical)

  if (!hasTitle || !hasDescription) {
    return { check_key: CHECK_KEY, group: GROUP, status: 'fail', score: 0, data }
  }

  if (!hasOgImage || !hasCanonical) {
    return { check_key: CHECK_KEY, group: GROUP, status: 'warn', score: 60, data }
  }

  if (hasTitle && hasDescription && hasOgTitle && hasOgImage) {
    return { check_key: CHECK_KEY, group: GROUP, status: 'pass', score: 100, data }
  }

  return { check_key: CHECK_KEY, group: GROUP, status: 'warn', score: 70, data }
}

// ----------------------
// runSeoChecks — public entry point
// ----------------------

export async function runSeoChecks(url: string): Promise<CheckResult[]> {
  const runners: Array<() => Promise<CheckResult>> = [
    () => checkRobotsTxt(url),
    () => checkSitemap(url),
    () => checkRedirectChain(url),
    () => checkSocialTags(url),
  ]

  const results = await Promise.allSettled(runners.map((fn) => fn()))

  return results.map((result, i) => {
    if (result.status === 'fulfilled') return result.value

    const keys = ['robots_txt', 'sitemap', 'redirect_chain', 'social_tags']
    return {
      check_key: keys[i],
      group: GROUP,
      status: 'error' as const,
      score: null,
      data: {},
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    }
  })
}
