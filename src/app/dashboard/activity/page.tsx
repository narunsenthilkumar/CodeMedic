'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Clock, Terminal } from 'lucide-react';

export default function ActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivity() {
      try {
        const repoRes = await fetch('/api/repositories');
        const repoJson = await repoRes.json();
        const targetRepo = repoJson.repositories?.[0];

        if (targetRepo) {
          const actRes = await fetch(`/api/repositories/${targetRepo.id}/activity`);
          const actJson = await actRes.json();
          setActivities(actJson.activities || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadActivity();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-teal-400" />
          <span>System Activity & Audit Log</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Chronological record of scans, AI diagnostic conclusions, patch proposals, authorizations, and verification runs.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-400">
          No activity records found.
        </div>
      ) : (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="space-y-3 font-mono text-xs">
            {activities.map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-lg border border-slate-800/80"
              >
                <div className="w-6 h-6 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                  <Terminal className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] px-2 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-800 uppercase font-semibold">
                      {act.type}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(act.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1 leading-relaxed break-words">
                    {act.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
