import { createClient } from 'npm:@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface VitalsThresholds {
  lcp_warning_ms: number;
  lcp_critical_ms: number;
  cls_warning: number;
  cls_critical: number;
  inp_warning_ms: number;
  inp_critical_ms: number;
}

Deno.serve(async (req) => {
  const { domainId, path, thresholds } = await req.json() as {
    domainId: string;
    path: string;
    thresholds: VitalsThresholds;
  };

  // Query P75 from materialized view
  const { data: vitals } = await supabase
    .from('page_vitals_p75')
    .select('lcp_p75, cls_p75, inp_p75, sample_size')
    .eq('domain_id', domainId)
    .eq('path', path)
    .single();

  if (!vitals || vitals.sample_size < 5) {
    return new Response(JSON.stringify({ ok: true, skipped: 'insufficient_data' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const checks = [
    {
      metric: 'lcp_ms',
      value: vitals.lcp_p75,
      warning: thresholds.lcp_warning_ms,
      critical: thresholds.lcp_critical_ms,
      type: 'lcp_degraded',
    },
    {
      metric: 'cls_score',
      value: vitals.cls_p75,
      warning: thresholds.cls_warning,
      critical: thresholds.cls_critical,
      type: 'cls_degraded',
    },
    {
      metric: 'inp_ms',
      value: vitals.inp_p75,
      warning: thresholds.inp_warning_ms,
      critical: thresholds.inp_critical_ms,
      type: 'inp_degraded',
    },
  ];

  for (const check of checks) {
    if (check.value === null || check.value === undefined) continue;

    let severity: 'critical' | 'warning' | null = null;
    let threshold = 0;

    if (check.value >= check.critical) {
      severity = 'critical';
      threshold = check.critical;
    } else if (check.value >= check.warning) {
      severity = 'warning';
      threshold = check.warning;
    }

    if (!severity) continue;

    // Avoid duplicate active alerts
    const { data: existing } = await supabase
      .from('alerts')
      .select('id')
      .eq('domain_id', domainId)
      .eq('type', check.type)
      .eq('affected_path', path)
      .eq('status', 'active')
      .single();

    if (existing) continue;

    await supabase.from('alerts').insert({
      domain_id: domainId,
      type: check.type,
      severity,
      affected_path: path,
      metric_name: check.metric,
      metric_value: check.value,
      metric_threshold: threshold,
      ai_analysis_status: 'pending',
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
