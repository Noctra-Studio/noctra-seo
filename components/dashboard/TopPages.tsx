import { getScoreLabel } from '@/lib/seo/issue-detector';
import { cn } from '@/lib/utils';

interface PageRow {
  path: string;
  visits: number;
  seo_score: number;
}

interface TopPagesProps {
  pages: PageRow[];
}

export function TopPages({ pages }: TopPagesProps) {
  const hasData = pages && pages.length > 0;

  return (
    <div className="bg-[#14141C] border border-white/[0.05] rounded-2xl p-7 hover:border-[#10B98150] transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-3xl h-full flex flex-col group">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs text-[#8B8B9A] font-bold uppercase tracking-widest">
          Top páginas
        </h3>
        {hasData && (
          <span className="text-[10px] font-bold text-[#8B8B9A] uppercase tracking-widest opacity-50">
            Visitas
          </span>
        )}
      </div>

      <div className="space-y-1 flex-1">
        {pages.map((page) => {
          const { label, color } = getScoreLabel(page.seo_score);
          return (
            <div 
              key={page.path} 
              className="flex items-center gap-4 py-3 border-b border-white/[0.02] last:border-0 hover:bg-white/[0.02] rounded-xl px-3 transition-all -mx-3 group/row cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <span className="text-sm text-[#F1F1F5] truncate font-mono block group-hover/row:text-[#10B981] transition-colors">
                  {page.path}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono font-bold text-[#8B8B9A]">
                  {page.visits.toLocaleString()}
                </span>
                <div
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider min-w-[32px] text-center',
                    color === 'green' ? 'bg-[#10B98115] text-[#10B981]' :
                    color === 'yellow' ? 'bg-[#F59E0B15] text-[#F59E0B]' :
                    'bg-[#EF444415] text-[#EF4444]'
                  )}
                >
                  {page.seo_score}
                </div>
              </div>
            </div>
          );
        })}

        {!hasData && (
          <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-3 opacity-50 group-hover:opacity-100 transition-opacity">
            <div className="p-3 bg-white/[0.03] rounded-full border border-white/[0.05]">
              <span className="text-xl">📄</span>
            </div>
            <p className="text-xs text-[#8B8B9A] font-bold uppercase tracking-widest text-center max-w-[160px] leading-relaxed">
              Instala el tracker para ver tus páginas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
