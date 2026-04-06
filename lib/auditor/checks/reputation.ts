// =====================
// NOCTRA SEO — Site Auditor: Reputation Checks
// lib/auditor/checks/reputation.ts
//
// DNS-only checks — no external API keys required:
//   - spf_dmarc:     DNS TXT lookups for SPF + DMARC records
//   - dns_blacklist: Reverse-IP DNS queries against Spamhaus & SpamCop
//   - domain_age:    RDAP creation date → age in days
// =====================

import dns from 'node:dns/promises'
import type { CheckResult } from '../types'

const GROUP = 'reputation' as const
const RDAP_TIMEOUT_MS = 15_000

// ----------------------
// Utilities
// ----------------------

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

/** Extract apex domain (e.g. "sub.example.com" → "example.com") */
function apexDomain(hostname: string): string {
  const parts = hostname.replace(/^https?:\/\//i, '').split('.')
  return parts.length >= 2 ? parts.slice(-2).join('.') : hostname
}

/** Normalise a hostname by stripping protocol and trailing slashes */
function normalizeHostname(input: string): string {
  return input.trim().replace(/^https?:\/\//i, '').split('/')[0].split('?')[0]
}

// ----------------------
// checkSpfDmarc
// ----------------------

/**
 * Verifies email authentication policy by looking up:
 *   - SPF:   TXT records on the apex domain containing "v=spf1"
 *   - DMARC: TXT records on `_dmarc.<apex>` containing "v=DMARC1"
 *
 * Thresholds:
 *   pass  Both SPF and DMARC present
 *   warn  Only one present
 *   fail  Neither present
 */
export async function checkSpfDmarc(hostname: string): Promise<CheckResult> {
  const CHECK_KEY = 'spf_dmarc'
  const host = normalizeHostname(hostname)
  const apex = apexDomain(host)

  let spfFound  = false
  let dmarcFound = false
  let spfRecord: string | null = null
  let dmarcRecord: string | null = null

  // SPF — TXT records on apex
  try {
    const records = await dns.resolveTxt(apex)
    for (const parts of records) {
      const joined = parts.join('')
      if (joined.toLowerCase().startsWith('v=spf1')) {
        spfFound = true
        spfRecord = joined
        break
      }
    }
  } catch (err: unknown) {
    // ENODATA / ENOTFOUND = no TXT records, treat as missing SPF
    const code = (err as NodeJS.ErrnoException).code
    if (code !== 'ENODATA' && code !== 'ENOTFOUND') {
      return errorResult(CHECK_KEY, err)
    }
  }

  // DMARC — TXT records on _dmarc.<apex>
  try {
    const records = await dns.resolveTxt(`_dmarc.${apex}`)
    for (const parts of records) {
      const joined = parts.join('')
      if (joined.toLowerCase().startsWith('v=dmarc1')) {
        dmarcFound = true
        dmarcRecord = joined
        break
      }
    }
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code
    if (code !== 'ENODATA' && code !== 'ENOTFOUND') {
      return errorResult(CHECK_KEY, err)
    }
  }

  const data = {
    apex,
    spf_found:    spfFound,
    dmarc_found:  dmarcFound,
    spf_record:   spfRecord,
    dmarc_record: dmarcRecord,
  }

  if (spfFound && dmarcFound) {
    return { check_key: CHECK_KEY, group: GROUP, status: 'pass', score: 100, data }
  }
  if (spfFound || dmarcFound) {
    return { check_key: CHECK_KEY, group: GROUP, status: 'warn', score: 50, data }
  }
  return { check_key: CHECK_KEY, group: GROUP, status: 'fail', score: 0, data }
}

// ----------------------
// checkDnsBlacklist
// ----------------------

const BLOCKLISTS = [
  'zen.spamhaus.org',
  'bl.spamcop.net',
] as const

/**
 * Checks whether the domain's IP appears on major DNS blocklists.
 *
 * Method: resolve domain → get IPv4 → reverse octets → query <reversed>.blocklist
 *   Listed:     A record returned   → listed on that blocklist
 *   Not listed: NXDOMAIN / ENOTFOUND → clean
 *
 *   pass  Not listed on any blocklist
 *   warn  Listed on 1 blocklist
 *   fail  Listed on 2+ blocklists
 */
export async function checkDnsBlacklist(hostname: string): Promise<CheckResult> {
  const CHECK_KEY = 'dns_blacklist'
  const host = normalizeHostname(hostname)
  const apex = apexDomain(host)

  // Resolve IPv4 address
  let ip: string
  try {
    const addresses = await dns.resolve4(apex)
    if (!addresses.length) throw new Error('No A records found')
    ip = addresses[0]
  } catch (err) {
    return errorResult(CHECK_KEY, err)
  }

  // Reverse the IP (e.g. 1.2.3.4 → 4.3.2.1)
  const reversed = ip.split('.').reverse().join('.')

  type ListingResult = { list: string; listed: boolean; response: string | null }
  const results: ListingResult[] = []

  await Promise.allSettled(
    BLOCKLISTS.map(async (list) => {
      const query = `${reversed}.${list}`
      try {
        const addrs = await dns.resolve4(query)
        results.push({ list, listed: true, response: addrs[0] ?? null })
      } catch (err: unknown) {
        const code = (err as NodeJS.ErrnoException).code
        // ENOTFOUND / ENODATA = not listed (expected "clean" response)
        if (code === 'ENOTFOUND' || code === 'ENODATA') {
          results.push({ list, listed: false, response: null })
        } else {
          // Actual network failure — still record as unknown, don't count as listed
          results.push({ list, listed: false, response: null })
        }
      }
    }),
  )

  const listedOn = results.filter((r) => r.listed).map((r) => r.list)

  const data = {
    ip,
    reversed_ip: reversed,
    blocklists_checked: BLOCKLISTS.length,
    listings: results,
    listed_on: listedOn,
  }

  if (listedOn.length === 0) {
    return { check_key: CHECK_KEY, group: GROUP, status: 'pass', score: 100, data }
  }
  if (listedOn.length === 1) {
    return { check_key: CHECK_KEY, group: GROUP, status: 'warn', score: 30, data }
  }
  return { check_key: CHECK_KEY, group: GROUP, status: 'fail', score: 0, data }
}

// ----------------------
// checkDomainAge
// ----------------------

/**
 * Fetches domain registration date from RDAP and computes domain age.
 *
 * Thresholds (older = more trustworthy):
 *   pass  > 365 days old
 *   warn  180–365 days old
 *   fail  < 180 days old (very new domain, higher spam/phishing risk)
 */
export async function checkDomainAge(hostname: string): Promise<CheckResult> {
  const CHECK_KEY = 'domain_age'
  const host = normalizeHostname(hostname)
  const apex = apexDomain(host)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), RDAP_TIMEOUT_MS)

  try {
    const res = await fetch(`https://rdap.org/domain/${apex}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'NoctraSEOBot/1.0' },
    })
    clearTimeout(timer)

    if (!res.ok) {
      throw new Error(`RDAP returned HTTP ${res.status}`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rdap: any = await res.json()

    // Extract creation date from RDAP events array
    let createdAt: string | null = null
    if (Array.isArray(rdap.events)) {
      for (const event of rdap.events) {
        if (event.eventAction === 'registration' && event.eventDate) {
          createdAt = event.eventDate
          break
        }
      }
    }

    const registrar: string | null =
      rdap.entities?.find((e: any) => e.roles?.includes('registrar'))?.vcardArray?.[1]
        ?.find((v: any) => v[0] === 'fn')?.[3] ?? null

    const expiryDate: string | null =
      rdap.events?.find((e: any) => e.eventAction === 'expiration')?.eventDate ?? null

    if (!createdAt) {
      return {
        check_key: CHECK_KEY,
        group: GROUP,
        status: 'warn',
        score: 50,
        data: { apex, created_at: null, age_days: null, registrar, expiry_date: expiryDate },
      }
    }

    const created = new Date(createdAt)
    const ageDays = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24))

    const data = {
      apex,
      created_at:  createdAt,
      age_days:    ageDays,
      registrar,
      expiry_date: expiryDate,
    }

    if (ageDays > 365) {
      return { check_key: CHECK_KEY, group: GROUP, status: 'pass', score: 100, data }
    }
    if (ageDays >= 180) {
      // Linear scale: 180d → 60, 365d → 99
      const score = Math.round(60 + ((ageDays - 180) / 185) * 39)
      return { check_key: CHECK_KEY, group: GROUP, status: 'warn', score, data }
    }
    // < 180 days — score degrades from 59 at 180d to 0 at 0d
    const score = Math.max(0, Math.round((ageDays / 180) * 59))
    return { check_key: CHECK_KEY, group: GROUP, status: 'fail', score, data }
  } catch (err) {
    clearTimeout(timer)
    return errorResult(CHECK_KEY, err)
  }
}

// ----------------------
// runReputationChecks — public entry point
// ----------------------

export async function runReputationChecks(hostname: string): Promise<CheckResult[]> {
  const runners: Array<() => Promise<CheckResult>> = [
    () => checkSpfDmarc(hostname),
    () => checkDnsBlacklist(hostname),
    () => checkDomainAge(hostname),
  ]

  const results = await Promise.allSettled(runners.map((fn) => fn()))
  const keys = ['spf_dmarc', 'dns_blacklist', 'domain_age']

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
