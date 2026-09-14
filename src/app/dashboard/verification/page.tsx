'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckSquare, CheckCircle2, XCircle, Terminal, Clock, ArrowRight } from 'lucide-react';

export default function VerificationHubPage() {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVerifications() {
      try {
        const repoRes = await fetch('/api/repositories');
        const repoJson = await repoRes.json();
        const targetRepo = repoJson.repositories?.[0];

        if (targetRepo) {
          const detailRes = await fetch(`/api/repositories/${targetRepo.id}`);
          const detailJson = await detailRes.json();
          const scan = detailJson.repository?.scans?.[0];
          const allIssues = scan?.issues || [];

          const gathered: any[] = [];
          for (const issue of allIssues) {
            if (issue.repairs) {
              for (const repair of issue.repairs) {
                if (repair.verifications) {
                  for (const v of repair.verifications) {
                    gathered.push({
                      ...v,
                      repairId: repair.id,
                      issueTitle: issue.title,
                      strategy: repair.strategy,
                    });
                  }
                }
              }
            }
          }
          setVerifications(gathered);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadVerifications();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-teal-400" />
          <span>Verification Console Runs</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Historical record of automated verification runs executed within isolated sandbox workspaces.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : verifications.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="text-xs font-mono text-slate-400">
            No verification runs have completed yet.
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs text-teal-400 font-mono hover:underline"
          >
            Apply a repair from the dashboard to trigger verification <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {verifications.map((v) => (
            <div
              key={v.id}
              className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  {v.success ? (
                    <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> VERIFIED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-mono text-rose-400 font-bold">
                      <XCircle className="w-4 h-4" /> FAILED
                    </span>
                  )}
                  <span className="text-sm font-semibold text-slate-200">
                    {v.issueTitle}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 mt-1">
                  <span>Build: {v.buildStatus}</span>
                  <span>•</span>
                  <span>Tests: {v.testStatus}</span>
                  <span>•</span>
                  <span>Exit Code: {v.exitCode}</span>
                  <span>•</span>
                  <span>Duration: {v.durationMs}ms</span>
                </div>
              </div>

              <Link
                href={`/dashboard/repairs/${v.repairId}`}
                className="flex items-center gap-1 text-xs font-mono text-teal-400 hover:text-teal-300 self-end md:self-center"
              >
                <span>View Full Terminal Logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
