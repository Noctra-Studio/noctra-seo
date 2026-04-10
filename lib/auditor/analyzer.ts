// =====================
// NOCTRA SEO — Site Auditor: Claude Enrichment
// lib/auditor/analyzer.ts
// =====================

import Anthropic from '@anthropic-ai/sdk'
import type {
  AuditJob,
  CheckGroup,
  CheckRecommendation,
  CheckResult,
} from './types'
import { CHECK_REGISTRY } from './types'

// ----------------------
// Types
// ----------------------

export interface EnrichedCheckResult extends CheckResult {
  summary:         string
  recommendations: CheckRecommendation[]
}

interface ClaudeCheckOutput {
  check_key:       string
  summary:         string
  recommendations: CheckRecommendation[]
}

interface ClaudeResponse {
  results: ClaudeCheckOutput[]
}

// ----------------------
// Auto-summaries for pass / info checks (no Claude call needed)
// ----------------------

const AUTO_SUMMARIES: Record<string, string> = {
  ssl_chain:        'El certificado SSL está vigente y la cadena de confianza está correctamente configurada.',
  dns_records:      'Los registros DNS están correctamente configurados con A, NS y registros de correo presentes.',
  dnssec:           'DNSSEC está habilitado, lo que protege el dominio contra ataques de envenenamiento DNS.',
  ip_info:          'Información de IP y proveedor de hosting obtenida correctamente.',
  http_headers:     'Headers HTTP inspeccionados — revisa los detalles para ver la configuración completa.',
  hsts:             'HSTS está habilitado con max-age adecuado, forzando conexiones HTTPS seguras.',
  security_headers: 'Los headers de seguridad principales están presentes y correctamente configurados.',
  robots_txt:       'El archivo robots.txt existe y tiene directivas válidas para los crawlers.',
  sitemap:          'El sitemap XML fue encontrado y contiene URLs válidas para indexación.',
  redirect_chain:   'El dominio redirige correctamente a HTTPS con una cadena mínima de saltos.',
  social_tags:      'Las etiquetas Open Graph y Twitter Card están presentes para una previsualización óptima en redes sociales.',
  whois:            'El dominio está activo y tiene margen amplio antes de su vencimiento.',
  tech_stack:       'Stack tecnológico detectado — revisa los detalles para ver las tecnologías identificadas.',
}

const AUTO_SUMMARIES_FAIL: Record<string, string> = {
  ssl_chain:        'El certificado SSL tiene problemas que pueden alertar a los usuarios y afectar el posicionamiento.',
  dns_records:      'Faltan registros DNS críticos que pueden afectar la entrega de correo y la visibilidad del sitio.',
  dnssec:           'DNSSEC no está habilitado, dejando el dominio vulnerable a ataques de envenenamiento de caché DNS.',
  http_headers:     'Los headers HTTP revelan información sensible del servidor.',
  hsts:             'HSTS no está configurado, permitiendo que las conexiones iniciales sean interceptadas.',
  security_headers: 'Faltan headers de seguridad críticos que exponen el sitio a ataques XSS y clickjacking.',
  robots_txt:       'El archivo robots.txt no existe o no es accesible, lo que puede confundir a los crawlers.',
  sitemap:          'No se encontró un sitemap XML, dificultando la indexación de páginas por los buscadores.',
  redirect_chain:   'La cadena de redirects es demasiado larga o tiene problemas que afectan el SEO y la velocidad.',
  social_tags:      'Faltan etiquetas meta esenciales que perjudican la apariencia del sitio en buscadores y redes sociales.',
  whois:            'El dominio está próximo a expirar o tiene problemas en su registro.',
}

function autoSummary(check: CheckResult): string {
  if (check.status === 'pass' || check.status === 'info') {
    return AUTO_SUMMARIES[check.check_key] ?? `El check ${check.check_key} completó sin problemas.`
  }
  if (check.status === 'error') {
    return `No se pudo ejecutar el check ${check.check_key}${check.error ? ': ' + check.error : '.'}`
  }
  // warn / fail — will be enriched by Claude, but fallback if needed
  return AUTO_SUMMARIES_FAIL[check.check_key] ?? `El check ${check.check_key} detectó problemas que requieren atención.`
}

function checkLabel(check_key: string): string {
  return CHECK_REGISTRY[check_key]?.label ?? check_key
}

// ----------------------
// Claude client (lazy-initialized)
// ----------------------

let _client: Anthropic | null = null
const AI_ANALYSIS_TIMEOUT_MS = 12_000
const AI_SUMMARY_TIMEOUT_MS = 8_000

function hasAnthropicApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim())
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

// ----------------------
// analyzeAuditResults
// ----------------------

/**
 * Enriches audit CheckResults with Claude-generated summaries and recommendations.
 *
 * Strategy:
 * - pass / info checks  → auto-generated summary, empty recommendations (no API call)
 * - warn / fail / error → single batched Claude call for all problematic checks
 */
export async function analyzeAuditResults(
  checks: CheckResult[],
  siteUrl: string,
): Promise<EnrichedCheckResult[]> {
  // Separate checks that need Claude from those that don't
  const needsAnalysis = checks.filter(
    (c) => c.status === 'warn' || c.status === 'fail',
  )
  const autoOnly = checks.filter(
    (c) => c.status === 'pass' || c.status === 'info' || c.status === 'error',
  )

  // Build a quick-lookup map for Claude results
  const enrichedMap = new Map<string, ClaudeCheckOutput>()

  if (needsAnalysis.length > 0 && hasAnthropicApiKey()) {
    try {
      const client = getClient()

      // Slim down the data sent to Claude — don't send large raw HTML blobs
      const slimChecks = needsAnalysis.map((c) => ({
        check_key: c.check_key,
        label:     checkLabel(c.check_key),
        group:     c.group as CheckGroup,
        status:    c.status,
        score:     c.score,
        // Truncate data values that might be huge (e.g. rawContent, allHeaders)
        data: Object.fromEntries(
          Object.entries(c.data ?? {}).map(([k, v]) => [
            k,
            typeof v === 'string' && v.length > 500 ? v.slice(0, 500) + '…' : v,
          ]),
        ),
      }))

      const message = await withTimeout(
        client.messages.create({
          model:      'claude-3-5-sonnet-20240620',
          max_tokens: 2048,
          system:
            'Eres un experto en SEO técnico, seguridad web y rendimiento. Analizas resultados de auditorías web para agencias digitales en LATAM. Tus respuestas son directas, accionables y priorizadas. Respondes SOLO en JSON válido, sin markdown, sin texto extra.',
          messages: [
            {
              role:    'user',
              content: `Analiza los siguientes checks de auditoría para el sitio ${siteUrl} y genera recomendaciones accionables.

Para cada check, genera:
- summary: 1-2 oraciones explicando el hallazgo en términos de impacto de negocio (no técnico)
- recommendations: array de acciones priorizadas, máximo 3 por check

Responde con este JSON exacto:
{
  "results": [
    {
      "check_key": "nombre_del_check",
      "summary": "...",
      "recommendations": [
        { "priority": "high|medium|low", "action": "instrucción clara y específica" }
      ]
    }
  ]
}

Checks a analizar:
${JSON.stringify(slimChecks, null, 2)}`,
            },
          ],
        }),
        AI_ANALYSIS_TIMEOUT_MS,
        'Audit AI enrichment',
      )

      const rawText =
        message.content[0].type === 'text' ? message.content[0].text : ''

      const parsed = JSON.parse(rawText) as ClaudeResponse
      for (const result of parsed.results ?? []) {
        enrichedMap.set(result.check_key, result)
      }
    } catch {
      // Claude call failed — fall through to auto-summaries for all checks
    }
  }

  // Build final enriched results preserving original order
  return checks.map((check): EnrichedCheckResult => {
    const claude = enrichedMap.get(check.check_key)

    if (claude) {
      return {
        ...check,
        summary:         claude.summary,
        recommendations: claude.recommendations ?? [],
      }
    }

    // auto-only or Claude failed for this check
    return {
      ...check,
      summary:         autoSummary(check),
      recommendations: [],
    }
  })
}

// ----------------------
// generateAuditSummary
// ----------------------

/**
 * Generates a 3-4 sentence executive paragraph about the overall site health.
 * Falls back to an empty string silently if Claude is unavailable.
 */
export async function generateAuditSummary(
  job: AuditJob,
  checks: EnrichedCheckResult[],
): Promise<string> {
  if (!hasAnthropicApiKey()) {
    return ''
  }

  try {
    const client = getClient()

    const scoreLines = [
      job.score_overall    != null && `- Score general: ${job.score_overall}/100`,
      job.score_seo        != null && `- SEO: ${job.score_seo}/100`,
      job.score_dns        != null && `- DNS: ${job.score_dns}/100`,
      job.score_security   != null && `- Seguridad: ${job.score_security}/100`,
      job.score_tech       != null && `- Tech: ${job.score_tech}/100`,
    ]
      .filter(Boolean)
      .join('\n')

    const failedChecks = checks
      .filter((c) => c.status === 'fail' || c.status === 'warn')
      .map((c) => `${checkLabel(c.check_key)} (${c.status})`)
      .join(', ')

    const message = await withTimeout(
      client.messages.create({
        model:      'claude-3-5-sonnet-20240620',
        max_tokens: 300,
        system:
          'Eres un consultor de SEO y seguridad web para agencias digitales en LATAM. Escribes resúmenes ejecutivos concisos en español.',
        messages: [
          {
            role:    'user',
            content: `Genera un resumen ejecutivo de 3-4 oraciones sobre el estado general de este sitio web.
Escribe en segunda persona ("Tu sitio..."), tono profesional pero directo.
No uses bullets ni markdown. Solo el párrafo.

Scores:
${scoreLines}

Checks con problemas: ${failedChecks || 'ninguno'}`,
          },
        ],
      }),
      AI_SUMMARY_TIMEOUT_MS,
      'Audit executive summary',
    )

    return message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  } catch {
    return ''
  }
}
