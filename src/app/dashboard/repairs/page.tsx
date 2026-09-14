'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Wrench,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Award,
} from 'lucide-react';

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
                const verifications = r.verifications || [];
                const lastVerification = verifications[verifications.length - 1];
                gatheredRepairs.push({
                  ...r,
                  issueTitle: issue.title,
                  issueSeverity: issue.severity,
                  issueCategory: issue.category,
                  lastVerification,
                  scanHealth: scan?.healthScore,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-teal-400" />
            <span>Repair History & Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Persistent log of synthesized code patches, human approval authorizations, and sandbox verification runs.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{repairs.length} Total Repair Sessions</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-xs font-mono text-slate-400">Loading repair audit log...</div>
        </div>
      ) : repairs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <Wrench className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-200 font-mono">No repairs initiated yet.</h3>
          <p className="text-xs font-mono text-slate-400 max-w-sm mx-auto">
            Choose an issue on the dashboard and click &quot;Generate Repair&quot; to synthesize an atomic fix.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-mono font-bold transition-colors shadow-md shadow-teal-950"
          >
            Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {repairs.map((r, idx) => {
            const isVerified = r.status === 'verified';
            const isFailed = r.status === 'failed';
            const numStr = String(repairs.length - idx).padStart(3, '0');
            const formattedDate = r.createdAt
              ? new Date(r.createdAt).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent';

            return (
              <Link
                key={r.id}
                href={`/dashboard/repairs/${r.id}`}
                className="block p-4 bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-xl transition-all shadow-sm group focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800 mt-0.5">
                      #{numStr}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 group-hover:text-teal-300 transition-colors">
                        {r.issueTitle}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400 mt-1">
                        <span className="text-teal-400 font-medium">Strategy: {r.strategy}</span>
                        <span>•</span>
                        <span>Risk: {r.risk?.toUpperCase()}</span>
                        <span>•</span>
                        <span>Attempts: {r.attemptNumber || 1}/3</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3 h-3" /> {formattedDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {isVerified ? (
                      <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED ✓
                      </span>
                    ) : isFailed ? (
                      <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-400 bg-rose-950/80 px-3 py-1 rounded-lg border border-rose-800">
                        <XCircle className="w-3.5 h-3.5" /> FAILED ✕
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 bg-amber-950/80 px-3 py-1 rounded-lg border border-amber-800 capitalize">
                        <Clock className="w-3.5 h-3.5" /> {r.status}
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors" />
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
