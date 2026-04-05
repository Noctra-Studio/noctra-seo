import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  const { domainId, alertType, path, score, issues } = await req.json();

  const { data: domain } = await supabase
    .from('domains')
    .select('hostname, projects(org_id, organizations(ai_context, name))')
    .eq('id', domainId)
    .single();

  const aiContext = (domain as any)?.projects?.organizations?.ai_context ?? {};
  const orgName = (domain as any)?.projects?.organizations?.name ?? 'tu empresa';
  const hostname = (domain as any)?.hostname ?? 'el sitio';

  const prompt = `
Eres un consultor SEO senior analizando un problema detectado en ${hostname} (${orgName}).

CONTEXTO DEL NEGOCIO:
- Tipo: ${aiContext.business_type ?? 'no especificado'}
- Industria: ${aiContext.industry ?? 'no especificada'}
- Ubicación: ${aiContext.location ?? 'no especificada'}
- Objetivos principales: ${(aiContext.main_goals ?? []).join(', ') || 'no especificados'}
- Páginas prioritarias: ${(aiContext.priority_pages ?? []).join(', ') || 'no especificadas'}
- Instrucciones adicionales: ${aiContext.custom_instructions ?? 'ninguna'}

PROBLEMA DETECTADO:
- Tipo: ${alertType}
- URL afectada: ${path}
- SEO Score actual: ${score}/100
- Issues encontrados: ${JSON.stringify(issues, null, 2)}

Genera un análisis de alerta inteligente. Responde SOLO con este JSON exacto:
{
  "summary": "2 frases explicando qué está pasando y por qué es importante para este negocio específico",
  "impact": [
    "Impacto concreto 1 (ej: Reduce visibilidad en búsquedas de [término relevante para su industria])",
    "Impacto concreto 2",
    "Impacto concreto 3"
  ],
  "actions": [
    {
      "step": 1,
      "instruction": "Instrucción específica y accionable",
      "effort": "low",
      "expected_result": "Qué mejora al hacer esto"
    },
    {
      "step": 2,
      "instruction": "...",
      "effort": "medium",
      "expected_result": "..."
    }
  ],
  "estimated_recovery_days": 7,
  "priority_context": "Por qué es especialmente importante para este tipo de negocio/industria"
}

Sé específico al contexto del negocio. No uses jerga técnica innecesaria.
`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  let analysis;
  try {
    analysis = JSON.parse((response.content[0] as { text: string }).text);
  } catch {
    analysis = { summary: 'Error al generar análisis', impact: [], actions: [] };
  }

  await supabase
    .from('alerts')
    .update({
      ai_analysis: analysis,
      ai_analysis_status: 'generated',
    })
    .eq('domain_id', domainId)
    .eq('type', alertType)
    .eq('affected_path', path)
    .eq('status', 'active')
    .order('detected_at', { ascending: false })
    .limit(1);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
