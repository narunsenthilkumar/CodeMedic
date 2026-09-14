import { NextResponse } from 'next/server';
import { loadDemoRepository } from '@/lib/demo/demoRepo';

export async function POST() {
  try {
    const result = await loadDemoRepository();
    return NextResponse.json({
      success: true,
      ...result,
      message: 'Demo repository loaded and scanned. Initial Health Score: 42/100 with 5 controlled issues ready for repair.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
