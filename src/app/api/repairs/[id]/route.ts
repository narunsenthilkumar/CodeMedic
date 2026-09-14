import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repair = await db.repair.findUnique({
      where: { id: params.id },
      include: {
        issue: {
          include: {
            scan: {
              include: { repository: true },
            },
          },
        },
        verifications: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!repair) {
      return NextResponse.json({ error: 'Repair not found' }, { status: 404 });
    }

    let parsedPatch = null;
    try {
      parsedPatch = JSON.parse(repair.patch);
    } catch {
      // Raw string
    }

    return NextResponse.json({
      repair: {
        ...repair,
        parsedPatch,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
