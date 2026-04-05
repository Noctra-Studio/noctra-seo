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
    <div className="bg-[#14141C] border border-[#1E1E2A] rounded-xl p-5 flex flex-col gap-3 hover:border-[#2A2A38] transition-colors">
      <div className="flex items-start justify-between">
        <span className="text-xs text-[#8B8B9A] font-medium uppercase tracking-wider">{title}</span>
        {badge}
      </div>

      <div className="flex items-end gap-4">
        {showGauge && (
          <div className="relative">
            <ScoreGauge score={score} size={72} strokeWidth={5} />
            <span
              className="absolute inset-0 flex items-center justify-center font-mono font-bold text-sm"
              style={{ color }}
            >
              {score}
            </span>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <span
            className="font-mono font-bold text-3xl leading-none"
            style={{ color: showGauge ? undefined : color }}
          >
            {score}
          </span>
          {subtitle && (
            <span className="text-xs text-[#8B8B9A]">{subtitle}</span>
          )}
          {trend !== undefined && (
            <TrendBadge value={trend} />
          )}
        </div>
      </div>

      {sparklineData && sparklineData.length > 0 && (
        <div className="h-8">
          <Sparkline data={sparklineData} color={color} />
        </div>
      )}
    </div>
  );
}
