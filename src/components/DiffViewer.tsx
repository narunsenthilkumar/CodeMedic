import React from 'react';
import { parseDiffLines } from '@/lib/ai/diffUtil';
import { FileCode, Plus, Minus } from 'lucide-react';

interface DiffViewerProps {
  filePath: string;
  diff: string;
  className?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  filePath,
  diff,
  className = '',
}) => {
  const diffLines = parseDiffLines(diff || '');

  return (
    <div className={`rounded-lg border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs ${className}`}>
      {/* File Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-slate-300">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-teal-400" />
          <span className="font-semibold text-slate-200">{filePath}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400">
            <Plus className="w-3 h-3" />
            {diffLines.filter((l) => l.type === 'add').length} additions
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <Minus className="w-3 h-3" />
            {diffLines.filter((l) => l.type === 'delete').length} deletions
          </span>
        </div>
      </div>

      {/* Code diff lines */}
      <div className="overflow-x-auto max-h-96 py-2">
        <table className="w-full border-collapse">
          <tbody>
            {diffLines.map((line, idx) => {
              if (line.type === 'header') {
                return (
                  <tr key={idx} className="bg-slate-900/60 text-slate-500 select-none">
                    <td className="w-10 px-2 py-0.5 text-right border-r border-slate-800/60">...</td>
                    <td className="w-10 px-2 py-0.5 text-right border-r border-slate-800/60">...</td>
                    <td className="w-6 px-1 text-center font-bold">~</td>
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
                    <td className="w-10 px-2 py-0.5 text-right text-emerald-500/80 border-r border-emerald-900/40 select-none font-bold">
                      {line.newLineNumber}
                    </td>
                    <td className="w-6 px-1 text-center font-bold text-emerald-400 select-none">+</td>
                    <td className="px-3 py-0.5 whitespace-pre">{line.content}</td>
                  </tr>
                );
              }

              if (line.type === 'delete') {
                return (
                  <tr key={idx} className="bg-rose-950/40 text-rose-300 hover:bg-rose-950/60">
                    <td className="w-10 px-2 py-0.5 text-right text-rose-500/80 border-r border-rose-900/40 select-none font-bold">
                      {line.oldLineNumber}
                    </td>
                    <td className="w-10 px-2 py-0.5 text-right text-slate-600 border-r border-slate-800/60 select-none">
                      {line.newLineNumber || ''}
                    </td>
                    <td className="w-6 px-1 text-center font-bold text-rose-400 select-none">-</td>
                    <td className="px-3 py-0.5 whitespace-pre">{line.content}</td>
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
                  <td className="px-3 py-0.5 whitespace-pre">{line.content}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
