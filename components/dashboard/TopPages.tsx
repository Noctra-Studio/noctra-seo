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
  return (
    <div className="bg-[#14141C] border border-[#1E1E2A] rounded-xl p-5">
      <h3 className="text-xs text-[#8B8B9A] font-medium uppercase tracking-wider mb-4">
        Top páginas
      </h3>
      <div className="space-y-2">
        {pages.map((page) => {
          const { label, color } = getScoreLabel(page.seo_score);
          return (
            <div key={page.path} className="flex items-center gap-3 py-1.5">
              <span className="flex-1 text-sm text-[#F1F1F5] truncate font-mono text-xs">
                {page.path}
              </span>
              <span className="text-xs font-mono text-[#8B8B9A]">
                {page.visits.toLocaleString()}
              </span>
              <span
                className={cn(
                  'text-[10px] font-medium px-1.5 py-0.5 rounded',
                  color === 'green' ? 'bg-[#10B98115] text-[#10B981]' :
                  color === 'yellow' ? 'bg-[#F59E0B15] text-[#F59E0B]' :
                  'bg-[#EF444415] text-[#EF4444]'
                )}
              >
                {page.seo_score}
              </span>
            </div>
          );
        })}
        {pages.length === 0 && (
          <p className="text-sm text-[#8B8B9A] py-4 text-center">
            Sin datos — instala el tracker para ver tus páginas
          </p>
        )}
      </div>
    </div>
  );
}
