'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IssueCard } from '@/components/IssueCard';
import { AlertTriangle, Filter } from 'lucide-react';

export default function IssuesPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadIssues() {
      try {
        const repoRes = await fetch('/api/repositories');
        const repoJson = await repoRes.json();
        const targetRepo = repoJson.repositories?.[0];

        if (targetRepo) {
          const detailRes = await fetch(`/api/repositories/${targetRepo.id}`);
          const detailJson = await detailRes.json();
          const scan = detailJson.repository?.scans?.[0];
          setIssues(scan?.issues || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadIssues();
  }, []);

  const handleGenerateRepair = async (issueId: string) => {
    try {
      const res = await fetch(`/api/issues/${issueId}/repair`, { method: 'POST' });
      const data = await res.json();
      if (data.repairId) {
        router.push(`/dashboard/repairs/${data.repairId}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredIssues = issues.filter((i) => {
    if (categoryFilter === 'all') return true;
    return i.category === categoryFilter;
  });

  const categories = ['all', 'dependency', 'code', 'test', 'security', 'configuration', 'build'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Repository Issues & Diagnostics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic diagnostic scanner results prioritized by severity, confidence, and system impact.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
          <Filter className="w-3.5 h-3.5 text-slate-500 ml-2" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                categoryFilter === cat
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-400">
          No issues found matching the selected filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onGenerateRepair={handleGenerateRepair}
            />
          ))}
        </div>
      )}
    </div>
  );
}
