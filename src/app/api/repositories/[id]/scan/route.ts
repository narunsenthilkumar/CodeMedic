import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runFullScan } from '@/lib/scanner';
import { DEMO_REPO_PATH } from '@/lib/demo/demoRepo';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repository = await db.repository.findUnique({
      where: { id: params.id },
    });

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    const repoPath = repository.localPath || DEMO_REPO_PATH;
    logger.scan(`Executing full scan for repository: ${repository.name}`);

    // Run full scan
    const scanResult = await runFullScan(repoPath, false);

    // Save scan to database
    const scan = await db.scan.create({
      data: {
        repositoryId: repository.id,
        status: 'completed',
        healthScore: scanResult.health.overall,
        buildScore: scanResult.health.build,
        dependencyScore: scanResult.health.dependencies,
        codeScore: scanResult.health.codeQuality,
        securityScore: scanResult.health.security,
        testScore: scanResult.health.tests,
        completedAt: new Date(),
      },
    });

    // Save issues
    for (const issue of scanResult.issues) {
      await db.issue.create({
        data: {
          scanId: scan.id,
          category: issue.category,
          severity: issue.severity,
          title: issue.title,
          description: issue.description,
          filePath: issue.filePath,
          lineNumber: issue.lineNumber,
          confidence: issue.confidence,
          evidence: JSON.stringify(issue.evidence),
          rootCause: issue.rootCause,
          priority: issue.priority ?? 50,
          status: 'open',
        },
      });
    }

    await db.activity.create({
      data: {
        repositoryId: repository.id,
        type: 'scan',
        message: `Scanned repository. Detected ${scanResult.issues.length} issues. Health Score: ${scanResult.health.overall}/100.`,
      },
    });

    return NextResponse.json({
      success: true,
      scanId: scan.id,
      health: scanResult.health,
      issuesCount: scanResult.issues.length,
      issues: scanResult.issues,
    });
  } catch (error: any) {
    logger.scan(`Scan failed: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
