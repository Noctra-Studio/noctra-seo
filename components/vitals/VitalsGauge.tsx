'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Info, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VitalConfig {
  id: 'LCP' | 'CLS' | 'INP';
  name: string;
  unit: string;
  goodMax: number;
  poorMin: number;
  description: string;
  importance: string;
}

const VITALS_INFO: Record<'LCP' | 'CLS' | 'INP', { name: string; unit: string; goodMax: number; poorMin: number; desc: string; importance: string }> = {
  LCP: {
    name: 'LCP',
    unit: 's',
    goodMax: 2500,
    poorMin: 4000,
    desc: "Largest Contentful Paint: Mide el tiempo que tarda en cargar el elemento de contenido más grande de la página.",
    importance: "Es clave para la percepción de velocidad del usuario."
  },
  CLS: {
    name: 'CLS',
    unit: '',
    goodMax: 0.1,
    poorMin: 0.25,
    desc: "Cumulative Layout Shift: Mide la estabilidad visual y cuántas veces cambian los elementos de posición inesperadamente.",
    importance: "Evita que los usuarios hagan clic en lugares erróneos por saltos de página."
  },
  INP: {
    name: 'INP',
    unit: 'ms',
    goodMax: 200,
    poorMin: 500,
    desc: "Interaction to Next Paint: Mide la respuesta de la página a las interacciones del usuario (clics, teclas).",
    importance: "Garantiza que la interfaz se sienta fluida y responsiva."
  }
};

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
  unknown: { label: 'Sin datos', color: 'text-[#8B8B9A]', bg: 'bg-white/5', dot: 'bg-[#8B8B9A]' },
};

interface VitalsGaugeProps {
  lcp?: number | null;
  lcpTrend?: number;
  cls?: number | null;
  clsTrend?: number;
  inp?: number | null;
  inpTrend?: number;
  className?: string;
}

export function VitalsGauge({ lcp, lcpTrend, cls, clsTrend, inp, inpTrend, className }: VitalsGaugeProps) {
  const [hoveredVital, setHoveredVital] = useState<string | null>(null);

  const vitals = [
    { ...VITALS_INFO.LCP, value: lcp ?? null, trend: lcpTrend ?? 0 },
    { ...VITALS_INFO.CLS, value: cls ?? null, trend: clsTrend ?? 0 },
    { ...VITALS_INFO.INP, value: inp ?? null, trend: inpTrend ?? 0 },
  ];

  const hasData = vitals.some(v => v.value !== null);

  return (
    <div className={cn("glass-premium p-7 flex flex-col gap-6 hover:border-[#10B98150] transition-all cursor-pointer shadow-2xl group relative rounded-2xl", className)}>
      <div className="flex items-center justify-between z-10">
        <span className="text-[10px] text-[#8B8B9A] font-black uppercase tracking-[0.15em] opacity-70">Core Web Vitals</span>
        {!hasData && (
          <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-[#8B8B9A] uppercase tracking-widest">
            Sin Datos
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 z-10 flex-1 justify-center">
        {vitals.map((v) => {
          const status = getStatus(v.value, v.goodMax, v.poorMin);
          const config = statusConfig[status];

          const displayValue = v.value !== null
            ? v.name === 'CLS'
              ? v.value.toFixed(3)
              : v.name === 'LCP'
                ? `${(v.value / 1000).toFixed(1)}s`
                : `${v.value}${v.unit}`
            : '—';

          return (
            <div 
              key={v.name} 
              className="flex items-center justify-between relative"
              onMouseEnter={() => setHoveredVital(v.name)}
              onMouseLeave={() => setHoveredVital(null)}
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
                <div className="flex items-center gap-1.5 group/info cursor-help">
                  <span className="text-sm font-bold text-[#F1F1F5] font-display">{v.name}</span>
                  <Info size={12} className="text-[#8B8B9A] opacity-40 group-hover/info:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-black text-[#F1F1F5]">
                    {displayValue}
                  </span>
                  {v.value !== null && v.trend !== 0 && (
                    <div className={cn(
                      "flex items-center gap-0.5 text-[10px] font-bold",
                      v.trend > 0 ? "text-[#10B981]" : "text-[#EF4444]"
                    )}>
                      {v.trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {Math.abs(v.trend).toFixed(1)}%
                    </div>
                  )}
                </div>
                <div className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0", config.bg, config.color)}>
                  {config.label}
                </div>
              </div>

              {/* Tooltip */}
              <AnimatePresence>
                {hoveredVital === v.name && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute bottom-full mb-3 left-0 w-64 p-4 bg-[#0A0A0F/95] backdrop-blur-xl z-[100] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 pointer-events-none"
                  >
                    <p className="text-[12px] text-white font-semibold leading-relaxed mb-2">
                      {v.desc}
                    </p>
                    <div className="h-px bg-white/10 w-full mb-2" />
                    <p className="text-[10px] text-[#10B981] font-black uppercase tracking-widest leading-tight">
                      {v.importance}
                    </p>
                    {/* Shadow Arrow */}
                    <div className="absolute -bottom-1 left-6 w-2 h-2 bg-[#0A0A0F/95] rotate-45 border-r border-b border-white/10" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Decorative */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#10B98105] blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
