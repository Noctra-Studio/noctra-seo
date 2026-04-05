import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { detectIssues, calculateSEOScore } from '@/lib/seo/issue-detector';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const GIF_1X1 = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function POST(req: NextRequest) {
  // Lazy client creation — avoids module-level errors at build time with empty env vars
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const payload = await req.json();
    if (!payload.site_id) return gifResponse();

    const { data: domain } = await supabase
      .from('domains')
      .select('id, hostname, alert_thresholds, tracker_installed')
      .eq('site_id', payload.site_id)
      .single();

    if (!domain) return gifResponse();

    const country = req.headers.get('x-vercel-ip-country') ?? 'unknown';
    const city = req.headers.get('x-vercel-ip-city') ?? 'unknown';

    if (!domain.tracker_installed) {
      await supabase
        .from('domains')
        .update({ tracker_installed: true, first_pageview_at: new Date().toISOString() })
        .eq('id', domain.id);
    }

    switch (payload.event) {
      case 'pageview':
        await handlePageview(supabase, domain.id, payload, country, city);
        break;
      case 'vitals':
        await handleVitals(supabase, domain.id, payload, country);
        await checkVitalsThresholds(supabase, domain.id, payload.path, domain.alert_thresholds);
        break;
      case 'engagement':
        await handleEngagement(supabase, domain.id, payload.path, payload.behavior, payload.session_id);
        break;
    }

    await supabase
      .from('domains')
      .update({ last_pageview_at: new Date().toISOString() })
      .eq('id', domain.id);

  } catch (err) {
    console.error('[collect]', err);
  }

  return gifResponse();
}

async function handlePageview(supabase: SupabaseClient, domainId: string, payload: Record<string, unknown>, country: string, city: string) {
  const traffic = payload.traffic as Record<string, unknown> | undefined;
  const device = payload.device as Record<string, unknown> | undefined;

  await supabase.from('pageviews').insert({
    domain_id: domainId,
    session_id: payload.session_id,
    path: payload.path,
    referrer: traffic?.referrer,
    utm_source: traffic?.utm_source,
    utm_medium: traffic?.utm_medium,
    utm_campaign: traffic?.utm_campaign,
    utm_content: traffic?.utm_content,
    utm_term: traffic?.utm_term,
    channel: traffic?.channel ?? 'unknown',
    country,
    city,
    device_type: device?.device_type,
    screen_width: device?.screen_width,
    language: device?.language,
    timezone: device?.timezone,
    visited_at: payload.ts,
  });

  if (payload.seo) {
    const seo = payload.seo as Record<string, unknown>;
    const issues = detectIssues(seo);
    const seoScore = calculateSEOScore(issues);

    await supabase.from('page_seo_signals').upsert({
      domain_id: domainId,
      path: payload.path,
      title: seo.title,
      meta_description: seo.meta_description,
      h1: seo.h1,
      canonical_url: seo.canonical_url,
      robots_meta: seo.robots_meta,
      og_title: seo.og_title,
      og_description: seo.og_description,
      og_image: seo.og_image,
      schema_types: seo.schema_types,
      hreflang: seo.hreflang,
      word_count: seo.word_count,
      images_without_alt: seo.images_without_alt,
      internal_links: seo.internal_links,
      external_links: seo.external_links,
      issues,
      seo_score: seoScore,
      last_seen_at: payload.ts,
    }, {
      onConflict: 'domain_id,path',
      ignoreDuplicates: false,
    });

    await checkSEOScoreAlert(supabase, domainId, payload.path as string, seoScore, issues);
  }
}

async function handleVitals(supabase: SupabaseClient, domainId: string, payload: Record<string, unknown>, country: string) {
  if (!payload.vitals) return;
  const vitals = payload.vitals as Record<string, unknown>;
  await supabase.from('web_vitals').insert({
    domain_id: domainId,
    path: payload.path,
    lcp_ms: vitals.lcp_ms,
    cls_score: vitals.cls_score,
    fid_ms: vitals.fid_ms,
    inp_ms: vitals.inp_ms,
    fcp_ms: vitals.fcp_ms,
    ttfb_ms: vitals.ttfb_ms,
    country,
    measured_at: payload.ts,
  });
}

async function handleEngagement(supabase: SupabaseClient, domainId: string, path: string, behavior: Record<string, unknown> | null, sessionId: string) {
  if (!behavior) return;
  await supabase
    .from('pageviews')
    .update({
      time_on_page: behavior.time_on_page,
      scroll_depth: behavior.scroll_depth,
      is_bounce: behavior.is_bounce,
    })
    .eq('domain_id', domainId)
    .eq('session_id', sessionId)
    .eq('path', path)
    .order('visited_at', { ascending: false })
    .limit(1);
}

async function checkSEOScoreAlert(supabase: SupabaseClient, domainId: string, path: string, score: number, issues: ReturnType<typeof detectIssues>) {
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  if (criticalIssues.length === 0 && score >= 70) return;

  const severity = score < 50 || criticalIssues.length >= 2 ? 'critical' : 'warning';

  const { data: existing } = await supabase
    .from('alerts')
    .select('id')
    .eq('domain_id', domainId)
    .eq('type', 'seo_score_drop')
    .eq('affected_path', path)
    .eq('status', 'active')
    .single();

  if (existing) return;

  await supabase.from('alerts').insert({
    domain_id: domainId,
    type: 'seo_score_drop',
    severity,
    affected_path: path,
    metric_name: 'seo_score',
    metric_value: score,
    metric_threshold: 70,
    ai_analysis_status: 'pending',
  });

  await supabase.functions.invoke('analyze-alert', {
    body: { domainId, alertType: 'seo_score_drop', path, score, issues }
  });
}

async function checkVitalsThresholds(supabase: SupabaseClient, domainId: string, path: string, thresholds: Record<string, unknown>) {
  await supabase.functions.invoke('check-vitals-alert', {
    body: { domainId, path, thresholds }
  });
}

function gifResponse() {
  return new Response(GIF_1X1, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
