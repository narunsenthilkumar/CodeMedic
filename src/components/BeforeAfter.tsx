import React from 'react';
import { ArrowRight, CheckCircle2, XCircle, TrendingUp, Award } from 'lucide-react';

interface BeforeAfterProps {
  beforeHealth?: number;
  afterHealth?: number;
  beforeIssues?: number;
  afterIssues?: number;
  buildStatusBefore?: string;
  buildStatusAfter?: string;
  testsBefore?: string;
  testsAfter?: string;
  isVerified?: boolean;
  className?: string;
}

export const BeforeAfter: React.FC<BeforeAfterProps> = ({
  beforeHealth = 42,
  afterHealth = 94,
  beforeIssues = 5,
  afterIssues = 0,
  buildStatusBefore = 'FAILED',
  buildStatusAfter = 'PASSED',
  testsBefore = '1 failing',
  testsAfter = 'All Passing',
  isVerified = true,
  className = '',
}) => {
  return (
    <div
      className={`p-6 rounded-xl border ${
        isVerified
          ? 'bg-gradient-to-b from-slate-900 via-slate-900/90 to-teal-950/20 border-teal-500/30 shadow-lg shadow-teal-950/20'
          : 'bg-slate-900 border-slate-800'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-teal-500/20 text-teal-400">
              <Award className="w-4 h-4" />
            </span>
            <h3 className="text-base font-semibold text-slate-100">
              Closed-Loop Repair Impact
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Measurable state transformation verified in isolated execution workspace.
          </p>
        </div>

        {isVerified && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-mono font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            FIX VERIFIED
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        {/* Metric 1: Health Score */}
        <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <div className="text-xs uppercase font-mono text-slate-400">
            Repository Health
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-2xl font-bold font-mono text-rose-400">
              {beforeHealth}
            </span>
            <div className="flex items-center text-teal-400">
              <span className="w-8 border-t border-dashed border-teal-500/50 mx-1" />
              <ArrowRight className="w-4 h-4" />
            </div>
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {afterHealth}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono mt-2">
            <TrendingUp className="w-3 h-3" />
            <span>+{afterHealth - beforeHealth} pts gain</span>
          </div>
        </div>

        {/* Metric 2: Open Issues */}
        <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <div className="text-xs uppercase font-mono text-slate-400">
            Open Issues
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-2xl font-bold font-mono text-amber-400">
              {beforeIssues}
            </span>
            <div className="flex items-center text-teal-400">
              <span className="w-8 border-t border-dashed border-teal-500/50 mx-1" />
              <ArrowRight className="w-4 h-4" />
            </div>
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {afterIssues}
            </span>
          </div>
          <div className="text-[11px] text-emerald-400 font-mono mt-2">
            Resolved: {beforeIssues - afterIssues}/{beforeIssues}
          </div>
        </div>

        {/* Metric 3: Build Status */}
        <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <div className="text-xs uppercase font-mono text-slate-400">
            Build Execution
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm font-semibold font-mono text-rose-400 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> {buildStatusBefore}
            </span>
            <ArrowRight className="w-4 h-4 text-teal-400" />
            <span className="text-sm font-semibold font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {buildStatusAfter}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-2">
            npm run build
          </div>
        </div>

        {/* Metric 4: Test Suite */}
        <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <div className="text-xs uppercase font-mono text-slate-400">
            Test Verification
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm font-semibold font-mono text-amber-400">
              {testsBefore}
            </span>
            <ArrowRight className="w-4 h-4 text-teal-400" />
            <span className="text-sm font-semibold font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {testsAfter}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-2">
            npm test
          </div>
        </div>
      </div>
    </div>
  );
};
