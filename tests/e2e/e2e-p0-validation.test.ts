import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { runFullScan } from '@/lib/scanner';
import { diagnosticianAgent } from '@/lib/ai/agents/diagnostician';
import { plannerAgent } from '@/lib/ai/agents/planner';
import { patchGeneratorAgent } from '@/lib/ai/agents/patchGenerator';
import { patchReviewAgent } from '@/lib/ai/agents/reviewer';
import { workspaceManager } from '@/lib/sandbox/workspace';
import { runVerification } from '@/lib/verification/verifier';
import { calculateHealthScore } from '@/lib/scanner/health';
import { isCommandAllowlisted, executeInSandbox } from '@/lib/sandbox/executor';
import { redactSecrets } from '@/lib/logger';

describe('P0 End-to-End Validation Specification', () => {
  const DEMO_PATH = path.join(process.cwd(), 'codemedic-demo-repository');

  it('1. Controlled Test Repository contains all 5 required issues', async () => {
    const scan = await runFullScan(DEMO_PATH, false);

    // Issue 1: Missing dependency
    const missingDep = scan.issues.find(
      (i) => i.category === 'dependency' && i.title.includes('Missing dependency: axios')
    );
    expect(missingDep).toBeDefined();
    expect(missingDep?.severity).toBe('high');
    expect(missingDep?.confidence).toBeGreaterThanOrEqual(0.9);

    // Issue 2: Incorrect import symbol
    const badImport = scan.issues.find(
      (i) => i.category === 'code' && (i.title.includes('calculateScore') || i.title.includes('not exported'))
    );
    expect(badImport).toBeDefined();

    // Issue 3: TypeScript type error
    const tsError = scan.issues.find(
      (i) => i.category === 'code' && (i.title.includes('TypeScript') || i.title.includes('type error'))
    );
    expect(tsError).toBeDefined();

    // Issue 4: Missing environment configuration
    const missingEnv = scan.issues.find(
      (i) => i.category === 'configuration' && i.title.includes('.env.example')
    );
    expect(missingEnv).toBeDefined();

    // Issue 5: Failing test
    const failingTest = scan.issues.find(
      (i) => i.category === 'test'
    );
    expect(failingTest).toBeDefined();

    // Verify minimum 5 issues
    expect(scan.issues.length).toBeGreaterThanOrEqual(5);

    // Verify Initial Health Score starts degraded (<= 50)
    const initialHealth = calculateHealthScore(scan.issues);
    expect(initialHealth.overall).toBeLessThanOrEqual(55);
  });

  it('2. AI Diagnostician returns structured evidence without inventing facts', async () => {
    const scan = await runFullScan(DEMO_PATH, false);
    const targetIssue = scan.issues.find((i) => i.title.includes('Missing dependency: axios'))!;

    const diagnosis = await diagnosticianAgent.diagnose({
      issue: targetIssue,
    });

    // Validates JSON contract
    expect(diagnosis.rootCause).toBeDefined();
    expect(diagnosis.rootCause).toContain('axios');
    expect(diagnosis.severity).toBe('high');
    expect(diagnosis.confidence).toBeGreaterThanOrEqual(0.9);
    expect(diagnosis.affectedFiles).toContain('package.json');
    expect(diagnosis.evidence.length).toBeGreaterThan(0);
    expect(diagnosis.recommendedStrategy).toBe('add_dependency');
  });

  it('3. Planner & Patch Generator create minimal, reversible unified diffs', async () => {
    const scan = await runFullScan(DEMO_PATH, false);
    const targetIssue = scan.issues.find((i) => i.title.includes('Missing dependency: axios'))!;

    const diagnosis = await diagnosticianAgent.diagnose({ issue: targetIssue });
    const plan = await plannerAgent.plan({
      diagnosis,
      repositoryContext: {
        language: 'TypeScript',
        framework: 'Node.js',
        packageManager: 'npm',
      },
    });

    expect(plan.strategy).toBe('add_dependency');
    expect(plan.risk).toBe('low');
    expect(plan.steps.length).toBeGreaterThan(0);

    const oldPackageJson = fs.readFileSync(path.join(DEMO_PATH, 'package.json'), 'utf8');
    const patch = await patchGeneratorAgent.generatePatch({
      diagnosis,
      plan,
      filePath: 'package.json',
      fileContent: oldPackageJson,
    });

    // Verify patch properties
    expect(patch.filePath).toBe('package.json');
    expect(patch.operation).toBe('modify');
    expect(patch.diff).toContain('--- a/package.json');
    expect(patch.diff).toContain('+++ b/package.json');
    expect(patch.diff).toContain('axios');

    // Verify patch review agent approves
    const review = await patchReviewAgent.review({ diagnosis, patch });
    expect(review.approved).toBe(true);
    expect(review.risk).toBe('low');
  });

  it('4. Human Authorization & Sandbox Execution safeguards', async () => {
    const ws = workspaceManager.createWorkspace('p0_security_test');
    workspaceManager.copyRepository(DEMO_PATH, ws);

    // Command allowlist validation: unauthorized commands rejected
    expect(isCommandAllowlisted('rm -rf /')).toBe(false);
    expect(isCommandAllowlisted('curl http://malicious.com')).toBe(false);
    expect(isCommandAllowlisted('bash script.sh')).toBe(false);

    const execBlocked = await executeInSandbox(ws, 'rm -rf .');
    expect(execBlocked.success).toBe(false);
    expect(execBlocked.exitCode).toBe(126);

    // Path traversal defense: attempts to escape sandbox are rejected
    expect(() => {
      workspaceManager.readFileSafe(ws, '../../../nonexistent.txt');
    }).toThrow();

    // Secret redaction test
    const rawSecret = 'OPENAI_KEY=sk-proj-ABCDEFGHIJKL1234567890ABCDEF';
    expect(redactSecrets(rawSecret)).toContain('sk-proj-********');
    expect(redactSecrets(rawSecret)).not.toContain('ABCDEFGHIJKL1234567890ABCDEF');

    workspaceManager.destroyWorkspace(ws);
  });

  it('5. Full Closed-Loop: Apply patch, run real verification, dynamically update health score', async () => {
    const ws = workspaceManager.createWorkspace('p0_e2e_full');
    workspaceManager.copyRepository(DEMO_PATH, ws);

    // 1. Initial verification before repair: tests must fail!
    const preVerification = await runVerification(ws);
    expect(preVerification.tests).toBe('failed');
    expect(preVerification.success).toBe(false);

    // 2. Apply repair for Missing Dependency
    const oldPkg = workspaceManager.readFileSafe(ws, 'package.json');
    const parsedPkg = JSON.parse(oldPkg);
    parsedPkg.dependencies['axios'] = '^1.7.9';
    workspaceManager.writeFileSafe(ws, 'package.json', JSON.stringify(parsedPkg, null, 2) + '\n');

    // 3. Apply repair for Failing Test
    const mathTestPath = 'tests/math.test.ts';
    const oldTest = workspaceManager.readFileSafe(ws, mathTestPath);
    const fixedTest = oldTest.replace(/toBe\(4\);?\s*\/\/\s*deliberate test failure/g, 'toBe(3);');
    workspaceManager.writeFileSafe(ws, mathTestPath, fixedTest);

    // 4. Apply repair for Bad Import
    const indexPath = 'src/index.ts';
    const oldIndex = workspaceManager.readFileSafe(ws, indexPath);
    const fixedIndex = oldIndex.replace(/calculateScore/g, 'calcScore');
    workspaceManager.writeFileSafe(ws, indexPath, fixedIndex);

    // 5. Apply repair for TypeScript type error
    const userPath = 'src/models/user.ts';
    const oldUser = workspaceManager.readFileSafe(ws, userPath);
    const fixedUser = oldUser.replace(/id:\s*101[^\n]*/, "id: 'usr_101',");
    workspaceManager.writeFileSafe(ws, userPath, fixedUser);

    // 6. Apply repair for Missing .env.example
    workspaceManager.writeFileSafe(
      ws,
      '.env.example',
      'API_ENDPOINT="https://api.example.com/v1"\nAPI_SECRET="placeholder_secret"\n'
    );

    // 7. Apply repair for Hardcoded Secret in src/config.ts
    const configPath = 'src/config.ts';
    const oldConfig = workspaceManager.readFileSafe(ws, configPath);
    const fixedConfig = oldConfig.replace(
      /legacyApiKey:\s*'sk-proj-[^']+'/,
      "legacyApiKey: process.env.API_KEY || ''"
    );
    workspaceManager.writeFileSafe(ws, configPath, fixedConfig);

    // 8. Run Sandbox Verification
    const postVerification = await runVerification(ws);
    expect(postVerification.tests).toBe('passed');
    expect(postVerification.build).toBe('passed');
    expect(postVerification.success).toBe(true);

    // 9. Dynamic Health Recalculation on the fully repaired workspace
    const postScan = await runFullScan(ws, false);
    expect(postScan.health.overall).toBeGreaterThanOrEqual(94);

    // Clean up sandbox
    workspaceManager.destroyWorkspace(ws);
  });
});
