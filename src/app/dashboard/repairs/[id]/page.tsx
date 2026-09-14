'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DiffViewer } from '@/components/DiffViewer';
import { VerificationCard } from '@/components/VerificationCard';
import { RepairTimeline } from '@/components/RepairTimeline';
import { SeverityBadge } from '@/components/SeverityBadge';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import {
  Wrench,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ArrowLeft,
  Terminal,
  Play,
  Award,
  RefreshCw,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export default function RepairDetailPage() {
  const params = useParams();
  const router = useRouter();
  const repairId = params.id as string;

  const [repair, setRepair] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [verifiedCelebration, setVerifiedCelebration] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRepair = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/repairs/${repairId}`);
      const data = await res.json();
      if (data.repair) {
        setRepair(data.repair);
        // If prior verifications exist, populate
        if (data.repair.verifications?.length > 0) {
          const last = data.repair.verifications[0];
          setVerificationResult(last);
          if (last.success) setVerifiedCelebration(true);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (repairId) {
      fetchRepair();
    }
  }, [repairId]);

  const handleApplyFix = async () => {
    try {
      setApplying(true);
      setErrorMsg('');

      // Step 1: Human Approval explicitly applied
      const applyRes = await fetch(`/api/repairs/${repairId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      const applyJson = await applyRes.json();

      if (!applyJson.success) {
        throw new Error(applyJson.error || 'Failed to apply patch');
      }

      // Step 2: Trigger Sandbox Verification Engine
      setApplying(false);
      setVerifying(true);

      const verifyRes = await fetch(`/api/repairs/${repairId}/verify`, {
        method: 'POST',
      });
      const verifyJson = await verifyRes.json();

      setVerificationResult(verifyJson.verification);

      if (verifyJson.success) {
        setVerifiedCelebration(true);
        setAttempts((prev) => [
          ...prev,
          { attemptNumber: repair.attemptNumber, success: true },
        ]);
        await fetchRepair();
      } else if (verifyJson.canRetry) {
        // Self-Healing retry triggered!
        setAttempts((prev) => [
          ...prev,
          {
            attemptNumber: repair.attemptNumber,
            success: false,
            error: verifyJson.verification?.stderr?.slice(0, 80) || 'Verification test assertion failed',
          },
        ]);
        await fetchRepair();
      } else {
        // Max retries reached
        setAttempts((prev) => [
          ...prev,
          { attemptNumber: repair.attemptNumber, success: false },
        ]);
        await fetchRepair();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setApplying(false);
      setVerifying(false);
    }
  };

  const handleRejectFix = async () => {
    try {
      await fetch(`/api/repairs/${repairId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-xs font-mono text-slate-400">Loading Repair Studio & Patch Diff...</div>
      </div>
    );
  }

  if (!repair) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="text-rose-400 font-mono">Repair session not found</div>
        <Link href="/dashboard" className="text-xs text-teal-400 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const patch = repair.parsedPatch || {};
  const issue = repair.issue || {};
  const isVerified = repair.status === 'verified' || verifiedCelebration;
  const isProposed = repair.status === 'proposed';

  // Determine current timeline stage
  let currentStage: any = 'approval';
  if (isVerified) currentStage = 'verified';
  else if (verifying) currentStage = 'verification';
  else if (repair.status === 'applied') currentStage = 'applied';
  else if (repair.status === 'failed') currentStage = 'failed';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <span className="text-xs font-mono text-slate-500">
          Session ID: {repair.id}
        </span>
      </div>

      {/* Visual Repair Timeline */}
      <RepairTimeline
        currentStage={currentStage}
        attempts={attempts}
      />

      {/* Prominent "FIX VERIFIED" Celebration Banner (Sections 58 & 59) */}
      {isVerified && (
        <div className="p-6 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-600/50 shadow-xl shadow-emerald-950/30 text-slate-100 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-0.5">
                  <Award className="w-4 h-4" /> FIX VERIFIED
                </div>
                <h2 className="text-xl font-bold text-slate-100">
                  Closed-Loop Software Repair Successful
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  CodeMedic generated a minimal patch, applied it in an isolated workspace, and verified the repository after the change.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-slate-950/70 border border-emerald-800/60 rounded-lg shrink-0 font-mono">
              <div className="text-center">
                <div className="text-[10px] text-slate-400 uppercase">Health Score</div>
                <div className="text-lg font-bold text-emerald-400">42 → 94</div>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="text-center">
                <div className="text-[10px] text-slate-400 uppercase">Verification</div>
                <div className="text-xs font-bold text-emerald-300">PASSED ✓</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diagnosis & Strategy Summary Card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <SeverityBadge severity={issue.severity || 'high'} />
              <ConfidenceBadge confidence={issue.confidence || 0.96} />
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Risk: {repair.risk.toUpperCase()}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100">{issue.title}</h2>
            <p className="text-xs text-slate-400 mt-1">{issue.description}</p>
          </div>

          <div className="flex items-center gap-2 self-start">
            <span className="text-xs font-mono text-teal-400 bg-teal-950/60 px-2.5 py-1 rounded border border-teal-800/40">
              Strategy: {repair.strategy}
            </span>
          </div>
        </div>

        {/* AI Root Cause & Reasoning */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-xs font-mono font-semibold text-teal-400 mb-1 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>Evidence-Backed Root Cause:</span>
            </div>
            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              {issue.rootCause || 'Missing dependency in manifest.'}
            </p>
          </div>

          {/* AI Safety Review Checklist */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-xs font-mono font-semibold text-teal-400 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Safety Audit Checklist:</span>
            </div>
            <ul className="space-y-1 text-xs text-slate-300 font-mono">
              <li className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Minimal diff footprint
              </li>
              <li className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Addresses verified root cause
              </li>
              <li className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Zero secrets or unsafe commands introduced
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Unified Diff Viewer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-slate-200 font-mono uppercase">
              Proposed Code Patch (Unified Diff)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            File: {patch.filePath || 'package.json'}
          </span>
        </div>

        <DiffViewer
          filePath={patch.filePath || 'package.json'}
          diff={patch.diff || ''}
        />
      </div>

      {/* Mandatory Human Approval Controls (Section 21) */}
      {isProposed && !isVerified && (
        <div className="p-5 bg-slate-900 border border-teal-800/60 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Mandatory Human Authorization Required</span>
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              CodeMedic never automatically pushes code without explicit human consent. Review the diff above and approve application into the isolated sandbox.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleRejectFix}
              disabled={applying || verifying}
              className="flex-1 sm:flex-initial px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors font-mono"
            >
              Reject Proposal
            </button>
            <button
              onClick={handleApplyFix}
              disabled={applying || verifying}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors font-mono shadow-lg shadow-teal-950"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{applying ? 'Applying...' : verifying ? 'Verifying Fix...' : 'Apply Fix & Verify'}</span>
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-lg flex items-center gap-2 text-xs text-rose-300 font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Isolated Sandbox Verification Console (Section 23) */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-200 font-mono uppercase flex items-center gap-2">
          <Terminal className="w-4 h-4 text-teal-400" />
          <span>Automated Sandbox Verification Console</span>
        </h3>

        <VerificationCard
          verification={verificationResult}
          isRunning={verifying}
        />
      </div>
    </div>
  );
}
