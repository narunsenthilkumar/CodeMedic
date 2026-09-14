import { IssueCategory, IssueSeverity, ScanIssue } from './types';

const SEVERITY_WEIGHTS: Record<IssueSeverity, number> = {
  critical: 100,
  high: 80,
  medium: 50,
  low: 25,
  info: 10,
};

const CATEGORY_IMPACT_WEIGHTS: Record<IssueCategory, number> = {
  build: 1.0,
  test: 0.9,
  dependency: 0.85,
  security: 0.8,
  code: 0.7,
  configuration: 0.65,
};

/**
 * Calculates priority score (0–100) based on:
 * priority = (severityWeight * confidence * categoryImpact)
 */
export function calculateIssuePriority(issue: {
  severity: IssueSeverity;
  category: IssueCategory;
  confidence: number;
  evidence?: string[];
}): number {
  const severityWeight = SEVERITY_WEIGHTS[issue.severity] ?? 50;
  const impactWeight = CATEGORY_IMPACT_WEIGHTS[issue.category] ?? 0.7;
  const confidence = Math.max(0.1, Math.min(1.0, issue.confidence ?? 0.9));

  // Base raw score (0 - 100)
  const rawScore = severityWeight * impactWeight * confidence;

  // Normalize and clamp between 10 and 99
  const score = Math.round(Math.min(99, Math.max(10, rawScore)));
  return score;
}

/**
 * Sorts issues in descending priority order and attaches priority scores.
 */
export function prioritizeIssues(issues: ScanIssue[]): ScanIssue[] {
  const prioritized = issues.map((issue) => {
    const priority = calculateIssuePriority(issue);
    return {
      ...issue,
      priority,
    };
  });

  return prioritized.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}
