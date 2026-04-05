'use client';

import { XCircle, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Alert } from './AlertPanel';

interface AlertCardProps {
  alert: Alert;
  onClick?: () => void;
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  lcp_degraded: 'LCP Degradado',
  cls_degraded: 'CLS Degradado',
  inp_degraded: 'INP Degradado',
  seo_score_drop: 'SEO Score Bajo',
  page_missing_title: 'Sin etiqueta <title>',
  page_missing_h1: 'Sin etiqueta H1',
  bounce_rate_spike: 'Spike de tasa de rebote',
  position_drop: 'Caída de posición',
  geo_visibility_lost: 'Visibilidad GEO perdida',
  anomaly_detected: 'Anomalía detectada',
};

const severityConfig = {
  critical: { icon: XCircle, color: 'text-[#EF4444]', bg: 'bg-[#EF444408]', border: 'border-[#EF444418]' },
  warning: { icon: AlertTriangle, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B08]', border: 'border-[#F59E0B18]' },
  info: { icon: AlertTriangle, color: 'text-[#10B981]', bg: 'bg-[#10B98108]', border: 'border-[#10B98118]' },
};

export function AlertCard({ alert, onClick }: AlertCardProps) {
  const cfg = severityConfig[alert.severity];
  const Icon = cfg.icon;
  const detectedDate = new Date(alert.detected_at);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all hover:border-[#2A2A38] group',
        cfg.bg, cfg.border
      )}
    >
      <Icon size={15} className={cn('mt-0.5 shrink-0', cfg.color)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#F1F1F5]">
          {ALERT_TYPE_LABELS[alert.type] ?? alert.type}
        </p>
        {alert.affected_path && (
          <p className="text-xs font-mono text-[#10B981] mt-0.5 truncate">{alert.affected_path}</p>
        )}
        {alert.metric_name && alert.metric_value !== undefined && alert.metric_value !== null && (
          <p className="text-xs text-[#8B8B9A] mt-1">
            <span className={cn('font-mono font-medium', cfg.color)}>{alert.metric_value}</span>
            {alert.metric_threshold && (
              <span> — umbral: <span className="font-mono">{alert.metric_threshold}</span></span>
            )}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-[#8B8B9A]">
          <Clock size={10} />
          {detectedDate.toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          {alert.ai_analysis_status === 'generated' && (
            <span className="text-[#10B981] ml-1">· Análisis IA listo</span>
          )}
        </div>
      </div>
      <ChevronRight size={14} className="text-[#8B8B9A] mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
