import React from 'react';
import { Hammer, Package, FileCode, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface HealthBreakdownProps {
  build: number;
  dependencies: number;
  codeQuality: number;
  security: number;
  tests: number;
  className?: string;
}

export const HealthBreakdown: React.FC<HealthBreakdownProps> = ({
  build,
  dependencies,
  codeQuality,
  security,
  tests,
  className = '',
}) => {
  const categories = [
    {
      name: 'Build',
      score: build,
      weight: '25%',
      icon: Hammer,
      color: build >= 90 ? 'bg-emerald-500' : build >= 60 ? 'bg-amber-500' : 'bg-rose-500',
      textColor: build >= 90 ? 'text-emerald-400' : build >= 60 ? 'text-amber-400' : 'text-rose-400',
    },
    {
      name: 'Dependencies',
      score: dependencies,
      weight: '20%',
      icon: Package,
      color: dependencies >= 90 ? 'bg-emerald-500' : dependencies >= 60 ? 'bg-amber-500' : 'bg-rose-500',
      textColor: dependencies >= 90 ? 'text-emerald-400' : dependencies >= 60 ? 'text-amber-400' : 'text-rose-400',
    },
    {
      name: 'Tests',
      score: tests,
      weight: '20%',
      icon: CheckCircle2,
      color: tests >= 90 ? 'bg-emerald-500' : tests >= 60 ? 'bg-amber-500' : 'bg-rose-500',
      textColor: tests >= 90 ? 'text-emerald-400' : tests >= 60 ? 'text-amber-400' : 'text-rose-400',
    },
    {
      name: 'Code Quality',
      score: codeQuality,
      weight: '15%',
      icon: FileCode,
      color: codeQuality >= 90 ? 'bg-emerald-500' : codeQuality >= 60 ? 'bg-amber-500' : 'bg-rose-500',
      textColor: codeQuality >= 90 ? 'text-emerald-400' : codeQuality >= 60 ? 'text-amber-400' : 'text-rose-400',
    },
    {
      name: 'Security (MVP)',
      score: security,
      weight: '20%',
      icon: ShieldAlert,
      color: security >= 90 ? 'bg-emerald-500' : security >= 60 ? 'bg-amber-500' : 'bg-rose-500',
      textColor: security >= 90 ? 'text-emerald-400' : security >= 60 ? 'text-amber-400' : 'text-rose-400',
    },
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 ${className}`}>
      {categories.map((cat) => {
        const Icon = cat.icon;
        return (
          <div
            key={cat.name}
            className="p-3 bg-slate-900/90 border border-slate-800/80 rounded-lg hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <div className="flex items-center gap-1.5 font-medium">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                <span>{cat.name}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">wt: {cat.weight}</span>
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <span className={`text-xl font-bold font-mono ${cat.textColor}`}>
                {cat.score}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ 100</span>
            </div>

            {/* Micro progress bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full ${cat.color} transition-all duration-700`}
                style={{ width: `${Math.max(4, cat.score)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
