// =====================
// NOCTRA SEO — Site Auditor: Security Checks
// lib/auditor/checks/security.ts
// =====================

import * as tls from 'node:tls'
import type { CheckResult } from '../types'

const GROUP = 'security' as const
const FETCH_TIMEOUT_MS = 10_000
const TLS_TIMEOUT_MS = 10_000

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
// checkSslChain
// ----------------------

interface TlsCertSubject {
  CN?: string
  O?:  string
  C?:  string
  [key: string]: string | undefined
}

function formatDN(dn: TlsCertSubject): string {
  return Object.entries(dn)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ')
}

export function checkSslChain(domain: string): Promise<CheckResult> {
  const CHECK_KEY = 'ssl_chain'
  const host = extractHostname(domain)

  return new Promise((resolve) => {
    let settled = false

    function settle(result: CheckResult) {
      if (settled) return
      settled = true
      resolve(result)
    }

    let socket: tls.TLSSocket | null = null

    try {
      socket = tls.connect(
        { host, port: 443, servername: host, rejectUnauthorized: false },
        () => {
          try {
            if (!socket) return

            const authorized = socket.authorized
            // getPeerCertificate(true) walks the full chain
            const cert = socket.getPeerCertificate(true)
            socket.destroy()

            if (!cert || !cert.subject) {
              settle({
                check_key: CHECK_KEY,
                group: GROUP,
                status: 'fail',
                score: 0,
                data: { valid: false, issuer: '', subject: '', validFrom: '', validTo: '', daysUntilExpiry: 0, altNames: [], fingerprint: '' },
              })
              return
            }

            const validTo   = new Date(cert.valid_to)
            const validFrom = new Date(cert.valid_from)
            const now       = new Date()
            const msPerDay  = 1000 * 60 * 60 * 24
            const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / msPerDay)

            // Extract Subject Alt Names
            const altNames: string[] = cert.subjectaltname
              ? cert.subjectaltname
                  .split(',')
                  .map((s) => s.trim().replace(/^DNS:/, ''))
              : []

            // Detect self-signed: issuer fingerprint equals subject fingerprint
            const isSelfSigned =
              cert.issuerCertificate?.fingerprint === cert.fingerprint &&
              cert.issuerCertificate?.subject?.CN === cert.subject?.CN

            const data = {
              valid:           authorized && daysUntilExpiry > 0,
              issuer:          formatDN(cert.issuer as TlsCertSubject),
              subject:         formatDN(cert.subject as TlsCertSubject),
              validFrom:       validFrom.toISOString(),
              validTo:         validTo.toISOString(),
              daysUntilExpiry,
              altNames,
              fingerprint:     cert.fingerprint ?? '',
            }

            if (isSelfSigned || daysUntilExpiry <= 0) {
              settle({ check_key: CHECK_KEY, group: GROUP, status: 'fail', score: 0, data })
              return
            }

            if (daysUntilExpiry <= 30) {
              settle({ check_key: CHECK_KEY, group: GROUP, status: 'warn', score: 60, data })
              return
            }

            settle({ check_key: CHECK_KEY, group: GROUP, status: 'pass', score: 100, data })
          } catch (err) {
            socket?.destroy()
            settle(errorResult(CHECK_KEY, err))
          }
        },
      )

      socket.setTimeout(TLS_TIMEOUT_MS, () => {
        socket?.destroy()
        settle(errorResult(CHECK_KEY, new Error(`TLS connection timed out after ${TLS_TIMEOUT_MS}ms`)))
      })

      socket.on('error', (err) => {
        socket?.destroy()
        // TLS errors (CERT_HAS_EXPIRED, DEPTH_ZERO_SELF_SIGNED_CERT, etc.)
        // count as a failed cert, not a technical error
        const tlsFailCodes = [
          'CERT_HAS_EXPIRED',
          'DEPTH_ZERO_SELF_SIGNED_CERT',
          'SELF_SIGNED_CERT_IN_CHAIN',
          'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
          'CERT_UNTRUSTED',
        ]
        const code = (err as NodeJS.ErrnoException).code ?? ''
        if (tlsFailCodes.some((c) => code.includes(c))) {
          settle({
            check_key: CHECK_KEY,
            group: GROUP,
            status: 'fail',
            score: 0,
            data: {
              valid: false, issuer: '', subject: '', validFrom: '', validTo: '',
              daysUntilExpiry: 0, altNames: [], fingerprint: '',
            },
          })
        } else {
          settle(errorResult(CHECK_KEY, err))
        }
      })
    } catch (err) {
      socket?.destroy()
      settle(errorResult(CHECK_KEY, err))
    }
  })
}

// ----------------------
// checkHttpHeaders
// ----------------------

export async function checkHttpHeaders(url: string): Promise<CheckResult> {
  const CHECK_KEY = 'http_headers'

  let headers: Headers

  try {
    const target = normalizeUrl(url).href
    const res = await fetchWithTimeout(target, {
      method:   'HEAD',
      redirect: 'follow',
      headers:  { 'User-Agent': 'NoctraSEOBot/1.0' },
    })
    headers = res.headers
  } catch (err) {
    return errorResult(CHECK_KEY, err)
  }

  // Collect all response headers into a plain object
  const allHeaders: Record<string, string> = {}
  headers.forEach((value, key) => {
    allHeaders[key] = value
  })

  const data = {
    server:      headers.get('server'),
    xPoweredBy:  headers.get('x-powered-by'),
    contentType: headers.get('content-type'),
    cacheControl: headers.get('cache-control'),
    allHeaders,
  }

  return { check_key: CHECK_KEY, group: GROUP, status: 'info', score: null, data }
}

// ----------------------
// checkHsts
// ----------------------

export async function checkHsts(url: string): Promise<CheckResult> {
  const CHECK_KEY = 'hsts'
  const ONE_YEAR_SECONDS = 31_536_000

  let hstsHeader: string | null = null

  try {
    const target = normalizeUrl(url).href
    const res = await fetchWithTimeout(target, {
      method:   'HEAD',
      redirect: 'follow',
      headers:  { 'User-Agent': 'NoctraSEOBot/1.0' },
    })
    hstsHeader = res.headers.get('strict-transport-security')
  } catch (err) {
    return errorResult(CHECK_KEY, err)
  }

  if (!hstsHeader) {
    return {
      check_key: CHECK_KEY,
      group:     GROUP,
      status:    'fail',
      score:     0,
      data: { enabled: false, maxAge: null, includeSubDomains: false, preload: false, rawValue: null },
    }
  }

  // Parse directives: max-age=31536000; includeSubDomains; preload
  const maxAgeMatch     = hstsHeader.match(/max-age\s*=\s*(\d+)/i)
  const maxAge          = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : null
  const includeSubDomains = /includeSubDomains/i.test(hstsHeader)
  const preload           = /preload/i.test(hstsHeader)

  const data = {
    enabled: true,
    maxAge,
    includeSubDomains,
    preload,
    rawValue: hstsHeader,
  }

  if (maxAge !== null && maxAge >= ONE_YEAR_SECONDS && includeSubDomains) {
    return { check_key: CHECK_KEY, group: GROUP, status: 'pass', score: 100, data }
  }

  return { check_key: CHECK_KEY, group: GROUP, status: 'warn', score: 60, data }
}

// ----------------------
// checkSecurityHeaders
// ----------------------

interface HeaderAudit {
  present:        boolean
  value:          string | null
  recommendation: string | null
}

const HEADER_SPECS: Array<{
  name:           string
  header:         string
  points:         number
  recommendation: string
}> = [
  {
    name:           'Content-Security-Policy',
    header:         'content-security-policy',
    points:         30,
    recommendation: "Add a Content-Security-Policy header to restrict resource origins and mitigate XSS. Start with 'default-src \\'self\\''.",
  },
  {
    name:           'X-Frame-Options',
    header:         'x-frame-options',
    points:         20,
    recommendation: "Set X-Frame-Options to 'SAMEORIGIN' or 'DENY' to prevent clickjacking attacks.",
  },
  {
    name:           'X-Content-Type-Options',
    header:         'x-content-type-options',
    points:         20,
    recommendation: "Set X-Content-Type-Options: nosniff to prevent MIME-type sniffing.",
  },
  {
    name:           'Referrer-Policy',
    header:         'referrer-policy',
    points:         15,
    recommendation: "Add a Referrer-Policy header (e.g. 'strict-origin-when-cross-origin') to control referrer leakage.",
  },
  {
    name:           'Permissions-Policy',
    header:         'permissions-policy',
    points:         15,
    recommendation: "Add a Permissions-Policy header to restrict access to browser features like camera, microphone, and geolocation.",
  },
]

export async function checkSecurityHeaders(url: string): Promise<CheckResult> {
  const CHECK_KEY = 'security_headers'

  let responseHeaders: Headers
  let xssProtection: string | null = null

  try {
    const target = normalizeUrl(url).href
    const res = await fetchWithTimeout(target, {
      method:   'HEAD',
      redirect: 'follow',
      headers:  { 'User-Agent': 'NoctraSEOBot/1.0' },
    })
    responseHeaders = res.headers
    xssProtection   = res.headers.get('x-xss-protection')
  } catch (err) {
    return errorResult(CHECK_KEY, err)
  }

  let score = 0
  const headers: Record<string, HeaderAudit> = {}

  for (const spec of HEADER_SPECS) {
    const value   = responseHeaders.get(spec.header)
    const present = value !== null

    headers[spec.name] = {
      present,
      value,
      recommendation: present ? null : spec.recommendation,
    }

    if (present) score += spec.points
  }

  // X-XSS-Protection is legacy — flag if misconfigured (value of '1' without mode=block
  // can introduce a reflected XSS vector in some browsers), but don't award points
  headers['X-XSS-Protection'] = {
    present:        xssProtection !== null,
    value:          xssProtection,
    recommendation: xssProtection === null
      ? "X-XSS-Protection is deprecated. Rely on CSP instead."
      : xssProtection === '1'
        ? "X-XSS-Protection: 1 (without mode=block) can be exploited in older browsers. Use '0' or '1; mode=block', and rely on CSP."
        : null,
  }

  const data = { score, headers }

  if (score >= 85) {
    return { check_key: CHECK_KEY, group: GROUP, status: 'pass', score, data }
  }

  if (score >= 50) {
    return { check_key: CHECK_KEY, group: GROUP, status: 'warn', score, data }
  }

  return { check_key: CHECK_KEY, group: GROUP, status: 'fail', score, data }
}

// ----------------------
// runSecurityChecks — public entry point
// ----------------------

export async function runSecurityChecks(url: string): Promise<CheckResult[]> {
  const host = extractHostname(url)

  const runners: Array<() => Promise<CheckResult>> = [
    () => checkSslChain(host),
    () => checkHttpHeaders(url),
    () => checkHsts(url),
    () => checkSecurityHeaders(url),
  ]

  const results = await Promise.allSettled(runners.map((fn) => fn()))

  const keys = ['ssl_chain', 'http_headers', 'hsts', 'security_headers']

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
