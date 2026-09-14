import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repository = await db.repository.findUnique({
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

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    return NextResponse.json({ repository });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
