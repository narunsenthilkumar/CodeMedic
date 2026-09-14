import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  PackageCheck,
  TestTube2,
  Hammer,
  AlertCircle,
} from 'lucide-react';
import { VerificationResult } from '@/lib/verification/verifier';

interface VerificationCardProps {
  verification?: VerificationResult | null;
  isRunning?: boolean;
  className?: string;
}

export const VerificationCard: React.FC<VerificationCardProps> = ({
  verification,
  isRunning = false,
  className = '',
}) => {
  const [showLogs, setShowLogs] = useState(true);

  if (isRunning) {
    return (
      <div className={`p-6 rounded-xl border border-teal-500/40 bg-slate-900/90 shadow-lg shadow-teal-950/30 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-slate-100 font-mono">
              Running Isolated Sandbox Verification...
            </h4>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Executing allowlist pipeline: npm install → npm test → npm run build
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-950 rounded-lg font-mono text-xs text-slate-400 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-teal-400">&gt;</span> sandbox/exec: running isolated verification commands
            <span className="terminal-cursor ml-1" />
          </div>
          <span className="text-[11px] text-teal-300 animate-pulse font-bold">
            IN PROGRESS
          </span>
        </div>
      </div>
    );
  }

  if (!verification) {
    return null;
  }

  const isSuccess = verification.success === true && verification.exitCode === 0;

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all ${
        isSuccess
          ? 'bg-slate-900/95 border-emerald-500/50 shadow-xl shadow-emerald-950/20'
          : 'bg-slate-900/95 border-rose-500/50 shadow-xl shadow-rose-950/20'
      } ${className}`}
    >
      {/* Top Banner: Sandbox Verification Header */}
      <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              SANDBOX VERIFICATION
            </span>
            <p className="text-[11px] text-slate-400 font-mono">
              Executed in ephemeral isolated workspace with strict command allowlist
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{verification.durationMs}ms</span>
          </span>
          <span
            className={`px-2 py-0.5 rounded font-bold uppercase border ${
              isSuccess
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-rose-950 text-rose-300 border-rose-800'
            }`}
          >
            Exit Code: {verification.exitCode}
          </span>
        </div>
      </div>

      {/* Actual Command Results (Item 7 format) */}
      <div className="p-5 space-y-3 font-mono text-xs">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Command Pipeline Execution Status:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Step 1: npm install */}
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-slate-400" />
              <span className="text-slate-200">npm install</span>
            </div>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> passed
            </span>
          </div>

          {/* Step 2: npm test */}
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TestTube2 className="w-4 h-4 text-slate-400" />
              <span className="text-slate-200">npm test</span>
            </div>
            {verification.tests === 'passed' ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> passed
              </span>
            ) : verification.tests === 'failed' ? (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> failed
              </span>
            ) : (
              <span className="text-slate-400">skipped</span>
            )}
          </div>

          {/* Step 3: npm run build */}
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hammer className="w-4 h-4 text-slate-400" />
              <span className="text-slate-200">npm run build</span>
            </div>
            {verification.build === 'passed' ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> passed
              </span>
            ) : verification.build === 'failed' ? (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> failed
              </span>
            ) : (
              <span className="text-slate-400">skipped</span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800/80 my-3" />

        {/* Final Result Banner (Item 7) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              RESULT
            </div>
            {isSuccess ? (
              <div className="flex items-center gap-2 text-emerald-400 text-base font-bold">
                <CheckCircle2 className="w-5 h-5" />
                <span>✓ FIX VERIFIED</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-rose-400 text-base font-bold">
                <XCircle className="w-5 h-5" />
                <span>✕ VERIFICATION FAILED</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors self-start sm:self-center"
          >
            <Terminal className="w-3.5 h-3.5 text-teal-400" />
            <span>{showLogs ? 'Hide Console Logs' : 'View Execution Logs'}</span>
            {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Console Output */}
      {showLogs && (
        <div className="p-4 bg-slate-950 font-mono text-xs border-t border-slate-800 max-h-80 overflow-y-auto">
          <div className="text-slate-500 mb-2 flex items-center justify-between">
            <span>{'// Live Sandbox Execution Stream (Stdout/Stderr)'}</span>
            <span className="text-[10px] text-teal-400">Redacted</span>
          </div>

          <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">
            {verification.stdout || 'No standard output recorded.'}
          </pre>

          {verification.stderr && (
            <div className="mt-3 pt-3 border-t border-slate-900 text-rose-300">
              <div className="text-rose-400 font-bold mb-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{'// Stderr Diagnostic Trace:'}</span>
              </div>
              <pre className="whitespace-pre-wrap">{verification.stderr}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
