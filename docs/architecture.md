# CodeMedic Architecture

## 1. High-Level System Architecture

```mermaid
graph TD
    User[Developer / Hackathon Judge] --> UI[Next.js App Router Frontend]
    UI --> API[REST API Route Handlers]
    API --> DB[(Prisma / SQLite - dev.db)]
    API --> Scanner[Multi-Scanner Engine]
    API --> AI[Multi-Agent AI Engine]
    API --> Sandbox[Isolated Workspace Sandbox]
    
    subgraph Multi-Scanner Engine
        Scanner --> BuildScanner[Build Scanner]
        Scanner --> DepScanner[Dependency Scanner]
        Scanner --> CodeScanner[Code Scanner]
        Scanner --> SecScanner[Security Scanner]
        Scanner --> TestScanner[Test Scanner]
        Scanner --> CfgScanner[Config Scanner]
        Scanner --> Prioritizer[Priority Score 0-100]
        Scanner --> HealthCalc[Health Calculator]
    end

    subgraph Multi-Agent AI System
        AI --> Diagnostician[Diagnostician Agent]
        AI --> Planner[Planner Agent]
        AI --> PatchGen[Patch Generator Agent]
        AI --> Reviewer[Patch Review Agent]
        AI --> Orchestrator[Self-Healing Orchestrator]
    end

    subgraph Sandbox Isolation
        Sandbox --> WS[Temporary Workspace .workspaces/ws_id]
        Sandbox --> Exec[Allowlisted Command Runner]
        Sandbox --> Verifier[npm test & build Verifier]
    end
```

## 2. Core Subsystems

### 2.1 Multi-Scanner Engine
- **Analyzer (`analyzer.ts`)**: Inspects repository manifest, language (JS/TS), framework (Next.js, Vite, React, Node.js), and lockfiles.
- **Dependency Scanner (`dependencyScanner.ts`)**: Scans AST imports against `package.json` dependencies and flags missing packages.
- **Code Scanner (`codeScanner.ts`)**: Checks import specifiers against local module exports and detects TypeScript type errors (e.g. TS2322).
- **Security Scanner (`securityScanner.ts`)**: Detects high-entropy keys, OpenAI API keys, GitHub tokens, and private keys with mandatory redaction (`sk-proj-********`).
- **Configuration Scanner (`configurationScanner.ts`)**: Identifies references to `process.env.*` in code lacking documentation in `.env.example`.
- **Test Scanner (`testScanner.ts`)**: Executes test suites or parses test fixtures, capturing passed/failed counts and failure traces.
- **Prioritizer (`prioritizer.ts`)**: Normalizes priority scores (0–100) using `severityWeight * confidence * categoryImpact`.
- **Health Engine (`health.ts`)**: Transparent score calculation: Build (25%), Dependencies (20%), Tests (20%), Code Quality (15%), Security (20%).

### 2.2 Multi-Agent AI System
- **Dual Engine Provider**: Supports live LLM providers (OpenAI, Gemini, Groq) with an intelligent zero-config AST heuristic fallback that executes with 100% determinism offline.
- **Single Responsibility Agents**:
  - `Diagnostician`: Evidence-backed root cause analysis.
  - `Planner`: Minimal reversible repair plan.
  - `PatchGenerator`: Minimal unified diff (`--- a/... +++ b/...`).
  - `Reviewer`: Safety audit before presenting to human user.
  - `Orchestrator`: Coordinates repair attempts and caps self-healing retries at 3 attempts.

### 2.3 Sandbox Execution & Verification Engine
- **Workspace Manager (`workspace.ts`)**: Clones repository snapshot into dedicated directory (`.workspaces/ws_<id>`). Rejects path traversal attempts.
- **Process Executor (`executor.ts`)**: Restricts commands to allowlisted lifecycle scripts (`npm install`, `npm test`, `npm run build`, `npm run lint`). Enforces 60s timeouts.
- **Verifier (`verifier.ts`)**: Executes verification pipeline on patched code and captures duration, stdout, stderr, and exit codes.
