import React from 'react';
import { SeverityBadge } from './SeverityBadge';
import { ConfidenceBadge } from './ConfidenceBadge';
import { FileCode, Wrench, AlertCircle, CheckCircle2, ArrowRight, ShieldAlert } from 'lucide-react';

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

  // Format recommended strategy hint based on category/title
  const getRecommendedAction = () => {
    const title = issue.title.toLowerCase();
    if (title.includes('missing dependency') || issue.category === 'dependency') {
      return 'Install missing package and record in package.json manifest';
    }
    if (title.includes('import') || title.includes('export')) {
      return 'Restore correct named export signature in module';
    }
    if (title.includes('type') || issue.category === 'code') {
      return 'Fix TypeScript property assignment to match declared interface';
    }
    if (title.includes('env') || issue.category === 'configuration') {
      return 'Create .env.example configuration template';
    }
    if (title.includes('test') || issue.category === 'test') {
      return 'Correct test expectation to match verified implementation';
    }
    if (issue.category === 'security') {
      return 'Extract hardcoded secret to environment variable configuration';
    }
    return 'Generate verified atomic patch';
  };

  return (
    <div
      className={`p-5 rounded-xl border transition-all ${
        isResolved
          ? 'bg-slate-900/60 border-slate-800 opacity-80'
          : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-sm'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          {/* Badge Hierarchy Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={issue.severity} />
            <ConfidenceBadge confidence={issue.confidence} />
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono capitalize border border-slate-700">
              {issue.category}
            </span>
            {issue.priority && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-950/70 border border-teal-800/50 text-teal-300 font-mono font-medium">
                Priority: {issue.priority}/100
              </span>
            )}
          </div>

          {/* Title and description */}
          <h3 className="text-base font-bold text-slate-100">{issue.title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {issue.description}
          </p>

          {/* File location badge */}
          {issue.filePath && (
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
              <FileCode className="w-3.5 h-3.5 text-teal-400" />
              <span>
                {issue.filePath}
                {issue.lineNumber ? `:${issue.lineNumber}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="shrink-0 self-start">
          {onGenerateRepair && !isResolved && (
            <button
              onClick={() => onGenerateRepair(issue.id)}
              disabled={isRepairing}
              aria-label={`Generate repair for ${issue.title}`}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-teal-950/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              <Wrench className={`w-3.5 h-3.5 ${isRepairing ? 'animate-spin' : ''}`} />
              <span>{isRepairing ? 'Synthesizing Fix...' : 'Generate Repair'}</span>
            </button>
          )}

          {isResolved && (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resolved</span>
            </span>
          )}
        </div>
      </div>

      {/* Verifiable Evidence Checklist */}
      {evidenceList.length > 0 && (
        <div className="mt-3.5 p-3 bg-slate-950/80 rounded-lg border border-slate-800/80">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-teal-400" />
            <span>Verifiable Evidence:</span>
          </div>
          <ul className="space-y-1 text-xs text-slate-300 font-mono">
            {evidenceList.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-teal-400 font-bold">•</span>
                <span className="break-all">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Root Cause & Recommended Action */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
        <div className="p-2.5 bg-slate-950/50 rounded border border-slate-800/50">
          <span className="text-teal-400 font-bold block mb-1">AI Root Cause:</span>
          <span className="text-slate-300">
            {issue.rootCause || 'Diagnostic scanner identified pattern violation in repository.'}
          </span>
        </div>
        <div className="p-2.5 bg-slate-950/50 rounded border border-slate-800/50">
          <span className="text-slate-400 font-bold block mb-1">Recommended Action:</span>
          <span className="text-slate-200 flex items-center gap-1.5">
            <ArrowRight className="w-3 h-3 text-teal-400 shrink-0" />
            <span>{getRecommendedAction()}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
