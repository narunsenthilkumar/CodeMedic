'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderGit2,
  AlertTriangle,
  Wrench,
  CheckSquare,
  Activity,
  Settings,
  ShieldCheck,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Repositories', href: '/dashboard/repositories', icon: FolderGit2 },
    { name: 'Issues', href: '/dashboard/issues', icon: AlertTriangle },
    { name: 'Repairs', href: '/dashboard/repairs', icon: Wrench },
    { name: 'Verification', href: '/dashboard/verification', icon: CheckSquare },
    { name: 'Activity', href: '/dashboard/activity', icon: Activity },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 hidden md:flex">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-mono font-bold text-lg">
            ✚
          </div>
          <div>
            <div className="font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
              <span>CodeMedic</span>
              <span className="text-[10px] bg-teal-950 border border-teal-800 text-teal-300 px-1.5 py-0.2 rounded font-mono">
                v0.1
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Closed-Loop AI Repair</div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer System Badge */}
      <div className="p-4 border-t border-slate-800">
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Sandbox Isolation</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-snug">
            Restricted workspace. Host filesystem protected.
          </p>
        </div>
      </div>
    </aside>
  );
};
