import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { repairOrchestrator } from '@/lib/ai/orchestrator';
import { DEMO_REPO_PATH } from '@/lib/demo/demoRepo';
import { workspaceManager } from '@/lib/sandbox/workspace';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issue = await db.issue.findUnique({
      where: { id: params.id },
      include: {
        scan: {
          include: { repository: true },
        },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const repoPath = issue.scan.repository.localPath || DEMO_REPO_PATH;
    const evidence = JSON.parse(issue.evidence || '[]');

    // 1. Create dedicated isolated workspace for this repair session
    const sessionId = `repair_${Date.now()}_${issue.id.slice(-6)}`;
    const workspaceDir = workspaceManager.createWorkspace(sessionId);
    workspaceManager.copyRepository(repoPath, workspaceDir);

    // 2. Generate repair proposal via orchestrator (Diagnose -> Plan -> Patch -> Review)
    const proposal = await repairOrchestrator.prepareRepairProposal(
      sessionId,
      {
        id: issue.id,
        category: issue.category as any,
        severity: issue.severity as any,
        title: issue.title,
        description: issue.description,
        filePath: issue.filePath || undefined,
        lineNumber: issue.lineNumber || undefined,
        evidence,
        confidence: issue.confidence,
        rootCause: issue.rootCause || undefined,
      },
      workspaceDir,
      1,
      []
    );

    // 3. Save Repair record in database (status: 'proposed' - requires human approval)
    const repair = await db.repair.create({
      data: {
        issueId: issue.id,
        strategy: proposal.plan.strategy,
        risk: proposal.review.risk,
        patch: JSON.stringify(proposal.patch),
        status: 'proposed', // Awaiting explicit human approval!
        attemptNumber: 1,
        aiReasoning: `${proposal.diagnosis.rootCause}\n\nReview: ${proposal.review.reason}`,
      },
    });

    await db.issue.update({
      where: { id: issue.id },
      data: { status: 'planned' },
    });

    await db.activity.create({
      data: {
        repositoryId: issue.scan.repositoryId,
        type: 'patch',
        message: `Generated safe repair proposal for '${issue.title}' with risk '${proposal.review.risk}'. Awaiting developer review.`,
      },
    });

    return NextResponse.json({
      success: true,
      repairId: repair.id,
      proposal: {
        ...proposal,
        workspaceDir,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
