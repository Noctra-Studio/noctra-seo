'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AlertCard } from '@/components/alerts/AlertCard';
import { AlertPanel, type Alert } from '@/components/alerts/AlertPanel';
import { cn } from '@/lib/utils';

type StatusFilter = 'active' | 'acknowledged' | 'resolved';
type SeverityFilter = 'all' | 'critical' | 'warning' | 'info';

export default function AlertsPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [selected, setSelected] = useState<Alert | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadAlerts();
  }, [projectId, statusFilter]);

  async function loadAlerts() {
    setLoading(true);
    const { data: domains } = await supabase
      .from('domains')
      .select('id')
      .eq('project_id', projectId);

    if (!domains?.length) { setLoading(false); return; }
    const domainIds = domains.map(d => d.id);

    let query = supabase
      .from('alerts')
      .select('*')
      .in('domain_id', domainIds)
      .eq('status', statusFilter)
      .order('detected_at', { ascending: false });

    const { data } = await query;
    setAlerts((data ?? []) as Alert[]);
    setLoading(false);
  }

  const filtered = severityFilter === 'all'
    ? alerts
    : alerts.filter(a => a.severity === severityFilter);

  function openAlert(alert: Alert) {
    setSelected(alert);
    setPanelOpen(true);
  }

  async function acknowledge(id: string) {
    await supabase
      .from('alerts')
      .update({ status: 'acknowledged', acknowledged_at: new Date().toISOString() })
      .eq('id', id);
    setPanelOpen(false);
    loadAlerts();
  }

  async function ignore(id: string) {
    await supabase
      .from('alerts')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', id);
    setPanelOpen(false);
    loadAlerts();
  }

  return (
    <>
      <div className="p-6 space-y-4 pb-20 md:pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[#F1F1F5]">Alertas</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <div className="flex items-center gap-0.5 bg-[#14141C] border border-[#1E1E2A] rounded-md p-0.5">
            {(['active', 'acknowledged', 'resolved'] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize',
                  statusFilter === s ? 'bg-[#1E1E2A] text-[#F1F1F5]' : 'text-[#8B8B9A] hover:text-[#F1F1F5]'
                )}
              >
                {s === 'active' ? 'Activas' : s === 'acknowledged' ? 'Reconocidas' : 'Resueltas'}
              </button>
            ))}
          </div>

          {/* Severity */}
          <div className="flex items-center gap-0.5 bg-[#14141C] border border-[#1E1E2A] rounded-md p-0.5">
            {(['all', 'critical', 'warning', 'info'] as SeverityFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-medium transition-colors',
                  severityFilter === s ? 'bg-[#1E1E2A] text-[#F1F1F5]' : 'text-[#8B8B9A] hover:text-[#F1F1F5]'
                )}
              >
                {s === 'all' ? 'Todas' : s === 'critical' ? 'Críticas' : s === 'warning' ? 'Warnings' : 'Info'}
              </button>
            ))}
          </div>
        </div>

        {/* Alert list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-[#14141C] border border-[#1E1E2A] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-[#10B98115] rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-[#10B981] text-xl">✓</span>
            </div>
            <p className="text-sm text-[#8B8B9A]">No hay alertas {statusFilter === 'active' ? 'activas' : statusFilter === 'acknowledged' ? 'reconocidas' : 'resueltas'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onClick={() => openAlert(alert)}
              />
            ))}
          </div>
        )}
      </div>

      <AlertPanel
        alert={selected}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onAcknowledge={acknowledge}
        onIgnore={ignore}
      />
    </>
  );
}
