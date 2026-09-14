import { describe, it, expect } from 'vitest';
import { calculateHealthScore } from '@/lib/scanner/health';
import { ScanIssue } from '@/lib/scanner/types';

describe('Health Score Engine', () => {
  it('returns 100 overall score when no issues are present', () => {
    const health = calculateHealthScore([]);
    expect(health.overall).toBe(100);
    expect(health.build).toBe(100);
    expect(health.dependencies).toBe(100);
    expect(health.tests).toBe(100);
    expect(health.codeQuality).toBe(100);
    expect(health.security).toBe(100);
  });

  it('transparently deducts points for critical and high severity issues', () => {
    const issues: ScanIssue[] = [
      {
        id: '1',
        category: 'build',
        severity: 'critical',
        title: 'Build failed',
        description: '',
        evidence: [],
        confidence: 1.0,
      },
      {
        id: '2',
        category: 'dependency',
        severity: 'high',
        title: 'Missing package',
        description: '',
        evidence: [],
        confidence: 0.95,
      },
    ];

    const health = calculateHealthScore(issues);
    expect(health.overall).toBeLessThan(80);
    expect(health.build).toBeLessThan(100);
    expect(health.dependencies).toBeLessThan(100);
    expect(health.formulaDescription).toContain('Build × 25%');
  });
});
