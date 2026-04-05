'use client';

interface ScoreGaugeProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
}

export function ScoreGauge({ score, size = 80, strokeWidth = 6 }: ScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Only draw 270 degrees (3/4 of circle)
  const arcLength = circumference * 0.75;
  const offset = arcLength - (score / 100) * arcLength;

  const color =
    score >= 80 ? '#10B981' :
    score >= 60 ? '#F59E0B' :
    '#EF4444';

  return (
    <svg width={size} height={size} className="-rotate-[135deg]">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#1E1E2A"
        strokeWidth={strokeWidth}
        strokeDasharray={`${arcLength} ${circumference}`}
        strokeLinecap="round"
      />
      {/* Value */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${arcLength} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}
