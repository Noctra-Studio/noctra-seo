'use client';

import { useState } from 'react';
import { AlertTriangle, XCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const ISSUE_TYPE_LABELS: Record<string, string> = {
  missing_title: 'Sin etiqueta <title>',
  long_title: 'Título demasiado largo',
  short_title: 'Título demasiado corto',
  missing_meta: 'Sin meta description',
  long_meta: 'Meta description larga',
  missing_h1: 'Sin etiqueta H1',
  no_canonical: 'Sin URL canónica',
  noindex: 'Página bloqueada (noindex)',
  thin_content: 'Contenido escaso',
  missing_alt: 'Imágenes sin alt',
  missing_schema: 'Sin structured data',
  missing_og_title: 'Sin og:title',
  missing_og_image: 'Sin og:image',
};

export function IssuesList({ issues, onFix }: IssuesListProps) {
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const hasData = criticalIssues.length > 0;

  return (
    <div className="bg-[#14141C] border border-white/[0.05] rounded-2xl p-7 hover:border-[#F59E0B50] transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-3xl h-full flex flex-col group">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xs text-[#8B8B9A] font-bold uppercase tracking-widest">
          Issues Críticos
        </h3>
        {hasData && (
          <span className="text-[10px] font-bold text-[#EF4444] bg-[#EF444415] px-2 py-0.5 rounded uppercase tracking-wider">
            {criticalIssues.length} detectado{criticalIssues.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="space-y-3 flex-1">
        {criticalIssues.slice(0, 5).map((issue, i) => (
          <div
            key={i}
            className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-[#EF444430] transition-all group/issue cursor-pointer"
          >
            <div className="p-2 bg-[#EF444410] rounded-lg mt-0.5">
              <XCircle size={16} className="text-[#EF4444]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-bold text-[#F1F1F5] truncate">
                  {ISSUE_TYPE_LABELS[issue.type] ?? issue.type}
                </p>
                {onFix && (
                  <button
                    onClick={() => onFix(issue)}
                    className="shrink-0 text-[10px] font-bold text-[#10B981] hover:text-[#0D9469] flex items-center gap-1 uppercase tracking-tighter opacity-0 group-hover/issue:opacity-100 transition-opacity"
                  >
                    Reparar
                    <ChevronRight size={12} />
                  </button>
                )}
              </div>
              <p className="text-xs text-[#8B8B9A] mt-1 line-clamp-2 leading-relaxed">{issue.detail}</p>
              {issue.path && (
                <p className="text-[10px] font-mono font-bold text-[#4B4B5A] mt-2 truncate bg-white/[0.02] px-1.5 py-0.5 rounded-md w-fit">
                  {issue.path}
                </p>
              )}
            </div>
          </div>
        ))}

        {!hasData && (
          <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-4 opacity-50 group-hover:opacity-100 transition-opacity">
            <div className="relative">
              <div className="absolute inset-0 bg-[#10B981]/20 blur-2xl rounded-full scale-150" />
              <div className="p-4 bg-[#10B98110] border border-[#10B98120] rounded-2xl relative">
                <span className="text-2xl text-[#10B981]">✓</span>
              </div>
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm font-bold text-[#F1F1F5]">Todo en orden</p>
              <p className="text-xs text-[#8B8B9A] font-bold uppercase tracking-widest leading-relaxed">
                No se han detectado issues críticos
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
