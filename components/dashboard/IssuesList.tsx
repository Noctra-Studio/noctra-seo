'use client';

import { AlertTriangle, XCircle, ChevronRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface Issue {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  detail: string;
  path?: string;
  field?: string;
}

interface IssuesListProps {
  issues: Issue[];
  onFix?: (issue: Issue) => void;
}

// Moved hardcoded labels from global scope to use translations inside component

export function IssuesList({ issues, onFix }: IssuesListProps) {
  const t = useTranslations('dashboard.issues');
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const hasData = criticalIssues.length > 0;

  return (
    <div className="glass-premium p-7 hover:border-[#EF444430] transition-all shadow-2xl h-full flex flex-col group rounded-2xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-8 z-10">
        <h3 className="text-[10px] text-[#8B8B9A] font-black uppercase tracking-[0.2em] opacity-70 group-hover:opacity-100 transition-all font-display">
          {t('title')}
        </h3>
        {hasData && (
          <span className="text-[9px] font-black text-[#EF4444] bg-[#EF444410] border border-[#EF444420] px-2.5 py-1 rounded-md uppercase tracking-[0.1em] shadow-[0_0_10px_#EF444415]">
            {t('detected', { count: criticalIssues.length })}
          </span>
        )}
      </div>

      <div className="space-y-4 flex-1 z-10">
        {criticalIssues.slice(0, 5).map((issue, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.03] hover:border-[#EF444430] transition-all group/issue cursor-pointer relative overflow-hidden"
          >
            {/* Visual indicator for severity */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#EF4444] opacity-40 group-hover/issue:opacity-100 transition-opacity" />
            
            <div className="p-2.5 bg-[#EF444408] rounded-xl mt-0.5 border border-[#EF444415] shadow-[0_0_15px_rgba(239,68,68,0.05)]">
              <XCircle size={18} className="text-[#EF4444]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-extrabold text-[#F1F1F5] truncate font-display tracking-tight">
                  {t(`labels.${issue.type}`)}
                </p>
                {onFix && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFix(issue);
                    }}
                    className="shrink-0 text-[10px] font-black text-[#10B981] flex items-center gap-1.5 uppercase tracking-[0.1em] bg-[#10B98110] border border-[#10B98120] px-3 py-1.5 rounded-lg opacity-60 group-hover/issue:opacity-100 group-hover/issue:bg-[#10B98115] transition-all hover:scale-105 active:scale-95"
                  >
                    {t('solve')}
                    <ChevronRight size={12} className="group-hover/issue:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
              <p className="text-xs text-[#8B8B9A] mt-2 line-clamp-2 leading-relaxed font-medium opacity-70">
                {issue.detail}
              </p>
              {issue.path && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[9px] font-black font-mono text-[#6B6B7A] uppercase tracking-tighter bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.05] truncate">
                    {issue.path}
                  </span>
                  <div className="h-px flex-1 bg-white/[0.03]" />
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {!hasData && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-5 opacity-40 group-hover:opacity-100 transition-opacity">
            <div className="relative">
              <div className="absolute inset-0 bg-[#10B981]/15 blur-3xl rounded-full scale-150 animate-pulse" />
              <div className="p-5 bg-[#10B98108] border border-[#10B98115] rounded-3xl relative squircle flex items-center justify-center shadow-[0_0_40px_#10B98110]">
                <CheckCircle size={32} className="text-[#10B981]" />
              </div>
            </div>
            <div className="space-y-1.5 text-center">
              <p className="text-base font-black text-[#F1F1F5] font-display tracking-tight">{t('emptyTitle')}</p>
              <p className="text-[10px] text-[#8B8B9A] font-extrabold uppercase tracking-[0.2em] leading-relaxed opacity-60">
                {t('emptySubtitle')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Subtle background glow */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/[0.01] blur-3xl rounded-full" />
    </div>
  );
}
