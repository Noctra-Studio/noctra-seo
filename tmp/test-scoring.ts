import { calculateOverallScore, calculateGroupScore, type CheckResult, type CheckGroup } from '@/lib/auditor/types';

// Mock check results
const checks: CheckResult[] = [
  { check_key: 'ssl_chain', group: 'security', status: 'pass', score: 100, data: {} },
  { check_key: 'hsts', group: 'security', status: 'error', score: null, data: {} }, // Error check
  { check_key: 'dnssec', group: 'dns', status: 'skipped', score: null, data: {} }, // Skipped check
];

console.log('--- Testing Group Score ---');
const securityScore = calculateGroupScore(checks.filter(c => c.group === 'security'));
console.log('Security Score (expected ~100):', securityScore);

const dnsScore = calculateGroupScore(checks.filter(c => c.group === 'dns'));
console.log('DNS Score (expected null):', dnsScore);

console.log('\n--- Testing Overall Score ---');
const groupScores: Partial<Record<CheckGroup, number | null>> = {
  security: 100,
  dns: null,
  seo: 80
};

const overall = calculateOverallScore(groupScores);
console.log('Overall Score (expected 90):', overall);

const emptyScores: Partial<Record<CheckGroup, number | null>> = {
  security: null,
  dns: null
};

const overallEmpty = calculateOverallScore(emptyScores);
console.log('Overall Score (expected null):', overallEmpty);
