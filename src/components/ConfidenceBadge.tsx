import React from 'react';

interface ConfidenceBadgeProps {
  confidence: number; // 0.0 to 1.0
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, className = '' }) => {
  const percent = Math.round(confidence * 100);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border border-teal-800/50 bg-teal-950/40 text-teal-300 ${className}`}
      title={`AI Confidence Rating: ${percent}%`}
    >
      <span className="text-teal-400 font-semibold mr-1">AI</span> {percent}% Confidence
    </span>
  );
};
