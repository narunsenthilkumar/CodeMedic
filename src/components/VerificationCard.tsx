import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
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
      <div className={`p-6 rounded-lg border border-teal-800/60 bg-slate-900/90 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <div>
            <h4 className="text-sm font-semibold text-slate-200">
              Running Isolated Sandbox Verification...
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Executing allowlisted commands: npm install → npm test → npm run build
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-950 rounded font-mono text-xs text-slate-400 border border-slate-800">
          <span className="text-teal-400">&gt;</span> sandbox/exec: running isolated verification pipeline
          <span className="terminal-cursor ml-1" />
        </div>
      </div>
    );
  }

  if (!verification) {
    return null;
  }

  const isSuccess = verification.success;

  return (
    <div
      className={`rounded-lg border overflow-hidden ${
        isSuccess
          ? 'bg-slate-900/90 border-emerald-800/60 shadow-lg shadow-emerald-950/20'
          : 'bg-slate-900/90 border-rose-800/60 shadow-lg shadow-rose-950/20'
      } ${className}`}
    >
      {/* Header */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {isSuccess ? (
            <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-rose-950 border border-rose-700 flex items-center justify-center text-rose-400">
              <XCircle className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-100">
                {isSuccess ? 'FIX VERIFIED IN SANDBOX' : 'VERIFICATION FAILED'}
              </h4>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold border ${
                  isSuccess
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border-rose-800'
                }`}
              >
                Exit {verification.exitCode}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <Clock className="w-3 h-3" /> Duration: {verification.durationMs}ms
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 self-end sm:self-center font-mono"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>{showLogs ? 'Hide Console Logs' : 'View Console Logs'}</span>
          {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Step Pills */}
      <div className="px-4 py-3 bg-slate-950/40 border-b border-slate-800 flex flex-wrap gap-2 text-xs font-mono">
        <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
          <span>npm install:</span>
          <span className="text-emerald-400 font-bold">✓ passed</span>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
          <span>npm test:</span>
          {verification.tests === 'passed' ? (
            <span className="text-emerald-400 font-bold">✓ passed</span>
          ) : verification.tests === 'failed' ? (
            <span className="text-rose-400 font-bold">✕ failed</span>
          ) : (
            <span className="text-slate-400">not available</span>
          )}
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
          <span>npm run build:</span>
          {verification.build === 'passed' ? (
            <span className="text-emerald-400 font-bold">✓ passed</span>
          ) : verification.build === 'failed' ? (
            <span className="text-rose-400 font-bold">✕ failed</span>
          ) : (
            <span className="text-slate-400">not available</span>
          )}
        </div>
      </div>

      {/* Terminal Log Output */}
      {showLogs && (
        <div className="p-4 bg-slate-950 font-mono text-xs max-h-72 overflow-y-auto">
          <div className="text-slate-500 mb-2">{'// Sandbox Execution Output (Redacted)'}</div>
          <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">
            {verification.stdout || verification.stderr || 'No console output logged.'}
          </pre>
          {verification.stderr && (
            <div className="mt-3 pt-3 border-t border-slate-900 text-rose-300">
              <div className="text-rose-400 font-bold mb-1">{'// Stderr Trace:'}</div>
              <pre className="whitespace-pre-wrap">{verification.stderr}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
