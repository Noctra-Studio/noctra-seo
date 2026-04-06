// =====================
// NOCTRA SEO — Site Auditor: Types & Constants
// lib/auditor/types.ts
//
// No external imports — safe to use from both server (Route Handlers) and client components.
// =====================

// ----------------------
// 1. Base types (mirror DB enums)
// ----------------------

export type AuditStatus = 'pending' | 'running' | 'completed' | 'failed'
export type CheckStatus = 'pass' | 'warn' | 'fail' | 'info' | 'error'
export type CheckGroup  = 'seo' | 'dns' | 'security' | 'performance' | 'tech' | 'reputation'
export type TriggeredBy = 'manual' | 'onboarding' | 'scheduled'

// ----------------------
// 2. DB-mapped interfaces
// ----------------------

export interface CheckRecommendation {
  priority: 'high' | 'medium' | 'low'
  action: string
}

export interface AuditJob {
  id:                string
  domain_id:         string
  user_id:           string
  status:            AuditStatus
  triggered_by:      TriggeredBy
  started_at:        string | null
  completed_at:      string | null
  score_overall:     number | null
  score_seo:         number | null
  score_dns:         number | null
  score_security:    number | null
  score_performance: number | null
  score_tech:        number | null
  score_reputation:  number | null
  created_at:        string
}

export interface AuditCheck {
  id:              string
  job_id:          string
  check_key:       string
  group:           CheckGroup
  status:          CheckStatus
  score:           number | null
  data:            Record<string, unknown> | null
  summary:         string | null
  recommendations: CheckRecommendation[] | null
  created_at:      string
}

// ----------------------
// 3. Internal check result (pre-persist)
// ----------------------

export interface CheckResult {
  check_key: string
  group:     CheckGroup
  status:    CheckStatus
  score:     number | null
  data:      Record<string, unknown>
  error?:    string  // set when the check failed technically (e.g. network timeout)
}

// ----------------------
// 4. Check registry
// ----------------------

export interface CheckMeta {
  label:                string
  group:                CheckGroup
  description:          string
  weight:               number   // relative weight within the group (all weights per group sum to 1.0)
  requiresChromium:     boolean
  requiresExternalApi:  boolean  // true if it needs an external API key (PageSpeed, VirusTotal, etc.)
}

export const CHECK_REGISTRY: Record<string, CheckMeta> = {
  // --- security (weights: 0.20 + 0.25 + 0.25 + 0.30 = 1.00) ---
  ssl_chain: {
    label:               'SSL Chain',
    group:               'security',
    description:         'Validates the TLS certificate chain, expiry, and issuer trust.',
    weight:              0.30,
    requiresChromium:    false,
    requiresExternalApi: false,
  },
  http_headers: {
    label:               'HTTP Headers',
    group:               'security',
    description:         'Inspects raw response headers for misconfiguration or information leakage.',
    weight:              0.20,
    requiresChromium:    false,
    requiresExternalApi: false,
  },
  hsts: {
    label:               'HSTS',
    group:               'security',
    description:         'Checks for a valid Strict-Transport-Security header with adequate max-age.',
    weight:              0.25,
    requiresChromium:    false,
    requiresExternalApi: false,
  },
  security_headers: {
    label:               'Security Headers',
    group:               'security',
    description:         'Audits CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy.',
    weight:              0.25,
    requiresChromium:    false,
    requiresExternalApi: false,
  },

  // --- dns (weights: 0.35 + 0.35 + 0.30 = 1.00) ---
  dns_records: {
    label:               'DNS Records',
    group:               'dns',
    description:         'Retrieves and validates A, AAAA, MX, TXT, NS, and SPF/DMARC records.',
    weight:              0.35,
    requiresChromium:    false,
    requiresExternalApi: false,
  },
  dnssec: {
    label:               'DNSSEC',
    group:               'dns',
    description:         'Verifies whether DNSSEC is enabled and the zone is properly signed.',
    weight:              0.35,
    requiresChromium:    false,
    requiresExternalApi: false,
  },
  ip_info: {
    label:               'IP Info',
    group:               'dns',
    description:         'Resolves the domain IP and checks ASN, hosting provider, and geolocation.',
    weight:              0.30,
    requiresChromium:    false,
    requiresExternalApi: false,
  },

  // --- seo (weights: 0.25 + 0.25 + 0.30 + 0.20 = 1.00) ---
  robots_txt: {
    label:               'robots.txt',
    group:               'seo',
    description:         'Fetches and parses robots.txt for crawl directives and sitemap references.',
    weight:              0.25,
    requiresChromium:    false,
    requiresExternalApi: false,
  },
  sitemap: {
    label:               'XML Sitemap',
    group:               'seo',
    description:         'Discovers and validates the XML sitemap structure, URL count, and freshness.',
    weight:              0.25,
    requiresChromium:    false,
    requiresExternalApi: false,
  },
  redirect_chain: {
    label:               'Redirect Chain',
    group:               'seo',
    description:         'Follows the redirect chain from HTTP to HTTPS and flags loops or excess hops.',
    weight:              0.30,
    requiresChromium:    false,
    requiresExternalApi: false,
  },
  social_tags: {
    label:               'Social Tags',
    group:               'seo',
    description:         'Checks Open Graph and Twitter Card meta tags on the homepage.',
    weight:              0.20,
    requiresChromium:    false,
    requiresExternalApi: false,
  },

  // --- tech (weights: 1.00) ---
  whois: {
    label:               'WHOIS',
    group:               'tech',
    description:         'Queries WHOIS data for registrar, registration date, and expiry warning.',
    weight:              1.00,
    requiresChromium:    false,
    requiresExternalApi: false,
  },

  // --- performance (weights: 0.50 + 0.25 + 0.25 = 1.00) ---
  ttfb: {
    label:               'TTFB',
    group:               'performance',
    description:         'Measures Time To First Byte via a timed HEAD request. Aligned with Google CrUX thresholds.',
    weight:              0.50,
    requiresChromium:    false,
    requiresExternalApi: false,
  },
  compression: {
    label:               'Compression',
    group:               'performance',
    description:         'Checks whether HTTP response compression (Brotli, Gzip) is enabled.',
    weight:              0.25,
    requiresChromium:    false,
    requiresExternalApi: false,
  },
  cache_headers: {
    label:               'Cache Headers',
    group:               'performance',
    description:         'Inspects Cache-Control, ETag, and Last-Modified headers for caching policy.',
    weight:              0.25,
    requiresChromium:    false,
    requiresExternalApi: false,
  },

  // --- reputation (weights: 0.45 + 0.35 + 0.20 = 1.00) ---
  spf_dmarc: {
    label:               'SPF & DMARC',
    group:               'reputation',
    description:         'Verifies email authentication policy via SPF and DMARC DNS records.',
    weight:              0.45,
    requiresChromium:    false,
    requiresExternalApi: false,
  },
  dns_blacklist: {
    label:               'DNS Blacklist',
    group:               'reputation',
    description:         'Checks whether the domain IP is listed on Spamhaus or SpamCop blocklists.',
    weight:              0.35,
    requiresChromium:    false,
    requiresExternalApi: false,
  },
  domain_age: {
    label:               'Domain Age',
    group:               'reputation',
    description:         'Evaluates domain trustworthiness based on registration date (via RDAP).',
    weight:              0.20,
    requiresChromium:    false,
    requiresExternalApi: false,
  },
} as const satisfies Record<string, CheckMeta>

// ----------------------
// 5. getGroupChecks
// ----------------------

/**
 * Returns all check_keys that belong to the given group.
 */
export function getGroupChecks(group: CheckGroup): string[] {
  return Object.entries(CHECK_REGISTRY)
    .filter(([, meta]) => meta.group === group)
    .map(([key]) => key)
}

// ----------------------
// 6. calculateGroupScore
// ----------------------

/** Score contribution per status. 'error' returns null → check is excluded from scoring. */
const STATUS_SCORE: Record<CheckStatus, number | null> = {
  pass:  100,
  warn:  60,
  fail:  0,
  info:  100,
  error: null,
}

/**
 * Calculates the weighted score for a group from an array of CheckResults.
 *
 * Only checks present in CHECK_REGISTRY are considered.
 * Checks with status 'error' are excluded; their weight is redistributed
 * proportionally among the remaining checks.
 *
 * Returns 0 if no scorable checks exist.
 */
export function calculateGroupScore(checks: CheckResult[]): number {
  if (checks.length === 0) return 0

  type Pair = { weight: number; rawScore: number }
  const scorable: Pair[] = []

  for (const check of checks) {
    const meta = CHECK_REGISTRY[check.check_key]
    if (!meta) continue

    const rawScore = STATUS_SCORE[check.status]
    if (rawScore === null) continue  // 'error' — skip

    scorable.push({ weight: meta.weight, rawScore })
  }

  if (scorable.length === 0) return 0

  const totalWeight = scorable.reduce((sum, p) => sum + p.weight, 0)
  if (totalWeight === 0) return 0

  const weighted = scorable.reduce((sum, p) => sum + (p.rawScore * p.weight) / totalWeight, 0)
  return Math.round(weighted)
}

// ----------------------
// 7. calculateOverallScore
// ----------------------

/**
 * Simple average of all available group scores.
 * Groups missing from the map are excluded.
 *
 * Returns 0 if the map is empty.
 */
export function calculateOverallScore(
  groupScores: Partial<Record<CheckGroup, number>>,
): number {
  const values = Object.values(groupScores).filter((v): v is number => v !== undefined)
  if (values.length === 0) return 0
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
}
