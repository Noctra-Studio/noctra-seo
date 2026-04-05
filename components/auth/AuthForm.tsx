'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthFormProps {
  type: 'login' | 'register';
  locale: string;
  onSubmit: (formData: FormData) => Promise<{ error?: string } | void>;
}

export function AuthForm({ type, locale, onSubmit }: AuthFormProps) {
  const t = useTranslations('auth');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLogin = type === 'login';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await onSubmit(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-10"
      >
        <Link href="/" className="inline-flex items-center gap-3 mb-8 group">
          <Image src="/noctra-navbar-dark.svg" alt="Noctra" width={120} height={32} className="h-7 w-auto transition-transform group-hover:scale-105" priority />
          <span className="font-mono text-[11px] border-l border-white/20 pl-3 uppercase tracking-[0.4em] font-bold text-[#10b981]">
            SEO
          </span>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-3">
          {isLogin ? t('welcomeBack') : t('createAccount')}
        </h1>
        <p className="text-sm text-white/40">
          {isLogin ? t('noAccount') : t('alreadyAccount')}{' '}
          <Link
            href={isLogin ? `/${locale}/register` : `/${locale}/login`}
            className="text-[#10b981] font-bold hover:text-[#10b981]/80 transition-colors"
          >
            {isLogin ? t('register') : t('login')}
          </Link>
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-4">
                {t('fullName')}
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#10b981] transition-colors">
                  <User size={16} />
                </div>
                <input
                  required
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  className="w-full h-12 bg-white/[0.03] border border-white/[0.06] rounded-2xl pl-11 pr-4 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-[#10b981]/50 focus:bg-white/[0.05] transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-4">
              {t('email')}
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#10b981] transition-colors">
                <Mail size={16} />
              </div>
              <input
                required
                name="email"
                type="email"
                placeholder="hola@noctra.studio"
                className="w-full h-12 bg-white/[0.03] border border-white/[0.06] rounded-2xl pl-11 pr-4 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-[#10b981]/50 focus:bg-white/[0.05] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-4 mr-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                {t('password')}
              </label>
              {isLogin && (
                <Link href="#" className="text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors">
                  {t('forgotPassword')}
                </Link>
              )}
            </div>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#10b981] transition-colors">
                <Lock size={16} />
              </div>
              <input
                required
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full h-12 bg-white/[0.03] border border-white/[0.06] rounded-2xl pl-11 pr-4 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-[#10b981]/50 focus:bg-white/[0.05] transition-all"
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-medium"
            >
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-white text-black rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {isLogin ? t('signIn') : t('signUp')}
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/[0.05] text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/10">
            Powered by Noctra Studio
          </p>
        </div>
      </motion.div>
    </div>
  );
}
