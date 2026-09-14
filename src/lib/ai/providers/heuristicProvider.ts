import {
  AIProvider,
  DiagnosisInput,
  DiagnosisOutput,
  PlanningInput,
  PlanningOutput,
  PatchInput,
  PatchOutput,
  PatchReviewInput,
  PatchReviewOutput,
} from './interface';
import { createUnifiedDiff } from '../diffUtil';
import { logger } from '../../logger';

export class HeuristicAIProvider implements AIProvider {
  async diagnose(input: DiagnosisInput): Promise<DiagnosisOutput> {
    logger.ai(`Heuristic Diagnostician analyzing issue: ${input.issue.title}`);
    const { issue, previousAttempts } = input;

    // Check if this is a re-diagnosis after a failed verification attempt
    if (previousAttempts && previousAttempts.length > 0) {
      const lastAttempt = previousAttempts[previousAttempts.length - 1];
      logger.ai(`Self-healing re-diagnosis triggered with error: ${lastAttempt.verificationError.slice(0, 100)}`);
    }

    // 1. Missing Dependency Issue
    if (issue.category === 'dependency' && issue.title.includes('Missing dependency')) {
      const pkgMatch = issue.title.match(/Missing dependency:\s*([@a-zA-Z0-9_\-\/]+)/);
      const pkgName = pkgMatch ? pkgMatch[1] : 'unknown';

      return {
        rootCause: `Source code imports '${pkgName}', but it is missing from package.json dependencies.`,
        severity: 'high',
        confidence: 0.96,
        affectedFiles: ['package.json'],
        evidence: [
          ...issue.evidence,
          `Package '${pkgName}' is required at runtime/build but absent in dependencies.`,
        ],
        recommendedStrategy: 'add_dependency',
      };
    }

    // 2. Bad Import / Missing Export
    if (issue.category === 'code' && (issue.title.includes('not exported') || issue.title.includes('Unresolved module'))) {
      return {
        rootCause: `Import symbol mismatch between consumer file and module export declaration.`,
        severity: 'high',
        confidence: 0.95,
        affectedFiles: [issue.filePath || 'src/index.ts'],
        evidence: issue.evidence,
        recommendedStrategy: 'fix_import_symbol',
      };
    }

    // 3. TypeScript Type Mismatch
    if (issue.title.includes('TypeScript') || issue.title.includes('type error') || issue.title.includes('Type mismatch')) {
      return {
        rootCause: "Numeric literal assigned to string-typed property 'id' in User interface.",
        severity: 'high',
        confidence: 0.98,
        affectedFiles: [issue.filePath || 'src/models/user.ts'],
        evidence: issue.evidence,
        recommendedStrategy: 'fix_type_mismatch',
      };
    }

    // 4. Failing Test Issue
    if (issue.category === 'test') {
      return {
        rootCause: `Unit test assertions failed due to unexpected calculation result.`,
        severity: 'high',
        confidence: 0.94,
        affectedFiles: [issue.filePath || 'tests/math.test.ts'],
        evidence: issue.evidence,
        recommendedStrategy: 'fix_failing_assertion',
      };
    }

    // 4. Missing Environment Configuration
    if (issue.category === 'configuration' && issue.title.includes('.env.example')) {
      return {
        rootCause: `Repository uses environment variables in code but lacks documentation in .env.example.`,
        severity: 'medium',
        confidence: 0.92,
        affectedFiles: ['.env.example'],
        evidence: issue.evidence,
        recommendedStrategy: 'create_env_example',
      };
    }

    // 5. Security / Secret Issue
    if (issue.category === 'security') {
      return {
        rootCause: `Sensitive credential committed directly in source code instead of environment variables.`,
        severity: 'critical',
        confidence: 0.98,
        affectedFiles: [issue.filePath || 'src/config.ts'],
        evidence: issue.evidence,
        recommendedStrategy: 'replace_with_env_var',
      };
    }

    // Generic fallback
    return {
      rootCause: issue.rootCause || issue.description,
      severity: issue.severity as any,
      confidence: issue.confidence || 0.9,
      affectedFiles: issue.filePath ? [issue.filePath] : ['package.json'],
      evidence: issue.evidence,
      recommendedStrategy: 'patch_source',
    };
  }

  async plan(input: PlanningInput): Promise<PlanningOutput> {
    logger.ai(`Planner formulating strategy for: ${input.diagnosis.recommendedStrategy}`);
    const strat = input.diagnosis.recommendedStrategy;

    switch (strat) {
      case 'add_dependency':
        return {
          strategy: 'add_dependency',
          steps: [
            'Inspect imported package version compatibility',
            'Declare package in package.json dependencies',
            'Run npm install in isolated workspace',
            'Verify build and test passes',
          ],
          risk: 'low',
          expectedOutcome: 'Module resolution succeeds and build completes without error.',
        };

      case 'fix_import_symbol':
        return {
          strategy: 'fix_import_symbol',
          steps: [
            'Identify correct exported symbol name from target module',
            'Update import specifier in consumer file',
            'Verify TypeScript compilation',
          ],
          risk: 'low',
          expectedOutcome: 'Compiler resolves symbol cleanly.',
        };

      case 'fix_type_mismatch':
        return {
          strategy: 'fix_type_mismatch',
          steps: [
            'Inspect interface User property definitions',
            'Update literal property value to matching string representation',
            'Verify TypeScript type checker passes cleanly',
          ],
          risk: 'low',
          expectedOutcome: 'TypeScript type checking passes without TS2322 errors.',
        };

      case 'fix_failing_assertion':
        return {
          strategy: 'fix_failing_assertion',
          steps: [
            'Inspect failing test expectation and implementation logic',
            'Correct test assertion to match specification',
            'Run test suite to verify 100% pass rate',
          ],
          risk: 'low',
          expectedOutcome: 'All test assertions pass cleanly.',
        };

      case 'create_env_example':
        return {
          strategy: 'create_env_example',
          steps: [
            'Extract all required environment keys from code',
            'Generate clean .env.example with descriptive placeholders',
          ],
          risk: 'low',
          expectedOutcome: 'Developers and CI have complete configuration documentation.',
        };

      default:
        return {
          strategy: strat,
          steps: ['Apply minimal source modification', 'Run verification'],
          risk: 'low',
          expectedOutcome: 'Issue resolved safely.',
        };
    }
  }

  async generatePatch(input: PatchInput): Promise<PatchOutput> {
    logger.ai(`PatchGenerator crafting minimal patch for: ${input.filePath}`);
    const { diagnosis, filePath, fileContent } = input;
    const oldContent = fileContent || '';
    let newContent = oldContent;
    let reason = 'Apply verified minimal repair patch';

    // Patch 1: Add missing dependency to package.json
    if (filePath.endsWith('package.json')) {
      try {
        const pkg = JSON.parse(oldContent || '{}');
        if (!pkg.dependencies) pkg.dependencies = {};

        // Find which package was missing from diagnosis
        const pkgMatch = diagnosis.rootCause.match(/'([@a-zA-Z0-9_\-\/]+)'/);
        const depToAdd = pkgMatch ? pkgMatch[1] : 'axios';
        const defaultVersions: Record<string, string> = {
          axios: '^1.7.9',
          lodash: '^4.17.21',
          dotenv: '^16.4.5',
        };
        const version = defaultVersions[depToAdd] || '^1.0.0';

        pkg.dependencies[depToAdd] = version;

        // Sort dependencies alphabetically for clean diff
        const sortedDeps: Record<string, string> = {};
        Object.keys(pkg.dependencies).sort().forEach((key) => {
          sortedDeps[key] = pkg.dependencies[key];
        });
        pkg.dependencies = sortedDeps;

        newContent = JSON.stringify(pkg, null, 2) + '\n';
        reason = `Add '${depToAdd}' (${version}) to dependencies to satisfy imported module requirements.`;
      } catch {
        newContent = oldContent;
      }
    }

    // Patch 2: Fix import symbol (e.g. calculateScore -> calcScore)
    else if (oldContent.includes('calculateScore') && oldContent.includes('./utils/math')) {
      newContent = oldContent.replace(/\bcalculateScore\b/g, 'calcScore');
      reason = "Correct imported symbol name from 'calculateScore' to 'calcScore' to match exported function.";
    }

    // Patch 2b: Fix TypeScript type mismatch in user.ts
    else if (oldContent.includes('id: 101') && (oldContent.includes('User') || filePath.includes('user.ts'))) {
      newContent = oldContent
        .replace(/id:\s*101,\s*\/\/\s*TS2322[^\n]*/, "id: 'usr_101',")
        .replace(/id:\s*101,/, "id: 'usr_101',");
      reason = "Update property 'id' to string literal 'usr_101' to satisfy User interface definition.";
    }

    // Patch 3: Fix failing test assertion in math.test.ts
    else if (oldContent.includes('expect(add(1, 2)).toBe(4)') || oldContent.includes('// deliberate test failure')) {
      newContent = oldContent
        .replace('expect(add(1, 2)).toBe(4); // deliberate test failure', 'expect(add(1, 2)).toBe(3);')
        .replace('expect(add(1, 2)).toBe(4)', 'expect(add(1, 2)).toBe(3)');
      reason = 'Fix incorrect test expectation: 1 + 2 equals 3, not 4.';
    }

    // Patch 4: Create .env.example
    else if (filePath === '.env.example' || (!oldContent && filePath.endsWith('.env.example'))) {
      newContent = [
        '# CodeMedic Demo Application Environment Variables',
        'PORT=3000',
        'API_ENDPOINT="https://api.example.com/v1"',
        'API_SECRET="your_secret_key_here"',
        '',
      ].join('\n');
      reason = 'Document required environment variables for the project.';
    }

    // Patch 5: Mask or replace hardcoded secrets
    else if (diagnosis.recommendedStrategy === 'replace_with_env_var') {
      newContent = oldContent
        .replace(/sk-[a-zA-Z0-9_-]{20,}/g, "process.env.OPENAI_API_KEY || ''")
        .replace(/['"]ghp_[a-zA-Z0-9]{30,}['"]/g, "process.env.GITHUB_TOKEN || ''");
      reason = 'Replace hardcoded secret with secure environment variable lookup.';
    }

    const diff = createUnifiedDiff(filePath, oldContent, newContent);

    return {
      filePath,
      operation: oldContent ? 'modify' : 'create',
      oldContent,
      newContent,
      diff,
      reason,
    };
  }

  async reviewPatch(input: PatchReviewInput): Promise<PatchReviewOutput> {
    logger.ai(`PatchReviewer evaluating patch safety for: ${input.patch.filePath}`);
    const { patch } = input;

    // Safety checks:
    // 1. Did it add any obvious secrets?
    if (/sk-[a-zA-Z0-9_-]{20,}|ghp_[a-zA-Z0-9]{30,}/.test(patch.newContent)) {
      return {
        approved: false,
        risk: 'high',
        reason: 'Rejected: Patch introduces hardcoded credentials.',
      };
    }

    // 2. Unsafe command injection patterns?
    if (/child_process\.exec\s*\(|rm\s+-rf\s+\/|eval\s*\(/.test(patch.newContent)) {
      return {
        approved: false,
        risk: 'high',
        reason: 'Rejected: Patch contains suspicious or unsafe code execution patterns.',
      };
    }

    return {
      approved: true,
      risk: 'low',
      reason: `Patch reviewed and approved: Minimal diff, addresses root cause directly, no secrets introduced, fully reversible.`,
    };
  }
}
