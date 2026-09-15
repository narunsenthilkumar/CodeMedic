import { NextResponse } from 'next/server';
import { loadDemoRepository } from '@/lib/demo/demoRepo';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST() {
  try {
    const result = await loadDemoRepository();
    const sanitizedRepo = result.repository
      ? { ...result.repository, localPath: undefined }
      : undefined;

    return NextResponse.json({
      success: true,
      repository: sanitizedRepo,
      scan: result.scan,
      message: `Demo repository loaded and scanned. Initial Health Score: ${result.scan?.healthScore ?? 55}/100.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
