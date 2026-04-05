'use client';

import { ScoreGauge } from '@/components/shared/ScoreGauge';
import { Sparkline } from '@/components/shared/Sparkline';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ScoreCardProps {
  title: string;
  score: number;
  trend?: number;
  sparklineData?: number[];
  showGauge?: boolean;
  badge?: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export function ScoreCard({ title, score, trend, sparklineData, showGauge = false, badge, subtitle, className }: ScoreCardProps) {
  const color =
    score >= 80 ? '#10B981' :
    score >= 60 ? '#F59E0B' :
    '#EF4444';

  const isPositive = trend && trend > 0;

  return (
    <div className={cn("glass-premium p-7 flex flex-col gap-6 hover:border-[#10B98150] transition-all cursor-pointer shadow-2xl group relative overflow-hidden rounded-2xl", className)}>
      <div className="flex items-start justify-between z-10">
        <span className="text-[10px] text-[#8B8B9A] font-black uppercase tracking-[0.15em] opacity-70 group-hover:opacity-100 transition-opacity">
          {title}
        </span>
        {badge}
      </div>

      <div className="flex items-center gap-6 z-10">
        {showGauge && (
          <div className="relative group-hover:scale-110 transition-transform duration-500 ease-in-out">
            <div className="absolute inset-0 bg-[#10B98105] blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
            <ScoreGauge score={score} size={84} strokeWidth={8} />
            <span
              className="absolute inset-0 flex items-center justify-center font-display font-black text-2xl tracking-tighter"
              style={{ color }}
            >
              {score}
            </span>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-3">
            <span
              className="font-display font-black text-4xl md:text-5xl tracking-tighter transition-all"
              style={{ color: showGauge ? '#F1F1F5' : color }}
            >
              {score.toLocaleString()}
            </span>
            {trend !== undefined && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest shadow-sm",
                isPositive ? "bg-[#10B98115] text-[#10B981] border border-[#10B98120]" : "bg-[#EF444415] text-[#EF4444] border border-[#EF444420]"
              )}>
                {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
              </motion.div>
            )}
          </div>
          {subtitle && (
            <span className="text-[10px] font-bold text-[#8B8B9A] uppercase tracking-widest opacity-60">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {sparklineData && sparklineData.length > 0 && (
        <div className="h-10 mt-auto pt-2 z-10 opacity-60 group-hover:opacity-100 transition-opacity">
          <Sparkline data={sparklineData} color={color} />
        </div>
      )}

      {/* Subtle background glow */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/[0.02] blur-3xl rounded-full group-hover:bg-[#10B98105] transition-colors" />
    </div>
  );
}
