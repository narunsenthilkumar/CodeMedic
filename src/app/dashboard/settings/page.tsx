'use client';

import React, { useEffect, useState } from 'react';
import { Settings, ShieldCheck, Cpu, Database, Terminal, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [healthData, setHealthData] = useState<any>(null);

  useEffect(() => {
    async function loadHealth() {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setHealthData(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-teal-400" />
          <span>System & Sandbox Configuration</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review execution environment policies, AI provider status, and security limits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sandbox Architecture */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-teal-400 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Isolated Sandbox Policies</span>
          </div>
          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Sandbox Type:</span>
              <span className="text-teal-300">Isolated Workspace Directory</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Command Allowlist:</span>
              <span className="text-emerald-400">npm install / test / build / lint</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Execution Timeout:</span>
              <span className="text-slate-200">60,000ms</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Path Traversal Defense:</span>
              <span className="text-emerald-400">Enforced (Rejects .. escapes)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Secret Redaction:</span>
              <span className="text-emerald-400">Active (sk-*, ghp_*, passwords)</span>
            </div>
          </div>
        </div>

        {/* AI Agent Engine */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-teal-400 font-semibold text-sm">
            <Cpu className="w-4 h-4" />
            <span>AI Architecture & Engine</span>
          </div>
          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Active Engine:</span>
              <span className="text-emerald-400 font-bold">
                {healthData?.ai?.provider === 'live-llm' ? 'Live LLM (OpenAI/Gemini)' : 'Deterministic AST Heuristic (Zero-Config)'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Specialized Agents:</span>
              <span className="text-slate-200">Diagnostician, Planner, PatchGen, Reviewer</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Max Healing Retries:</span>
              <span className="text-amber-400 font-bold">3 attempts</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Human Approval:</span>
              <span className="text-emerald-400">Mandatory (Never auto-applies)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Database & Runtime Info */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-teal-400 font-semibold text-sm">
          <Database className="w-4 h-4" />
          <span>Runtime & Database Architecture</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-slate-300">
          <div className="p-3 bg-slate-950 rounded border border-slate-800">
            <div className="text-slate-500 uppercase text-[10px]">Database Engine</div>
            <div className="font-bold text-slate-200 mt-1">Prisma + SQLite (dev.db)</div>
            <div className="text-[10px] text-slate-400 mt-0.5">PostgreSQL / Supabase compatible</div>
          </div>
          <div className="p-3 bg-slate-950 rounded border border-slate-800">
            <div className="text-slate-500 uppercase text-[10px]">Node Platform</div>
            <div className="font-bold text-slate-200 mt-1">{healthData?.system?.platform || process.platform} ({healthData?.system?.nodeVersion || 'v20+'})</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Next.js 14 App Router</div>
          </div>
          <div className="p-3 bg-slate-950 rounded border border-slate-800">
            <div className="text-slate-500 uppercase text-[10px]">Product Tagline</div>
            <div className="font-bold text-teal-400 mt-1">&quot;Prove the fix works.&quot;</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Closed-loop software repair</div>
          </div>
        </div>
      </div>
    </div>
  );
}
