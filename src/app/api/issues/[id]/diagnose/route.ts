import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { diagnosticianAgent } from '@/lib/ai/agents/diagnostician';
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
    let fileContent = '';
    if (issue.filePath) {
      try {
        fileContent = workspaceManager.readFileSafe(repoPath, issue.filePath);
      } catch {
        // Ignore
      }
    }

    const evidence = JSON.parse(issue.evidence || '[]');

    // Run AI Diagnostician
    const diagnosis = await diagnosticianAgent.diagnose({
      issue: {
        id: issue.id,
        category: issue.category,
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        filePath: issue.filePath || undefined,
        lineNumber: issue.lineNumber || undefined,
        evidence,
        confidence: issue.confidence,
      },
      fileContent,
    });

    // Update issue with AI diagnosis findings
    await db.issue.update({
      where: { id: issue.id },
      data: {
        rootCause: diagnosis.rootCause,
        confidence: diagnosis.confidence,
        status: 'diagnosing',
      },
    });

    await db.activity.create({
      data: {
        repositoryId: issue.scan.repositoryId,
        type: 'diagnosis',
        message: `AI Diagnostician identified root cause for '${issue.title}': ${diagnosis.rootCause}`,
      },
    });

    return NextResponse.json({
      success: true,
      diagnosis,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
