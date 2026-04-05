'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OnboardingStepProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  loading?: boolean;
}

export function OnboardingStep({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onNext,
  onBack,
  nextLabel = 'Siguiente',
  loading = false,
}: OnboardingStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-lg mx-auto"
    >
      {/* Progress */}
      <div className="flex items-center gap-1.5 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 rounded-full transition-all duration-300',
              i < step ? 'bg-[#6366F1]' : i === step - 1 ? 'bg-[#6366F1]' : 'bg-[#1E1E2A]',
              i === step - 1 ? 'flex-[2]' : 'flex-1'
            )}
          />
        ))}
      </div>

      <div className="mb-1 text-xs text-[#8B8B9A]">Paso {step} de {totalSteps}</div>
      <h1 className="text-2xl font-semibold text-[#F1F1F5] mb-1">{title}</h1>
      {subtitle && <p className="text-sm text-[#8B8B9A] mb-8">{subtitle}</p>}
      {!subtitle && <div className="mb-6" />}

      <div className="space-y-4">
        {children}
      </div>

      <div className="flex gap-3 mt-8">
        {onBack && (
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-lg text-sm text-[#8B8B9A] hover:text-[#F1F1F5] hover:bg-[#1A1A24] transition-colors border border-[#1E1E2A]"
          >
            Atrás
          </button>
        )}
        <button
          onClick={onNext}
          disabled={loading}
          className="flex-1 px-5 py-2.5 rounded-lg text-sm font-medium bg-[#6366F1] text-white hover:bg-[#4F52D4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando...' : nextLabel}
        </button>
      </div>
    </motion.div>
  );
}
