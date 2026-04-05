'use client';

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

const CHANNELS = [
  { key: 'organic_search', label: 'Orgánico', color: '#6366F1' },
  { key: 'direct', label: 'Directo', color: '#10B981' },
  { key: 'referral', label: 'Referral', color: '#F59E0B' },
  { key: 'social', label: 'Social', color: '#EC4899' },
  { key: 'paid_search', label: 'Pagado', color: '#8B5CF6' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#14141C] border border-[#1E1E2A] rounded-lg p-3 shadow-xl">
      <p className="text-xs text-[#8B8B9A] mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-[#8B8B9A]">{entry.name}:</span>
          <span className="font-mono font-medium text-[#F1F1F5]">{entry.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export function TrafficChart({ data }: TrafficChartProps) {
  return (
    <div className="bg-[#14141C] border border-[#1E1E2A] rounded-xl p-5">
      <h3 className="text-xs text-[#8B8B9A] font-medium uppercase tracking-wider mb-4">
        Tráfico por canal
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            {CHANNELS.map(({ key, color }) => (
              <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2A" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#8B8B9A', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: '#8B8B9A', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {CHANNELS.map(({ key, label, color }) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={label}
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#grad-${key})`}
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
