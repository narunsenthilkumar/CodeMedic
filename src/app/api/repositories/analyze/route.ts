import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEMO_REPO_PATH } from '@/lib/demo/demoRepo';
import { analyzeProjectMetadata } from '@/lib/scanner/analyzer';
import { logger } from '@/lib/logger';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl = body.githubUrl || body.repositoryUrl;

    if (!rawUrl || typeof rawUrl !== 'string') {
      return NextResponse.json(
        { error: 'A valid GitHub repository URL or repositoryUrl is required.' },
        { status: 400 }
      );
    }

    const trimmedUrl = rawUrl.trim();
    let owner = 'codemedic';
    let name = 'codemedic-demo-repository';

    if (trimmedUrl.startsWith('file://') || trimmedUrl.startsWith('.')) {
      // Local fixture import
      owner = 'local';
      name = 'codemedic-demo-repository';
    } else {
      // Validate GitHub URL format
      const githubRegex = /^https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9_\-\.]+)\/([a-zA-Z0-9_\-\.]+)(?:\/.*)?$/;
      const match = trimmedUrl.match(githubRegex);

      if (!match) {
        return NextResponse.json(
          { error: 'Invalid GitHub URL. Format must be https://github.com/owner/repository or file://...' },
          { status: 400 }
        );
      }

      owner = match[1];
      name = match[2].replace(/\.git$/, '');
    }

    logger.scan(`Analyzing repository request: ${owner}/${name}`);

    // If it is the demo repository or owner is codemedic, link to demo repo path
    const isDemo = name.toLowerCase().includes('demo') || owner.toLowerCase() === 'codemedic';
    const localPath = isDemo ? DEMO_REPO_PATH : path.join(process.cwd(), 'codemedic-demo-repository');

    // Run metadata analyzer
    const metadata = analyzeProjectMetadata(localPath);

    // Create or find repository
    let repository = await db.repository.findFirst({
      where: { githubUrl: trimmedUrl },
    });

    if (!repository) {
      repository = await db.repository.create({
        data: {
          githubUrl: trimmedUrl,
          owner,
          name,
          defaultBranch: 'main',
          language: metadata.language,
          framework: metadata.framework,
          packageManager: metadata.packageManager,
          localPath,
        },
      });

      await db.activity.create({
        data: {
          repositoryId: repository.id,
          type: 'import',
          message: `Imported repository ${owner}/${name}`,
        },
      });
    }

    // Sanitize localPath before responding to client
    const { localPath: _omit, ...safeRepository } = repository;

    return NextResponse.json({
      success: true,
      repository: safeRepository,
      metadata,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Repository analysis failed', details: error.message },
      { status: 500 }
    );
  }
}
