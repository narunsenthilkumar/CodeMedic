import fs from 'fs';
import path from 'path';
import { ScanIssue } from '../types';
import { executeInSandbox } from '../../sandbox/executor';

export async function scanBuild(repoPath: string, isSandboxed = false): Promise<ScanIssue[]> {
  const issues: ScanIssue[] = [];
  const pkgPath = path.join(repoPath, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    return issues;
  }

  let pkg: any = {};
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch {
    return issues;
  }

  // If we are in an isolated sandbox and have a build script, run build
  if (isSandboxed && pkg.scripts?.build) {
    const buildResult = await executeInSandbox(repoPath, 'npm run build', 45000);
    if (!buildResult.success) {
      // Parse errors from build output
      const errorLines = (buildResult.stderr || buildResult.stdout)
        .split('\n')
        .filter((l) => /error|failed|cannot find/i.test(l))
        .slice(0, 5);

      issues.push({
        id: 'build_failed',
        category: 'build',
        severity: 'critical',
        title: 'Project build failed',
        description: `Running 'npm run build' failed with exit code ${buildResult.exitCode}.`,
        evidence: errorLines.length > 0 ? errorLines : [buildResult.stderr || buildResult.stdout],
        confidence: 0.99,
        rootCause: 'Build script execution threw fatal compilation or configuration errors.',
      });
      return issues;
    }
  }

  // Static check for TypeScript errors or missing config
  const tsconfigPath = path.join(repoPath, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    try {
      const tsContent = fs.readFileSync(tsconfigPath, 'utf8');
      JSON.parse(tsContent);
    } catch {
      issues.push({
        id: 'build_malformed_tsconfig',
        category: 'build',
        severity: 'high',
        title: 'Malformed tsconfig.json',
        description: 'tsconfig.json contains syntax errors that prevent TypeScript compilation.',
        filePath: 'tsconfig.json',
        evidence: ['tsconfig.json could not be parsed as valid JSON'],
        confidence: 1.0,
        rootCause: 'Invalid JSON in TypeScript configuration file.',
      });
    }
  }

  return issues;
}
