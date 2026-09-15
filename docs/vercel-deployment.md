# CodeMedic — Vercel Deployment Guide

This guide provides step-by-step instructions and architectural specifications for deploying CodeMedic to **Vercel**.

---

## 1. Architecture Overview on Vercel

CodeMedic is a full-stack Next.js (App Router) application. When deployed to Vercel:

| Component | Vercel Execution Model | Notes |
| :--- | :--- | :--- |
| **Frontend UI** | Vercel Edge Network / SSR | Fast globally distributed rendering with Tailwind CSS and Lucide icons |
| **API Route Handlers** | Node.js Serverless Functions | Explicitly configured with `export const runtime = "nodejs"` across all 16 endpoints |
| **Long-Running Endpoints** | Configured `maxDuration` | `verify` endpoint configured for 60s; `scan`, `analyze`, `repair`, and `demo` configured for 30s |
| **Workspace / Sandbox** | Ephemeral `/tmp` (`os.tmpdir()`) | Serverless functions utilize `/tmp/codemedic-workspaces` automatically when `VERCEL=1` is set |
| **Database** | Managed PostgreSQL | Connected via connection-pooling URL (`DATABASE_URL`) from Neon, Supabase, or Vercel Postgres |

---

## 2. Prerequisites

1. A Vercel account ([vercel.com](https://vercel.com)).
2. A managed PostgreSQL database:
   - **Neon** (Recommended for serverless pooling): [neon.tech](https://neon.tech)
   - **Supabase**: [supabase.com](https://supabase.com)
   - **Vercel Postgres**: Available directly inside the Vercel Storage dashboard
3. (Optional) An OpenAI-compatible API key (`AI_API_KEY`) if enabling live LLM reasoning (offline AST engine works by default without keys).

---

## 3. Database Preparation (PostgreSQL)

Locally, CodeMedic uses SQLite for zero-config development. For Vercel production, CodeMedic includes a dedicated PostgreSQL Prisma schema at `prisma/schema.postgresql.prisma`.

### Step 3.1: Set up the Database Schema
From your local environment with your remote `DATABASE_URL` set, push the PostgreSQL schema to your database:

```bash
DATABASE_URL="postgresql://user:password@host/db?sslmode=require" npm run db:push:pg
```

Or execute Prisma directly:
```bash
npx prisma db push --schema=prisma/schema.postgresql.prisma
```

### Step 3.2: Prisma Client Generation
The `package.json` contains a `postinstall` script:
```json
"postinstall": "prisma generate"
```
During Vercel's build phase, `postinstall` automatically runs to generate the Prisma Client.

---

## 4. Environment Variables Configuration

Configure the following environment variables in the Vercel Dashboard (**Project Settings > Environment Variables**):

| Variable Name | Required | Default / Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | Pooled PostgreSQL connection string (e.g. `postgres://user:pass@ep-cool.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true`) |
| `DIRECT_URL` | Optional | Direct connection string for Prisma migrations (bypassing connection pooler) |
| `NODE_ENV` | Optional | `production` (set automatically by Vercel) |
| `AI_API_KEY` | Optional | OpenAI / Groq / Gemini API key for live LLM reasoning |
| `AI_BASE_URL` | Optional | `https://api.openai.com/v1` |
| `AI_MODEL` | Optional | `gpt-4o-mini` |
| `GITHUB_TOKEN` | Optional | GitHub Personal Access Token to avoid rate limits when cloning public repos |
| `SANDBOX_TIMEOUT_MS` | Optional | Command timeout in milliseconds (default: `60000`) |

---

## 5. Filesystem & Ephemeral Sandbox Handling

Serverless functions on Vercel execute in AWS Lambda containers with a read-only root filesystem (`/var/task`). Only `/tmp` (typically 512 MB to 10 GB) is writable.

### Dynamic Directory Resolution
CodeMedic's `WorkspaceManager` (`src/lib/sandbox/workspace.ts`) includes automated fallback:
```typescript
function getBaseWorkspaceDir(): string {
  if (process.env.CODEMEDIC_WORKSPACE_DIR) {
    return process.env.CODEMEDIC_WORKSPACE_DIR;
  }
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), 'codemedic-workspaces');
  }
  try {
    const localDir = path.join(process.cwd(), '.codemedic-workspaces');
    fs.mkdirSync(localDir, { recursive: true });
    return localDir;
  } catch {
    return path.join(os.tmpdir(), 'codemedic-workspaces');
  }
}
```

### Sandbox Execution Considerations
- **Ephemeral Lifetime**: Repositories cloned or tested in `/tmp` persist only for the duration of the serverless container instance.
- **Child Processes**: Commands (`npm test`, `npm run build`, `git clone`) execute via Node's `child_process.spawn` within the serverless container's limits.
- **Docker in Vercel**: Docker-in-Docker is not supported on Vercel Serverless. When deploying on Vercel, CodeMedic runs in **Local Process Isolation Mode** inside `/tmp`. For hardware/kernel-level container isolation via Docker, deploy using the provided `Dockerfile` and `docker-compose.yml` to AWS ECS, GCP Cloud Run, or a dedicated Linux VM.

---

## 6. Deploying via Vercel CLI or Git

### Option A: Via GitHub (Recommended)
1. Push your repository to GitHub: `https://github.com/narunsenthilkumar/CodeMedic`.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Configure the Environment Variables listed in Section 4.
4. Click **Deploy**.

### Option B: Via Vercel CLI
```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to your account
vercel login

# Link and deploy preview
vercel

# Deploy to production
vercel --prod
```

---

## 7. Post-Deployment Verification Checklist

Once deployed, verify the deployment:

1. **Health Check Endpoint**:
   ```bash
   curl -i https://your-project.vercel.app/api/health
   ```
   *Expected response:*
   ```json
   { "status": "healthy" }
   ```
   *(Ensure HTTP 200 OK and no sensitive file paths or environment variables are leaked).*

2. **One-Click Demo Workflow**:
   - Open `https://your-project.vercel.app`.
   - Click **"Load Demo Repository"** in the top navigation bar.
   - Verify the repository initializes, scans, identifies issues, and populates the dashboard.

3. **Autonomous Repair Verification**:
   - Click on an issue (e.g. `AUTH-001` or `ENV-001`).
   - Click **"Generate Repair Plan"** -> **"Apply Patch & Run Verification Sandbox"**.
   - Verify that the diff renders and the sandbox produces a passing verification result with updated health metrics.
