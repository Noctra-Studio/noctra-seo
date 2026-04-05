import { cn } from '@/lib/utils';

interface VitalConfig {
  name: string;
  value: number | null;
  unit: string;
  goodMax: number;
  poorMin: number;
}

const VITALS: VitalConfig[] = [
  { name: 'LCP', value: null, unit: 'ms', goodMax: 2500, poorMin: 4000 },
  { name: 'CLS', value: null, unit: '', goodMax: 0.1, poorMin: 0.25 },
  { name: 'INP', value: null, unit: 'ms', goodMax: 200, poorMin: 500 },
];

function getStatus(value: number | null, good: number, poor: number): 'good' | 'needs-improvement' | 'poor' | 'unknown' {
  if (value === null) return 'unknown';
  if (value <= good) return 'good';
  if (value < poor) return 'needs-improvement';
  return 'poor';
}

const statusConfig = {
  good: { label: 'Bueno', color: 'text-[#10B981]', bg: 'bg-[#10B98115]', dot: 'bg-[#10B981]' },
  'needs-improvement': { label: 'Mejorable', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B15]', dot: 'bg-[#F59E0B]' },
  poor: { label: 'Pobre', color: 'text-[#EF4444]', bg: 'bg-[#EF444415]', dot: 'bg-[#EF4444]' },
  unknown: { label: 'Sin datos', color: 'text-[#8B8B9A]', bg: 'bg-[#1E1E2A]', dot: 'bg-[#8B8B9A]' },
};

interface VitalsGaugeProps {
  lcp?: number | null;
  cls?: number | null;
  inp?: number | null;
}

export function VitalsGauge({ lcp, cls, inp }: VitalsGaugeProps) {
  const vitals = [
    { ...VITALS[0], value: lcp ?? null },
    { ...VITALS[1], value: cls ?? null },
    { ...VITALS[2], value: inp ?? null },
  ];

  const allGood = vitals.every(v => getStatus(v.value, v.goodMax, v.poorMin) === 'good');
  const hasPoor = vitals.some(v => getStatus(v.value, v.goodMax, v.poorMin) === 'poor');

  return (
    <div className="bg-[#14141C] border border-[#1E1E2A] rounded-xl p-5 flex flex-col gap-3 hover:border-[#2A2A38] transition-colors">
      <div className="flex items-start justify-between">
        <span className="text-xs text-[#8B8B9A] font-medium uppercase tracking-wider">Core Web Vitals</span>
        <span className={cn(
          'text-[10px] font-medium px-2 py-0.5 rounded-full',
          allGood ? 'text-[#10B981] bg-[#10B98115]' :
          hasPoor ? 'text-[#EF4444] bg-[#EF444415]' :
          'text-[#F59E0B] bg-[#F59E0B15]'
        )}>
          {allGood ? 'Pasa Google' : hasPoor ? 'Falla Google' : 'Revisar'}
        </span>
      </div>

      <div className="space-y-2.5">
        {vitals.map(({ name, value, unit, goodMax, poorMin }) => {
          const status = getStatus(value, goodMax, poorMin);
          const cfg = statusConfig[status];
          const displayValue = value !== null
            ? name === 'CLS'
              ? value.toFixed(3)
              : `${Math.round(value)}${unit}`
            : '—';

          return (
            <div key={name} className="flex items-center gap-3">
              <span className="text-xs font-mono font-medium text-[#8B8B9A] w-8">{name}</span>
              <span className={cn('text-sm font-mono font-bold flex-1', cfg.color)}>
                {displayValue}
              </span>
              <div className={cn('w-2 h-2 rounded-full', cfg.dot)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
