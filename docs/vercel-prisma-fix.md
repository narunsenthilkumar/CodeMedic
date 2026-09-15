# CodeMedic — Vercel Prisma Build Failure Resolution

## 1. Overview & Problem Description

During Vercel deployments, the build phase (`npm run build` which invokes `next build`) failed with the following initialization error when compiling and tracing server routes (specifically `/api/demo`):

```text
PrismaClientInitializationError:
"Prisma has detected that this project was built on Vercel, which caches dependencies. This leads to an outdated Prisma Client because Prisma's auto-generation isn't triggered."
The failing route is: /api/demo
```

---

## 2. Root Cause Analysis

1. **Dependency Caching on Vercel**:
   Vercel caches `node_modules` across deployments to minimize build times. When a deployment occurs without changes to dependencies, or when cached dependencies are restored, `npm install` either skips installing packages or skips running postinstall hooks embedded inside third-party packages.
2. **Missing Repository-Level `postinstall` Script**:
   By default, `@prisma/client` relies on its own postinstall hook during first install to generate the client artifacts into `node_modules/.prisma/client`. In commit `4abb71f` (the base commit on `origin/main`), `package.json` had no root `"postinstall": "prisma generate"` script.
3. **Triggering During Route Tracing in Next.js Build**:
   When Next.js runs `next build`, it analyzes and pre-renders server route handlers. The route `/api/demo` imports `loadDemoRepository` (`src/lib/demo/demoRepo.ts`), which in turn initializes `db` (`PrismaClient` in `src/lib/db.ts`). At this point, Prisma checks whether `process.env.VERCEL` is active and whether `node_modules/.prisma/client` was freshly generated in the build container. Because the build cached dependencies and did not trigger Prisma client generation, Prisma threw `PrismaClientInitializationError`.

---

## 3. The Fix Applied

### A. Root `package.json` Configuration
Added the official Prisma/Vercel standard lifecycle hook in `package.json`:
```json
"scripts": {
  "postinstall": "prisma generate",
  ...
}
```
Whenever Vercel runs `npm install` or `npm ci`, npm automatically runs `postinstall`, executing `prisma generate` before `next build` runs.

### B. Prisma CLI Availability
Verified that `prisma` is present in `devDependencies`:
```json
"devDependencies": {
  "prisma": "^5.19.0",
  ...
}
```
In Vercel builds, `devDependencies` are installed by default during the build container creation. When npm executes scripts (such as `postinstall`), the local `.bin` directory (`node_modules/.bin`) is added to `PATH`, ensuring `prisma` is resolved without needing to move it to runtime dependencies or install it globally.

### C. Serverless Node.js Runtime Compliance
All API route handlers including `/api/demo` explicitly declare:
```typescript
export const runtime = 'nodejs';
```
This guarantees that Prisma Client runs on standard Node.js serverless functions with access to native binaries and Node runtime APIs, avoiding incompatible Edge runtime environments.

### D. Environment Variables Integrity
Prisma schemas (`prisma/schema.prisma` and `prisma/schema.postgresql.prisma`) continue to strictly read:
```prisma
datasource db {
  provider = "sqlite" // or "postgresql" in production
  url      = env("DATABASE_URL")
}
```
No database credentials or URLs are hardcoded. `.env` is explicitly ignored by `.gitignore` and is not committed.

---

## 4. Local Verification Results

The entire verification pipeline was executed sequentially without errors or mocked outputs:

### 1. `npm ci`
- Clean installation of locked dependencies from `package-lock.json`.
- Postinstall hook automatically fired:
  ```text
  > codemedic@0.1.0 postinstall
  > prisma generate

  Environment variables loaded from .env
  Prisma schema loaded from prisma\schema.prisma
  ✔ Generated Prisma Client (v5.22.0) to .\node_modules\@prisma\client in 88ms
  ```
- Exit code: `0`

### 2. `npx prisma validate`
- Schema syntax, relations, and data sources verified:
  ```text
  Environment variables loaded from .env
  Prisma schema loaded from prisma\schema.prisma
  The schema at prisma\schema.prisma is valid 🚀
  ```
- Exit code: `0`

### 3. `npx prisma generate`
- Generated Prisma Client client engine:
  ```text
  ✔ Generated Prisma Client (v5.22.0) to .\node_modules\@prisma\client in 95ms
  ```
- Exit code: `0`

### 4. `npm run typecheck` (`tsc --noEmit`)
- Complete TypeScript compilation across all source and test files.
- Exit code: `0` (Zero type errors)

### 5. `npm run lint` (`next lint`)
- ESLint verification across all App Router routes and library modules.
- Output: `✔ No ESLint warnings or errors`
- Exit code: `0`

### 6. `npm run test` (`vitest run`)
- Full test suite execution including AST analyzers, repair heuristics, and end-to-end sandbox verification:
  ```text
  Test Files  7 passed (7)
       Tests  19 passed (19)
    Duration  40.66s
  ```
- Exit code: `0`

### 7. `/api/demo` Runtime Usability Check
- Evaluated `POST /api/demo` handler with the generated Prisma Client:
  ```text
  [SYSTEM] Loading demo repository from .../codemedic-demo-repository
  [SCAN] Total issues detected: 7
  [SCAN] Repository Health Score calculated: 55/100
  [SYSTEM] Demo repository loaded successfully. Scan ID: cmu2umw5x0001s0t6o0e6azjq
  POST /api/demo status: 200 success: true issuesCount: 55
  ```
- HTTP status: `200 OK`

### 8. `npm run build` (`next build`)
- Next.js 14.2.35 production build:
  ```text
  Creating an optimized production build ...
  ✓ Compiled successfully
  Linting and checking validity of types ...
  Collecting page data ...
  Generating static pages (16/16) ...
  ✓ Generating static pages (16/16)
  Finalizing page optimization ...
  Collecting build traces ...
  ```
- Exit code: `0`

---

## 5. Vercel Deployment Instructions

1. **Push Changes to GitHub**:
   Commit and push the updated `package.json` and `package-lock.json` to the default branch on `https://github.com/narunsenthilkumar/CodeMedic`.
2. **Import Project to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new) and select the `CodeMedic` repository.
   - Framework Preset: **Next.js** (auto-detected).
   - Build Command: `npm run build` (or Next.js default).
   - Install Command: `npm install` (default, which runs `postinstall`).
3. **Configure Environment Variables**:
   In Vercel **Project Settings > Environment Variables**, configure:
   - `DATABASE_URL`: Connection string for PostgreSQL (e.g. Neon, Supabase, or Vercel Postgres).
   - `NODE_ENV`: `production` (set automatically).
   - (Optional) `AI_API_KEY`: API key for optional live LLM reasoning (offline AST engine functions by default).
4. **Deploy**:
   Trigger the deployment. The `postinstall` script runs `prisma generate`, generating the Prisma Client before Next.js builds the routes, eliminating the caching initialization error.

---

## 6. Remaining Warnings & Limitations

1. **Deprecated Transitive Dependency Warnings**:
   During `npm ci` / `npm install`, npm reports deprecation notices on transitive dependencies (`glob@7`, `rimraf@3`, `inflight@1.0.6`). These are standard ecosystem deprecations in third-party tooling and do not impact runtime or build execution.
2. **Local SQLite vs. Production Serverless Database**:
   Local development uses SQLite (`file:./dev.db`). When deploying to Vercel serverless functions, SQLite files on disk are ephemeral. For production persistence across serverless invocations, provision a PostgreSQL database (such as Neon or Supabase) and set `DATABASE_URL`.
3. **Docker-in-Docker Restriction**:
   Vercel Serverless Functions do not support Docker daemons. CodeMedic runs in **Local Process Isolation Mode** inside `/tmp` on Vercel. For hardware-level container sandboxes, run using the included `docker-compose.yml` on AWS ECS or GCP Cloud Run.

---

**Status:** VERCEL PRISMA BUILD: READY
