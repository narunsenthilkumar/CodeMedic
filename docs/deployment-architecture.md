# CodeMedic Deployment Architecture Decision & Operational Guide

## 1. Executive Summary

CodeMedic is a **closed-loop automated software repair engine**. Unlike typical web applications that only perform database queries and API calls, CodeMedic's core value proposition is:

> **"Don't just fix the code. Prove the fix works."**

Proving the fix works requires **actual process execution** (`child_process.spawn`), **ephemeral filesystem workspaces** (`.workspaces/ws_<id>/`), **package manifest manipulation**, and **running compilation/testing tools** (`npm install`, `npm test`, `npm run build`).

Consequently, **serverless hosting platforms (such as Vercel Serverless Functions, AWS Lambda, or Netlify Functions) CANNOT host CodeMedic's sandbox verification worker without severe architectural degradation**:
- Read-only or ephemeral 512MB `/tmp` filesystems prevent multi-package installations.
- Execution timeouts (10–15 seconds) abort real `npm install` and test suites.
- Restricted `child_process` prevents running native compilers and runtime package managers.

Therefore, CodeMedic must be deployed to a **stateful container or virtual machine runtime**.

---

## 2. Platform Capability Matrix

| Platform Tier | Example Providers | Sandbox Process Support | Ephemeral Filesystem | Suitable for CodeMedic? | Recommended Topology |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Serverless Function** | Vercel Functions, AWS Lambda | ✕ Blocked / Restricted | ✕ 512MB `/tmp` only | **NO** (Verification fails) | Frontend only (with remote worker) |
| **Container as a Service (CaaS)** | Render, Railway, Fly.io, Google Cloud Run | ✓ Full child_process | ✓ Dedicated disk / container | **YES (Recommended)** | Single full-stack container |
| **Managed Container Orchestrator** | AWS ECS (Fargate/EC2), GCP GKE | ✓ Full child_process | ✓ Persistent / NVMe volume | **YES (Production Enterprise)** | Split Frontend + Verification Worker |
| **Virtual Machine (IaaS)** | AWS EC2, DigitalOcean Droplet, Hetzner | ✓ Full root / docker | ✓ Full OS filesystem | **YES** | Standalone VM or Docker Compose |

---

## 3. Recommended Production Topologies

### Topology A: Single Full-Stack Container (Recommended for Hackathon & Fast Production)
- **Target Platform**: Render (Web Service), Railway, Fly.io, or AWS App Runner / EC2.
- **Components**:
  - Next.js 14 Web UI + API Routes running in Node 20 LTS.
  - Local SQLite database (`dev.db`) mounted on a persistent disk or PostgreSQL instance.
  - Ephemeral `.workspaces/` directory created within the container filesystem.
  - Node `child_process` spawns verification commands inside the container sandbox.
- **Startup Command**:
  ```bash
  npm run build
  npm start
  ```
- **Advantages**: Zero inter-service latency; single deploy command; zero config.

### Topology B: Split Web App + Dedicated Execution Worker (Enterprise Scale)
- **Target Platform**: AWS ECS / Kubernetes.
- **Components**:
  - **Frontend / Management API**: Next.js deployed on any Node runtime.
  - **Verification Worker Service**: Hardened Linux container pool with Docker-in-Docker (DinD) or gVisor sandbox runtimes.
  - **Message Queue**: Redis / RabbitMQ for dispatching repair and verification jobs.
  - **Database**: PostgreSQL (AWS RDS or Supabase) with Prisma ORM.

---

## 4. Sandbox Security Model & Execution Controls

CodeMedic enforces a **Zero-Trust Execution Policy** for all sandbox runs:

1. **Workspace Boundary Enforcement**:
   - Every verification attempt is copied into an isolated timestamped directory (`.workspaces/ws_<id>/`).
   - Relative path escaping (`../`) is strictly blocked before process spawning.
2. **Command Allowlist**:
   - Only allowlisted commands are executable:
     - `npm install`
     - `npm test`
     - `npm run build`
     - `npm run lint`
   - Arbitrary shell commands (such as `rm -rf`, `curl`, `bash`) are immediately intercepted and rejected with exit code 126.
3. **Execution Timeouts**:
   - Subprocesses are assigned an execution watchdog timer (default: 60,000ms via `SANDBOX_TIMEOUT_MS`).
   - Hanging tests or compilation loops are automatically terminated via `SIGKILL`.
4. **Secret Redaction**:
   - Environment variables and output streams are scrubbed for API keys, tokens, and authorization headers before logging.
5. **Self-Healing Loop Cap**:
   - Automated repair retries are strictly capped at 3 iterations to prevent infinite retry loops.

---

## 5. Environment Variables for Deployment

```bash
# Required
DATABASE_URL="file:./dev.db"  # Or "postgresql://..."
NODE_ENV="production"
PORT=3000

# Optional
AI_API_KEY=""                # Optional: live LLM reasoning (defaults to heuristic engine)
AI_BASE_URL="https://api.openai.com/v1"
AI_MODEL="gpt-4o-mini"
GITHUB_TOKEN=""              # Optional: higher rate limits for public GitHub cloning
SANDBOX_TIMEOUT_MS=60000     # Sandbox command timeout (milliseconds)
```

---

## 6. Zero-Config Deployment Instructions (Render / Railway)

1. Connect the GitHub repository `https://github.com/narunsenthilkumar/CodeMedic`.
2. Select **Web Service / Docker** environment.
3. Set build command:
   ```bash
   npm ci && npx prisma generate && npx prisma db push && npm run build
   ```
4. Set start command:
   ```bash
   npm start
   ```
5. Set environment variables from `.env.example`.
6. Access the deployed application; all scanning, repair synthesis, and verification executes within the container.
