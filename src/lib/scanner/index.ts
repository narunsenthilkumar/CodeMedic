import { analyzeProjectMetadata } from './analyzer';
import { scanDependencies } from './scanners/dependencyScanner';
import { scanSecurity } from './scanners/securityScanner';
import { scanConfiguration } from './scanners/configurationScanner';
import { scanCode } from './scanners/codeScanner';
import { scanBuild } from './scanners/buildScanner';
import { scanTests } from './scanners/testScanner';
import { prioritizeIssues } from './prioritizer';
import { calculateHealthScore } from './health';
import { HealthScoreBreakdown, ProjectMetadata, ScanIssue } from './types';
import { logger } from '../logger';

export interface FullScanResult {
  metadata: ProjectMetadata;
  issues: ScanIssue[];
  health: HealthScoreBreakdown;
  testStats: {
    passed: number;
    failed: number;
    skipped: number;
    total: number;
  };
}

export async function runFullScan(repoPath: string, isSandboxed = false): Promise<FullScanResult> {
  logger.scan(`Starting repository scan for path: ${repoPath}`);

  // 1. Metadata Analysis
  const metadata = analyzeProjectMetadata(repoPath);
  logger.scan(`Project detected: ${metadata.framework} (${metadata.language}), package manager: ${metadata.packageManager}`);

  // 2. Run All Specialized Scanners
  const depIssues = scanDependencies(repoPath);
  const secIssues = scanSecurity(repoPath);
  const cfgIssues = scanConfiguration(repoPath);
  const codeIssues = scanCode(repoPath);
  const buildIssues = await scanBuild(repoPath, isSandboxed);
  const testResult = await scanTests(repoPath, isSandboxed);

  const rawIssues = [
    ...depIssues,
    ...secIssues,
    ...cfgIssues,
    ...codeIssues,
    ...buildIssues,
    ...testResult.issues,
  ];

  // 3. Prioritize Issues
  const prioritized = prioritizeIssues(rawIssues);
  logger.scan(`Total issues detected: ${prioritized.length}`);

  // 4. Calculate Health Score
  const health = calculateHealthScore(prioritized);
  logger.scan(`Repository Health Score calculated: ${health.overall}/100`);

  return {
    metadata,
    issues: prioritized,
    health,
    testStats: {
      passed: testResult.passed,
      failed: testResult.failed,
      skipped: testResult.skipped,
      total: testResult.total,
    },
  };
}
