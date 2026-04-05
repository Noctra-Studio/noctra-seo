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
    <div className="glass-premium p-7 hover:border-[#10B98130] transition-all shadow-2xl relative overflow-hidden group rounded-2xl h-full flex flex-col">
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#10B981]/5 blur-[80px] rounded-full -mr-24 -mt-24 pointer-events-none group-hover:bg-[#10B981]/10 transition-colors" />
      
      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className="p-2.5 bg-[#10B98108] rounded-xl group-hover:bg-[#10B98115] transition-all border border-[#10B98115] shadow-[0_0_15px_#10B98110] emerald-glow">
          <Sparkles size={18} className="text-[#10B981]" />
        </div>
        <h3 className="text-[10px] text-[#8B8B9A] font-black uppercase tracking-[0.2em] opacity-70 group-hover:opacity-100 transition-all font-display">
          AI Diagnostic Intelligence
        </h3>
      </div>

      {loading && (
        <div className="space-y-5 relative z-10">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-3 bg-white/[0.02] rounded-full overflow-hidden relative">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#10B98110] to-transparent animate-shimmer" 
                style={{ width: '40%', animationDuration: `${1.5 + i * 0.2}s` }} 
              />
            </div>
          ))}
        </div>
      )}

      {!loading && !insight && (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center relative z-10 space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-[#10B981]/10 blur-3xl rounded-full scale-150 animate-pulse" />
            <div className="p-6 bg-[#10B98105] border border-[#10B98115] rounded-3xl relative squircle flex items-center justify-center shadow-[0_0_40px_#10B98108]">
              <Sparkles size={40} className="text-[#10B981] opacity-60" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-black text-[#F1F1F5] font-display tracking-tight">Intelligence Pending</p>
            <p className="text-[11px] text-[#8B8B9A] max-w-[260px] mx-auto leading-relaxed font-medium opacity-60 uppercase tracking-widest">
              Activate the Noctra Edge Network to enable real-time neural diagnostics.
            </p>
          </div>
          <button className="text-[10px] font-black text-[#10B981] pt-4 hover:scale-105 transition-transform uppercase tracking-[0.2em] bg-[#10B98108] px-4 py-2 rounded-lg border border-[#10B98120]">
            System Setup Guide
          </button>
        </div>
      )}

      {!loading && insight && (
        <div className="space-y-6 relative z-10 flex-1">
          {insight.summary && (
            <p className="text-sm text-[#C5C5D0] leading-relaxed font-medium italic opacity-90 border-l-2 border-[#10B98130] pl-4 py-1">
              "{insight.summary}"
            </p>
          )}

          {insight.actions && insight.actions.length > 0 && (
            <div className="space-y-3">
              {insight.actions.slice(0, 3).map((action, i) => {
                const effort = effortConfig[action.effort] ?? effortConfig.medium;
                return (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-[#10B98140] transition-all group/action">
                    <div className="w-6 h-6 rounded-lg bg-[#10B98110] border border-[#10B98120] text-[#10B981] text-[10px] font-black font-mono flex items-center justify-center shrink-0 shadow-sm">
                      {action.step}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-xs text-[#F1F1F5] leading-relaxed font-semibold group-hover/action:text-[#10B981] transition-colors">
                        {action.instruction}
                      </p>
                    </div>
                    <div className={cn('text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest shrink-0 border mt-1 shadow-sm transition-colors', 
                      action.effort === 'low' ? 'bg-[#10B98110] border-[#10B98130] text-[#10B981]' :
                      action.effort === 'medium' ? 'bg-[#F59E0B10] border-[#F59E0B30] text-[#F59E0B]' :
                      'bg-white/[0.05] border-white/[0.1] text-[#8B8B9A]'
                    )}>
                      {effort.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edge gradient for glass effect depth */}
      <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
    </div>
  );
}
