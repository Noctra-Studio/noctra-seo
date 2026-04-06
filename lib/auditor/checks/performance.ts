// =====================
// NOCTRA SEO — Site Auditor: Performance Checks
// lib/auditor/checks/performance.ts
//
// Checks are intentionally free of external APIs:
//   - ttfb:         real TTFB measured with a timed HEAD fetch
//   - compression:  inspects Content-Encoding response header
//   - cache_headers: inspects Cache-Control / ETag / Last-Modified
// =====================

import type { CheckResult } from '../types'

const GROUP = 'performance' as const
const FETCH_TIMEOUT_MS = 15_000   // performance checks need a bit more headroom

// ----------------------
// Utilities
// ----------------------

function normalizeUrl(url: string): URL {
  const raw = url.trim()
  return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
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
// checkTtfb
// ----------------------

/**
 * Measures Time To First Byte by timing a HEAD fetch.
 * Uses Date.now() which is precise enough for TTFB classification.
 *
 * Thresholds (aligned with Google's CrUX "Good" / "Needs improvement" / "Poor"):
 *   pass  < 200ms
 *   warn  200–600ms
 *   fail  > 600ms
 */
export async function checkTtfb(url: string): Promise<CheckResult> {
  const CHECK_KEY = 'ttfb'

  let target: string
  try {
    target = normalizeUrl(url).href
  } catch (err) {
    return errorResult(CHECK_KEY, err)
  }

  const t0 = Date.now()

  try {
    const res = await fetchWithTimeout(target, {
      method:   'HEAD',
      redirect: 'follow',
      headers:  { 'User-Agent': 'NoctraSEOBot/1.0' },
    })
    const ttfb_ms = Date.now() - t0

    const data = {
      ttfb_ms,
      status_code:   res.status,
      final_url:     res.url,
      was_redirected: res.redirected,
      server:        res.headers.get('server') ?? null,
    }

    if (ttfb_ms < 200) {
      return { check_key: CHECK_KEY, group: GROUP, status: 'pass', score: 100, data }
    }
    if (ttfb_ms < 600) {
      // Scale score linearly from 99→60 within the warn range
      const score = Math.round(99 - ((ttfb_ms - 200) / 400) * 39)
      return { check_key: CHECK_KEY, group: GROUP, status: 'warn', score, data }
    }
    // > 600ms — score degrades down to 0 at 3000ms
    const score = Math.max(0, Math.round(59 - ((ttfb_ms - 600) / 2400) * 59))
    return { check_key: CHECK_KEY, group: GROUP, status: 'fail', score, data }
  } catch (err) {
    return errorResult(CHECK_KEY, err)
  }
}

// ----------------------
// checkCompression
// ----------------------

/**
 * Verifies HTTP response compression via Content-Encoding header.
 *
 *   pass  Brotli (br) or Gzip — current best practice
 *   warn  Deflate only — works but outdated
 *   fail  No compression
 */
export async function checkCompression(url: string): Promise<CheckResult> {
  const CHECK_KEY = 'compression'

  let target: string
  try {
    target = normalizeUrl(url).href
  } catch (err) {
    return errorResult(CHECK_KEY, err)
  }

  try {
    const res = await fetchWithTimeout(target, {
      method:   'GET',
      redirect: 'follow',
      headers:  {
        'User-Agent':      'NoctraSEOBot/1.0',
        'Accept-Encoding': 'br, gzip, deflate',
      },
    })

    const encoding    = res.headers.get('content-encoding')?.toLowerCase() ?? null
    const contentType = res.headers.get('content-type') ?? null
    const vary        = res.headers.get('vary') ?? null

    const data = {
      encoding,
      content_type: contentType,
      vary,
    }

    if (!encoding) {
      return { check_key: CHECK_KEY, group: GROUP, status: 'fail', score: 0, data }
    }
    if (encoding.includes('deflate') && !encoding.includes('gzip') && !encoding.includes('br')) {
      return { check_key: CHECK_KEY, group: GROUP, status: 'warn', score: 60, data }
    }
    // gzip or br
    return { check_key: CHECK_KEY, group: GROUP, status: 'pass', score: 100, data }
  } catch (err) {
    return errorResult(CHECK_KEY, err)
  }
}

// ----------------------
// checkCacheHeaders
// ----------------------

/**
 * Inspects caching directives on the homepage response.
 *
 *   pass  Cache-Control with max-age > 0 OR immutable
 *   warn  Weak validators only (ETag / Last-Modified, no Cache-Control)
 *   fail  No caching signals at all
 *
 * `no-store` and `no-cache` are intentionally classified as fail (the server
 * is explicitly preventing caching).
 */
function parseMaxAge(cacheControl: string): number | null {
  const m = cacheControl.match(/max-age\s*=\s*(\d+)/i)
  return m ? parseInt(m[1], 10) : null
}

export async function checkCacheHeaders(url: string): Promise<CheckResult> {
  const CHECK_KEY = 'cache_headers'

  let target: string
  try {
    target = normalizeUrl(url).href
  } catch (err) {
    return errorResult(CHECK_KEY, err)
  }

  try {
    const res = await fetchWithTimeout(target, {
      method:   'HEAD',
      redirect: 'follow',
      headers:  { 'User-Agent': 'NoctraSEOBot/1.0' },
    })

    const cacheControl = res.headers.get('cache-control')?.toLowerCase() ?? null
    const etag         = res.headers.get('etag') ?? null
    const lastModified = res.headers.get('last-modified') ?? null
    const expires      = res.headers.get('expires') ?? null
    const pragma       = res.headers.get('pragma') ?? null
    const maxAge       = cacheControl ? parseMaxAge(cacheControl) : null

    const data = {
      cache_control: cacheControl,
      etag,
      last_modified: lastModified,
      expires,
      pragma,
      max_age_seconds: maxAge,
    }

    // Explicit no-cache or no-store → fail
    if (cacheControl && (cacheControl.includes('no-store') || cacheControl.includes('no-cache'))) {
      return { check_key: CHECK_KEY, group: GROUP, status: 'fail', score: 0, data }
    }

    // Has max-age > 0 or immutable → pass
    if (cacheControl) {
      if (cacheControl.includes('immutable') || (maxAge !== null && maxAge > 0)) {
        return { check_key: CHECK_KEY, group: GROUP, status: 'pass', score: 100, data }
      }
    }

    // Weak validators only (ETag / Last-Modified) — browser can still revalidate
    if (etag || lastModified) {
      return { check_key: CHECK_KEY, group: GROUP, status: 'warn', score: 55, data }
    }

    // Nothing at all
    return { check_key: CHECK_KEY, group: GROUP, status: 'fail', score: 0, data }
  } catch (err) {
    return errorResult(CHECK_KEY, err)
  }
}

// ----------------------
// runPerformanceChecks — public entry point
// ----------------------

export async function runPerformanceChecks(url: string): Promise<CheckResult[]> {
  const runners: Array<() => Promise<CheckResult>> = [
    () => checkTtfb(url),
    () => checkCompression(url),
    () => checkCacheHeaders(url),
  ]

  const results = await Promise.allSettled(runners.map((fn) => fn()))
  const keys = ['ttfb', 'compression', 'cache_headers']

  return results.map((result, i): CheckResult => {
    if (result.status === 'fulfilled') return result.value
    return {
      check_key: keys[i],
      group:     GROUP,
      status:    'error' as const,
      score:     null,
      data:      {},
      error:     result.reason instanceof Error ? result.reason.message : String(result.reason),
    }
  })
}
