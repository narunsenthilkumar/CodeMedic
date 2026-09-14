import React from 'react';

interface SeverityBadgeProps {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info' | string;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className = '' }) => {
  const norm = severity.toLowerCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  if (norm === 'critical') {
    colorClasses = 'bg-rose-950/80 text-rose-300 border-rose-800/60 shadow-sm shadow-rose-950';
  } else if (norm === 'high') {
    colorClasses = 'bg-amber-950/80 text-amber-300 border-amber-800/60';
  } else if (norm === 'medium') {
    colorClasses = 'bg-yellow-950/70 text-yellow-300 border-yellow-800/50';
  } else if (norm === 'low') {
    colorClasses = 'bg-blue-950/60 text-blue-300 border-blue-800/40';
  } else if (norm === 'info') {
    colorClasses = 'bg-slate-900 text-slate-400 border-slate-800';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${colorClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {severity}
    </span>
  );
};
