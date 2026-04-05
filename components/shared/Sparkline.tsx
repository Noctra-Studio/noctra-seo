'use client';

import { ResponsiveContainer, LineChart, Line } from 'recharts';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color = '#6366F1', height = 32 }: SparklineProps) {
  const chartData = data.map((value, i) => ({ i, value }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
