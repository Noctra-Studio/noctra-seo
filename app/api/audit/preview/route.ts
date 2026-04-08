import { NextRequest, NextResponse } from 'next/server';
import { runSeoChecks } from '@/lib/auditor/checks/seo';
import { runDnsChecks } from '@/lib/auditor/checks/dns';
import { runSecurityChecks } from '@/lib/auditor/checks/security';
import { runTechChecks } from '@/lib/auditor/checks/tech';
import { 
  calculateGroupScore, 
  calculateOverallScore,
  type CheckGroup,
  type CheckResult
} from '@/lib/auditor/types';
import { analyzeAuditResults } from '@/lib/auditor/analyzer';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 });
    }

    // Extraction helper for DNS hostname
    const domain_hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;

    // Run a subset of fast checks
    console.info(`[API /audit/preview] Running preview for ${url}...`);
    
    // We run SEO, DNS, Security and Tech as they are relatively fast lookups
    const [seo, dns, security, tech] = await Promise.all([
      runSeoChecks(url).catch(() => [] as CheckResult[]),
      runDnsChecks(domain_hostname).catch(() => [] as CheckResult[]),
      runSecurityChecks(url).catch(() => [] as CheckResult[]),
      runTechChecks(url).catch(() => [] as CheckResult[])
    ]);

    const allChecks: CheckResult[] = [...seo, ...dns, ...security, ...tech];

    // Calculate scores for the preview
    const groupScores: Partial<Record<CheckGroup, number | null>> = {
      seo: calculateGroupScore(seo),
      dns: calculateGroupScore(dns),
      security: calculateGroupScore(security),
      tech: calculateGroupScore(tech)
    };

    const score_overall = calculateOverallScore(groupScores);

    // Enrich with AI for a couple of key findings (demonstrates value)
    // We only send the problematic ones to save tokens/time
    const enrichedResults = await analyzeAuditResults(allChecks, url);

    return NextResponse.json({
      url,
      score_overall,
      groupScores,
      results: enrichedResults,
    });
  } catch (err: any) {
    console.error('[API /audit/preview] Error:', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
