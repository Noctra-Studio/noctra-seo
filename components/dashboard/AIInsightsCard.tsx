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
    <div className="bg-[#14141C] border border-[#1E1E2A] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 bg-[#6366F115] rounded flex items-center justify-center">
          <Sparkles size={12} className="text-[#6366F1]" />
        </div>
        <h3 className="text-xs text-[#8B8B9A] font-medium uppercase tracking-wider">
          AI Insights
        </h3>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-4 bg-[#1E1E2A] rounded animate-pulse" style={{ width: `${80 - i * 10}%` }} />
          ))}
        </div>
      )}

      {!loading && !insight && (
        <div className="py-6 text-center">
          <Sparkles size={24} className="text-[#2A2A38] mx-auto mb-2" />
          <p className="text-sm text-[#8B8B9A]">
            Instala el tracker para recibir insights personalizados
          </p>
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
                    <div className="w-5 h-5 rounded-full bg-[#6366F115] text-[#6366F1] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
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
