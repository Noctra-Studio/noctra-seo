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

  const allGood = vitals.every(v => v.value !== null && getStatus(v.value, v.goodMax, v.poorMin) === 'good');
  const hasPoor = vitals.some(v => v.value !== null && getStatus(v.value, v.goodMax, v.poorMin) === 'poor');
  const hasData = vitals.some(v => v.value !== null);

  return (
    <div className="bg-[#14141C] border border-white/[0.05] rounded-2xl p-7 flex flex-col gap-6 hover:border-[#10B98150] transition-all cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-3xl group">
      <div className="flex items-start justify-between">
        <span className="text-xs text-[#8B8B9A] font-bold uppercase tracking-widest">Core Web Vitals</span>
        <span className={cn(
          'text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider',
          !hasData ? 'text-[#8B8B9A] bg-white/5' :
          allGood ? 'text-[#10B981] bg-[#10B98115]' :
          hasPoor ? 'text-[#EF4444] bg-[#EF444415]' :
          'text-[#F59E0B] bg-[#F59E0B15]'
        )}>
          {!hasData ? 'Sin datos' : allGood ? 'Pasa' : hasPoor ? 'Falla' : 'Aviso'}
        </span>
      </div>

      <div className="space-y-4">
        {vitals.map(({ name, value, unit, goodMax, poorMin }) => {
          const status = getStatus(value, goodMax, poorMin);
          const cfg = statusConfig[status];
          const displayValue = value !== null
            ? name === 'CLS'
              ? value.toFixed(3)
              : `${(value / (unit === 'ms' ? 1000 : 1)).toFixed(unit === 'ms' ? 1 : 3)}${unit === 'ms' ? 's' : ''}`
            : '—';

          return (
            <div key={name} className="flex items-center justify-between group/vital">
              <div className="flex items-center gap-3">
                <div className={cn('w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]', cfg.dot)} />
                <span className="text-sm font-bold text-[#8B8B9A]">{name}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={cn('text-lg font-mono font-bold', cfg.color)}>
                  {displayValue}
                </span>
                <span className="text-[10px] font-bold text-[#8B8B9A] uppercase opacity-0 group-hover/vital:opacity-100 transition-opacity">
                  {cfg.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
