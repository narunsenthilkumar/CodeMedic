import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rawRepository = await db.repository.findUnique({
      where: { id: params.id },
      include: {
        scans: {
          orderBy: { startedAt: 'desc' },
          include: {
            issues: {
              orderBy: { priority: 'desc' },
            },
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!rawRepository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    // Sanitize localPath so server filesystem paths are never leaked to client
    const { localPath, ...safeRepository } = rawRepository;

    return NextResponse.json({ repository: safeRepository });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to retrieve repository details' }, { status: 500 });
  }
}
