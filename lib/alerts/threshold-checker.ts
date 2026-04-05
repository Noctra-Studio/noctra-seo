export interface AlertThresholds {
  lcp_warning_ms: number;
  lcp_critical_ms: number;
  cls_warning: number;
  cls_critical: number;
  inp_warning_ms: number;
  inp_critical_ms: number;
  seo_score_warning: number;
  seo_score_critical: number;
  bounce_rate_warning: number;
  position_drop_warning: number;
}

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  lcp_warning_ms: 2500,
  lcp_critical_ms: 4000,
  cls_warning: 0.1,
  cls_critical: 0.25,
  inp_warning_ms: 200,
  inp_critical_ms: 500,
  seo_score_warning: 70,
  seo_score_critical: 50,
  bounce_rate_warning: 70,
  position_drop_warning: 5,
};

export type VitalStatus = 'good' | 'needs-improvement' | 'poor';

export function checkLCP(value: number, thresholds: AlertThresholds): VitalStatus {
  if (value <= thresholds.lcp_warning_ms) return 'good';
  if (value < thresholds.lcp_critical_ms) return 'needs-improvement';
  return 'poor';
}

export function checkCLS(value: number, thresholds: AlertThresholds): VitalStatus {
  if (value <= thresholds.cls_warning) return 'good';
  if (value < thresholds.cls_critical) return 'needs-improvement';
  return 'poor';
}

export function checkINP(value: number, thresholds: AlertThresholds): VitalStatus {
  if (value <= thresholds.inp_warning_ms) return 'good';
  if (value < thresholds.inp_critical_ms) return 'needs-improvement';
  return 'poor';
}

export function passesGoogleCWV(lcp: number | null, cls: number | null, inp: number | null): boolean {
  if (lcp === null || cls === null || inp === null) return false;
  return lcp <= 2500 && cls <= 0.1 && inp <= 200;
}
