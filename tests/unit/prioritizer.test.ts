import { describe, it, expect } from 'vitest';
import { calculateIssuePriority, prioritizeIssues } from '@/lib/scanner/prioritizer';
import { ScanIssue } from '@/lib/scanner/types';

describe('Issue Prioritizer Engine', () => {
  it('calculates higher priority for critical build issues than low code issues', () => {
    const criticalBuild = calculateIssuePriority({
      category: 'build',
      severity: 'critical',
      confidence: 0.99,
    });

    const lowCode = calculateIssuePriority({
      category: 'code',
      severity: 'low',
      confidence: 0.8,
    });

    expect(criticalBuild).toBeGreaterThan(lowCode);
    expect(criticalBuild).toBeGreaterThanOrEqual(90);
    expect(lowCode).toBeLessThanOrEqual(30);
  });

  it('correctly sorts issues in descending priority order', () => {
    const issues: ScanIssue[] = [
      {
        id: '1',
        category: 'code',
        severity: 'low',
        title: 'Minor style',
        description: '',
        evidence: [],
        confidence: 0.7,
      },
      {
        id: '2',
        category: 'dependency',
        severity: 'high',
        title: 'Missing axios',
        description: '',
        evidence: [],
        confidence: 0.96,
      },
    ];

    const sorted = prioritizeIssues(issues);
    expect(sorted[0].id).toBe('2');
    expect(sorted[1].id).toBe('1');
    expect(sorted[0].priority).toBeGreaterThan(sorted[1].priority!);
  });
});
