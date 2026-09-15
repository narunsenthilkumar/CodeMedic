import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issue = await db.issue.findUnique({
      where: { id: params.id },
      include: {
        scan: {
          include: {
            repository: true,
          },
        },
        repairs: {
          orderBy: { createdAt: 'desc' },
          include: {
            verifications: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    return NextResponse.json({ issue });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
