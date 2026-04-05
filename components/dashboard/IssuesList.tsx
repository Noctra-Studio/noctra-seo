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

  return (
    <div className="bg-[#14141C] border border-[#1E1E2A] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs text-[#8B8B9A] font-medium uppercase tracking-wider">
          Issues críticos
        </h3>
        {criticalIssues.length > 0 && (
          <span className="text-[10px] bg-[#EF444415] text-[#EF4444] px-1.5 py-0.5 rounded font-medium">
            {criticalIssues.length} crítico{criticalIssues.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {criticalIssues.slice(0, 5).map((issue, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg bg-[#EF444408] border border-[#EF444418] group"
          >
            <XCircle size={15} className="text-[#EF4444] mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#F1F1F5]">
                {ISSUE_TYPE_LABELS[issue.type] ?? issue.type}
              </p>
              <p className="text-xs text-[#8B8B9A] mt-0.5 line-clamp-2">{issue.detail}</p>
              {issue.path && (
                <p className="text-[10px] font-mono text-[#6366F1] mt-1 truncate">{issue.path}</p>
              )}
            </div>
            {onFix && (
              <button
                onClick={() => onFix(issue)}
                className="shrink-0 text-xs text-[#6366F1] hover:text-[#4F52D4] flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Fix
                <ChevronRight size={12} />
              </button>
            )}
          </div>
        ))}

        {criticalIssues.length === 0 && (
          <div className="py-6 text-center">
            <div className="w-8 h-8 bg-[#10B98115] rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-[#10B981] text-sm">✓</span>
            </div>
            <p className="text-sm text-[#8B8B9A]">Sin issues críticos</p>
          </div>
        )}
      </div>
    </div>
  );
}
