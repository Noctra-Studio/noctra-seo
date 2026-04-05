'use client';

import { motion } from 'framer-motion';
import { Zap, Activity, Bell, BarChart2, CheckCircle2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DashboardPreview() {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-12 overflow-hidden bg-[#0A0A0F]">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#10b981]/10 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#6366f1]/10 blur-[120px] rounded-full"
        />
      </div>

      {/* Text Branding Section */}
      <div className="relative z-20 mb-16 text-center w-full max-w-sm px-6">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight leading-tight"
        >
          Effortlessly manage your <span className="text-[#10b981] d-block">search intelligence.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-white/30 text-sm leading-relaxed font-medium"
        >
          Check your SEO health, Core Web Vitals, and AI engine visibility in one unified technical dashboard.
        </motion.p>
      </div>

      {/* Main mockup container */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="relative w-full max-w-4xl aspect-[16/10] bg-[#111118] rounded-3xl border border-white/[0.08] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6)] overflow-hidden flex transform scale-75 md:scale-[0.85] origin-top"
      >
        {/* Sidebar Mockup */}
        <div className="w-[18%] border-r border-white/[0.05] p-4 flex flex-col gap-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-md bg-[#10b981] flex items-center justify-center shrink-0">
              <Zap size={10} className="text-[#050505] fill-current" />
            </div>
            <div className="h-2 w-16 bg-white/10 rounded-full" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-md bg-white/[0.03]" />
                <div className="h-1.5 w-full bg-white/[0.03] rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Content Mockup */}
        <div className="flex-1 p-8 flex flex-col gap-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-40 bg-white/10 rounded-md" />
              <div className="h-2 w-24 bg-white/5 rounded-md" />
            </div>
            <div className="w-24 h-8 bg-[#10b981]/10 border border-[#10b981]/20 rounded-full" />
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { icon: Activity, label: 'SEO Score', value: '92/100', color: '#10b981' },
              { icon: Zap, label: 'P75 LCP', value: '1.2s', color: '#10b981' },
              { icon: Shield, label: 'GEO Visibility', value: '84%', color: '#10b981' },
            ].map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl space-y-3"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${m.color}15`, color: m.color }}>
                  <m.icon size={16} />
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold">{m.label}</div>
                  <div className="text-xl font-bold text-white tracking-tight">{m.value}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Main Chart Section */}
          <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="h-3 w-32 bg-white/10 rounded-md" />
              <div className="flex gap-2">
                {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-white/10" />)}
              </div>
            </div>
            <div className="flex-1 flex items-end gap-2 px-2 pb-2">
              {[40, 60, 45, 80, 55, 90, 70, 85, 45, 60, 75, 95, 65, 80].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 1.5, delay: 1 + i * 0.05, ease: 'easeOut' }}
                  className="flex-1 bg-[#10b981]/20 rounded-t-sm relative group"
                >
                  <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                    className="absolute inset-0 bg-[#10b981]/40 rounded-t-sm"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Alerta Component */}
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [2, 1, 2],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-12 right-12 w-64 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-5 rounded-2xl shadow-2xl flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Critical Alert</span>
            </div>
            <span className="text-[10px] text-white/30">Just now</span>
          </div>
          <div className="text-xs font-bold text-white tracking-tight leading-relaxed">
            Layout shift detected on /blog-post-01
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <div className="w-5 h-5 rounded-full bg-[#10b981]/20 flex items-center justify-center shrink-0">
              <Zap size={10} className="text-[#10b981]" />
            </div>
            <span className="text-[9px] text-[#10b981] font-bold uppercase tracking-wider">Claude is analyzing...</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Branded Label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-12 text-center"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20">
          Search Intelligence Dashboard — v2.0
        </p>
      </motion.div>
    </div>
  );
}
