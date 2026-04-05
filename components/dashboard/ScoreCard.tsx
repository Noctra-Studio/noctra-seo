'use client';

import { ScoreGauge } from '@/components/shared/ScoreGauge';
import { TrendBadge } from '@/components/shared/TrendBadge';
import { Sparkline } from '@/components/shared/Sparkline';
import { cn } from '@/lib/utils';

interface ScoreCardProps {
  title: string;
  score: number;
  trend?: number;
  sparklineData?: number[];
  showGauge?: boolean;
  badge?: React.ReactNode;
  subtitle?: string;
}

export function ScoreCard({ title, score, trend, sparklineData, showGauge = false, badge, subtitle }: ScoreCardProps) {
  const color =
    score >= 80 ? '#10B981' :
    score >= 60 ? '#F59E0B' :
    '#EF4444';

  return (
    <div className="bg-[#14141C] border border-white/[0.05] rounded-2xl p-7 flex flex-col gap-6 hover:border-[#10B98150] transition-all cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-3xl group">
      <div className="flex items-start justify-between">
        <span className="text-xs text-[#8B8B9A] font-bold uppercase tracking-widest">{title}</span>
        {badge}
      </div>

      <div className="flex items-center gap-6">
        {showGauge && (
          <div className="relative group-hover:scale-105 transition-transform duration-300">
            <ScoreGauge score={score} size={80} strokeWidth={6} />
            <span
              className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xl"
              style={{ color }}
            >
              {score}
            </span>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline gap-2">
            <span
              className="font-mono font-bold text-4xl leading-none"
              style={{ color: showGauge ? '#F1F1F5' : color }}
            >
              {score.toLocaleString()}
            </span>
            {trend !== undefined && (
              <TrendBadge value={trend} />
            )}
          </div>
          {subtitle && (
            <span className="text-sm font-medium text-[#8B8B9A]">{subtitle}</span>
          )}
        </div>
      </div>

      {sparklineData && sparklineData.length > 0 && (
        <div className="h-10 mt-auto pt-2">
          <Sparkline data={sparklineData} color={color} />
        </div>
      )}
    </div>
  );
}
