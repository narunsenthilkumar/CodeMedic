import fs from 'fs';
import path from 'path';
import { ProjectMetadata } from './types';

export function analyzeProjectMetadata(repoPath: string): ProjectMetadata {
  const metadata: ProjectMetadata = {
    language: 'JavaScript',
    framework: 'Node.js',
    packageManager: 'npm',
    hasTypeScript: false,
    testFramework: 'none',
    hasEnvExample: false,
    totalFiles: 0,
    dependenciesCount: 0,
  };

  if (!fs.existsSync(repoPath)) {
    return metadata;
  }

  // Count files recursively (excluding node_modules, .git, .next)
  metadata.totalFiles = countFiles(repoPath);

  // Check package.json
  const pkgPath = path.join(repoPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const raw = fs.readFileSync(pkgPath, 'utf8');
      const pkg = JSON.parse(raw);
      metadata.packageJsonRaw = pkg;

      const deps = Object.keys(pkg.dependencies || {});
      const devDeps = Object.keys(pkg.devDependencies || {});
      const allDeps = [...deps, ...devDeps];
      metadata.dependenciesCount = allDeps.length;

      // Detect TypeScript
      if (allDeps.includes('typescript') || fs.existsSync(path.join(repoPath, 'tsconfig.json'))) {
        metadata.hasTypeScript = true;
        metadata.language = 'TypeScript';
      }

      // Detect Framework
      if (allDeps.includes('next') || fs.existsSync(path.join(repoPath, 'next.config.js')) || fs.existsSync(path.join(repoPath, 'next.config.mjs'))) {
        metadata.framework = 'Next.js';
      } else if (allDeps.includes('vite') || fs.existsSync(path.join(repoPath, 'vite.config.ts')) || fs.existsSync(path.join(repoPath, 'vite.config.js'))) {
        metadata.framework = 'Vite';
      } else if (allDeps.includes('react')) {
        metadata.framework = 'React';
      } else if (allDeps.includes('express')) {
        metadata.framework = 'Express';
      }

      // Detect Test Framework
      if (allDeps.includes('vitest')) {
        metadata.testFramework = 'vitest';
      } else if (allDeps.includes('jest')) {
        metadata.testFramework = 'jest';
      } else if (allDeps.includes('mocha')) {
        metadata.testFramework = 'mocha';
      }

      // Detect scripts
      if (pkg.scripts) {
        if (pkg.scripts.build) metadata.buildScript = pkg.scripts.build;
        if (pkg.scripts.test) metadata.testScript = pkg.scripts.test;
        if (pkg.scripts.lint) metadata.lintScript = pkg.scripts.lint;
      }
    } catch {
      // Invalid or unparseable package.json
    }
  }

  // Detect Lockfile & Package Manager
  if (fs.existsSync(path.join(repoPath, 'pnpm-lock.yaml'))) {
    metadata.packageManager = 'pnpm';
  } else if (fs.existsSync(path.join(repoPath, 'yarn.lock'))) {
    metadata.packageManager = 'yarn';
  } else {
    metadata.packageManager = 'npm';
  }

  // Detect .env.example
  if (fs.existsSync(path.join(repoPath, '.env.example'))) {
    metadata.hasEnvExample = true;
  }

  return metadata;
}

function countFiles(dir: string, currentCount = 0): number {
  if (currentCount > 2000) return currentCount; // limit recursion
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let count = currentCount;
    for (const entry of entries) {
      if (['node_modules', '.git', '.next', 'dist', 'out', '.workspaces'].includes(entry.name)) {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        count = countFiles(fullPath, count);
      } else {
        count += 1;
      }
    }
    return count;
  } catch {
    return currentCount;
  }
}
