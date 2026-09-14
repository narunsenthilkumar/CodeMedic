import { diagnosticianAgent } from './agents/diagnostician';
import { plannerAgent } from './agents/planner';
import { patchGeneratorAgent } from './agents/patchGenerator';
import { patchReviewAgent } from './agents/reviewer';
import { workspaceManager } from '../sandbox/workspace';
import { runVerification, VerificationResult } from '../verification/verifier';
import { logger } from '../logger';
import { ScanIssue } from '../scanner/types';

export interface RepairSessionState {
  id: string;
  issue: ScanIssue;
  workspaceDir: string;
  maxAttempts: number;
  currentAttempt: number;
  history: Array<{
    attemptNumber: number;
    diagnosis: any;
    plan: any;
    patch: any;
    review: any;
    verification?: VerificationResult;
  }>;
  status: 'planning' | 'awaiting_approval' | 'verifying' | 'verified' | 'failed' | 'rejected';
  finalMessage?: string;
}

export class RepairOrchestrator {
  private readonly MAX_RETRIES = 3;

  /**
   * Generates a new repair proposal (Diagnosis -> Plan -> Patch -> Review).
   * Stops before applying, so user can approve the diff.
   */
  async prepareRepairProposal(
    sessionId: string,
    issue: ScanIssue,
    workspaceDir: string,
    attemptNumber = 1,
    previousAttempts: any[] = []
  ) {
    logger.ai(`Initiating repair proposal sequence for ${issue.id} (Attempt ${attemptNumber}/${this.MAX_RETRIES})`);

    // 1. Identify primary affected file
    const targetFile = issue.filePath || 'package.json';
    let fileContent = '';
    try {
      fileContent = workspaceManager.readFileSafe(workspaceDir, targetFile);
    } catch {
      fileContent = '';
    }

    // Read package.json if available
    let packageJson: any = null;
    try {
      packageJson = JSON.parse(workspaceManager.readFileSafe(workspaceDir, 'package.json'));
    } catch {
      // Ignore
    }

    // 2. AI Diagnosis
    const diagnosis = await diagnosticianAgent.diagnose({
      issue,
      fileContent,
      packageJson,
      previousAttempts: previousAttempts.map((a) => ({
        patch: a.patch?.diff || '',
        verificationError: a.verification?.stderr || a.verification?.stdout || '',
      })),
    });

    // 3. AI Planner
    const plan = await plannerAgent.plan({
      diagnosis,
      repositoryContext: {
        language: 'TypeScript',
        framework: 'Node.js',
        packageManager: 'npm',
      },
    });

    // 4. AI Patch Generator
    const patch = await patchGeneratorAgent.generatePatch({
      diagnosis,
      plan,
      filePath: targetFile,
      fileContent,
      packageJsonContent: packageJson ? JSON.stringify(packageJson) : undefined,
    });

    // 5. AI Patch Reviewer
    const review = await patchReviewAgent.review({
      diagnosis,
      patch,
    });

    return {
      diagnosis,
      plan,
      patch,
      review,
      attemptNumber,
      canApply: review.approved,
    };
  }

  /**
   * Applies the approved patch into the isolated workspace and runs automated verification.
   * If verification fails and retries remain, returns self-healing diagnosis context.
   */
  async applyAndVerify(
    sessionId: string,
    workspaceDir: string,
    patch: any,
    attemptNumber: number
  ): Promise<{
    verification: VerificationResult;
    canRetry: boolean;
    nextAttemptNumber: number;
  }> {
    logger.patch(`Applying approved patch to workspace for ${patch.filePath}...`);

    // Write modified content inside isolated workspace
    workspaceManager.writeFileSafe(workspaceDir, patch.filePath, patch.newContent);

    // Run verification
    logger.verify(`Triggering verification pipeline...`);
    const verification = await runVerification(workspaceDir);

    const canRetry = !verification.success && attemptNumber < this.MAX_RETRIES;

    return {
      verification,
      canRetry,
      nextAttemptNumber: attemptNumber + 1,
    };
  }
}

export const repairOrchestrator = new RepairOrchestrator();
