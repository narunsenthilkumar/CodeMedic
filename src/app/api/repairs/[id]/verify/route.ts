import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runVerification } from '@/lib/verification/verifier';
import { workspaceManager } from '@/lib/sandbox/workspace';
import { DEMO_REPO_PATH } from '@/lib/demo/demoRepo';
import { repairOrchestrator } from '@/lib/ai/orchestrator';
import { runFullScan } from '@/lib/scanner';
import { logger } from '@/lib/logger';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repair = await db.repair.findUnique({
      where: { id: params.id },
      include: {
        issue: {
          include: {
            scan: {
              include: { repository: true },
            },
          },
        },
        verifications: true,
      },
    });

    if (!repair) {
      return NextResponse.json({ error: 'Repair not found' }, { status: 404 });
    }

    const repoPath = repair.issue.scan.repository.localPath || DEMO_REPO_PATH;
    const sessionId = `apply_${repair.id}`;
    const workspaceDir = path.join(workspaceManager.getBaseDir(), `ws_${sessionId}`);

    // If workspace doesn't exist, recreate and apply patch
    if (!require('fs').existsSync(workspaceDir)) {
      workspaceManager.createWorkspace(sessionId);
      workspaceManager.copyRepository(repoPath, workspaceDir);
      const patch = JSON.parse(repair.patch);
      workspaceManager.writeFileSafe(workspaceDir, patch.filePath, patch.newContent);
    }

    // 1. Run Verification Engine in isolated workspace
    logger.verify(`Running verification on repair ${repair.id} (Attempt ${repair.attemptNumber})...`);
    const verification = await runVerification(workspaceDir);

    // 2. Record verification run in DB
    const verificationRun = await db.verificationRun.create({
      data: {
        repairId: repair.id,
        buildStatus: verification.build,
        testStatus: verification.tests,
        lintStatus: verification.lint,
        exitCode: verification.exitCode,
        stdout: verification.stdout,
        stderr: verification.stderr,
        success: verification.success,
        durationMs: verification.durationMs,
      },
    });

    // 3. Handle Success
    if (verification.success) {
      logger.verify(`FIX VERIFIED for repair ${repair.id}! Updating health score.`);

      await db.repair.update({
        where: { id: repair.id },
        data: { status: 'verified' },
      });

      await db.issue.update({
        where: { id: repair.issueId },
        data: { status: 'verified' },
      });

      // Recalculate repository health score dynamically using actual scanner results on the repaired workspace
      const rescanned = await runFullScan(workspaceDir, false);
      const newHealth = rescanned.health;
      const beforeScore = repair.issue.scan.healthScore;

      const updatedScan = await db.scan.update({
        where: { id: repair.issue.scanId },
        data: {
          healthScore: newHealth.overall,
          buildScore: newHealth.build,
          dependencyScore: newHealth.dependencies,
          codeScore: newHealth.codeQuality,
          securityScore: newHealth.security,
          testScore: newHealth.tests,
        },
      });

      await db.activity.create({
        data: {
          repositoryId: repair.issue.scan.repositoryId,
          type: 'verification',
          message: `FIX VERIFIED: CodeMedic verified repair in isolated workspace. Health score recalculated: ${beforeScore} -> ${newHealth.overall}/100.`,
        },
      });

      return NextResponse.json({
        success: true,
        status: 'verified',
        verification,
        verificationRunId: verificationRun.id,
        healthScoreDelta: {
          before: beforeScore,
          after: newHealth.overall,
        },
        recalculatedHealth: newHealth,
        message: 'FIX VERIFIED: CodeMedic generated a repair, applied it in an isolated environment, and verified the repository after the change.',
      });
    }

    // 4. Handle Verification Failure & Self-Healing Loop
    logger.verify(`Verification failed for attempt ${repair.attemptNumber}. Checking self-healing policy.`);

    const MAX_RETRIES = 3;
    if (repair.attemptNumber < MAX_RETRIES) {
      const nextAttemptNumber = repair.attemptNumber + 1;
      logger.ai(`Initiating self-healing loop: Attempt ${nextAttemptNumber} of ${MAX_RETRIES}`);

      // Re-diagnose with new evidence
      const newProposal = await repairOrchestrator.prepareRepairProposal(
        `heal_${repair.id}_${nextAttemptNumber}`,
        {
          id: repair.issue.id,
          category: repair.issue.category as any,
          severity: repair.issue.severity as any,
          title: repair.issue.title,
          description: repair.issue.description,
          filePath: repair.issue.filePath || undefined,
          lineNumber: repair.issue.lineNumber || undefined,
          evidence: JSON.parse(repair.issue.evidence || '[]'),
          confidence: repair.issue.confidence,
          rootCause: repair.issue.rootCause || undefined,
        },
        workspaceDir,
        nextAttemptNumber,
        [
          {
            patch: JSON.parse(repair.patch),
            verification,
          },
        ]
      );

      // Update repair with new attempt
      await db.repair.update({
        where: { id: repair.id },
        data: {
          patch: JSON.stringify(newProposal.patch),
          attemptNumber: nextAttemptNumber,
          status: 'proposed', // Awaiting approval for retry
          aiReasoning: `Self-healing retry ${nextAttemptNumber}: ${newProposal.diagnosis.rootCause}`,
        },
      });

      await db.activity.create({
        data: {
          repositoryId: repair.issue.scan.repositoryId,
          type: 'diagnosis',
          message: `Self-healing loop triggered: Attempt ${repair.attemptNumber} failed. AI diagnosed new evidence and synthesized proposal for Attempt ${nextAttemptNumber}.`,
        },
      });

      return NextResponse.json({
        success: false,
        status: 'retrying',
        canRetry: true,
        attemptNumber: nextAttemptNumber,
        verification,
        newProposal,
        message: `Verification failed on attempt ${repair.attemptNumber}. CodeMedic self-healing loop analyzed new error logs and prepared repair proposal for Attempt ${nextAttemptNumber}.`,
      });
    }

    // Retries exhausted (Strict retry limit = 3)
    await db.repair.update({
      where: { id: repair.id },
      data: { status: 'failed' },
    });

    await db.issue.update({
      where: { id: repair.issueId },
      data: { status: 'open' },
    });

    await db.activity.create({
      data: {
        repositoryId: repair.issue.scan.repositoryId,
        type: 'verification',
        message: `Repair could not be verified after ${MAX_RETRIES} attempts. Escalated to manual developer review.`,
      },
    });

    return NextResponse.json({
      success: false,
      status: 'failed',
      canRetry: false,
      attempts: MAX_RETRIES,
      verification,
      message: `Repair could not be verified. Attempts: ${MAX_RETRIES}. Last error: ${verification.stderr || verification.stdout}. Recommended action: Manual developer review.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
