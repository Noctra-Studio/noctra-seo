'use client';

import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  Sparkles,
  Zap,
  Shield,
  Search,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useLocale } from 'next-intl';

interface QuickReportProps {
  data: {
    url: string;
    score_overall: number;
    groupScores: Record<string, number>;
    results: any[];
  };
}

export function QuickReport({ data }: QuickReportProps) {
  const locale = useLocale();
  
  // Get top 3 critical issues (fail or warn)
  const keyFindings = data.results
    .filter(r => r.status === 'fail' || r.status === 'warn')
    .slice(0, 3);

  const scoreColor = data.score_overall > 80 
    ? '#10b981' 
    : data.score_overall > 50 
      ? '#f59e0b' 
      : '#ef4444';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto space-y-8"
    >
      {/* Header Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Score Ring */}
        <div className="flex flex-col items-center gap-2 p-8 rounded-3xl bg-white/[0.03] border border-white/[0.05]">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-white/[0.05]"
              />
              <motion.circle
                initial={{ strokeDasharray: '0 365' }}
                animate={{ strokeDasharray: `${(data.score_overall / 100) * 365} 365` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                cx="64"
                cy="64"
                r="58"
                fill="none"
                stroke={scoreColor}
                strokeWidth="8"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-4xl font-bold font-mono tracking-tighter" style={{ color: scoreColor }}>
              {data.score_overall}
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Technical Health</span>
        </div>

        {/* URL and Status Tags */}
        <div className="md:col-span-2 space-y-4 text-left">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold tracking-tight truncate max-w-[300px]">{data.url}</h3>
            <div className="px-3 py-1 rounded-full bg-[#10b98110] border border-[#10b98130] text-[#10b981] text-[9px] uppercase font-bold tracking-widest">
              Live Probe Successful
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
             <ScoreBadge label="SEO" score={data.groupScores.seo || 0} icon={Search} />
             <ScoreBadge label="DNS" score={data.groupScores.dns || 0} icon={Globe} />
             <ScoreBadge label="Security" score={data.groupScores.security || 0} icon={Shield} />
             <ScoreBadge label="Stack" score={data.groupScores.tech || 0} icon={Zap} />
          </div>
        </div>
      </div>

      {/* Key Findings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Sparkles size={14} className="text-[#10b981]" />
          <h4 className="text-xs uppercase font-bold tracking-widest text-white/60">AI Diagnostic Summary</h4>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {keyFindings.map((finding, idx) => (
            <motion.div
              key={finding.check_key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-colors group"
            >
              <div className="mt-0.5">
                {finding.status === 'fail' ? <XCircle size={18} className="text-red-500" /> : <AlertTriangle size={18} className="text-amber-500" />}
              </div>
              <div className="flex-1 space-y-1 text-left">
                <div className="text-sm font-bold text-white/90">{finding.label || finding.check_key}</div>
                <p className="text-xs text-white/50 leading-relaxed font-mono">
                  {finding.summary}
                </p>
              </div>
            </motion.div>
          ))}
          
          {/* Missing Results Blocker */}
          <div className="relative group overflow-hidden">
            <div className="p-5 rounded-2xl bg-white/[0.01] border border-dashed border-white/10 flex items-center justify-between blur-[2px] opacity-40 select-none">
              <div className="flex items-start gap-4">
                <div className="mt-0.5"><CheckCircle2 size={18} /></div>
                <div className="space-y-1 text-left">
                   <div className="h-4 w-32 bg-white/20 rounded"></div>
                   <div className="h-3 w-64 bg-white/10 rounded"></div>
                </div>
              </div>
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               <span className="text-[10px] font-bold uppercase tracking-widest bg-black/80 px-4 py-2 rounded-full border border-white/10">
                 +15 more checks hidden in preview
               </span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-[#10b98115] to-transparent border border-[#10b98130] space-y-6 text-center">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight">Obtén el análisis completo</h3>
          <p className="text-white/60 text-sm max-w-lg mx-auto leading-relaxed">
            Hemos detectado problemas que impactan tu visibilidad. Crea una cuenta gratuita para ver la auditoría profunda con 19 checks, rendimiento Web Vitals y monitoreo 24/7.
          </p>
        </div>

        <Link
          href={`/register?url=${encodeURIComponent(data.url)}`}
          className="inline-flex items-center gap-3 px-8 py-4 bg-[#ffffff] text-black font-bold uppercase tracking-widest text-xs rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)]"
        >
          Create Free Account
          <ArrowRight size={16} />
        </Link>
      </div>
    </motion.div>
  );
}

function ScoreBadge({ label, score, icon: Icon }: { label: string; score: number; icon: any }) {
  const color = score > 80 ? '#10b981' : score > 50 ? '#f59e0b' : '#ef4444';
  
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
      <div className="p-2 rounded-lg bg-white/[0.03]" style={{ color }}>
         <Icon size={14} />
      </div>
      <div className="flex-1">
        <div className="text-[9px] uppercase font-bold tracking-widest text-white/40">{label}</div>
        <div className="text-sm font-bold font-mono" style={{ color }}>{score}</div>
      </div>
    </div>
  );
}
