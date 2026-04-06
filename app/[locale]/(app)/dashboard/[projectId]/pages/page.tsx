'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getScoreLabel } from '@/lib/seo/issue-detector';
import { cn } from '@/lib/utils';
import { ExternalLink, ChevronDown, ChevronUp, Search, RefreshCw, Filter, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const pathParam = searchParams.get('path');

  const [pages, setPages] = useState<PageSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'seo_score' | 'last_seen_at'>('seo_score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expanded, setExpanded] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!projectId) return;
    load();
  }, [projectId, sortBy, sortDir]);

  useEffect(() => {
    if (pathParam && !loading) {
      setExpanded(pathParam);
      // Wait for re-render then scroll
      setTimeout(() => {
        const el = document.getElementById(`page-${pathParam}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [pathParam, loading]);

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

  const filteredPages = pages.filter(p => 
    p.path.toLowerCase().includes(search.toLowerCase()) ||
    p.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 pb-32 max-w-[1400px] mx-auto min-h-screen">
      {/* Header section with back button and title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push(`/dashboard/${projectId}`)}
            className="p-2 hover:bg-white/5 rounded-xl border border-white/5 transition-colors group"
          >
            <ArrowLeft size={20} className="text-[#8B8B9A] group-hover:text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-black text-[#F1F1F5] tracking-tight">Inventario de Páginas</h1>
            <p className="text-[10px] text-[#8B8B9A] font-bold uppercase tracking-[0.2em] opacity-60">SEO Health & Content Coverage</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => load()} 
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-[#F1F1F5] transition-all"
          >
            <RefreshCw size={14} className={cn(loading && "animate-spin")} />
            Recargar
          </button>
        </div>
      </div>

      {/* Search and Filters bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-[#8B8B9A] group-focus-within:text-[#10B981] transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Buscar por URL o título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#14141C] border border-[#1E1E2A] focus:border-[#10B98150] rounded-2xl py-3.5 pl-12 pr-4 text-sm text-[#F1F1F5] placeholder:text-[#8B8B9A50] outline-none transition-all shadow-xl"
          />
        </div>
        <div className="md:col-span-4 flex gap-3">
          <div className="flex-1 bg-[#14141C] border border-[#1E1E2A] rounded-2xl px-4 flex items-center justify-between text-xs font-bold text-[#8B8B9A] cursor-pointer hover:border-white/20 transition-all">
            <div className="flex items-center gap-2">
              <Filter size={14} />
              <span>Filtrar</span>
            </div>
            <ChevronDown size={14} />
          </div>
          <div className="w-12 h-12 bg-[#14141C] border border-[#1E1E2A] rounded-2xl flex items-center justify-center hover:bg-white/5 cursor-pointer transition-all">
            <MoreHorizontal size={18} className="text-[#8B8B9A]" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="glass-premium rounded-2xl overflow-hidden border border-white/[0.05] shadow-2xl">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 bg-white/[0.02] text-[10px] text-[#8B8B9A] uppercase tracking-[0.15em] font-black">
          <div className="col-span-5">Página / URL</div>
          <div className="col-span-2 text-center">Estado</div>
          <button
            className="col-span-2 flex items-center justify-center gap-2 hover:text-[#F1F1F5] transition-colors"
            onClick={() => toggleSort('seo_score')}
          >
            SEO Score
            {sortBy === 'seo_score' && (sortDir === 'asc' ? <ChevronUp size={12} className="text-[#10B981]" /> : <ChevronDown size={12} className="text-[#10B981]" />)}
          </button>
          <div className="col-span-3 text-right">Incidencias Detectadas</div>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-16 bg-white/[0.02] rounded-xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
              <Search size={32} className="text-[#8B8B9A] opacity-20" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#F1F1F5]">No se encontraron páginas</p>
              <p className="text-xs text-[#8B8B9A] opacity-60">Prueba con otra búsqueda o instala el tracker</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredPages.map(page => {
              const { color } = getScoreLabel(page.seo_score);
              const criticalCount = page.issues?.filter((i: any) => i.severity === 'critical').length ?? 0;
              const warningCount = page.issues?.filter((i: any) => i.severity === 'warning').length ?? 0;
              const isExpanded = expanded === page.path;

              return (
                <div key={page.path} id={`page-${page.path}`} className={cn(
                  "transition-all",
                  isExpanded ? "bg-white/[0.03]" : "hover:bg-white/[0.01]"
                )}>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : page.path)}
                    className="w-full grid grid-cols-12 gap-4 px-6 py-5 text-left transition-colors group relative"
                  >
                    <div className="col-span-5 flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-[#F1F1F5] truncate group-hover:text-[#10B981] transition-colors">{page.path}</span>
                        <a
                          href={page.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-white/10 rounded-lg"
                        >
                          <ExternalLink size={12} className="text-[#8B8B9A]" />
                        </a>
                      </div>
                      <span className="text-[10px] text-[#8B8B9A] truncate opacity-50 font-medium">{page.title || 'Sin título definido'}</span>
                    </div>
                    
                    <div className="col-span-2 flex items-center justify-center">
                      <div className={cn(
                        "flex items-center gap-2 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest",
                        page.is_indexable 
                          ? "bg-[#10B98110] border-[#10B98120] text-[#10B981]" 
                          : "bg-[#EF444410] border-[#EF444420] text-[#EF4444]"
                      )}>
                        <div className={cn("w-1 h-1 rounded-full", page.is_indexable ? "bg-[#10B981]" : "bg-[#EF4444]")} />
                        {page.is_indexable ? 'Index' : 'NoIndex'}
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center justify-center">
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            fill="transparent"
                            className="text-white/[0.03]"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            fill="transparent"
                            strokeDasharray={125.6}
                            strokeDashoffset={125.6 - (125.6 * page.seo_score) / 100}
                            className={cn(
                              "transition-all duration-1000",
                              color === 'green' ? 'text-[#10B981]' : color === 'yellow' ? 'text-[#F59E0B]' : 'text-[#EF4444]'
                            )}
                          />
                        </svg>
                        <span className="absolute font-mono text-xs font-black">{page.seo_score}</span>
                      </div>
                    </div>

                    <div className="col-span-3 flex items-center justify-end gap-2">
                      <div className="flex -space-x-1">
                        {criticalCount > 0 && (
                          <div className="w-6 h-6 rounded-lg bg-[#EF4444] flex items-center justify-center text-[10px] font-black shadow-lg shadow-[#EF444430] border border-black/20">
                            {criticalCount}
                          </div>
                        )}
                        {warningCount > 0 && (
                          <div className="w-6 h-6 rounded-lg bg-[#F59E0B] flex items-center justify-center text-[10px] font-black shadow-lg shadow-[#F59E0B30] border border-black/20">
                            {warningCount}
                          </div>
                        )}
                      </div>
                      <div className="p-1.5 rounded-lg group-hover:bg-white/5 transition-colors">
                        {isExpanded ? <ChevronUp size={16} className="text-[#8B8B9A]" /> : <ChevronDown size={16} className="text-[#8B8B9A]" />}
                      </div>
                    </div>
                  </button>

                  {/* Expanded detail with AnimatePresence */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-8 pt-0 flex flex-col gap-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-black text-[#8B8B9A] uppercase tracking-[0.15em]">Meta Data</h4>
                              <div className="space-y-4">
                                <div className="space-y-1">
                                  <span className="text-[9px] text-[#8B8B9A] uppercase font-bold opacity-50">Título SEO</span>
                                  <p className="text-xs text-[#F1F1F5] font-medium leading-relaxed">{page.title || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[9px] text-[#8B8B9A] uppercase font-bold opacity-50">Etiqueta H1</span>
                                  <p className="text-xs text-[#F1F1F5] font-medium leading-relaxed">{page.h1 || 'N/A'}</p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h4 className="text-[10px] font-black text-[#8B8B9A] uppercase tracking-[0.15em]">Estadísticas</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                  <span className="text-[9px] text-[#8B8B9A] uppercase font-bold opacity-50 block mb-1">Palabras</span>
                                  <span className="text-sm font-black text-[#F1F1F5]">{page.word_count || 0}</span>
                                </div>
                                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                  <span className="text-[9px] text-[#8B8B9A] uppercase font-bold opacity-50 block mb-1">Último Rastreo</span>
                                  <span className="text-[10px] font-black text-[#F1F1F5] block">
                                    {new Date(page.last_seen_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h4 className="text-[10px] font-black text-[#8B8B9A] uppercase tracking-[0.15em]">Resolver Problemas</h4>
                              <div className="space-y-2">
                                {page.issues?.length > 0 ? (
                                  page.issues.map((issue: any, i: number) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl group/issue hover:border-[#10B98140] transition-all">
                                      <div className={cn(
                                        "w-1.5 h-1.5 rounded-full shrink-0 mt-1.5",
                                        issue.severity === 'critical' ? 'bg-[#EF4444]' : issue.severity === 'warning' ? 'bg-[#F59E0B]' : 'bg-[#10B981]'
                                      )} />
                                      <p className="text-[11px] text-[#8B8B9A] group-hover/issue:text-[#F1F1F5] transition-colors leading-normal">{issue.detail}</p>
                                    </div>
                                  ))
                                ) : (
                                  <div className="p-4 rounded-xl bg-[#10B98105] border border-[#10B98120] text-center">
                                    <p className="text-[11px] font-bold text-[#10B981]">¡Esta página está perfecta!</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-end">
                            <button className="px-6 py-2.5 bg-[#10B981] hover:bg-[#0D9668] text-black text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#10B98120]">
                              Analizar de nuevo
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
