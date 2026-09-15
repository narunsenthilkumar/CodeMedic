import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const rawRepositories = await db.repository.findMany({
      include: {
        scans: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Sanitize localPath so server filesystem paths are never leaked to client
    const repositories = rawRepositories.map((repo) => {
      const { localPath, ...safeRepo } = repo;
      return safeRepo;
    });

    return NextResponse.json({ repositories });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}
