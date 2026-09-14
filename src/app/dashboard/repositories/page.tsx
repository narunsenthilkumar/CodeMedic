'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FolderGit2, RefreshCw, ExternalLink, ArrowRight } from 'lucide-react';
import { HealthScore } from '@/components/HealthScore';

export default function RepositoriesPage() {
  const [repositories, setRepositories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRepos() {
      try {
        const res = await fetch('/api/repositories');
        const data = await res.json();
        setRepositories(data.repositories || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadRepos();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-teal-400" />
            <span>Monitored Repositories</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Repositories imported for autonomous diagnosis and verification.
          </p>
        </div>

        <Link
          href="/dashboard/import"
          className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold font-mono transition-colors shadow-sm"
        >
          + Import New Repo
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : repositories.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="text-xs font-mono text-slate-400">No repositories found.</div>
          <Link href="/dashboard/import" className="text-xs text-teal-400 font-mono hover:underline">
            Import your first repository
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repositories.map((repo) => {
            const latestScan = repo.scans?.[0];
            const health = latestScan?.healthScore ?? 42;

            return (
              <div
                key={repo.id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                        <span>{repo.owner}/{repo.name}</span>
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-1">
                        <span>{repo.language}</span>
                        <span>•</span>
                        <span>{repo.framework}</span>
                        <span>•</span>
                        <span>{repo.packageManager}</span>
                      </div>
                    </div>

                    <HealthScore score={health} size="sm" showStatus={false} />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">
                    Latest scan: {new Date(latestScan?.startedAt || repo.createdAt).toLocaleTimeString()}
                  </span>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1 text-teal-400 hover:text-teal-300 font-semibold"
                  >
                    <span>View Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
