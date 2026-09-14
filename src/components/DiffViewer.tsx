import React from 'react';
import { parseDiffLines } from '@/lib/ai/diffUtil';
import { FileCode, Plus, Minus, Info, AlertCircle } from 'lucide-react';

interface DiffViewerProps {
  filePath: string;
  diff: string;
  reason?: string;
  issueTitle?: string;
  className?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  filePath,
  diff,
  reason,
  issueTitle,
  className = '',
}) => {
  const diffLines = parseDiffLines(diff || '');
  const additions = diffLines.filter((l) => l.type === 'add').length;
  const deletions = diffLines.filter((l) => l.type === 'delete').length;
  const totalChanged = additions + deletions;

  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs ${className}`}>
      {/* File & Issue Header */}
      <div className="p-3.5 bg-slate-900 border-b border-slate-800 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="font-bold text-slate-100 text-sm">{filePath}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
              {totalChanged} lines modified
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              <Plus className="w-3.5 h-3.5" />
              <span>+{additions}</span>
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50">
              <Minus className="w-3.5 h-3.5" />
              <span>-{deletions}</span>
            </span>
          </div>
        </div>

        {/* Affected Issue & Reason for change (Item 6) */}
        {(issueTitle || reason) && (
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            {issueTitle && (
              <div className="flex items-start gap-1.5 text-slate-300">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-400">Target Issue:</strong> {issueTitle}
                </span>
              </div>
            )}
            {reason && (
              <div className="flex items-start gap-1.5 text-slate-300">
                <Info className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-400">Reason:</strong> {reason}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Code diff lines */}
      <div className="overflow-x-auto max-h-[420px] py-2">
        <table className="w-full border-collapse">
          <tbody>
            {diffLines.map((line, idx) => {
              if (line.type === 'header') {
                return (
                  <tr key={idx} className="bg-slate-900/60 text-slate-500 select-none">
                    <td className="w-10 px-2 py-0.5 text-right border-r border-slate-800/60">...</td>
                    <td className="w-10 px-2 py-0.5 text-right border-r border-slate-800/60">...</td>
                    <td className="w-6 px-1 text-center font-bold text-slate-600">~</td>
                    <td className="px-3 py-0.5 whitespace-pre font-semibold text-teal-400/80">
                      {line.content}
                    </td>
                  </tr>
                );
              }

              if (line.type === 'add') {
                return (
                  <tr key={idx} className="bg-emerald-950/40 text-emerald-300 hover:bg-emerald-950/60">
                    <td className="w-10 px-2 py-0.5 text-right text-slate-600 border-r border-slate-800/60 select-none">
                      {line.oldLineNumber || ''}
                    </td>
                    <td className="w-10 px-2 py-0.5 text-right text-emerald-400 border-r border-emerald-900/40 select-none font-bold">
                      {line.newLineNumber}
                    </td>
                    <td className="w-6 px-1 text-center font-bold text-emerald-400 select-none">+</td>
                    <td className="px-3 py-0.5 whitespace-pre font-medium">{line.content}</td>
                  </tr>
                );
              }

              if (line.type === 'delete') {
                return (
                  <tr key={idx} className="bg-rose-950/40 text-rose-300 hover:bg-rose-950/60">
                    <td className="w-10 px-2 py-0.5 text-right text-rose-400 border-r border-rose-900/40 select-none font-bold">
                      {line.oldLineNumber}
                    </td>
                    <td className="w-10 px-2 py-0.5 text-right text-slate-600 border-r border-slate-800/60 select-none">
                      {line.newLineNumber || ''}
                    </td>
                    <td className="w-6 px-1 text-center font-bold text-rose-400 select-none">-</td>
                    <td className="px-3 py-0.5 whitespace-pre font-medium">{line.content}</td>
                  </tr>
                );
              }

              return (
                <tr key={idx} className="text-slate-300 hover:bg-slate-900/50">
                  <td className="w-10 px-2 py-0.5 text-right text-slate-600 border-r border-slate-800/60 select-none">
                    {line.oldLineNumber}
                  </td>
                  <td className="w-10 px-2 py-0.5 text-right text-slate-600 border-r border-slate-800/60 select-none">
                    {line.newLineNumber}
                  </td>
                  <td className="w-6 px-1 text-center text-slate-600 select-none"> </td>
                  <td className="px-3 py-0.5 whitespace-pre text-slate-400">{line.content}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
