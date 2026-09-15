import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workspaceManager } from '@/lib/sandbox/workspace';
import { DEMO_REPO_PATH } from '@/lib/demo/demoRepo';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body; // 'approve' | 'reject'

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
      },
    });

    if (!repair) {
      return NextResponse.json({ error: 'Repair not found' }, { status: 404 });
    }

    if (action === 'reject') {
      await db.repair.update({
        where: { id: repair.id },
        data: { status: 'rejected' },
      });

      await db.issue.update({
        where: { id: repair.issueId },
        data: { status: 'rejected' },
      });

      await db.activity.create({
        data: {
          repositoryId: repair.issue.scan.repositoryId,
          type: 'patch',
          message: `Developer rejected repair proposal for '${repair.issue.title}'.`,
        },
      });

      return NextResponse.json({
        success: true,
        status: 'rejected',
        message: 'Repair proposal rejected by user.',
      });
    }

    // MANDATORY HUMAN APPROVAL GATE:
    // Any request where action !== 'approve' MUST be rejected with 403 Forbidden!
    if (action !== 'approve') {
      return NextResponse.json(
        {
          error: 'Approval required. Human authorization gate rejected modification.',
          code: 'HUMAN_APPROVAL_REQUIRED',
          status: 'unapproved',
        },
        { status: 403 }
      );
    }

    // Human Approval confirmed!
    logger.patch(`Human approved repair ${repair.id}. Applying patch in isolated sandbox workspace...`);

    const patch = JSON.parse(repair.patch);
    const repoPath = repair.issue.scan.repository.localPath || DEMO_REPO_PATH;

    // Use or create dedicated isolated workspace
    const sessionId = `apply_${repair.id}`;
    const workspaceDir = workspaceManager.createWorkspace(sessionId);
    workspaceManager.copyRepository(repoPath, workspaceDir);

    // Apply the patch safely in the isolated sandbox workspace ONLY (Never on host)
    workspaceManager.writeFileSafe(workspaceDir, patch.filePath, patch.newContent);

    // Update status in DB
    await db.repair.update({
      where: { id: repair.id },
      data: { status: 'applied' },
    });

    await db.issue.update({
      where: { id: repair.issueId },
      data: { status: 'applied' },
    });

    await db.activity.create({
      data: {
        repositoryId: repair.issue.scan.repositoryId,
        type: 'patch',
        message: `Applied approved patch to ${patch.filePath} in isolated workspace. Ready for verification.`,
      },
    });

    return NextResponse.json({
      success: true,
      status: 'applied',
      workspaceId: sessionId,
      patch,
      message: 'Patch applied successfully in isolated workspace. Proceed to verification.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
