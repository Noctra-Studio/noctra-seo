'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Search, Globe, Shield, Zap, Layers, BadgeCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface CheckGroup {
  icon: LucideIcon;
  name: string;
  description: string;
  checks: number;
  keys: string[];
  soon?: boolean;
}

const GROUPS: CheckGroup[] = [
  {
    icon: Search,
    name: 'SEO',
    description: 'Crawlability, indexation and search engine visibility.',
    checks: 4,
    keys: ['robots.txt', 'Sitemap XML', 'Redirect chain', 'Social tags'],
  },
  {
    icon: Globe,
    name: 'DNS & Network',
    description: 'Domain configuration, propagation and resolution.',
    checks: 3,
    keys: ['DNS records', 'DNSSEC', 'IP Info'],
  },
  {
    icon: Shield,
    name: 'Security',
    description: 'TLS, HTTP headers and security policies.',
    checks: 4,
    keys: ['SSL chain', 'HTTP headers', 'HSTS', 'Security headers'],
  },
  {
    icon: Zap,
    name: 'Performance',
    description: 'Response time, HTTP compression and caching policy.',
    checks: 3,
    keys: ['TTFB', 'Compression', 'Cache Headers'],
  },
  {
    icon: Layers,
    name: 'Tech Stack',
    description: 'Detected frameworks, CMS, analytics and libraries.',
    checks: 2,
    keys: ['WHOIS', 'Tech fingerprint'],
  },
  {
    icon: BadgeCheck,
    name: 'Reputation',
    description: 'Email authentication, blocklists and domain age.',
    checks: 3,
    keys: ['SPF & DMARC', 'DNS Blacklist', 'Domain Age'],
  },
];

function GroupCard({ group, index }: { group: CheckGroup & { soon?: boolean }; index: number }) {
  const { icon: Icon, name, description, checks, keys, soon } = group;
  const col = index % 2;
  const row = Math.floor(index / 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: col * 0.08 + row * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="group p-8 rounded-3xl cursor-default transition-all duration-300"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)';
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
      }}
    >
      {/* Icon */}
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-105"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Icon size={18} color="rgba(255,255,255,0.7)" strokeWidth={1.5} />
      </div>

      {/* Name + badge */}
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-bold text-[15px] tracking-tight text-white">{name}</h3>
        {soon && (
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest"
            style={{ background: 'rgba(252,211,77,0.15)', color: '#fcd34d', border: '1px solid rgba(252,211,77,0.2)' }}
          >
            Pronto
          </span>
        )}
      </div>

      <p
        className="text-[13px] leading-relaxed mb-5 transition-colors group-hover:text-white/60"
        style={{ color: 'rgba(255,255,255,0.35)' }}
      >
        {description}
      </p>

      {/* Check keys */}
      <div className="flex flex-wrap gap-1.5">
        {keys.map(key => (
          <span
            key={key}
            className="text-[10px] font-mono px-2 py-1 rounded-lg"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            {key}
          </span>
        ))}
      </div>

      {/* Check count */}
      <div
        className="mt-5 pt-4 flex items-center"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <span
          className="text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-geist-mono, monospace)' }}
        >
          {checks} checks included
        </span>
      </div>
    </motion.div>
  );
}

export function ChecksGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      id="que-analiza"
      className="max-w-6xl mx-auto px-5"
      style={{ paddingTop: '120px', paddingBottom: '120px' }}
    >
      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="text-[10px] font-bold uppercase tracking-[0.25em] mb-6"
        style={{ color: '#10b981', fontFamily: 'var(--font-geist-mono, monospace)' }}
        ref={ref}
      >
        19 CHECKS · 6 CATEGORIES
      </motion.p>

      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="font-bold mb-16 leading-tight tracking-tighter max-w-2xl"
        style={{ fontSize: 'clamp(28px, 4vw, 48px)', color: '#ffffff', letterSpacing: '-0.03em' }}
      >
        A complete technical analysis,
        <br />
        <span style={{ color: 'rgba(255,255,255,0.35)' }}>not a generic checklist.</span>
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {GROUPS.map((group, i) => (
          <GroupCard key={group.name} group={group} index={i} />
        ))}
      </div>
    </section>
  );
}
