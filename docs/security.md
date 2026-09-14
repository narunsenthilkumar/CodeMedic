# CodeMedic Security Model & Sandbox Isolation

## 1. Threat Model & Philosophy

CodeMedic operates under a **Zero-Trust Model** regarding untrusted code from imported repositories. AI agents are treated as advisory components and are never granted unconstrained shell execution privileges or write access to the host filesystem.

---

## 2. Core Security Guarantees

### 2.1 Process & Host Isolation
- **No Arbitrary Execution on Host**: Untrusted repository build scripts and tests are executed only within an isolated temporary workspace directory (`.workspaces/ws_<id>/`).
- **Path Traversal Protection**: All file read and write operations inside the sandbox normalize paths and reject directory escapes (`../`).
- **Execution Timeouts**: All child processes spawned in the sandbox have an enforced timeout (default 60 seconds). Processes exceeding the timeout receive `SIGTERM`/`SIGKILL` and exit with code 124.
- **Environment Sanitization**: Host environment secrets (such as `AI_API_KEY`, `GITHUB_TOKEN`, or `DATABASE_URL`) are stripped from the child process environment before command execution.

### 2.2 Strict Command Allowlisting
CodeMedic prohibits arbitrary shell execution. Only recognized commands derived from safe lifecycle scripts are permitted:
- `npm install`
- `npm test`
- `npm run build`
- `npm run lint`
- `npx vitest run`
- `npx jest`

Any command containing unauthorized binaries (`rm`, `curl`, `wget`, `bash`, `sh`, `powershell`, `cmd`, `eval`) is blocked immediately with exit code 126 and logged as a security exception.

### 2.3 Secret Masking & Redaction
- All output streams (`stdout`, `stderr`), error stack traces, and evidence logs pass through the automated redaction engine (`redactSecrets`).
- Regex patterns mask:
  - OpenAI Secret Keys (`sk-[a-zA-Z0-9_-]{20,}`) → `sk-proj-********`
  - GitHub Tokens (`ghp_[a-zA-Z0-9]{30,}`) → `ghp_********`
  - Private Keys (`-----BEGIN PRIVATE KEY-----`) → `[REDACTED]`
  - Generic Secrets & Passwords → `[REDACTED]`

### 2.4 Mandatory Human Authorization
- The AI cannot autonomously push commits, merge pull requests, or alter the host repository.
- Every repair proposal displays a unified diff and requires the developer to explicitly click **Apply Fix & Verify**.
- The user retains complete authority to reject proposals.

### 2.5 Self-Healing Retry Guardrails
- If a verification run fails, the self-healing loop retries up to a maximum of **3 attempts**.
- After 3 unsuccessful attempts, CodeMedic ceases automatic retries and escalates the issue for manual developer review, preventing infinite execution loops and compute exhaustion.
