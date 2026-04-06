'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, CheckCircle, XCircle, AlertTriangle, Sparkles, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations, useLocale } from 'next-intl';

export interface Alert {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'active' | 'acknowledged' | 'resolved';
  affected_path?: string;
  metric_name?: string;
  metric_value?: number;
  metric_threshold?: number;
  metric_previous?: number;
  ai_analysis?: {
    summary: string;
    impact: string[];
    actions: Array<{
      step: number;
      instruction: string;
      effort: 'low' | 'medium' | 'high';
      expected_result: string;
    }>;
    estimated_recovery_days?: number;
    priority_context?: string;
  };
  ai_analysis_status: 'pending' | 'generated' | 'failed';
  detected_at: string;
}

interface AlertPanelProps {
  alert: Alert | null;
  open: boolean;
  onClose: () => void;
  onAcknowledge?: (id: string) => void;
  onIgnore?: (id: string) => void;
}

// Config logic moved inside component to use translations

export function AlertPanel({ alert, open, onClose, onAcknowledge, onIgnore }: AlertPanelProps) {
  const t = useTranslations('alerts');
  const locale = useLocale();
  
  const severityConfig = {
    critical: {
      label: t('critical'),
      icon: XCircle,
      color: 'text-[#EF4444]',
      bg: 'bg-[#EF444415]',
      border: 'border-[#EF444430]',
    },
    warning: {
      label: t('warning'),
      icon: AlertTriangle,
      color: 'text-[#F59E0B]',
      bg: 'bg-[#F59E0B15]',
      border: 'border-[#F59E0B30]',
    },
    info: {
      label: t('info'),
      icon: AlertTriangle,
      color: 'text-[#10B981]',
      bg: 'bg-[#10B98115]',
      border: 'border-[#10B98130]',
    },
  };

  const effortConfig = {
    low: { label: t('effort.low'), color: 'text-[#10B981] bg-[#10B98115]' },
    medium: { label: t('effort.medium'), color: 'text-[#F59E0B] bg-[#F59E0B15]' },
    high: { label: t('effort.high'), color: 'text-[#EF4444] bg-[#EF444415]' },
  };
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!alert) return null;

  const cfg = severityConfig[alert.severity];
  const SeverityIcon = cfg.icon;
  const detectedDate = new Date(alert.detected_at);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[#111118] border-l border-[#1E1E2A] z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-[#1E1E2A]">
              <div className="flex items-start gap-3">
                <div className={cn('p-2 rounded-lg mt-0.5', cfg.bg)}>
                  <SeverityIcon size={16} className={cfg.color} />
                </div>
                <div>
                  <h2 className="font-semibold text-sm text-[#F1F1F5]">
                    {t(`types.${alert.type}`)}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded border', cfg.color, cfg.bg, cfg.border)}>
                      {cfg.label}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-[#8B8B9A]">
                      <Clock size={10} />
                      {detectedDate.toLocaleDateString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-[#8B8B9A] hover:text-[#F1F1F5] hover:bg-[#1E1E2A] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Affected path */}
              {alert.affected_path && (
                <div className="flex items-center gap-2 p-3 bg-[#14141C] rounded-lg border border-[#1E1E2A]">
                  <span className="text-xs text-[#8B8B9A]">{t('affectedUrl')}</span>
                  <span className="font-mono text-xs text-[#10B981] truncate">{alert.affected_path}</span>
                </div>
              )}

              {/* Metric */}
              {alert.metric_name && alert.metric_value !== null && alert.metric_value !== undefined && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#14141C] rounded-lg border border-[#1E1E2A]">
                    <p className="text-[10px] text-[#8B8B9A] mb-1">{t('currentValue')}</p>
                    <p className={cn('font-mono font-bold text-xl', cfg.color)}>
                      {alert.metric_value}
                    </p>
                  </div>
                  {alert.metric_threshold !== null && alert.metric_threshold !== undefined && (
                    <div className="p-3 bg-[#14141C] rounded-lg border border-[#1E1E2A]">
                      <p className="text-[10px] text-[#8B8B9A] mb-1">{t('threshold')}</p>
                      <p className="font-mono font-bold text-xl text-[#8B8B9A]">
                        {alert.metric_threshold}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* AI Analysis */}
              {alert.ai_analysis_status === 'pending' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-[#10B981] animate-pulse" />
                    <span className="text-xs text-[#8B8B9A]">{t('analyzing')}</span>
                  </div>
                  <Skeleton className="h-4 w-full bg-[#1E1E2A]" />
                  <Skeleton className="h-4 w-4/5 bg-[#1E1E2A]" />
                  <Skeleton className="h-4 w-3/5 bg-[#1E1E2A]" />
                  <div className="space-y-2 mt-4">
                    {[1, 2].map(i => (
                      <Skeleton key={i} className="h-16 w-full bg-[#1E1E2A] rounded-lg" />
                    ))}
                  </div>
                </div>
              )}

              {alert.ai_analysis_status === 'generated' && alert.ai_analysis && (
                <>
                  {/* Summary */}
                  <div className="p-4 bg-[#10B98108] border border-[#10B98120] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={12} className="text-[#10B981]" />
                      <span className="text-[10px] text-[#10B981] font-medium uppercase tracking-wider">{t('aiAnalysis')}</span>
                    </div>
                    <p className="text-sm text-[#C5C5D0] leading-relaxed">
                      {alert.ai_analysis.summary}
                    </p>
                  </div>

                  {/* Impact */}
                  {alert.ai_analysis.impact?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-[#8B8B9A] uppercase tracking-wider mb-2">
                        {t('impactTitle')}
                      </h4>
                      <ul className="space-y-1.5">
                        {alert.ai_analysis.impact.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[#C5C5D0]">
                            <ChevronRight size={14} className="text-[#EF4444] mt-0.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  {alert.ai_analysis.actions?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-[#8B8B9A] uppercase tracking-wider mb-2">
                        {t('howToFixTitle')}
                      </h4>
                      <div className="space-y-2">
                        {alert.ai_analysis.actions.map((action) => {
                          const effort = effortConfig[action.effort] ?? effortConfig.medium;
                          return (
                            <div
                              key={action.step}
                              className="p-3 bg-[#14141C] border border-[#1E1E2A] rounded-lg"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-[#10B98115] text-[#10B981] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  {action.step}
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs text-[#F1F1F5] leading-relaxed">{action.instruction}</p>
                                  {action.expected_result && (
                                    <p className="text-[11px] text-[#8B8B9A] mt-1.5">
                                      <span className="text-[#10B981]">→</span> {t('expectedResult')} {action.expected_result}
                                    </p>
                                  )}
                                </div>
                                <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0', effort.color)}>
                                  {effort.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recovery time */}
                  {alert.ai_analysis.estimated_recovery_days && (
                    <div className="flex items-center gap-2 text-xs text-[#8B8B9A]">
                      <Clock size={12} />
                      {t('recoveryEst', { days: alert.ai_analysis.estimated_recovery_days })}
                    </div>
                  )}
                </>
              )}

              {alert.ai_analysis_status === 'failed' && (
                <div className="p-3 bg-[#EF444408] border border-[#EF444420] rounded-lg text-xs text-[#8B8B9A]">
                  {t('aiError')}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-[#1E1E2A] flex gap-2">
              {onAcknowledge && alert.status === 'active' && (
                <button
                  onClick={() => onAcknowledge(alert.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-[#10B98115] border border-[#10B98130] text-[#10B981] text-xs font-medium hover:bg-[#10B98125] transition-colors"
                >
                  <CheckCircle size={13} />
                  {t('acknowledged')}
                </button>
              )}
              {alert.affected_path && (
                <a
                  href={alert.affected_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-[#14141C] border border-[#1E1E2A] text-[#8B8B9A] text-xs font-medium hover:text-[#F1F1F5] hover:border-[#2A2A38] transition-colors"
                >
                  <ExternalLink size={13} />
                  {t('viewAffectedPage')}
                </a>
              )}
              {onIgnore && (
                <button
                  onClick={() => onIgnore(alert.id)}
                  className="px-3 py-2 rounded-md text-[#8B8B9A] text-xs font-medium hover:text-[#F1F1F5] hover:bg-[#1A1A24] transition-colors"
                >
                  {t('ignore')}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
