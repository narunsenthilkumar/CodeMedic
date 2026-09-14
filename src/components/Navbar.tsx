'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FolderGit2, Plus, Play, Menu, Zap } from 'lucide-react';

interface NavbarProps {
  repoName?: string;
  healthScore?: number;
  scanStatus?: string;
  onLoadDemo?: () => void;
  isLoadingDemo?: boolean;
  onToggleMobileNav?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  repoName = 'codemedic-demo-repository',
  healthScore,
  scanStatus = 'Active',
  onLoadDemo,
  isLoadingDemo = false,
  onToggleMobileNav,
}) => {
  const router = useRouter();

  const handleDemoClick = async () => {
    if (onLoadDemo) {
      onLoadDemo();
    } else {
      try {
        const res = await fetch('/api/demo', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          router.push('/dashboard');
          router.refresh();
        }
      } catch (err) {
        console.error('Failed to load demo', err);
      }
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
      {/* Left side: Mobile Toggle & Active Repo Badge */}
      <div className="flex items-center gap-3">
        {onToggleMobileNav && (
          <button
            onClick={onToggleMobileNav}
            aria-label="Open navigation menu"
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg text-xs font-mono">
          <FolderGit2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="font-semibold text-slate-200 truncate max-w-[140px] sm:max-w-xs">
            {repoName}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Repository Active" />
        </div>

        {healthScore !== undefined && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/70 border border-slate-700/60 rounded-md text-xs font-mono">
            <span className="text-slate-400">Health:</span>
            <span
              className={`font-bold ${
                healthScore >= 90
                  ? 'text-emerald-400'
                  : healthScore >= 70
                  ? 'text-teal-400'
                  : 'text-amber-400'
              }`}
            >
              {healthScore}/100
            </span>
          </div>
        )}
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2">
        {/* Fast Demo Repository Button */}
        <button
          onClick={handleDemoClick}
          disabled={isLoadingDemo}
          aria-label="Load interactive demo repository"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 rounded-lg text-xs font-mono font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          title="Instantly loads broken hackathon demo repository"
        >
          <Play className="w-3.5 h-3.5 text-teal-400 fill-teal-400/20 shrink-0" />
          <span>{isLoadingDemo ? 'Loading...' : 'Open Demo Repo'}</span>
        </button>

        {/* Import Repo Button */}
        <Link
          href="/dashboard/import"
          aria-label="Import a new repository"
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Import Repo</span>
        </Link>
      </div>
    </header>
  );
};
