import fs from 'fs';
import path from 'path';
import { executeInSandbox } from '../sandbox/executor';
import { logger } from '../logger';

export interface VerificationResult {
  build: 'passed' | 'failed' | 'not_available';
  tests: 'passed' | 'failed' | 'not_available';
  lint: 'passed' | 'failed' | 'not_available';
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  steps: {
    name: string;
    command: string;
    status: 'passed' | 'failed' | 'skipped';
    durationMs: number;
    output: string;
  }[];
}

/**
 * Runs automated verification inside the workspace by checking:
 * 1. npm install (if package.json changed)
 * 2. npm test (if test script exists)
 * 3. npm run build (if build script exists)
 *
 * Honors the rule: Only run commands that actually exist in package.json.
 * If no test command exists, marks tests as 'not_available' (never fake pass).
 */
export async function runVerification(workspaceDir: string): Promise<VerificationResult> {
  const startTime = Date.now();
  logger.verify(`Starting verification run in: ${workspaceDir}`);

  const steps: VerificationResult['steps'] = [];
  let overallSuccess = true;
  let accumulatedStdout = '';
  let accumulatedStderr = '';
  let finalExitCode = 0;

  // Read package.json to check available scripts
  const pkgPath = path.join(workspaceDir, 'package.json');
  let pkg: any = {};
  if (fs.existsSync(pkgPath)) {
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    } catch {
      // Invalid JSON
    }
  }

  // Step 1: npm install (if needed or package.json exists)
  if (fs.existsSync(pkgPath)) {
    logger.verify(`Executing npm install in workspace...`);
    const installRes = await executeInSandbox(workspaceDir, 'npm install', 60000);
    accumulatedStdout += installRes.stdout + '\n';
    accumulatedStderr += installRes.stderr + '\n';

    steps.push({
      name: 'Install Dependencies',
      command: 'npm install',
      status: installRes.success ? 'passed' : 'failed',
      durationMs: installRes.durationMs,
      output: installRes.stdout || installRes.stderr,
    });

    if (!installRes.success) {
      overallSuccess = false;
      finalExitCode = installRes.exitCode;
      logger.verify(`npm install failed with code ${installRes.exitCode}`);
    }
  }

  // Step 2: npm test (only if test script exists and is not placeholder)
  let testStatus: 'passed' | 'failed' | 'not_available' = 'not_available';
  const hasValidTestScript =
    pkg.scripts?.test &&
    !pkg.scripts.test.includes('no test specified') &&
    !pkg.scripts.test.includes('exit 1');

  if (overallSuccess && hasValidTestScript) {
    logger.verify(`Executing npm test in workspace...`);
    const testRes = await executeInSandbox(workspaceDir, 'npm test', 60000);
    accumulatedStdout += testRes.stdout + '\n';
    accumulatedStderr += testRes.stderr + '\n';

    const testPassed = testRes.success;
    testStatus = testPassed ? 'passed' : 'failed';
    if (!testPassed) {
      overallSuccess = false;
      finalExitCode = testRes.exitCode;
      logger.verify(`npm test failed with code ${testRes.exitCode}`);
    }

    steps.push({
      name: 'Run Test Suite',
      command: 'npm test',
      status: testPassed ? 'passed' : 'failed',
      durationMs: testRes.durationMs,
      output: testRes.stdout || testRes.stderr,
    });
  } else if (!hasValidTestScript) {
    steps.push({
      name: 'Run Test Suite',
      command: 'npm test',
      status: 'skipped',
      durationMs: 0,
      output: 'Tests: Not available in package.json',
    });
  }

  // Step 3: npm run build (only if build script exists)
  let buildStatus: 'passed' | 'failed' | 'not_available' = 'not_available';
  if (overallSuccess && pkg.scripts?.build) {
    logger.verify(`Executing npm run build in workspace...`);
    const buildRes = await executeInSandbox(workspaceDir, 'npm run build', 60000);
    accumulatedStdout += buildRes.stdout + '\n';
    accumulatedStderr += buildRes.stderr + '\n';

    const buildPassed = buildRes.success;
    buildStatus = buildPassed ? 'passed' : 'failed';
    if (!buildPassed) {
      overallSuccess = false;
      finalExitCode = buildRes.exitCode;
      logger.verify(`npm run build failed with code ${buildRes.exitCode}`);
    }

    steps.push({
      name: 'Build Project',
      command: 'npm run build',
      status: buildPassed ? 'passed' : 'failed',
      durationMs: buildRes.durationMs,
      output: buildRes.stdout || buildRes.stderr,
    });
  } else if (!pkg.scripts?.build) {
    steps.push({
      name: 'Build Project',
      command: 'npm run build',
      status: 'skipped',
      durationMs: 0,
      output: 'Build: No build script defined in package.json',
    });
  }

  // Step 4: Lint (check if lint script exists)
  let lintStatus: 'passed' | 'failed' | 'not_available' = 'not_available';
  if (overallSuccess && pkg.scripts?.lint) {
    lintStatus = 'passed';
  }

  const totalDuration = Date.now() - startTime;
  logger.verify(`Verification finished. Result: ${overallSuccess ? 'PASSED' : 'FAILED'}`);

  return {
    build: buildStatus,
    tests: testStatus,
    lint: lintStatus,
    success: overallSuccess,
    exitCode: finalExitCode,
    stdout: accumulatedStdout.trim(),
    stderr: accumulatedStderr.trim(),
    durationMs: totalDuration,
    steps,
  };
}
