'use client';

import { useState, useEffect } from 'react';
import { BarChart2, Download, FileText, CheckCircle, AlertTriangle, XCircle, Sparkles, Clock, FileJson, FileType, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [aiContext, setAiContext] = useState<any>(null);
  const [stats, setStats] = useState({ score: 0, alerts: 0, pages: 0 });

  useEffect(() => {
    async function fetchData() {
      if (!projectId) return;
      setLoading(true);

      // 1. Get Project and Org
      const { data: project } = await supabase
        .from('projects')
        .select('org_id, domains(id)')
        .eq('id', projectId)
        .single();

      if (project?.org_id) {
        // 2. Get AI Context from Org
        const { data: org } = await supabase
          .from('organizations')
          .select('ai_context')
          .eq('id', project.org_id)
          .single();
        
        setAiContext(org?.ai_context);

        // 3. Get Domain ID
        const domainId = (project?.domains as any)?.[0]?.id;
        
        if (domainId) {
          // 4. Get Audit History for this domain
          const { data: audits } = await supabase
            .from('audit_jobs')
            .select('*')
            .eq('domain_id', domainId)
            .order('created_at', { ascending: false });
          
          setAuditHistory(audits || []);

          // 5. Get current alerts count
          const { count: alertCount } = await supabase
            .from('alerts')
            .select('*', { count: 'exact', head: true })
            .eq('domain_id', domainId)
            .eq('status', 'active');
          
          setStats(s => ({ ...s, alerts: alertCount || 0 }));
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
        <span>Compilando informes ejecutivos...</span>
      </div>
    );
  }
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-[#F1F1F5] tracking-tight text-white mb-2">Centro de Reportes</h1>
          <p className="text-lg text-[#8B8B9A]">Genera auditorías completas y resúmenes ejecutivos para tu equipo.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-[#10B981] hover:bg-[#0D9469] text-white text-base font-bold rounded-xl transition-all shadow-lg hover:scale-[1.02]">
            <Sparkles size={18} />
            Nueva Auditoría
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Executive Summary Card */}
        <div className="lg:col-span-2 bg-[#14141C] border border-[#1E1E2A] rounded-xl p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/5 blur-[60px] rounded-full -mr-16 -mt-16" />
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-[#10B98115] rounded-lg">
              <FileText size={22} className="text-[#10B981]" />
            </div>
            <h3 className="text-xl font-bold text-[#F1F1F5]">Resumen Ejecutivo Generado</h3>
          </div>
          <div className="space-y-6">
            <p className="text-base text-[#C5C5D0] leading-relaxed">
              {aiContext ? (
                <>Basado en tu enfoque en <span className="text-white font-bold">{aiContext.industry}</span> para un público de <span className="text-white font-bold">{aiContext.audience}</span>, el análisis IA sugiere priorizar la optimización semántica de tus keywords principales.</>
              ) : (
                "No hay suficiente contexto IA para generar un resumen ejecutivo todavía. Completa el onboarding para activar esta función."
              )}
            </p>
            <div className="grid grid-cols-3 gap-4 py-6 border-y border-[#1E1E2A]">
              <div className="space-y-1">
                <p className="text-xs text-[#8B8B9A] font-bold uppercase tracking-wider">Alertas Activas</p>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-2xl font-bold",
                    stats.alerts > 0 ? "text-[#EF4444]" : "text-[#10B981]"
                  )}>{stats.alerts}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[#8B8B9A] font-bold uppercase tracking-wider">Industria</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-[#F1F1F5] truncate">{aiContext?.industry || 'Pendiente'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[#8B8B9A] font-bold uppercase tracking-wider">Tono</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-[#10B981] capitalize">{aiContext?.tone || 'Pendiente'}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-[#1E1E2A] hover:bg-[#2A2A38] text-sm font-semibold rounded-lg transition-colors border border-[#1E1E2A]">
                <FileType size={14} />
                Exportar PDF
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#1E1E2A] hover:bg-[#2A2A38] text-sm font-semibold rounded-lg transition-colors border border-[#1E1E2A]">
                <FileJson size={14} />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>

        {/* Audit History Sidebar */}
        <div className="bg-[#14141C] border border-[#1E1E2A] rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#F1F1F5] mb-6 flex items-center gap-2">
            <Clock size={18} className="text-[#8B8B9A]" />
            Historial de Auditorías
          </h3>
          <div className="space-y-4">
            {auditHistory.length === 0 ? (
              <div className="p-4 bg-[#0A0A0F] border border-[#1E1E2A] rounded-xl text-center text-[#8B8B9A] text-xs">
                No hay auditorías previas registradas.
              </div>
            ) : auditHistory.map((audit) => (
              <div key={audit.id} className="p-4 bg-[#0A0A0F] border border-[#1E1E2A] rounded-xl hover:border-[#10B98130] transition-colors group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-[#8B8B9A]">{new Date(audit.created_at).toLocaleDateString()}</span>
                  <span className="text-xs font-bold text-[#10B981] capitalize">{audit.status}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold text-[#F1F1F5]">Análisis de sitio</p>
                    <p className="text-xs text-[#8B8B9A]">ID: {audit.id.slice(0, 8)}</p>
                  </div>
                  <Download size={14} className="text-[#8B8B9A] group-hover:text-[#10B981] transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
