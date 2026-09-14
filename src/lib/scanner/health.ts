import { HealthScoreBreakdown, ScanIssue } from './types';

/**
 * Calculates a transparent repository health score based on detected issues:
 * - Build: 25%
 * - Dependencies: 20%
 * - Tests: 20%
 * - Code Quality: 15%
 * - Security: 20%
 */
export function calculateHealthScore(issues: ScanIssue[]): HealthScoreBreakdown {
  // Category base scores start at 100
  let build = 100;
  let dependencies = 100;
  let tests = 100;
  let codeQuality = 100;
  let security = 100;

  for (const issue of issues) {
    const penalty = getCategoryDeduction(issue.severity);

    switch (issue.category) {
      case 'build':
        build = Math.max(0, build - penalty * 1.5);
        break;
      case 'dependency':
        dependencies = Math.max(0, dependencies - penalty * 1.2);
        break;
      case 'test':
        tests = Math.max(0, tests - penalty * 1.3);
        break;
      case 'code':
        codeQuality = Math.max(0, codeQuality - penalty);
        break;
      case 'security':
        security = Math.max(0, security - penalty * 1.4);
        break;
      case 'configuration':
        // Config impacts both build and code quality
        build = Math.max(0, build - penalty * 0.5);
        codeQuality = Math.max(0, codeQuality - penalty * 0.5);
        break;
    }
  }

  // Weightings specified in prompt:
  // Build 25%, Dependencies 20%, Tests 20%, Code Quality 15%, Security 20%
  const overall = Math.round(
    build * 0.25 +
    dependencies * 0.2 +
    tests * 0.2 +
    codeQuality * 0.15 +
    security * 0.2
  );

  return {
    overall: Math.min(100, Math.max(0, overall)),
    build: Math.round(build),
    dependencies: Math.round(dependencies),
    tests: Math.round(tests),
    codeQuality: Math.round(codeQuality),
    security: Math.round(security),
    formulaDescription:
      'Overall = (Build × 25%) + (Dependencies × 20%) + (Tests × 20%) + (Code × 15%) + (Security × 20%)',
  };
}

function getCategoryDeduction(severity: string): number {
  switch (severity) {
    case 'critical':
      return 50;
    case 'high':
      return 30;
    case 'medium':
      return 15;
    case 'low':
      return 8;
    default:
      return 4;
  }
}
