'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Terminal,
  Play,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Layers,
  FileCode,
  Lock,
  GitPullRequest,
  Check,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleLaunchDemo = async () => {
    setLoadingDemo(true);
    try {
      const res = await fetch('/api/demo', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        router.push('/dashboard');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-teal-500/30 selection:text-teal-200 font-sans">
      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-mono font-bold text-lg">
              ✚
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-100">CodeMedic</span>
              <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-teal-950 border border-teal-800 text-teal-300 font-mono">
                Hackathon MVP
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="#how-it-works"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors hidden sm:inline"
            >
              How it works
            </Link>
            <Link
              href="#security"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors hidden sm:inline"
            >
              Security Model
            </Link>
            <button
              onClick={handleLaunchDemo}
              disabled={loadingDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 rounded-lg text-xs font-mono transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-teal-400/20 text-teal-400" />
              <span>{loadingDemo ? 'Launching...' : 'Quick Demo'}</span>
            </button>
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm shadow-teal-950"
            >
              Open Console
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 overflow-hidden border-b border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-800/60 text-teal-300 text-xs font-mono mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Closed-Loop AI Software Repair & Verification</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-100 max-w-3xl mx-auto leading-tight">
            Don&apos;t just fix the code.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-teal-300 to-emerald-400">
              Prove the fix works.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            CodeMedic doesn&apos;t stop at suggesting AI solutions. It detects issues across dependencies, builds, and tests, synthesizes safe minimal patches, and <span className="text-slate-200 font-semibold">executes verification in an isolated sandbox</span> before claiming a fix is complete.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard/import"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-teal-950"
            >
              <span>Analyze a Repository</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={handleLaunchDemo}
              disabled={loadingDemo}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-mono transition-colors"
            >
              <Play className="w-4 h-4 text-teal-400 fill-teal-400/20" />
              <span>{loadingDemo ? 'Preparing Demo...' : 'Launch Live Demo (90s)'}</span>
            </button>
          </div>

          {/* Terminal Code Mockup */}
          <div className="mt-14 max-w-3xl mx-auto rounded-xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden text-left font-mono text-xs">
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-slate-400 ml-2 font-mono text-[11px]">codemedic // closed-loop repair agent</span>
              </div>
              <span className="text-[11px] text-teal-400">sandbox: isolated</span>
            </div>
            <div className="p-5 space-y-2 text-slate-300">
              <p><span className="text-teal-400">&gt;</span> Import repository: <span className="text-slate-100">github.com/codemedic/codemedic-demo-repository</span></p>
              <p><span className="text-teal-400">&gt;</span> [SCAN] 5 issues discovered | Initial Health: <span className="text-rose-400 font-bold">42 / 100</span></p>
              <p><span className="text-teal-400">&gt;</span> [AI] Diagnosis: Missing &apos;axios&apos; in package.json (Confidence: 96%)</p>
              <p><span className="text-teal-400">&gt;</span> [PATCH] Minimal unified diff prepared for package.json (+ &quot;axios&quot;: &quot;^1.7.9&quot;)</p>
              <p><span className="text-teal-400">&gt;</span> [HUMAN APPROVAL] User explicitly authorized fix application.</p>
              <p><span className="text-teal-400">&gt;</span> [SANDBOX] Running allowlisted verification: npm install && npm test && npm run build</p>
              <p className="text-emerald-400 font-bold"><span className="text-teal-400">&gt;</span> [VERIFY] ✓ FIX VERIFIED | Health Score: 42 ───────────────→ 94 / 100</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem vs Solution */}
      <section className="py-16 bg-slate-950 border-b border-slate-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
              The Reality of Software Debugging
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Why current chat assistants fail at software maintenance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-rose-900/30 bg-rose-950/10">
              <div className="flex items-center gap-2 text-rose-400 font-semibold mb-3">
                <AlertTriangle className="w-5 h-5" />
                <span>The Traditional Problem</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>AI chatbots output code blocks that may fail compiler checks.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Developers manually copy-paste diffs across multiple files.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>No automated test execution to prove the fix actually worked.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>When a fix breaks, developers repeat the manual prompt loop.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-xl border border-teal-800/40 bg-teal-950/10">
              <div className="flex items-center gap-2 text-teal-400 font-semibold mb-3">
                <CheckCircle2 className="w-5 h-5" />
                <span>The CodeMedic Solution</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Autonomous multi-scanner diagnostic engine finds root causes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Synthesizes minimal, reviewable unified diff patches.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Mandatory human approval before modifying code.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Runs real verification commands inside isolated sandboxes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Self-healing loop retries with new compiler evidence (up to 3x).</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 border-b border-slate-900 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
              The 10-Step Closed Loop
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              A disciplined, deterministic engineering lifecycle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-mono text-xs">
            {[
              { num: '01', title: 'Repository Import', desc: 'Validates repo URL and inspects manifest metadata.' },
              { num: '02', title: 'Multi-Engine Scan', desc: 'Executes build, dependency, test, code, and security scanners.' },
              { num: '03', title: 'AI Diagnostician', desc: 'Determines root causes with evidence and confidence scores.' },
              { num: '04', title: 'Planner Agent', desc: 'Formulates minimal, reversible repair strategy.' },
              { num: '05', title: 'Patch Generator', desc: 'Generates clean unified diffs targeting only necessary files.' },
              { num: '06', title: 'Safety Reviewer', desc: 'Pre-screens patch for suspicious patterns and leaked secrets.' },
              { num: '07', title: 'Human Approval', desc: 'Developer reviews diff and explicitly clicks Apply Fix.' },
              { num: '08', title: 'Sandbox Execution', desc: 'Applies patch safely inside an isolated temporary directory.' },
              { num: '09', title: 'Automated Verify', desc: 'Executes npm install, npm test, and npm run build.' },
              { num: '10', title: 'Fix Confirmed', desc: 'Calculates updated health score and updates audit history.' },
            ].map((step) => (
              <div
                key={step.num}
                className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-teal-500/40 transition-colors"
              >
                <div className="text-teal-400 font-bold text-sm mb-1">{step.num}</div>
                <div className="font-semibold text-slate-200 mb-1">{step.title}</div>
                <div className="text-slate-400 text-[11px] leading-relaxed">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 bg-slate-950 border-b border-slate-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono mb-3">
              <Lock className="w-3.5 h-3.5 text-teal-400" />
              <span>Strict Security Guarantees</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
              Host Isolation & Safety Controls
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              CodeMedic executes under a zero-trust model for untrusted repository code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60">
              <div className="w-8 h-8 rounded bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4">
                <Terminal className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">Allowlisted Commands</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                The AI cannot run arbitrary shell commands. Execution is strictly restricted to recognized npm/npx lifecycle scripts (<span className="font-mono text-teal-300">npm test, npm run build</span>).
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60">
              <div className="w-8 h-8 rounded bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">Isolated Workspace</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Every repair attempt runs in a dedicated temporary sandbox. Path traversal attempts (<span className="font-mono text-rose-300">../../</span>) are rejected. Workspaces are automatically cleaned up.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60">
              <div className="w-8 h-8 rounded bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">Secret Redaction</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Sensitive keys, tokens, and credentials are automatically redacted (<span className="font-mono text-amber-300">sk-proj-********</span>) from scan outputs, logs, and evidence views.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-900 bg-slate-950 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            CodeMedic — &quot;Don&apos;t just fix the code. Prove the fix works.&quot;
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hover:text-slate-300">Dashboard</Link>
            <Link href="/dashboard/import" className="hover:text-slate-300">Import</Link>
            <button onClick={handleLaunchDemo} className="hover:text-teal-400">Launch Demo</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
