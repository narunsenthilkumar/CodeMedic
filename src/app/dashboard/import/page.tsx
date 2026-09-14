'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderGit2,
  ArrowRight,
  Play,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Terminal,
} from 'lucide-react';

const IMPORT_STEPS = [
  'Connecting to GitHub',
  'Fetching repository tree',
  'Detecting project & manifest type',
  'Scanning dependencies and code',
  'Running multi-engine diagnostics',
  'Preparing verified health report',
];

export default function ImportPage() {
  const router = useRouter();
  const [url, setUrl] = useState('https://github.com/codemedic/codemedic-demo-repository');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAnalyze = async (overrideUrl?: string) => {
    const targetUrl = overrideUrl || url;
    setErrorMessage('');

    if (!targetUrl || !targetUrl.includes('github.com/')) {
      setErrorMessage('Please enter a valid GitHub repository URL (e.g. https://github.com/owner/repo)');
      return;
    }

    setIsAnalyzing(true);
    setCurrentStepIdx(0);

    // Simulate animated progress through the 6 stages so the user is never left staring at an unexplained spinner
    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev < IMPORT_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 450);

    try {
      const res = await fetch('/api/repositories/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUrl: targetUrl }),
      });

      const data = await res.json();
      clearInterval(interval);

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to analyze repository');
      }

      setCurrentStepIdx(IMPORT_STEPS.length - 1);
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (err: any) {
      clearInterval(interval);
      setIsAnalyzing(false);
      setErrorMessage(err.message || 'Repository analysis failed. Please verify URL and retry.');
    }
  };

  const handleLoadDemo = async () => {
    setUrl('https://github.com/codemedic/codemedic-demo-repository');
    await handleAnalyze('https://github.com/codemedic/codemedic-demo-repository');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-4">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950 border border-teal-800 text-teal-300 text-xs font-mono">
          <FolderGit2 className="w-3.5 h-3.5 text-teal-400" />
          <span>Repository Import Engine</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Import Repository for Diagnosis
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Enter any public JavaScript or TypeScript repository URL. CodeMedic will clone, analyze dependencies, and run diagnostic scanners.
        </p>
      </div>

      {/* Input Card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div>
          <label className="block text-xs font-mono text-slate-300 uppercase mb-2">
            GitHub Repository URL
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isAnalyzing}
              placeholder="https://github.com/owner/repository"
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-lg text-xs font-mono text-slate-200 outline-none transition-colors"
            />
            <button
              onClick={() => handleAnalyze()}
              disabled={isAnalyzing}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold font-mono transition-colors shadow-sm shadow-teal-950"
            >
              <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Repository'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-lg flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Demo Fast Track Button */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-400 font-mono">
            Hackathon judge or quick evaluation?
          </span>
          <button
            onClick={handleLoadDemo}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 rounded-lg text-xs font-mono transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-teal-400/20 text-teal-400" />
            <span>Load Prepared Broken Demo Repo</span>
          </button>
        </div>
      </div>

      {/* Transparent Multi-Step Progress State */}
      {isAnalyzing && (
        <div className="p-6 bg-slate-900 border border-teal-800/50 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-teal-400" />
              <h3 className="text-xs font-mono font-bold uppercase text-slate-200">
                Diagnostic Scanner Pipeline
              </h3>
            </div>
            <span className="text-xs font-mono text-teal-400">
              Stage {currentStepIdx + 1} of {IMPORT_STEPS.length}
            </span>
          </div>

          <div className="space-y-2">
            {IMPORT_STEPS.map((step, idx) => {
              const isCompleted = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div
                  key={step}
                  className={`flex items-center gap-3 p-2.5 rounded text-xs font-mono transition-all ${
                    isCompleted
                      ? 'bg-emerald-950/30 text-emerald-300 border border-emerald-900/40'
                      : isCurrent
                      ? 'bg-teal-950/50 text-teal-200 border border-teal-500/40'
                      : 'text-slate-500 opacity-60'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-teal-400 border-t-transparent animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                  )}
                  <span>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
