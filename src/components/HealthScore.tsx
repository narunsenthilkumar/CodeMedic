import React from 'react';

interface HealthScoreProps {
  score: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showStatus?: boolean;
}

export const HealthScore: React.FC<HealthScoreProps> = ({
  score,
  size = 'md',
  label = 'Repository Health',
  showStatus = true,
}) => {
  // Determine color and rating label
  let color = 'text-rose-400 stroke-rose-500';
  let badgeColor = 'bg-rose-950/80 text-rose-300 border-rose-800/60';
  let status = 'Critical Issues';

  if (score >= 90) {
    color = 'text-emerald-400 stroke-emerald-500';
    badgeColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';
    status = 'Optimal Health';
  } else if (score >= 75) {
    color = 'text-teal-400 stroke-teal-500';
    badgeColor = 'bg-teal-950/80 text-teal-300 border-teal-800/60';
    status = 'Good Condition';
  } else if (score >= 50) {
    color = 'text-amber-400 stroke-amber-500';
    badgeColor = 'bg-amber-950/80 text-amber-300 border-amber-800/60';
    status = 'Degraded';
  }

  const radius = size === 'lg' ? 44 : size === 'sm' ? 22 : 34;
  const strokeWidth = size === 'lg' ? 7 : size === 'sm' ? 4 : 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const svgSize = (radius + strokeWidth) * 2;

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex items-center justify-center">
        <svg
          width={svgSize}
          height={svgSize}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Foreground progress circle */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className={`${color} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span
            className={`font-mono font-bold tracking-tight ${
              size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-sm' : 'text-xl'
            }`}
          >
            {score}
          </span>
          {size === 'lg' && (
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
              / 100
            </span>
          )}
        </div>
      </div>

      {showStatus && (
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-400 font-mono">
            {label}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded border font-medium ${badgeColor}`}>
              {status}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
