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
    <div className="w-full max-w-[440px] px-8 md:px-12 py-12 flex flex-col justify-center">
      {/* Header section with Logo and Title */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10 text-left"
      >
        <Link href="/" className="inline-flex items-center gap-3 mb-10 group">
          <Image src="/noctra-navbar-dark.svg" alt="Noctra" width={110} height={30} className="h-6 w-auto transition-transform group-hover:scale-105" priority />
          <span className="font-mono text-[10px] border-l border-white/20 pl-3 uppercase tracking-[0.4em] font-bold text-[#10b981]">
            SEO
          </span>
        </Link>
        <h1 className="text-4xl font-bold tracking-tight text-white mb-4 leading-tight">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-sm text-white/40 leading-relaxed max-w-[320px]">
          {isLogin 
            ? 'Enter your email and password to access your search intelligence dashboard.' 
            : 'Join Noctra SEO and start understanding your search visibility today.'}
        </p>
      </motion.div>

      {/* Auth form */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">
                {t('fullName')}
              </label>
              <div className="relative group">
                <input
                  required
                  name="fullName"
                  type="text"
                  placeholder="Manuel Matus"
                  className="w-full h-14 bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-[#10b981]/50 focus:bg-white/[0.06] transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">
              {t('email')}
            </label>
            <div className="relative group">
              <input
                required
                name="email"
                type="email"
                placeholder="hola@noctra.studio"
                className="w-full h-14 bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-[#10b981]/50 focus:bg-white/[0.06] transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">
              {t('password')}
            </label>
            <div className="relative group">
              <input
                required
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full h-14 bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-[#10b981]/50 focus:bg-white/[0.06] transition-all"
              />
            </div>
          </div>

          {/* Remember me and Forgot password hooks */}
          <div className="flex items-center justify-between px-1">
            {isLogin && (
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="w-4 h-4 rounded border border-white/20 bg-white/5 flex items-center justify-center transition-colors group-hover:border-white/40">
                  <input type="checkbox" className="hidden" />
                  <div className="w-2 h-2 rounded-sm bg-[#10b981] opacity-0 transition-opacity" />
                </div>
                <span className="text-[11px] text-white/40 group-hover:text-white/60 transition-colors tracking-wide">Remember Me</span>
              </label>
            )}
            <Link href="#" className="text-[11px] font-bold text-[#10b981] hover:text-[#10b981]/80 transition-colors uppercase tracking-widest">
              {t('forgotPassword')}
            </Link>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs"
            >
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-white text-black rounded-2xl font-bold text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                {isLogin ? 'Log In' : 'Sign Up'}
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Social Login Section */}
        <div className="mt-8 space-y-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center px-4">
              <div className="w-full border-t border-white/[0.06]"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-[0.3em]">
              <span className="bg-[#050505] px-4 text-white/20">or login with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center h-12 bg-white/[0.03] border border-white/[0.08] rounded-2xl gap-3 text-[11px] font-bold text-white hover:bg-white/[0.06] transition-all">
              <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={16} height={16} />
              Google
            </button>
            <button className="flex items-center justify-center h-12 bg-white/[0.03] border border-white/[0.08] rounded-2xl gap-3 text-[11px] font-bold text-white hover:bg-white/[0.06] transition-all">
              <Image src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple" width={16} height={16} className="invert" />
              Apple
            </button>
          </div>
        </div>

        {/* Footer Toggle */}
        <div className="mt-10 pt-10 border-t border-white/[0.06] text-center">
          <p className="text-sm text-white/30">
            {isLogin ? "Don't Have An Account?" : "Already Have An Account?"}{' '}
            <Link
              href={isLogin ? `/${locale}/register` : `/${locale}/login`}
              className="text-[#10b981] font-bold uppercase tracking-widest text-[11px] hover:underline"
            >
              {isLogin ? 'Register Now' : 'Log In'}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
