import { getScoreLabel } from '@/lib/seo/issue-detector';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface PageRow {
  path: string;
  visits: number;
  seo_score: number;
}

interface TopPagesProps {
  pages: PageRow[];
}

export function TopPages({ pages }: TopPagesProps) {
  const t = useTranslations('dashboard.topPages');
  const hasData = pages && pages.length > 0;

  return (
    <div className="glass-premium p-7 hover:border-[#10B98150] transition-all shadow-2xl h-full flex flex-col group rounded-2xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-8 z-10">
        <h3 className="text-[10px] text-[#8B8B9A] font-black uppercase tracking-[0.2em] opacity-70 group-hover:opacity-100 transition-all font-display">
          {t('title')}
        </h3>
        {hasData && (
          <span className="text-[9px] font-black text-[#8B8B9A] uppercase tracking-[0.15em] opacity-40">
            {t('analytics')}
          </span>
        )}
      </div>

      <div className="space-y-1 flex-1 z-10">
        {pages.map((page) => {
          const { label, color } = getScoreLabel(page.seo_score);
          return (
            <div 
              key={page.path} 
              className="flex items-center gap-4 py-3 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.04] rounded-xl px-3 transition-all -mx-3 group/row cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <span className="text-xs text-[#F1F1F5] truncate font-medium block group-hover/row:text-[#10B981] transition-colors font-mono">
                  {page.path}
                </span>
              </div>
              
              <div className="flex items-center gap-5">
                <span className="text-[11px] font-black text-[#8B8B9A]/60 font-mono tracking-tighter">
                  {page.visits.toLocaleString()}
                </span>
                <div
                  className={cn(
                    'text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-[0.1em] min-w-[36px] text-center border transition-all',
                    color === 'green' ? 'bg-[#10B98108] border-[#10B98140] text-[#10B981] shadow-[0_0_10px_#10B98120]' :
                    color === 'yellow' ? 'bg-[#F59E0B08] border-[#F59E0B40] text-[#F59E0B]' :
                    'bg-[#EF444408] border-[#EF444440] text-[#EF4444]'
                  )}
                >
                  {page.seo_score}
                </div>
              </div>
            </div>
          );
        })}

        {!hasData && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-4 opacity-40 group-hover:opacity-100 transition-opacity">
            <div className="p-4 bg-white/[0.02] rounded-full border border-white/[0.05] squircle">
              <span className="text-2xl">📄</span>
            </div>
            <p className="text-[10px] text-[#8B8B9A] font-black uppercase tracking-[0.15em] text-center max-w-[180px] leading-relaxed">
              {t('empty')}
            </p>
          </div>
        )}
      </div>

      {/* Decorative gradient */}
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/[0.01] blur-3xl rounded-full" />
    </div>
  );
}
