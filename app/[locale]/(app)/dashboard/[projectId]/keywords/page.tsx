'use client';

import { useState, useEffect } from 'react';
import { Search, MousePointer2, Eye, Percent, Hash, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function KeywordsPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [stats, setStats] = useState({ clicks: 0, impressions: 0, ctr: 0, position: 0 });

  useEffect(() => {
    async function fetchData() {
      if (!projectId) return;
      setLoading(true);

      const { data: domains } = await supabase
        .from('domains')
        .select('id')
        .eq('project_id', projectId)
        .single();

      if (domains?.id) {
        const { data: gscData } = await supabase
          .from('gsc_snapshots')
          .select('*')
          .eq('domain_id', domains.id)
          .order('date', { ascending: false });

        if (gscData) {
          setData(gscData);
          const totalClicks = gscData.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
          const totalImpressions = gscData.reduce((acc, curr) => acc + (curr.impressions || 0), 0);
          const avgPosition = gscData.length > 0
            ? gscData.reduce((acc, curr) => acc + Number(curr.position || 0), 0) / gscData.length
            : 0;
          
          setStats({
            clicks: totalClicks,
            impressions: totalImpressions,
            ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
            position: avgPosition
          });
        }
      }
      setLoading(false);
    }
    fetchData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-[#8B8B9A]">
        <Loader2 className="animate-spin mr-2" />
        <span>Cargando datos de Search Console...</span>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#F1F1F5] tracking-tight">Keywords Intelligence</h1>
        <p className="text-lg text-[#8B8B9A] mt-2">Analiza el rendimiento orgánico y descubre nuevas oportunidades de tráfico.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#14141C] border border-[#1E1E2A] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-[#8B8B9A] mb-3">
            <MousePointer2 size={18} />
            <span className="text-sm font-semibold uppercase tracking-widest">Total Clicks</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-[#F1F1F5]">{stats.clicks.toLocaleString()}</span>
          </div>
        </div>
        <div className="bg-[#14141C] border border-[#1E1E2A] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-[#8B8B9A] mb-3">
            <Eye size={18} />
            <span className="text-sm font-semibold uppercase tracking-widest">Impressions</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-[#F1F1F5]">{stats.impressions.toLocaleString()}</span>
          </div>
        </div>
        <div className="bg-[#14141C] border border-[#1E1E2A] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-[#8B8B9A] mb-3">
            <Percent size={18} />
            <span className="text-sm font-semibold uppercase tracking-widest">Avg. CTR</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-[#F1F1F5]">{stats.ctr.toFixed(1)}%</span>
          </div>
        </div>
        <div className="bg-[#14141C] border border-[#1E1E2A] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-[#8B8B9A] mb-3">
            <Hash size={18} />
            <span className="text-sm font-semibold uppercase tracking-widest">Avg. Position</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-[#F1F1F5]">{stats.position.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-[#14141C] border border-[#1E1E2A] rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-[#1E1E2A] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-[#F1F1F5]">Top Consultas</h3>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8B9A]" />
              <input
                type="text"
                placeholder="Filtrar keywords..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-[#0A0A0F] border border-[#1E1E2A] rounded-lg pl-10 pr-4 py-2 text-sm text-[#F1F1F5] focus:outline-none focus:border-[#10B981] transition-colors w-full md:w-64"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#1E1E2A] bg-[#1A1A2440]">
                  <th className="px-6 py-4 text-sm font-semibold text-[#8B8B9A] uppercase tracking-widest">Consulta</th>
                  <th className="px-6 py-4 text-sm font-semibold text-[#8B8B9A] uppercase tracking-widest text-right">Clicks</th>
                  <th className="px-6 py-4 text-sm font-semibold text-[#8B8B9A] uppercase tracking-widest text-right">Impresiones</th>
                  <th className="px-6 py-4 text-sm font-semibold text-[#8B8B9A] uppercase tracking-widest text-right">CTR</th>
                  <th className="px-6 py-4 text-sm font-semibold text-[#8B8B9A] uppercase tracking-widest text-right">Posición</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E2A]">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#8B8B9A]">
                      No hay datos disponibles para este proyecto todavía.
                    </td>
                  </tr>
                ) : data.filter(q => q.query.toLowerCase().includes(filter.toLowerCase())).map((row, i) => (
                  <tr key={i} className="hover:bg-[#1A1A24] transition-colors group">
                    <td className="px-6 py-4 text-base font-medium text-[#F1F1F5]">{row.query}</td>
                    <td className="px-6 py-4 text-base font-mono text-[#F1F1F5] text-right">{(row.clicks || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-base font-mono text-[#8B8B9A] text-right">{(row.impressions || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-base font-mono text-[#10B981] text-right">{(row.ctr || 0).toFixed(1)}%</td>
                    <td className="px-6 py-4 text-base font-mono text-[#F59E0B] text-right">{row.position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
