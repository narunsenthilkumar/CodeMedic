import React from 'react';
import { CheckCircle2, XCircle, Circle, RefreshCw } from 'lucide-react';

export interface TimelineStep {
  name: string;
  status: 'completed' | 'current' | 'failed' | 'upcoming';
  description?: string;
  attemptNumber?: number;
}

interface RepairTimelineProps {
  currentStage:
    | 'scan'
    | 'detection'
    | 'diagnosis'
    | 'planning'
    | 'patch'
    | 'approval'
    | 'applied'
    | 'verification'
    | 'verified'
    | 'failed';
  attempts?: Array<{
    attemptNumber: number;
    success: boolean;
    error?: string;
  }>;
  className?: string;
}

export const RepairTimeline: React.FC<RepairTimelineProps> = ({
  currentStage,
  attempts = [],
  className = '',
}) => {
  const baseSteps: Array<{ key: string; label: string }> = [
    { key: 'scan', label: 'Repository Scan' },
    { key: 'detection', label: 'Issue Detection' },
    { key: 'diagnosis', label: 'AI Diagnosis' },
    { key: 'planning', label: 'Repair Plan' },
    { key: 'patch', label: 'Patch Generated' },
    { key: 'approval', label: 'Human Approval' },
    { key: 'applied', label: 'Patch Applied' },
    { key: 'verification', label: 'Verification' },
    { key: 'verified', label: 'Fix Confirmed' },
  ];

  const stageIndexMap: Record<string, number> = {
    scan: 0,
    detection: 1,
    diagnosis: 2,
    planning: 3,
    patch: 4,
    approval: 5,
    applied: 6,
    verification: 7,
    verified: 8,
    failed: 7,
  };

  const currentIdx = stageIndexMap[currentStage] ?? 0;

  return (
    <div className={`p-4 bg-slate-900 border border-slate-800 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
          Closed-Loop Verification Timeline
        </h4>
        {attempts.length > 1 && (
          <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
            <RefreshCw className="w-3 h-3 animate-spin" /> Self-Healing Active ({attempts.length} attempts)
          </span>
        )}
      </div>

      {/* Main Steps Progression */}
      <div className="relative">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-9 gap-2">
          {baseSteps.map((step, idx) => {
            const isDone = idx < currentIdx || (idx === 8 && currentStage === 'verified');
            const isCurrent = idx === currentIdx && currentStage !== 'verified';
            const isFailed = idx === currentIdx && currentStage === 'failed';

            return (
              <div
                key={step.key}
                className={`p-2 rounded border flex flex-col items-center text-center transition-all ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                    : isCurrent
                    ? 'bg-teal-950/40 border-teal-500/60 text-teal-200 ring-1 ring-teal-500/30'
                    : isFailed
                    ? 'bg-rose-950/30 border-rose-800/60 text-rose-300'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                }`}
              >
                <div className="mb-1">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isFailed ? (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <span className="text-[11px] font-medium leading-tight">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-Attempt Self-Healing Retries (if any) */}
      {attempts.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
          <div className="text-[11px] font-mono text-slate-400 uppercase">
            Execution Attempt Audit:
          </div>
          <div className="space-y-1.5 font-mono text-xs">
            {attempts.map((att) => (
              <div
                key={att.attemptNumber}
                className={`flex items-center justify-between px-3 py-1.5 rounded border ${
                  att.success
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {att.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span>Attempt {att.attemptNumber}: {att.success ? 'Verification Passed' : 'Verification Failed'}</span>
                </div>
                {att.error && (
                  <span className="text-[10px] text-slate-400 truncate max-w-xs">
                    {att.error}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
