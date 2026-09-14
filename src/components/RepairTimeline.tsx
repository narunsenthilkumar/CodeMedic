import React from 'react';
import { CheckCircle2, XCircle, Circle, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';

export type RepairStage =
  | 'detected'
  | 'diagnosed'
  | 'plan_created'
  | 'patch_generated'
  | 'waiting_approval'
  | 'approved'
  | 'patch_applied'
  | 'verifying'
  | 'verified'
  | 'failed';

export interface RepairAttempt {
  attemptNumber: number;
  success: boolean;
  error?: string;
  strategy?: string;
}

interface RepairTimelineProps {
  currentStage: RepairStage;
  attempts?: RepairAttempt[];
  className?: string;
}

export const RepairTimeline: React.FC<RepairTimelineProps> = ({
  currentStage,
  attempts = [],
  className = '',
}) => {
  const baseSteps: Array<{ key: RepairStage; label: string; number: number }> = [
    { key: 'detected', label: 'DETECTED', number: 1 },
    { key: 'diagnosed', label: 'DIAGNOSED', number: 2 },
    { key: 'plan_created', label: 'PLAN CREATED', number: 3 },
    { key: 'patch_generated', label: 'PATCH GENERATED', number: 4 },
    { key: 'waiting_approval', label: 'WAITING FOR APPROVAL', number: 5 },
    { key: 'approved', label: 'APPROVED', number: 6 },
    { key: 'patch_applied', label: 'PATCH APPLIED', number: 7 },
    { key: 'verifying', label: 'VERIFYING', number: 8 },
    { key: 'verified', label: 'VERIFIED', number: 9 },
  ];

  const stageOrder: Record<RepairStage, number> = {
    detected: 0,
    diagnosed: 1,
    plan_created: 2,
    patch_generated: 3,
    waiting_approval: 4,
    approved: 5,
    patch_applied: 6,
    verifying: 7,
    verified: 8,
    failed: 7, // Failed during verification
  };

  const currentIdx = stageOrder[currentStage] ?? 4;

  return (
    <div className={`p-5 bg-slate-900 border border-slate-800 rounded-xl ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span>Closed-Loop Repair Pipeline</span>
          </h4>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Strict human-in-the-loop authorization with sandbox verification
          </p>
        </div>

        {attempts.length > 1 && (
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-800">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
            <span>Self-Healing Loop: Attempt {attempts.length}/3</span>
          </span>
        )}
      </div>

      {/* 9-Stage Progress Track */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
        {baseSteps.map((step, idx) => {
          const isDone = idx < currentIdx || (idx === 8 && currentStage === 'verified');
          const isCurrent = idx === currentIdx && currentStage !== 'verified';
          const isFailed = currentStage === 'failed' && idx === 7;

          return (
            <div
              key={step.key}
              className={`p-2 rounded-lg border flex flex-col items-center justify-between text-center min-h-[72px] transition-all ${
                isDone
                  ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                  : isCurrent
                  ? 'bg-teal-950/60 border-teal-500 text-teal-200 ring-1 ring-teal-500/40 shadow-sm shadow-teal-950'
                  : isFailed
                  ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                  : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
              }`}
            >
              <span className="text-[9px] font-mono opacity-60">0{step.number}</span>
              <div className="my-1">
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
              <span className="text-[9px] font-mono font-bold tracking-tight leading-tight">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Multi-Attempt Self-Healing State Visualization (Item 8) */}
      {attempts.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 space-y-2">
          <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Self-Healing Execution Log</span>
            <span className="text-slate-500 font-normal">Cap: 3 attempts max</span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {attempts.map((att, index) => (
              <div
                key={att.attemptNumber}
                className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  att.success
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {att.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">
                      Repair Attempt {att.attemptNumber}:
                    </span>{' '}
                    <span>
                      {att.success ? 'Verification Passed (Exit 0)' : 'Verification Failed'}
                    </span>
                  </div>
                </div>

                {att.error && (
                  <span className="text-[10px] text-rose-300/80 truncate max-w-sm bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900/50">
                    Evidence: {att.error}
                  </span>
                )}

                {!att.success && index < attempts.length - 1 && (
                  <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" /> AI Adjusted Strategy
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
