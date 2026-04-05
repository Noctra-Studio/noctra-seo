'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { Check, Copy, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────

interface AIContext {
  business_type: string;
  industry: string;
  location: string;
  target_audience: string;
  competitors: string[];
  main_goals: string[];
  priority_pages: string[];
  tone: string;
  custom_instructions: string;
  hostname: string;
}

interface NotificationPrefs {
  email: boolean;
  whatsapp: boolean;
  slack: boolean;
  push: boolean;
  digest_time: string;
  whatsapp_number: string;
  slack_webhook: string;
}

const BUSINESS_TYPES = [
  { id: 'agencia', label: 'Agencia Digital' },
  { id: 'ecommerce', label: 'E-commerce' },
  { id: 'saas', label: 'SaaS / App' },
  { id: 'blog', label: 'Blog / Media' },
  { id: 'servicios', label: 'Servicios Profesionales' },
  { id: 'inmobiliaria', label: 'Inmobiliaria' },
  { id: 'educacion', label: 'Educación' },
  { id: 'otro', label: 'Otro' },
];

const SEO_GOALS = [
  { id: 'trafico_organico', label: 'Más tráfico orgánico' },
  { id: 'posiciones_keywords', label: 'Mejorar posiciones de keywords clave' },
  { id: 'conversiones', label: 'Aumentar conversiones desde orgánico' },
  { id: 'local', label: 'Posicionarme localmente' },
  { id: 'geo', label: 'Aparecer en respuestas de IA (GEO)' },
  { id: 'velocidad', label: 'Mejorar velocidad del sitio' },
];

// ── Helpers ───────────────────────────────────────────────

function TagInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const add = () => {
    // Normalizar: quitar espacios y el slash final si existe para evitar duplicados como /inicio y /inicio/
    const normalized = input.trim().replace(/\/+$/, '');
    if (normalized && !value.map(v => v.replace(/\/+$/, '')).includes(normalized)) {
      onChange([...value, normalized]);
    }
    setInput('');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 bg-[#14141C] border border-[#1E1E2A] rounded-xl px-4 py-3 text-base text-[#F1F1F5] placeholder:text-[#8B8B9A] focus:outline-none focus:border-[#10B981] transition-colors"
        />
        <button
          onClick={add}
          className="px-4 py-3 bg-[#1E1E2A] rounded-xl text-base text-[#8B8B9A] hover:text-[#F1F1F5] transition-colors"
        >
          +
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#10B98115] border border-[#10B98130] text-[#10B981] text-sm rounded-lg"
            >
              {tag}
              <button
                onClick={() => onChange(value.filter(t => t !== tag))}
                className="hover:text-white ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3.5">
      <label className="text-base font-semibold text-[#C5C5D0]">{label}</label>
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [siteId, setSiteId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [trackerInstalled, setTrackerInstalled] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale ?? 'es';

  const [aiContext, setAIContext] = useState<AIContext>({
    business_type: '',
    industry: '',
    location: '',
    target_audience: '',
    competitors: [],
    main_goals: [],
    priority_pages: [],
    tone: 'formal',
    custom_instructions: '',
    hostname: '',
  });

  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    email: true,
    whatsapp: false,
    slack: false,
    push: false,
    digest_time: '09:00',
    whatsapp_number: '',
    slack_webhook: '',
  });

  const supabase = createClient();

  // Load site_id from existing domain
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('org_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!userData?.org_id) return;

      const { data: projects } = await supabase
        .from('projects')
        .select('id, domains(id, site_id, tracker_installed)')
        .eq('org_id', userData.org_id)
        .limit(1)
        .maybeSingle();

      if (projects) {
        setProjectId(projects.id);
        const domain = (projects.domains as any[])?.[0];
        if (domain) {
          setSiteId(domain.site_id);
          setTrackerInstalled(domain.tracker_installed);
        }
      }
    }
    load();
  }, []);

  // Poll tracker installation status
  useEffect(() => {
    if (step !== 5 || trackerInstalled || !siteId) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('domains')
        .select('tracker_installed')
        .eq('site_id', siteId)
        .single();
      if (data?.tracker_installed) {
        setTrackerInstalled(true);
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [step, trackerInstalled, siteId]);

  async function ensureProjectAndDomain() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('org_id, full_name')
        .eq('id', user.id)
        .maybeSingle();

      let orgId = userData?.org_id;

      // 1. Create Org if not exists
      if (!orgId) {
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: `${userData?.full_name || user.email}'s Team`,
            slug: `org-${Math.random().toString(36).slice(2, 7)}`,
          })
          .select()
          .single();

        if (orgError) throw orgError;
        orgId = newOrg.id;

        await supabase
          .from('users')
          .update({ org_id: orgId })
          .eq('id', user.id);
      }

      // 2. Create Project if not exists
      let pId = projectId;
      if (!pId) {
        const { data: newProject, error: projError } = await supabase
          .from('projects')
          .insert({
            org_id: orgId,
            name: aiContext.hostname || 'Principal',
            created_by: user.id
          })
          .select()
          .single();

        if (projError) throw projError;
        pId = newProject.id;
        setProjectId(pId);
      }

      // 3. Create Domain if not exists
      if (!siteId && aiContext.hostname) {
        const { data: newDomain, error: domError } = await supabase
          .from('domains')
          .insert({
            project_id: pId,
            hostname: aiContext.hostname.replace(/^https?:\/\//, '').replace(/\/$/, '')
          })
          .select()
          .single();

        if (domError) throw domError;
        setSiteId(newDomain.site_id);
      }
    } catch (err) {
      console.error('Error ensuring project:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleStep1Next() {
    if (!aiContext.hostname) {
      alert('Por favor ingresa la URL de tu sitio web');
      return;
    }
    await ensureProjectAndDomain();
    setStep(2);
  }

  async function saveAndFinish() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (userData?.org_id) {
        await supabase
          .from('organizations')
          .update({ ai_context: aiContext, onboarding_completed: true })
          .eq('id', userData.org_id);

        await supabase
          .from('users')
          .update({ notification_prefs: notifPrefs })
          .eq('id', user.id);
      }

      router.push(`/${locale}/dashboard/${projectId}`);
    } finally {
      setSaving(false);
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const scriptSnippet = `<script defer src="https://cdn.noctra.studio/tracker.js" data-site-id="${siteId}"></script>`;

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          {/* ── Paso 1: Tu negocio ── */}
          {step === 1 && (
            <OnboardingStep
              key="step1"
              step={1}
              totalSteps={5}
              title="Tu negocio"
              subtitle="Esto nos permite personalizar el análisis IA para tu industria."
              onNext={handleStep1Next}
              loading={saving}
            >
              <Field label="URL de tu sitio web">
                <input
                  value={aiContext.hostname}
                  onChange={e => setAIContext(c => ({ ...c, hostname: e.target.value }))}
                  placeholder="Ej: misitio.com"
                  className="w-full bg-[#14141C] border border-[#1E1E2A] rounded-xl px-4 py-3 text-base text-[#F1F1F5] placeholder:text-[#8B8B9A] focus:outline-none focus:border-[#10B981] transition-colors"
                />
              </Field>

              <Field label="¿Cuál es el tipo de negocio?">
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_TYPES.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setAIContext(c => ({ ...c, business_type: id }))}
                      className={cn(
                        'px-4 py-2.5 rounded-xl text-base border transition-colors',
                        aiContext.business_type === id
                          ? 'bg-[#10B98115] border-[#10B981] text-[#10B981]'
                          : 'bg-[#14141C] border-[#1E1E2A] text-[#8B8B9A] hover:border-[#2A2A38] hover:text-[#F1F1F5]'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="¿En qué industria o nicho operas?">
                <input
                  value={aiContext.industry}
                  onChange={e => setAIContext(c => ({ ...c, industry: e.target.value }))}
                  placeholder="Ej: Tecnología B2B, Moda sostenible..."
                  className="w-full bg-[#14141C] border border-[#1E1E2A] rounded-xl px-4 py-3 text-base text-[#F1F1F5] placeholder:text-[#8B8B9A] focus:outline-none focus:border-[#10B981] transition-colors"
                />
              </Field>

              <Field label="¿En qué ciudad/región se enfoca tu negocio?">
                <input
                  value={aiContext.location}
                  onChange={e => setAIContext(c => ({ ...c, location: e.target.value }))}
                  placeholder="Ej: Querétaro, México"
                  className="w-full bg-[#14141C] border border-[#1E1E2A] rounded-xl px-4 py-3 text-base text-[#F1F1F5] placeholder:text-[#8B8B9A] focus:outline-none focus:border-[#10B981] transition-colors"
                />
              </Field>
            </OnboardingStep>
          )}

          {/* ── Paso 2: Audiencia y competidores ── */}
          {step === 2 && (
            <OnboardingStep
              key="step2"
              step={2}
              totalSteps={5}
              title="Audiencia y competidores"
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            >
              <Field label="Describe brevemente a tu cliente ideal">
                <textarea
                  value={aiContext.target_audience}
                  onChange={e => setAIContext(c => ({ ...c, target_audience: e.target.value }))}
                  placeholder="Ej: Dueños de PyMEs en México que buscan digitalizar su negocio..."
                  rows={3}
                  className="w-full bg-[#14141C] border border-[#1E1E2A] rounded-xl px-4 py-3 text-base text-[#F1F1F5] placeholder:text-[#8B8B9A] focus:outline-none focus:border-[#10B981] transition-colors resize-none"
                />
              </Field>

              <Field label="¿Cuáles son tus principales competidores? (dominios)">
                <TagInput
                  placeholder="Ej: competidor.com — Enter para agregar"
                  value={aiContext.competitors}
                  onChange={v => setAIContext(c => ({ ...c, competitors: v }))}
                />
              </Field>
            </OnboardingStep>
          )}

          {/* ── Paso 3: Objetivos SEO ── */}
          {step === 3 && (
            <OnboardingStep
              key="step3"
              step={3}
              totalSteps={5}
              title="Objetivos SEO"
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            >
              <Field label="¿Qué quieres lograr con SEO? (selecciona todos los que apliquen)">
                <div className="flex flex-wrap gap-2">
                  {SEO_GOALS.map(({ id, label }) => {
                    const selected = aiContext.main_goals.includes(id);
                    return (
                      <button
                        key={id}
                        onClick={() => setAIContext(c => ({
                          ...c,
                          main_goals: selected
                            ? c.main_goals.filter(g => g !== id)
                            : [...c.main_goals, id],
                        }))}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2.5 rounded-xl text-base border transition-colors',
                          selected
                            ? 'bg-[#10B98115] border-[#10B981] text-[#10B981]'
                            : 'bg-[#14141C] border-[#1E1E2A] text-[#8B8B9A] hover:border-[#2A2A38] hover:text-[#F1F1F5]'
                        )}
                      >
                        {selected && <Check size={12} />}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="¿Cuáles son tus páginas más importantes para el negocio?">
                <TagInput
                  placeholder="Ej: /servicios — Enter para agregar"
                  value={aiContext.priority_pages}
                  onChange={v => setAIContext(c => ({ ...c, priority_pages: v }))}
                />
              </Field>
            </OnboardingStep>
          )}

          {/* ── Paso 4: Alertas ── */}
          {step === 4 && (
            <OnboardingStep
              key="step4"
              step={4}
              totalSteps={5}
              title="Configuración de alertas"
              onNext={() => setStep(5)}
              onBack={() => setStep(3)}
            >
              <Field label="¿Cómo quieres recibir alertas?">
                <div className="space-y-2">
                  {[
                    { key: 'email', label: 'Email' },
                    { key: 'whatsapp', label: 'WhatsApp' },
                    { key: 'slack', label: 'Slack' },
                    { key: 'push', label: 'Push notifications' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-[#14141C] border border-[#1E1E2A] rounded-xl">
                      <span className="text-base text-[#F1F1F5]">{label}</span>
                      <button
                        onClick={() => setNotifPrefs(p => ({ ...p, [key]: !p[key as keyof NotificationPrefs] }))}
                        className={cn(
                          'w-11 h-6 rounded-full transition-colors relative flex items-center',
                          notifPrefs[key as keyof NotificationPrefs]
                            ? 'bg-[#10B981]'
                            : 'bg-[#1E1E2A]'
                        )}
                      >
                        <span className={cn(
                          'absolute w-4 h-4 rounded-full bg-white transition-all transform',
                          notifPrefs[key as keyof NotificationPrefs] ? 'translate-x-6' : 'translate-x-1'
                        )} />
                      </button>
                    </div>
                  ))}
                </div>
              </Field>

              <Field label="¿A qué hora quieres el digest diario?">
                <input
                  type="time"
                  value={notifPrefs.digest_time}
                  onChange={e => setNotifPrefs(p => ({ ...p, digest_time: e.target.value }))}
                  className="bg-[#14141C] border border-[#1E1E2A] rounded-xl px-4 py-3 text-base text-[#F1F1F5] focus:outline-none focus:border-[#10B981] transition-colors"
                />
              </Field>

              <Field label="Instrucciones adicionales para la IA (opcional)">
                <textarea
                  value={aiContext.custom_instructions}
                  onChange={e => setAIContext(c => ({ ...c, custom_instructions: e.target.value }))}
                  placeholder="Ej: Siempre prioriza velocidad mobile. Nuestro cliente busca en español. No recomiendas estrategias de black-hat SEO."
                  rows={3}
                  className="w-full bg-[#14141C] border border-[#1E1E2A] rounded-xl px-4 py-3 text-base text-[#F1F1F5] placeholder:text-[#8B8B9A] focus:outline-none focus:border-[#10B981] transition-colors resize-none"
                />
              </Field>
            </OnboardingStep>
          )}

          {/* ── Paso 5: Instalar tracker ── */}
          {step === 5 && (
            <OnboardingStep
              key="step5"
              step={5}
              totalSteps={5}
              title="Instala el tracker"
              subtitle="Copia el script en el <head> de tu sitio para empezar a recibir datos."
              onNext={saveAndFinish}
              onBack={() => setStep(4)}
              nextLabel="Ir al Dashboard →"
              loading={saving}
            >
              {/* Site ID */}
              <div className="flex items-center gap-3 p-4 bg-[#14141C] border border-[#1E1E2A] rounded-xl">
                <span className="text-sm text-[#8B8B9A]">Tu Site ID:</span>
                <code className="flex-1 font-mono text-base text-[#10B981]">{siteId || 'Cargando...'}</code>
                <button
                  onClick={() => copy(siteId, 'siteid')}
                  className="flex items-center gap-2 text-sm text-[#8B8B9A] hover:text-[#F1F1F5] transition-colors"
                >
                  {copied === 'siteid' ? <Check size={16} className="text-[#10B981]" /> : <Copy size={16} />}
                </button>
              </div>

              {/* Script snippet */}
              <div>
                <p className="text-sm text-[#8B8B9A] mb-3 font-medium">Opción A — Script universal:</p>
                <div className="relative group">
                  <pre className="bg-[#0A0A0F] border border-[#1E1E2A] rounded-xl p-5 text-sm font-mono text-[#10B981] overflow-x-auto leading-relaxed">
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

              {/* WordPress option */}
              <div className="p-4 bg-[#14141C] border border-[#1E1E2A] rounded-xl text-base text-[#8B8B9A]">
                <p className="font-semibold text-[#C5C5D0] mb-1.5">Opción B — WordPress:</p>
                Instala el plugin <span className="text-[#10B981] font-medium">Noctra SEO Tracker</span> y añade tu Site ID en la configuración.
              </div>

              {/* Verification status */}
              <div className={cn(
                'flex items-center gap-3 p-4 rounded-xl border transition-all',
                trackerInstalled
                  ? 'bg-[#10B98115] border-[#10B98130]'
                  : 'bg-[#14141C] border-[#1E1E2A]'
              )}>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  trackerInstalled ? 'bg-[#10B981]' : 'bg-[#F59E0B] animate-pulse'
                )} />
                <div>
                  <p className="text-base font-semibold text-[#F1F1F5]">
                    {trackerInstalled ? '¡Tracker detectado!' : 'Esperando primer pageview...'}
                  </p>
                  <p className="text-sm text-[#8B8B9A]">
                    {trackerInstalled
                      ? 'El tracker está enviando datos correctamente'
                      : 'El estado se actualiza automáticamente al detectar la primera visita'}
                  </p>
                </div>
              </div>
            </OnboardingStep>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
