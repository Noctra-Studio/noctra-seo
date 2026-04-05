'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { passesGoogleCWV } from '@/lib/alerts/threshold-checker';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format, subDays } from 'date-fns';

interface VitalsRow {
  path: string;
  device_type: string | null;
  lcp_p75: number | null;
  cls_p75: number | null;
  inp_p75: number | null;
  fcp_p75: number | null;
  ttfb_p75: number | null;
  sample_size: number;
}

const METRIC_CONFIG = [
  { key: 'lcp_p75' as const, label: 'LCP', unit: 'ms', good: 2500, poor: 4000, color: '#10B981' },
  { key: 'cls_p75' as const, label: 'CLS', unit: '', good: 0.1, poor: 0.25, color: '#10B981', decimals: 3 },
  { key: 'inp_p75' as const, label: 'INP', unit: 'ms', good: 200, poor: 500, color: '#F59E0B' },
  { key: 'fcp_p75' as const, label: 'FCP', unit: 'ms', good: 1800, poor: 3000, color: '#EC4899' },
  { key: 'ttfb_p75' as const, label: 'TTFB', unit: 'ms', good: 800, poor: 1800, color: '#8B5CF6' },
];

function statusColor(value: number | null, good: number, poor: number) {
  if (value === null) return 'text-[#8B8B9A]';
  if (value <= good) return 'text-[#10B981]';
  if (value < poor) return 'text-[#F59E0B]';
  return 'text-[#EF4444]';
}

function formatValue(value: number | null, unit: string, decimals = 0) {
  if (value === null) return '—';
  return decimals > 0 ? `${value.toFixed(decimals)}` : `${Math.round(value)}${unit}`;
}

export default function VitalsPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const [vitals, setVitals] = useState<VitalsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'mobile' | 'desktop'>('all');

  const supabase = createClient();

  useEffect(() => {
    load();
  }, [projectId]);

  async function load() {
    setLoading(true);
    const { data: domains } = await supabase
      .from('domains')
      .select('id')
      .eq('project_id', projectId);

    if (!domains?.length) { setLoading(false); return; }

    const { data } = await supabase
      .from('page_vitals_p75')
      .select('path, device_type, lcp_p75, cls_p75, inp_p75, fcp_p75, ttfb_p75, sample_size')
      .in('domain_id', domains.map(d => d.id))
      .order('lcp_p75', { ascending: false, nullsFirst: false });

    setVitals((data ?? []) as VitalsRow[]);
    setLoading(false);
  }

  const filtered = deviceFilter === 'all'
    ? vitals
    : vitals.filter(v => v.device_type === deviceFilter);

  // Summary P75 across all pages
  const summary = filtered.length ? {
    lcp: filtered.reduce((s, v) => s + (v.lcp_p75 ?? 0), 0) / filtered.filter(v => v.lcp_p75).length,
    cls: filtered.reduce((s, v) => s + (v.cls_p75 ?? 0), 0) / filtered.filter(v => v.cls_p75).length,
    inp: filtered.reduce((s, v) => s + (v.inp_p75 ?? 0), 0) / filtered.filter(v => v.inp_p75).length,
  } : null;

  const passes = summary ? passesGoogleCWV(summary.lcp, summary.cls, summary.inp) : false;

  return (
    <div className="p-6 space-y-5 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#F1F1F5]">Core Web Vitals</h1>
          <p className="text-xs text-[#8B8B9A] mt-0.5">P75 de los últimos 30 días</p>
        </div>
        <span className={cn(
          'text-xs font-medium px-2.5 py-1 rounded-full',
          passes ? 'bg-[#10B98115] text-[#10B981]' : 'bg-[#EF444415] text-[#EF4444]'
        )}>
          {passes ? '✓ Pasa Google CWV' : '✗ Falla Google CWV'}
        </span>
      </div>

      {/* Device filter */}
      <div className="flex items-center gap-0.5 bg-[#14141C] border border-[#1E1E2A] rounded-md p-0.5 w-fit">
        {(['all', 'mobile', 'desktop'] as const).map(d => (
          <button
            key={d}
            onClick={() => setDeviceFilter(d)}
            className={cn(
              'px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize',
              deviceFilter === d ? 'bg-[#1E1E2A] text-[#F1F1F5]' : 'text-[#8B8B9A] hover:text-[#F1F1F5]'
            )}
          >
            {d === 'all' ? 'Todos' : d === 'mobile' ? 'Mobile' : 'Desktop'}
          </button>
        ))}
      </div>

      {/* Summary metrics */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {METRIC_CONFIG.map(({ key, label, unit, good, poor, color, decimals }) => {
            const val = key === 'lcp_p75' ? summary.lcp : key === 'cls_p75' ? summary.cls : key === 'inp_p75' ? summary.inp : null;
            const colorClass = statusColor(val, good, poor);
            return (
              <div key={key} className="bg-[#14141C] border border-[#1E1E2A] rounded-xl p-4">
                <p className="text-[10px] text-[#8B8B9A] font-medium uppercase tracking-wider mb-1">{label}</p>
                <p className={cn('font-mono font-bold text-xl', colorClass)}>
                  {formatValue(val, unit, decimals)}
                </p>
                <p className="text-[10px] text-[#8B8B9A] mt-1">bueno ≤{formatValue(good, unit, decimals)}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Per-page table */}
      <div className="bg-[#14141C] border border-[#1E1E2A] rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-[#1E1E2A] text-[10px] text-[#8B8B9A] uppercase tracking-wider">
          <div className="col-span-4">URL</div>
          <div className="col-span-1 text-center">Device</div>
          {METRIC_CONFIG.map(m => (
            <div key={m.key} className="col-span-1 text-center">{m.label}</div>
          ))}
          <div className="col-span-1 text-center">Muestras</div>
        </div>

        {loading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-[#111118] rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#8B8B9A]">
            Sin datos — necesita al menos 5 pageviews por página
          </div>
        ) : (
          filtered.map((row, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-[#1E1E2A] last:border-0 hover:bg-[#111118] transition-colors">
              <div className="col-span-4 font-mono text-xs text-[#F1F1F5] truncate">{row.path}</div>
              <div className="col-span-1 text-center text-[10px] text-[#8B8B9A]">{row.device_type ?? '—'}</div>
              {METRIC_CONFIG.map(({ key, unit, good, poor, decimals }) => (
                <div key={key} className={cn('col-span-1 text-center font-mono text-xs font-medium', statusColor(row[key] as number | null, good, poor))}>
                  {formatValue(row[key] as number | null, unit, decimals)}
                </div>
              ))}
              <div className="col-span-1 text-center text-[10px] text-[#8B8B9A]">{row.sample_size}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
