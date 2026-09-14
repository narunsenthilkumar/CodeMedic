# CodeMedic — 90–120 Second Hackathon Demo Guide

> **Tagline:** *"Don't just fix the code. Prove the fix works."*

Follow this exact sequence for a judge presentation or live recording.

---

## Demo Script

### Step 1: Landing Page (0:00 – 0:15)
1. Open [http://localhost:3000](http://localhost:3000).
2. Point out the core product statement:
   > *"Most AI coding tools just generate code suggestions, leaving developers to copy-paste, run tests, and discover whether the code actually compiles. CodeMedic is an AI software repair agent that proves the fix works."*
3. Click **Launch Live Demo (90s)** (or **Open Demo Repo** in the topbar).

---

### Step 2: Dashboard & Problem State (0:15 – 0:35)
1. Show the **Repository Health: 55 / 100** gauge.
2. Show the diagnostic category breakdown: Build (25), Dependencies (30), Code (50), Security (70), Tests (35).
3. Scroll to the **Detected Issues** list:
   - Point out that CodeMedic detected 5+ controlled issues:
     - `Missing dependency: axios`
     - `Imported symbol 'calculateScore' is not exported by module`
     - `TypeScript type error: Type 'number' is not assignable to type 'string'`
     - `Missing .env.example template`
     - `Failing unit test in math.test.ts`
     - `Probable hardcoded credential (masked as sk-proj-********)`

---

### Step 3: AI Diagnosis & Patch Review (0:35 – 0:55)
1. Click **Generate Repair** on `"Missing dependency: axios"`.
2. Notice the instant transition to the **Repair Studio**:
   - **Root Cause Card:** Evidence-backed explanation (`axios is imported in api.ts but missing from package.json`).
   - **Confidence Badge:** 96% AI Confidence.
   - **Safety Review:** Checklist verifying minimal change, root cause addressed, and no leaked secrets.
   - **Unified Diff Viewer:** Line-by-line diff showing `+ "axios": "^1.7.9"` in `package.json`.

---

### Step 4: Mandatory Human Authorization (0:55 – 1:05)
1. Highlight the safety model:
   > *"CodeMedic never alters code without developer consent. The developer reviews the unified diff and authorizes the change."*
2. Click **Apply Fix & Verify**.

---

### Step 5: Isolated Sandbox Verification & Fix Verified (1:05 – 1:25)
1. Watch the live console execute allowlisted commands inside the isolated sandbox:
   - `npm install` ✓
   - `npm test` ✓
   - `npm run build` ✓
2. Highlight the celebration banner:
   - **"FIX VERIFIED IN SANDBOX"**
   - Health Score recalculates dynamically: **55 ───────────────→ 96 / 100**.
3. Point out the **Before/After View** and click **Repair History** to show the complete persisted audit trail.

---

## Total Duration: ~90–110 Seconds
A clean, deterministic, reproducible presentation showcasing real AI reasoning, isolated sandbox execution, and live verification.
