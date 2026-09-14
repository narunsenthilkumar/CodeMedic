import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issues = await db.issue.findMany({
      where: { scanId: params.id },
      orderBy: { priority: 'desc' },
      include: {
        repairs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({ issues });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
