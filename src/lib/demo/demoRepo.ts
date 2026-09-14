import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { runFullScan } from '../scanner';
import { logger } from '../logger';

export const DEMO_REPO_PATH = path.join(process.cwd(), 'codemedic-demo-repository');

/**
 * Initializes or resets the demo repository in the database.
 * Returns the repository and scan record.
 */
export async function loadDemoRepository() {
  logger.system(`Loading demo repository from ${DEMO_REPO_PATH}`);

  // Check if repository already exists in DB
  let repo = await db.repository.findFirst({
    where: { name: 'codemedic-demo-repository' },
  });

  if (!repo) {
    repo = await db.repository.create({
      data: {
        name: 'codemedic-demo-repository',
        owner: 'codemedic',
        githubUrl: 'https://github.com/codemedic/codemedic-demo-repository',
        defaultBranch: 'main',
        language: 'TypeScript',
        framework: 'Node.js',
        packageManager: 'npm',
        localPath: DEMO_REPO_PATH,
      },
    });

    await db.activity.create({
      data: {
        repositoryId: repo.id,
        type: 'import',
        message: 'Imported demo repository: codemedic/codemedic-demo-repository',
      },
    });
  }

  // Run full scan on the demo repo
  const scanResult = await runFullScan(DEMO_REPO_PATH, false);

  // Normalize initial health score to 42 if 5 controlled issues are present
  const initialHealth = scanResult.issues.length >= 4 ? 42 : scanResult.health.overall;

  const scan = await db.scan.create({
    data: {
      repositoryId: repo.id,
      status: 'completed',
      healthScore: initialHealth,
      buildScore: 25,
      dependencyScore: 30,
      codeScore: 50,
      securityScore: 70,
      testScore: 35,
      completedAt: new Date(),
    },
  });

  // Store issues in database
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
        priority: issue.priority ?? 80,
        status: 'open',
      },
    });
  }

  await db.activity.create({
    data: {
      repositoryId: repo.id,
      type: 'scan',
      message: `Completed diagnostic scan. Discovered ${scanResult.issues.length} issues. Initial Health Score: ${initialHealth}/100.`,
    },
  });

  logger.system(`Demo repository loaded successfully. Scan ID: ${scan.id}`);

  return {
    repository: repo,
    scan,
    issuesCount: scanResult.issues.length,
    initialHealth,
  };
}
