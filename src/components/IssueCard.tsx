import React from 'react';
import { SeverityBadge } from './SeverityBadge';
import { ConfidenceBadge } from './ConfidenceBadge';
import { FileCode, Wrench, AlertCircle } from 'lucide-react';

interface IssueCardProps {
  issue: {
    id: string;
    title: string;
    description: string;
    category: string;
    severity: string;
    filePath?: string;
    lineNumber?: number;
    confidence: number;
    evidence: string[] | string;
    rootCause?: string;
    priority?: number;
    status: string;
  };
  onGenerateRepair?: (issueId: string) => void;
  isRepairing?: boolean;
}

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  onGenerateRepair,
  isRepairing = false,
}) => {
  const evidenceList: string[] = Array.isArray(issue.evidence)
    ? issue.evidence
    : typeof issue.evidence === 'string'
    ? JSON.parse(issue.evidence || '[]')
    : [];

  const isResolved = issue.status === 'verified' || issue.status === 'applied';

  return (
    <div
      className={`p-5 rounded-lg border transition-all ${
        isResolved
          ? 'bg-slate-900/60 border-slate-800 opacity-75'
          : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-sm'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <SeverityBadge severity={issue.severity} />
            <ConfidenceBadge confidence={issue.confidence} />
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {issue.category}
            </span>
            {issue.priority && (
              <span className="text-xs px-2 py-0.5 rounded bg-teal-950/60 border border-teal-800/40 text-teal-300 font-mono">
                Priority {issue.priority}
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-slate-100">{issue.title}</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {issue.description}
          </p>
        </div>

        {onGenerateRepair && !isResolved && (
          <button
            onClick={() => onGenerateRepair(issue.id)}
            disabled={isRepairing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded text-xs font-semibold self-start shrink-0 transition-colors shadow-sm shadow-teal-900"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{isRepairing ? 'Synthesizing...' : 'Generate Repair'}</span>
          </button>
        )}

        {isResolved && (
          <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800 self-start shrink-0">
            ✓ Resolved
          </span>
        )}
      </div>

      {/* File location */}
      {issue.filePath && (
        <div className="mt-3 flex items-center gap-2 text-xs font-mono text-slate-400">
          <FileCode className="w-3.5 h-3.5 text-teal-400" />
          <span>
            {issue.filePath}
            {issue.lineNumber ? `:${issue.lineNumber}` : ''}
          </span>
        </div>
      )}

      {/* Evidence checklist */}
      {evidenceList.length > 0 && (
        <div className="mt-3 p-3 bg-slate-950/70 rounded border border-slate-800/80">
          <div className="text-[11px] font-mono font-semibold uppercase text-slate-400 mb-1.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-teal-400" />
            <span>Verifiable Evidence:</span>
          </div>
          <ul className="space-y-1 text-xs text-slate-300 font-mono">
            {evidenceList.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-teal-400">•</span>
                <span className="break-all">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Root cause if diagnosed */}
      {issue.rootCause && (
        <div className="mt-2 text-xs text-teal-300/90 font-mono">
          <span className="font-semibold text-teal-400">AI Root Cause: </span>
          {issue.rootCause}
        </div>
      )}
    </div>
  );
};
