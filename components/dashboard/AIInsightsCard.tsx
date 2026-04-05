import { Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIInsight {
  summary?: string;
  actions?: Array<{
    step: number;
    instruction: string;
    effort: 'low' | 'medium' | 'high';
    expected_result: string;
  }>;
}

interface AIInsightsCardProps {
  insight?: AIInsight | null;
  loading?: boolean;
}

const effortConfig = {
  low: { label: 'Impacto Alto', color: 'text-[#10B981] bg-[#10B98115]' },
  medium: { label: 'Impacto Medio', color: 'text-[#F59E0B] bg-[#F59E0B15]' },
  high: { label: 'Impacto Bajo', color: 'text-[#8B8B9A] bg-[#1E1E2A]' },
};

export function AIInsightsCard({ insight, loading }: AIInsightsCardProps) {
  return (
    <div className="bg-[#14141C] border border-white/[0.05] rounded-2xl p-7 hover:border-[#10B98150] transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-3xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2 bg-[#10B98115] rounded-lg group-hover:bg-[#10B98125] transition-colors">
          <Sparkles size={16} className="text-[#10B981]" />
        </div>
        <h3 className="text-xs text-[#8B8B9A] font-bold uppercase tracking-widest">
          AI Monitoring
        </h3>
      </div>

      {loading && (
        <div className="space-y-4 relative z-10">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-4 bg-white/[0.03] rounded-lg animate-pulse" style={{ width: `${80 - i * 10}%` }} />
          ))}
        </div>
      )}

      {!loading && !insight && (
        <div className="py-10 text-center relative z-10 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-[#10B981]/20 blur-2xl rounded-full scale-150 animate-pulse" />
            <div className="p-4 bg-[#10B98110] border border-[#10B98120] rounded-2xl relative">
              <Sparkles size={32} className="text-[#10B981]" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-base font-bold text-[#F1F1F5]">IA en espera</p>
            <p className="text-sm text-[#8B8B9A] max-w-[240px] mx-auto leading-relaxed">
              Instala el tracker para que nuestra IA pueda analizar tu tráfico y salud SEO en tiempo real.
            </p>
          </div>
          <button className="text-sm font-bold text-[#10B981] pt-2 hover:underline">Ver instrucciones de instalación →</button>
        </div>
      )}

      {!loading && insight && (
        <div className="space-y-4">
          {insight.summary && (
            <p className="text-sm text-[#C5C5D0] leading-relaxed">
              {insight.summary}
            </p>
          )}

          {insight.actions && insight.actions.length > 0 && (
            <div className="space-y-2">
              {insight.actions.slice(0, 3).map((action, i) => {
                const effort = effortConfig[action.effort] ?? effortConfig.medium;
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#111118] border border-[#1E1E2A]">
                    <div className="w-5 h-5 rounded-full bg-[#10B98115] text-[#10B981] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {action.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#F1F1F5] leading-relaxed">{action.instruction}</p>
                    </div>
                    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0', effort.color)}>
                      {effort.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
