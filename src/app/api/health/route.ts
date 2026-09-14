import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    product: 'CodeMedic',
    tagline: "Don't just fix the code. Prove the fix works.",
    timestamp: new Date().toISOString(),
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      uptimeSeconds: Math.round(process.uptime()),
      freeMemoryMb: Math.round(os.freemem() / (1024 * 1024)),
    },
    sandbox: {
      type: 'isolated-workspace',
      pathTraversalProtection: true,
      commandAllowlist: true,
      maxExecutionTimeoutMs: 60000,
    },
    ai: {
      provider: process.env.AI_API_KEY ? 'live-llm' : 'deterministic-heuristic',
      model: process.env.AI_MODEL || 'gpt-4o-mini',
    },
  });
}
