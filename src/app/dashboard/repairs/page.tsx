'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wrench, CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';

export default function RepairsHistoryPage() {
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRepairs() {
      try {
        const repoRes = await fetch('/api/repositories');
        const repoJson = await repoRes.json();
        const targetRepo = repoJson.repositories?.[0];

        if (targetRepo) {
          const detailRes = await fetch(`/api/repositories/${targetRepo.id}`);
          const detailJson = await detailRes.json();
          const scan = detailJson.repository?.scans?.[0];
          const allIssues = scan?.issues || [];

          // Collect repairs across issues
          const gatheredRepairs: any[] = [];
          for (const issue of allIssues) {
            if (issue.repairs && issue.repairs.length > 0) {
              for (const r of issue.repairs) {
                gatheredRepairs.push({
                  ...r,
                  issueTitle: issue.title,
                  issueSeverity: issue.severity,
                  issueCategory: issue.category,
                });
              }
            }
          }
          setRepairs(gatheredRepairs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadRepairs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-teal-400" />
          <span>Repair History & Audit Trail</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete log of generated code patches, human approval authorizations, and sandbox verification runs.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : repairs.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="text-xs font-mono text-slate-400">
            No repairs have been initiated yet.
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs text-teal-400 font-mono hover:underline"
          >
            Go to dashboard to generate a repair <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {repairs.map((r, idx) => {
            const isVerified = r.status === 'verified';
            const isFailed = r.status === 'failed';
            const numStr = String(repairs.length - idx).padStart(3, '0');

            return (
              <Link
                key={r.id}
                href={`/dashboard/repairs/${r.id}`}
                className="block p-4 bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      #{numStr}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200">
                        {r.issueTitle}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5">
                        <span>Strategy: {r.strategy}</span>
                        <span>•</span>
                        <span>Risk: {r.risk}</span>
                        <span>•</span>
                        <span>Attempt #{r.attemptNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isVerified ? (
                      <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified ✓
                      </span>
                    ) : isFailed ? (
                      <span className="flex items-center gap-1 text-xs font-mono text-rose-400 bg-rose-950/80 px-2.5 py-1 rounded border border-rose-800">
                        <XCircle className="w-3.5 h-3.5" /> Failed ✕
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-mono text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded border border-amber-800 capitalize">
                        <Clock className="w-3.5 h-3.5" /> {r.status}
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
