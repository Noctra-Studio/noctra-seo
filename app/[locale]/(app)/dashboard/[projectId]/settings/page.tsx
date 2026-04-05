'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Domain {
  id: string;
  hostname: string;
  site_id: string;
  tracker_installed: boolean;
  first_pageview_at: string | null;
  last_pageview_at: string | null;
  alert_thresholds: Record<string, number>;
}

export default function SettingsPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const [domain, setDomain] = useState<Domain | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [thresholds, setThresholds] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const supabase = createClient();

  useEffect(() => { load(); }, [projectId]);

  async function load() {
    const { data } = await supabase
      .from('domains')
      .select('id, hostname, site_id, tracker_installed, first_pageview_at, last_pageview_at, alert_thresholds')
      .eq('project_id', projectId)
      .single();

    if (data) {
      setDomain(data as Domain);
      setThresholds(data.alert_thresholds ?? {});
    }
    setLoading(false);
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  async function saveThresholds() {
    if (!domain) return;
    setSaving(true);
    await supabase
      .from('domains')
      .update({ alert_thresholds: thresholds })
      .eq('id', domain.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const scriptSnippet = domain
    ? `<script defer src="https://cdn.noctra.studio/tracker.js" data-site-id="${domain.site_id}"></script>`
    : '';

  const npmSnippet = domain
    ? `import { NoctraTracker } from '@noctra/tracker';\n\n// En tu _app.tsx o layout.tsx:\n<NoctraTracker siteId="${domain.site_id}" />`
    : '';

  if (loading) {
    return <div className="p-6 space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-[#14141C] border border-[#1E1E2A] rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6 max-w-2xl">
      <h1 className="text-lg font-semibold text-[#F1F1F5]">Configuración</h1>

      {/* Tracker installation */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#F1F1F5]">Instalación del Tracker</h2>
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-1.5 h-1.5 rounded-full',
              domain?.tracker_installed ? 'bg-[#10B981]' : 'bg-[#F59E0B] animate-pulse'
            )} />
            <span className={cn(
              'text-xs font-medium',
              domain?.tracker_installed ? 'text-[#10B981]' : 'text-[#F59E0B]'
            )}>
              {domain?.tracker_installed ? 'Instalado y activo' : 'Esperando primer pageview'}
            </span>
          </div>
        </div>

        {/* Site ID */}
        <div className="flex items-center gap-2 p-3 bg-[#14141C] border border-[#1E1E2A] rounded-lg">
          <span className="text-xs text-[#8B8B9A] shrink-0">Site ID:</span>
          <code className="flex-1 font-mono text-sm text-[#6366F1]">{domain?.site_id}</code>
          <button onClick={() => copy(domain?.site_id ?? '', 'siteid')} className="text-[#8B8B9A] hover:text-[#F1F1F5] transition-colors">
            {copied === 'siteid' ? <Check size={14} className="text-[#10B981]" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Script */}
        <div>
          <p className="text-xs text-[#8B8B9A] mb-2 font-medium">Opción A — HTML universal (pegar en &lt;head&gt;):</p>
          <div className="relative group">
            <pre className="bg-[#0A0A0F] border border-[#1E1E2A] rounded-lg p-4 text-xs font-mono text-[#10B981] overflow-x-auto whitespace-pre-wrap break-all">
              {scriptSnippet}
            </pre>
            <button
              onClick={() => copy(scriptSnippet, 'script')}
              className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-[#1E1E2A] rounded text-xs text-[#8B8B9A] hover:text-[#F1F1F5] opacity-0 group-hover:opacity-100 transition-all"
            >
              {copied === 'script' ? <Check size={11} className="text-[#10B981]" /> : <Copy size={11} />}
              Copiar
            </button>
          </div>
        </div>

        {/* Next.js */}
        <div>
          <p className="text-xs text-[#8B8B9A] mb-2 font-medium">Opción B — Next.js:</p>
          <div className="relative group">
            <pre className="bg-[#0A0A0F] border border-[#1E1E2A] rounded-lg p-4 text-xs font-mono text-[#C5C5D0] overflow-x-auto">
              {npmSnippet}
            </pre>
            <button
              onClick={() => copy(npmSnippet, 'npm')}
              className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-[#1E1E2A] rounded text-xs text-[#8B8B9A] hover:text-[#F1F1F5] opacity-0 group-hover:opacity-100 transition-all"
            >
              {copied === 'npm' ? <Check size={11} className="text-[#10B981]" /> : <Copy size={11} />}
              Copiar
            </button>
          </div>
        </div>

        {domain?.first_pageview_at && (
          <p className="text-xs text-[#8B8B9A]">
            Primera visita: {new Date(domain.first_pageview_at).toLocaleString('es')}
          </p>
        )}
      </section>

      {/* Alert thresholds */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#F1F1F5]">Umbrales de Alertas</h2>
        <p className="text-xs text-[#8B8B9A]">Personaliza los valores a partir de los cuales se crean alertas.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'lcp_warning_ms', label: 'LCP Warning (ms)' },
            { key: 'lcp_critical_ms', label: 'LCP Crítico (ms)' },
            { key: 'cls_warning', label: 'CLS Warning' },
            { key: 'cls_critical', label: 'CLS Crítico' },
            { key: 'inp_warning_ms', label: 'INP Warning (ms)' },
            { key: 'inp_critical_ms', label: 'INP Crítico (ms)' },
            { key: 'seo_score_warning', label: 'SEO Score Warning' },
            { key: 'seo_score_critical', label: 'SEO Score Crítico' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-[#8B8B9A] mb-1 block">{label}</label>
              <input
                type="number"
                value={thresholds[key] ?? ''}
                onChange={e => setThresholds(t => ({ ...t, [key]: parseFloat(e.target.value) }))}
                className="w-full bg-[#14141C] border border-[#1E1E2A] rounded-lg px-3 py-2 text-sm text-[#F1F1F5] font-mono focus:outline-none focus:border-[#6366F1] transition-colors"
              />
            </div>
          ))}
        </div>

        <button
          onClick={saveThresholds}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#6366F1] text-white text-sm font-medium rounded-lg hover:bg-[#4F52D4] transition-colors disabled:opacity-50"
        >
          {saving ? <RefreshCw size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
          {saved ? 'Guardado' : 'Guardar cambios'}
        </button>
      </section>
    </div>
  );
}
