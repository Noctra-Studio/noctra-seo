export interface SEOIssue {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  detail: string;
  field?: string;
}

export interface SEOSignals {
  title?: string | null;
  meta_description?: string | null;
  h1?: string | null;
  canonical_url?: string | null;
  robots_meta?: string | null;
  word_count?: number;
  images_without_alt?: number;
  schema_types?: string[];
  og_title?: string | null;
  og_image?: string | null;
}

export function detectIssues(signals: SEOSignals): SEOIssue[] {
  const issues: SEOIssue[] = [];

  // ── Título ──────────────────────────────────────────────
  if (!signals.title) {
    issues.push({ type: 'missing_title', severity: 'critical', detail: 'La página no tiene etiqueta <title>', field: 'title' });
  } else {
    const len = signals.title.length;
    if (len > 60) issues.push({ type: 'long_title', severity: 'warning', detail: `Título de ${len} caracteres — Google trunca a ~60`, field: 'title' });
    if (len < 30) issues.push({ type: 'short_title', severity: 'warning', detail: `Título de ${len} caracteres — muy corto para posicionar`, field: 'title' });
  }

  // ── Meta description ────────────────────────────────────
  if (!signals.meta_description) {
    issues.push({ type: 'missing_meta', severity: 'warning', detail: 'Sin meta description — Google generará una automáticamente', field: 'meta_description' });
  } else {
    const len = signals.meta_description.length;
    if (len > 160) issues.push({ type: 'long_meta', severity: 'warning', detail: `Meta description de ${len} caracteres — Google trunca a ~160`, field: 'meta_description' });
    if (len < 70)  issues.push({ type: 'short_meta', severity: 'info', detail: `Meta description de ${len} caracteres — considera ampliarla`, field: 'meta_description' });
  }

  // ── H1 ──────────────────────────────────────────────────
  if (!signals.h1) {
    issues.push({ type: 'missing_h1', severity: 'critical', detail: 'La página no tiene etiqueta H1', field: 'h1' });
  }

  // ── Canonical ───────────────────────────────────────────
  if (!signals.canonical_url) {
    issues.push({ type: 'no_canonical', severity: 'warning', detail: 'Sin URL canónica — puede haber problemas de contenido duplicado', field: 'canonical_url' });
  }

  // ── Indexabilidad ───────────────────────────────────────
  if (signals.robots_meta?.toLowerCase().includes('noindex')) {
    issues.push({ type: 'noindex', severity: 'critical', detail: 'La página tiene robots meta noindex — Google no la indexará', field: 'robots_meta' });
  }

  // ── Contenido ───────────────────────────────────────────
  const wordCount = signals.word_count ?? 0;
  if (wordCount > 0 && wordCount < 300) {
    issues.push({ type: 'thin_content', severity: 'warning', detail: `Solo ${wordCount} palabras — el contenido escaso dificulta el posicionamiento` });
  }

  // ── Imágenes ────────────────────────────────────────────
  const missingAlts = signals.images_without_alt ?? 0;
  if (missingAlts > 0) {
    issues.push({ type: 'missing_alt', severity: 'warning', detail: `${missingAlts} imagen${missingAlts > 1 ? 'es' : ''} sin atributo alt`, field: 'images' });
  }

  // ── Schema ──────────────────────────────────────────────
  if (!signals.schema_types?.length) {
    issues.push({ type: 'missing_schema', severity: 'info', detail: 'No se detectó structured data (JSON-LD) — considera agregar según el tipo de contenido' });
  }

  // ── Open Graph ──────────────────────────────────────────
  if (!signals.og_title) {
    issues.push({ type: 'missing_og_title', severity: 'info', detail: 'Sin og:title — afecta la vista previa en redes sociales', field: 'og_title' });
  }
  if (!signals.og_image) {
    issues.push({ type: 'missing_og_image', severity: 'info', detail: 'Sin og:image — el link compartido en redes no tendrá imagen', field: 'og_image' });
  }

  return issues;
}

export function calculateSEOScore(issues: SEOIssue[]): number {
  const penalties: Record<string, number> = { critical: 20, warning: 8, info: 2 };
  const total = issues.reduce((acc, i) => acc + (penalties[i.severity] ?? 0), 0);
  return Math.max(0, Math.min(100, 100 - total));
}

export function getScoreLabel(score: number): { label: string; color: 'green' | 'yellow' | 'red' } {
  if (score >= 80) return { label: 'Bueno', color: 'green' };
  if (score >= 60) return { label: 'Necesita mejoras', color: 'yellow' };
  return { label: 'Crítico', color: 'red' };
}
