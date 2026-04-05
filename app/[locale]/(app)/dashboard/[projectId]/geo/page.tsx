'use client';

import { useState, useEffect } from 'react';
import { Globe, MessageSquare, Quote, Star, TrendingUp, AlertCircle, CheckCircle2, Search, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function GeoPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [mentions, setMentions] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);

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
        const { data: geoData } = await supabase
          .from('geo_checks')
          .select('*')
          .eq('domain_id', domains.id)
          .order('checked_at', { ascending: false });

        if (geoData) {
          setMentions(geoData);
          
          // Group by engine
          const engines = ['chatgpt', 'perplexity', 'gemini', 'copilot'];
          const engineStats = engines.map(eng => ({
            name: eng.charAt(0).toUpperCase() + eng.slice(1),
            mentions: geoData.filter(m => m.engine === eng).length,
            color: eng === 'chatgpt' ? 'text-[#74aa9c]' : eng === 'perplexity' ? 'text-[#20b2aa]' : eng === 'gemini' ? 'text-[#4285f4]' : 'text-[#00a1f1]'
          }));
          setStats(engineStats);
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
        <span>Escaneando menciones en motores de IA...</span>
      </div>
    );
  }
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-[#F1F1F5] tracking-tight">GEO Intelligence</h1>
          <p className="text-lg text-[#8B8B9A] mt-2">Monitorea la visibilidad y reputación de tu marca en motores de respuesta IA.</p>
        </div>
        <div className="flex items-center gap-3 p-1.5 bg-[#14141C] border border-[#1E1E2A] rounded-xl">
          <button className="px-4 py-2 text-sm font-semibold text-[#10B981] bg-[#10B98115] rounded-lg">Últimos 30 días</button>
          <button className="px-4 py-2 text-sm font-semibold text-[#8B8B9A] hover:text-[#F1F1F5] transition-colors">Histórico</button>
        </div>
      </div>

      {/* Engine Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((engine) => (
          <div key={engine.name} className="bg-[#14141C] border border-[#1E1E2A] rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className={cn('text-sm font-bold uppercase tracking-widest', engine.color)}>{engine.name}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#F1F1F5]">{engine.mentions}</span>
              <span className="text-sm text-[#8B8B9A]">menciones</span>
            </div>
          </div>
        ))}
      </div>

      {/* Content Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mentions Table */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold text-[#F1F1F5] flex items-center gap-2">
            <MessageSquare size={20} className="text-[#10B981]" />
            Últimas menciones detectadas
          </h3>
          <div className="space-y-4">
            {mentions.length === 0 ? (
              <div className="bg-[#14141C] border border-[#1E1E2A] rounded-xl p-8 text-center text-[#8B8B9A]">
                No se han detectado menciones en motores de IA todavía.
              </div>
            ) : mentions.map((mention, i) => (
              <div key={i} className="bg-[#14141C] border border-[#1E1E2A] rounded-xl p-6 hover:border-[#2A2A38] transition-colors shadow-sm group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[#F1F1F5] bg-[#1E1E2A] px-2.5 py-1 rounded-md capitalize">{mention.engine}</span>
                    <span className="text-xs text-[#8B8B9A]">{new Date(mention.checked_at).toLocaleDateString()}</span>
                  </div>
                  {mention.domain_mentioned && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#10B981] bg-[#10B98115] px-2 py-0.5 rounded uppercase tracking-wider">
                      <Star size={10} fill="currentColor" />
                      Citado
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-[#8B8B9A] mb-2 italic">"{mention.query}"</p>
                <div className="bg-[#0A0A0F] rounded-lg p-4 border border-[#1E1E2A]">
                  <p className="text-sm text-[#F1F1F5] leading-relaxed">{mention.response_text}</p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'w-2 h-2 rounded-full',
                      mention.sentiment === 'positive' ? 'bg-[#10B981]' : mention.sentiment === 'negative' ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'
                    )} />
                    <span className="text-xs text-[#8B8B9A] capitalize">Sentimiento {mention.sentiment}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-6">
          <div className="bg-[#14141C] border border-[#1E1E2A] rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#F1F1F5] mb-4">Análisis GEO</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <TrendingUp size={18} className="text-[#10B981] mt-0.5" />
                <p className="text-sm text-[#8B8B9A]"><span className="text-[#F1F1F5] font-semibold">Tendencia al alza:</span> Tus menciones en ChatGPT han crecido un 25% tras la última actualización de contenido.</p>
              </div>
              <div className="flex items-start gap-3">
                <Quote size={18} className="text-[#F59E0B] mt-0.5" />
                <p className="text-sm text-[#8B8B9A]"><span className="text-[#F1F1F5] font-semibold">Cita directa:</span> Perplexity está usando tu blog como fuente principal para temas de performance.</p>
              </div>
            </div>
            <button className="w-full mt-6 py-2.5 bg-[#1E1E2A] hover:bg-[#2A2A38] text-[#F1F1F5] text-sm font-semibold rounded-xl transition-colors">
              Explorar recomendaciones IA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
