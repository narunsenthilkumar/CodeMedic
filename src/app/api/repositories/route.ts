import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const repositories = await db.repository.findMany({
      include: {
        scans: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ repositories });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch repositories', details: error.message },
      { status: 500 }
    );
  }
}
