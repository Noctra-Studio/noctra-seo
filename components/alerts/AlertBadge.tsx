import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertBadgeProps {
  critical: number;
  warning: number;
  className?: string;
}

export function AlertBadge({ critical, warning, className }: AlertBadgeProps) {
  const total = critical + warning;
  if (total === 0) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold font-mono',
        critical > 0
          ? 'bg-[#EF4444] text-white'
          : 'bg-[#F59E0B] text-[#0A0A0F]',
        className
      )}
    >
      {total > 99 ? '99+' : total}
    </span>
  );
}
