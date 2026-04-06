'use client';

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTranslations } from 'next-intl';

interface TrafficDataPoint {
  date: string;
  organic_search?: number;
  direct?: number;
  referral?: number;
  social?: number;
  paid_search?: number;
}

interface TrafficChartProps {
  data: TrafficDataPoint[];
}

// Removed hardcoded channels array from global scope to use translations inside component

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111118]/90 border border-white/[0.08] rounded-xl p-4 shadow-2xl backdrop-blur-md">
      <p className="text-[10px] font-bold text-[#8B8B9A] mb-3 uppercase tracking-widest">{label}</p>
      <div className="space-y-2">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-8 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ background: entry.color }} />
              <span className="text-[#8B8B9A] font-medium">{entry.name}</span>
            </div>
            <span className="font-mono font-bold text-[#F1F1F5]">{entry.value?.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function TrafficChart({ data }: TrafficChartProps) {
  const t = useTranslations('dashboard.traffic');
  const hasData = data && data.length > 0;

  const CHANNELS = [
    { key: 'organic_search', label: t('channels.organic_search'), color: '#10B981' },
    { key: 'direct', label: t('channels.direct'), color: '#10B981' },
    { key: 'referral', label: t('channels.referral'), color: '#F59E0B' },
    { key: 'social', label: t('channels.social'), color: '#EC4899' },
    { key: 'paid_search', label: t('channels.paid_search'), color: '#8B5CF6' },
  ];

  return (
    <div className="glass-premium p-7 hover:border-[#10B98150] transition-all shadow-2xl group rounded-2xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-8 z-10">
        <h3 className="text-[10px] text-[#8B8B9A] font-black uppercase tracking-[0.2em] opacity-70 group-hover:opacity-100 transition-all font-display">
          {t('title')}
        </h3>
        {hasData && (
          <div className="flex items-center gap-6">
            {CHANNELS.slice(0, 3).map(ch => (
              <div key={ch.key} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ background: ch.color }} />
                <span className="text-[9px] font-black text-[#8B8B9A] uppercase tracking-wider">{ch.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="relative h-[280px] w-full z-10">
        {!hasData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 opacity-50">
            <div className="w-16 h-16 bg-white/[0.02] rounded-full border border-white/[0.05] flex items-center justify-center squircle">
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-[10px] text-[#8B8B9A] font-black uppercase tracking-widest">{t('empty')}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {CHANNELS.map(({ key, color }) => (
                  <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#4B4B5A', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em' }}
                tickLine={false}
                axisLine={false}
                dy={15}
              />
              <YAxis
                tick={{ fill: '#4B4B5A', fontSize: 9, fontWeight: 700 }}
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }} 
              />
              {CHANNELS.map(({ key, label, color }) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={label}
                  stroke={color}
                  strokeWidth={2.5}
                  fill={`url(#grad-${key})`}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0, fill: color, className: 'emerald-glow' }}
                  animationDuration={1500}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Subtle background glow */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/[0.01] blur-3xl rounded-full" />
    </div>
  );
}
