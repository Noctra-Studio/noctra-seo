'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';

type CellValue = '✓' | '✗' | 'Parcial';

const TABLE_DATA: CellValue[][] = [
  ['✗', '✗', '✓'],
  ['✗', '✗', '✓'],
  ['✗', '✗', '✓'],
  ['✗', '✗', '✓'],
  ['✗', '✗', '✓'],
  ['✗', 'Parcial', '✓'],
  ['✗', '✓', '✓'],
  ['✗', '✗', '✓'],
  ['✗', '✗', '✓'],
  ['✗', '✗', '✓'],
];

const cellStyle = (v: CellValue) => ({
  '✓': { color: '#4ade80' },
  '✗': { color: 'rgba(255,255,255,0.2)' },
  'Parcial': { color: '#fcd34d' },
}[v]);

export function ComparativaSection() {
  const t = useTranslations('landing.comparativa');
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const rows = t.raw('rows') as string[];
  const heading = t('heading').split('\n');

  return (
    <section id="comparativa" className="max-w-4xl mx-auto px-5" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      <p className="text-xs tracking-widest mb-6 uppercase font-medium" style={{ color: '#10b981', fontFamily: 'var(--font-geist-mono, monospace)' }}>
        {t('label')}
      </p>
      <h2
        className="font-bold mb-4 leading-tight tracking-tighter"
        style={{ fontSize: 'clamp(28px, 4vw, 48px)', color: '#ffffff', letterSpacing: '-0.03em' }}
      >
        {heading.map((line, i) => <span key={i} className="block">{line}</span>)}
      </h2>
      <p className="text-base mb-12 max-w-xl" style={{ color: 'rgba(255,255,255,0.4)' }}>{t('subheading')}</p>

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.5 }}
        className="overflow-x-auto -mx-5 px-5"
      >
        <table className="w-full min-w-[600px]" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th className="text-left pb-4 pr-4 text-sm font-medium w-1/2" style={{ color: 'rgba(255,255,255,0.4)' }}></th>
              {[t('columns.generic'), t('columns.ga'), t('columns.noctra')].map((col, i) => (
                <th
                  key={col}
                  className="pb-4 px-4 text-sm font-medium"
                  style={{
                    color: i === 2 ? '#ffffff' : 'rgba(255,255,255,0.4)',
                    ...(i === 2 ? {
                      background: 'rgba(16,185,129,0.05)',
                      borderLeft: '1px solid rgba(16,185,129,0.2)',
                      borderRight: '1px solid rgba(16,185,129,0.2)',
                      borderTop: '1px solid rgba(16,185,129,0.2)',
                      borderRadius: '12px 12px 0 0',
                    } : {}),
                  }}
                >
                  {i === 2 && (
                    <div className="flex flex-col items-center gap-1 mb-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: '#10b981', color: '#000000' }}>
                        {t('recommended')}
                      </span>
                    </div>
                  )}
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td className="py-3 pr-4 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{row}</td>
                {TABLE_DATA[ri].map((cell, ci) => (
                  <td
                    key={ci}
                    className="py-3 px-4 text-center text-sm font-medium"
                    style={{
                      ...cellStyle(cell),
                      ...(ci === 2 ? {
                        background: 'rgba(16,185,129,0.03)',
                        borderLeft: '1px solid rgba(16,185,129,0.12)',
                        borderRight: '1px solid rgba(16,185,129,0.12)',
                      } : {}),
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td />
              <td />
              <td />
              <td style={{ height: 0, borderLeft: '1px solid rgba(16,185,129,0.2)', borderRight: '1px solid rgba(16,185,129,0.2)', borderBottom: '1px solid rgba(16,185,129,0.2)', borderRadius: '0 0 12px 12px', background: 'rgba(16,185,129,0.03)' }} />
            </tr>
          </tfoot>
        </table>
      </motion.div>
    </section>
  );
}
