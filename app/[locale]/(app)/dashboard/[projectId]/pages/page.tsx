'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getScoreLabel } from '@/lib/seo/issue-detector';
import { cn } from '@/lib/utils';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface PageSignal {
  path: string;
  title: string | null;
  h1: string | null;
  seo_score: number;
  issues: Array<{ type: string; severity: string; detail: string }>;
  word_count: number | null;
  is_indexable: boolean;
  last_seen_at: string;
}

export default function PagesPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const [pages, setPages] = useState<PageSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'seo_score' | 'last_seen_at'>('seo_score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expanded, setExpanded] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!projectId) return;
    load();
  }, [projectId, sortBy, sortDir]);

  async function load() {
    setLoading(true);
    const { data: domains } = await supabase
      .from('domains')
      .select('id')
      .eq('project_id', projectId);

    if (!domains?.length) { setLoading(false); return; }

    const { data } = await supabase
      .from('page_seo_signals')
      .select('path, title, h1, seo_score, issues, word_count, is_indexable, last_seen_at')
      .in('domain_id', domains.map(d => d.id))
      .order(sortBy, { ascending: sortDir === 'asc' });

    setPages((data ?? []) as PageSignal[]);
    setLoading(false);
  }

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  }

  return (
    <div className="p-6 space-y-4 pb-20 md:pb-6">
      <h1 className="text-lg font-semibold text-[#F1F1F5]">Páginas</h1>

      <div className="bg-[#14141C] border border-[#1E1E2A] rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2.5 border-b border-[#1E1E2A] text-[10px] text-[#8B8B9A] uppercase tracking-wider font-medium">
          <div className="col-span-5">URL</div>
          <div className="col-span-2 text-center">Indexable</div>
          <button
            className="col-span-2 flex items-center justify-center gap-1 hover:text-[#F1F1F5] transition-colors"
            onClick={() => toggleSort('seo_score')}
          >
            SEO Score
            {sortBy === 'seo_score' && (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
          </button>
          <div className="col-span-3 text-right">Issues</div>
        </div>

        {loading ? (
          <div className="space-y-0.5 p-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-[#111118] rounded animate-pulse" />
            ))}
          </div>
        ) : pages.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#8B8B9A]">
            Sin datos — instala el tracker para ver tus páginas
          </div>
        ) : (
          <div>
            {pages.map(page => {
              const { color } = getScoreLabel(page.seo_score);
              const criticalCount = page.issues?.filter((i: any) => i.severity === 'critical').length ?? 0;
              const warningCount = page.issues?.filter((i: any) => i.severity === 'warning').length ?? 0;
              const isExpanded = expanded === page.path;

              return (
                <div key={page.path} className="border-b border-[#1E1E2A] last:border-0">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : page.path)}
                    className="w-full grid grid-cols-12 gap-4 px-4 py-3 text-left hover:bg-[#111118] transition-colors group"
                  >
                    <div className="col-span-5 flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs text-[#F1F1F5] truncate">{page.path}</span>
                      <a
                        href={page.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        <ExternalLink size={11} className="text-[#8B8B9A]" />
                      </a>
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        page.is_indexable ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                      )} />
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                      <span className={cn(
                        'font-mono text-sm font-bold',
                        color === 'green' ? 'text-[#10B981]' :
                        color === 'yellow' ? 'text-[#F59E0B]' :
                        'text-[#EF4444]'
                      )}>
                        {page.seo_score}
                      </span>
                    </div>
                    <div className="col-span-3 flex items-center justify-end gap-1.5">
                      {criticalCount > 0 && (
                        <span className="text-[10px] bg-[#EF444415] text-[#EF4444] px-1.5 py-0.5 rounded font-medium">
                          {criticalCount} crítico{criticalCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {warningCount > 0 && (
                        <span className="text-[10px] bg-[#F59E0B15] text-[#F59E0B] px-1.5 py-0.5 rounded font-medium">
                          {warningCount} warning{warningCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 bg-[#0D0D14] border-t border-[#1E1E2A] space-y-2">
                      {page.title && (
                        <p className="text-xs text-[#8B8B9A]">
                          <span className="text-[#10B981]">Title:</span> {page.title}
                        </p>
                      )}
                      {page.h1 && (
                        <p className="text-xs text-[#8B8B9A]">
                          <span className="text-[#10B981]">H1:</span> {page.h1}
                        </p>
                      )}
                      {page.word_count && (
                        <p className="text-xs text-[#8B8B9A]">
                          <span className="text-[#10B981]">Palabras:</span> {page.word_count}
                        </p>
                      )}
                      {page.issues?.length > 0 && (
                        <div className="space-y-1 mt-2">
                          {page.issues.map((issue: any, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-[#8B8B9A]">
                              <span className={cn(
                                'mt-0.5 shrink-0',
                                issue.severity === 'critical' ? 'text-[#EF4444]' :
                                issue.severity === 'warning' ? 'text-[#F59E0B]' :
                                'text-[#10B981]'
                              )}>●</span>
                              {issue.detail}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
