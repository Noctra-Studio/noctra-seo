// =====================
// NOCTRA SEO — Site Auditor: DNS Checks
// lib/auditor/checks/dns.ts
// =====================

import * as dnsPromises from 'node:dns/promises'
import type { CheckResult } from '../types'

const GROUP = 'dns' as const
const FETCH_TIMEOUT_MS = 10_000

// ----------------------
// Utilities
// ----------------------

/** Accepts a bare hostname or a URL with protocol — always returns a bare hostname. */
function extractHostname(input: string): string {
  const trimmed = input.trim()
  if (/^https?:\/\//i.test(trimmed)) {
    return new URL(trimmed).hostname
  }
  // Strip stray slashes and paths
  return trimmed.split('/')[0]
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

/**
 * Resolves a DNS record type and swallows ENODATA / ENOTFOUND,
 * returning an empty array instead of throwing.
 * Real errors (ESERVFAIL, timeouts, etc.) still propagate.
 */
async function safeResolve<T>(
  fn: () => Promise<T[]>,
): Promise<T[]> {
  try {
    return await fn()
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code ?? ''
    if (code === 'ENODATA' || code === 'ENOTFOUND' || code === 'ENORECORDS') {
      return []
    }
    throw err
  }
}

// ----------------------
// checkDnsRecords
// ----------------------

export async function checkDnsRecords(domain: string): Promise<CheckResult> {
  const CHECK_KEY = 'dns_records'
  const host = extractHostname(domain)

  let a:     string[]                                     = []
  let aaaa:  string[]                                     = []
  let mx:    Array<{ exchange: string; priority: number }> = []
  let ns:    string[]                                     = []
  let txt:   string[]                                     = []
  let cname: string | null                                = null

  try {
    // Run all lookups in parallel; each tolerates missing records independently
    const [aRes, aaaaRes, mxRes, nsRes, txtRes, cnameRes] = await Promise.all([
      safeResolve(() => dnsPromises.resolve4(host)),
      safeResolve(() => dnsPromises.resolve6(host)),
      safeResolve(() => dnsPromises.resolveMx(host)),
      safeResolve(() => dnsPromises.resolveNs(host)),
      safeResolve(() => dnsPromises.resolveTxt(host)),
      safeResolve(() => dnsPromises.resolveCname(host)),
    ])

    a     = aRes
    aaaa  = aaaaRes
    // MX records — sort by priority ascending
    mx    = mxRes.sort((x, y) => x.priority - y.priority)
    ns    = nsRes
    // TXT records come back as string[][] — flatten each entry
    txt   = txtRes.map((chunks) => chunks.join(''))
    cname = cnameRes.length > 0 ? cnameRes[0] : null
  } catch (err) {
    return errorResult(CHECK_KEY, err)
  }

  const data = { a, aaaa, mx, ns, txt, cname }

  if (a.length === 0) {
    return { check_key: CHECK_KEY, group: GROUP, status: 'fail', score: 0, data }
  }

  // Has A record and NS records → pass
  if (ns.length > 0) {
    // Degrade to warn if missing IPv6 or MX (common but suboptimal)
    if (aaaa.length === 0 || mx.length === 0) {
      return { check_key: CHECK_KEY, group: GROUP, status: 'warn', score: 70, data }
    }
    return { check_key: CHECK_KEY, group: GROUP, status: 'pass', score: 100, data }
  }

  // Has A but no NS (unusual — NS may be on the apex handled by registrar)
  return { check_key: CHECK_KEY, group: GROUP, status: 'warn', score: 60, data }
}

// ----------------------
// checkDnssec
// ----------------------

export async function checkDnssec(domain: string): Promise<CheckResult> {
  const CHECK_KEY = 'dnssec'
  const host = extractHostname(domain)

  let dsRecords:    string[] = []
  let dnskeyFound:  boolean  = false
  let indeterminate = false

  try {
    const [dsRes, dnskeyRes] = await Promise.allSettled([
      dnsPromises.resolve(host, 'DS'),
      dnsPromises.resolve(host, 'DNSKEY'),
    ])

    if (dsRes.status === 'fulfilled') {
      dsRecords = dsRes.value as string[]
    } else {
      const code = (dsRes.reason as NodeJS.ErrnoException).code ?? ''
      // ENODATA / ENORECORDS = record type not present (definitive: no DS)
      // ESERVFAIL / ETIMEOUT = can't determine
      if (code !== 'ENODATA' && code !== 'ENOTFOUND' && code !== 'ENORECORDS') {
        indeterminate = true
      }
    }

    if (dnskeyRes.status === 'fulfilled') {
      dnskeyFound = (dnskeyRes.value as string[]).length > 0
    } else {
      const code = (dnskeyRes.reason as NodeJS.ErrnoException).code ?? ''
      if (code !== 'ENODATA' && code !== 'ENOTFOUND' && code !== 'ENORECORDS') {
        indeterminate = true
      }
    }
  } catch (err) {
    return errorResult(CHECK_KEY, err)
  }

  const enabled = dsRecords.length > 0 || dnskeyFound
  const data = { enabled, dsRecords, dnskeyFound }

  if (enabled) {
    return { check_key: CHECK_KEY, group: GROUP, status: 'pass', score: 100, data }
  }

  if (indeterminate) {
    return { check_key: CHECK_KEY, group: GROUP, status: 'warn', score: null, data }
  }

  return { check_key: CHECK_KEY, group: GROUP, status: 'fail', score: 0, data }
}

// ----------------------
// checkIpInfo
// ----------------------

interface IpApiResponse {
  status:      string
  country:     string
  countryCode: string
  city:        string
  isp:         string
  org:         string
  as:          string
  hosting:     boolean
}

export async function checkIpInfo(domain: string): Promise<CheckResult> {
  const CHECK_KEY = 'ip_info'
  const host = extractHostname(domain)

  let ip: string

  try {
    const lookup = await dnsPromises.lookup(host, { family: 4 })
    ip = lookup.address
  } catch (err) {
    return errorResult(CHECK_KEY, err)
  }

  let ipData: IpApiResponse

  try {
    const res = await fetchWithTimeout(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,isp,org,as,hosting`,
    )
    if (!res.ok) throw new Error(`ip-api.com responded with HTTP ${res.status}`)
    ipData = (await res.json()) as IpApiResponse
  } catch (err) {
    // ip-api unavailable — still return what we know (the IP) as partial info
    return {
      check_key: CHECK_KEY,
      group:     GROUP,
      status:    'info',
      score:     null,
      data: {
        ip,
        country:     '',
        countryCode: '',
        city:        '',
        isp:         '',
        org:         '',
        asn:         '',
        isHosting:   false,
      },
      error: err instanceof Error ? err.message : String(err),
    }
  }

  if (ipData.status !== 'success') {
    return errorResult(CHECK_KEY, new Error(`ip-api.com: ${ipData.status}`))
  }

  const data = {
    ip,
    country:     ipData.country,
    countryCode: ipData.countryCode,
    city:        ipData.city,
    isp:         ipData.isp,
    org:         ipData.org,
    asn:         ipData.as,       // "AS12345 Some Provider Inc."
    isHosting:   ipData.hosting,
  }

  // Always informational — no pass/fail judgment on hosting location
  return { check_key: CHECK_KEY, group: GROUP, status: 'info', score: null, data }
}

// ----------------------
// runDnsChecks — public entry point
// ----------------------

export async function runDnsChecks(domain: string): Promise<CheckResult[]> {
  const runners: Array<() => Promise<CheckResult>> = [
    () => checkDnsRecords(domain),
    () => checkDnssec(domain),
    () => checkIpInfo(domain),
  ]

  const results = await Promise.allSettled(runners.map((fn) => fn()))

  const keys = ['dns_records', 'dnssec', 'ip_info']

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
