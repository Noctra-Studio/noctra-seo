import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendBadgeProps {
  value: number; // percentage change
  suffix?: string;
  inverse?: boolean; // for metrics where lower is better
}

export function TrendBadge({ value, suffix = '%', inverse = false }: TrendBadgeProps) {
  const isPositive = inverse ? value < 0 : value > 0;
  const isNeutral = value === 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-mono font-medium',
        isNeutral ? 'text-[#8B8B9A]' :
        isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'
      )}
    >
      {isNeutral ? (
        <Minus size={12} />
      ) : isPositive ? (
        <TrendingUp size={12} />
      ) : (
        <TrendingDown size={12} />
      )}
      {value > 0 ? '+' : ''}{value.toFixed(1)}{suffix}
    </span>
  );
}
