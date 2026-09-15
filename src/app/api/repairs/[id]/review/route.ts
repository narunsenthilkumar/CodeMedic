import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { patchReviewAgent } from '@/lib/ai/agents/reviewer';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repair = await db.repair.findUnique({
      where: { id: params.id },
      include: { issue: true },
    });

    if (!repair) {
      return NextResponse.json({ error: 'Repair not found' }, { status: 404 });
    }

    const patch = JSON.parse(repair.patch);
    const review = await patchReviewAgent.review({
      diagnosis: {
        rootCause: repair.issue.rootCause || repair.issue.description,
        severity: repair.issue.severity as any,
        confidence: repair.issue.confidence,
        affectedFiles: [patch.filePath],
        evidence: JSON.parse(repair.issue.evidence || '[]'),
        recommendedStrategy: repair.strategy,
      },
      patch,
    });

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
