'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { ArrowRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AuditInputProps {
  size?: 'default' | 'large';
  placeholder?: string;
  buttonLabel?: string;
}

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    if (!u.hostname.includes('.')) return null;
    return u.href;
  } catch {
    return null;
  }
}

export function AuditInput({
  size = 'default',
  placeholder = 'https://example.com',
  buttonLabel = 'Audit',
}: AuditInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const locale = useLocale();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const url = normalizeUrl(value);
    if (!url) {
      setError('Enter a valid domain, e.g. example.com');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const encoded = encodeURIComponent(url);
      if (user) {
        router.push(`/${locale}/dashboard?audit=${encoded}`);
      } else {
        router.push(`/${locale}/login?redirect=/dashboard&url=${encoded}`);
      }
    } catch {
      setLoading(false);
      setError('Something went wrong. Please try again.');
    }
  }

  const isLarge = size === 'large';

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={e => { setValue(e.target.value); setError(''); }}
            placeholder={placeholder}
            disabled={loading}
            className="w-full font-mono outline-none transition-all duration-200 disabled:opacity-50"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: error
                ? '1px solid rgba(248,113,113,0.5)'
                : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '9999px',
              padding: isLarge ? '16px 24px' : '12px 20px',
              fontSize: isLarge ? '15px' : '13px',
              color: '#ffffff',
            }}
            onFocus={e => {
              if (!error) (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.25)';
            }}
            onBlur={e => {
              if (!error) (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-full font-bold uppercase tracking-widest transition-all duration-200 shrink-0 disabled:opacity-60 active:scale-95"
          style={{
            background: '#ffffff',
            color: '#000000',
            padding: isLarge ? '16px 32px' : '12px 24px',
            fontSize: '11px',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            if (!loading) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.85)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = '#ffffff';
          }}
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              {buttonLabel}
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      {error && (
        <p
          className="mt-2 text-xs font-mono pl-5"
          style={{ color: 'rgba(248,113,113,0.9)' }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
