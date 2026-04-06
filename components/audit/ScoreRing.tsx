'use client'

import { useEffect, useRef } from 'react'

interface ScoreRingProps {
  score:   number
  size?:   number
  label?:  string
  stroke?: number
}

function scoreColor(score: number): string {
  if (score >= 80) return '#10B981'
  if (score >= 50) return '#F59E0B'
  return '#EF4444'
}

export function ScoreRing({ score, size = 120, label, stroke = 8 }: ScoreRingProps) {
  const circleRef = useRef<SVGCircleElement>(null)
  const clampedScore = Math.max(0, Math.min(100, score))
  const color = scoreColor(clampedScore)

  const center = size / 2
  const radius = center - stroke - 2
  const circumference = 2 * Math.PI * radius

  useEffect(() => {
    const el = circleRef.current
    if (!el) return
    // Start at 0, animate to target
    el.style.strokeDashoffset = String(circumference)
    const target = circumference - (clampedScore / 100) * circumference
    // rAF to trigger the CSS transition after paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.strokeDashoffset = String(target)
      })
    })
  }, [clampedScore, circumference])

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
        aria-label={`Score: ${clampedScore}`}
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1E1E2A"
          strokeWidth={stroke}
        />
        {/* Animated foreground */}
        <circle
          ref={circleRef}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
        {/* Score number — counter-rotate to keep it upright */}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            transform: `rotate(90deg)`,
            transformOrigin: `${center}px ${center}px`,
            fill: color,
            fontSize: size * 0.22,
            fontWeight: 800,
            fontFamily: 'var(--font-satoshi, sans-serif)',
          }}
        >
          {clampedScore}
        </text>
      </svg>
      {label && (
        <span className="text-xs font-bold uppercase tracking-widest text-[#8B8B9A]">
          {label}
        </span>
      )}
    </div>
  )
}
