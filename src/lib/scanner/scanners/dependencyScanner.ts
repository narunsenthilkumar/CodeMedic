import fs from 'fs';
import path from 'path';
import { ScanIssue } from '../types';

const BUILTIN_NODE_MODULES = new Set([
  'fs', 'path', 'os', 'http', 'https', 'url', 'crypto', 'stream', 'events',
  'util', 'buffer', 'child_process', 'cluster', 'dgram', 'dns', 'net',
  'readline', 'repl', 'tls', 'tty', 'v8', 'vm', 'worker_threads', 'zlib',
  'node:fs', 'node:path', 'node:os', 'node:http', 'node:https', 'node:url',
  'node:crypto', 'node:stream', 'node:events', 'node:util', 'node:buffer',
  'node:child_process', 'node:net', 'node:test'
]);

export function scanDependencies(repoPath: string): ScanIssue[] {
  const issues: ScanIssue[] = [];
  const pkgPath = path.join(repoPath, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    issues.push({
      id: 'dep_missing_pkg_json',
      category: 'dependency',
      severity: 'critical',
      title: 'Missing package.json',
      description: 'The repository does not contain a package.json manifest file.',
      evidence: ['package.json was not found at repository root'],
      confidence: 1.0,
      rootCause: 'Repository missing node manifest',
    });
    return issues;
  }

  let declaredDeps = new Set<string>();
  try {
    const raw = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(raw);
    declaredDeps = new Set([
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ]);
  } catch {
    issues.push({
      id: 'dep_invalid_pkg_json',
      category: 'dependency',
      severity: 'high',
      title: 'Invalid package.json format',
      description: 'package.json contains invalid JSON syntax and cannot be parsed.',
      evidence: ['JSON.parse failed on package.json'],
      confidence: 1.0,
      rootCause: 'Malformed JSON in package.json',
    });
    return issues;
  }

  // Scan all source files for external imports
  const sourceFiles = findSourceFiles(repoPath);
  const foundMissing = new Map<string, { file: string; line: number }>();

  for (const file of sourceFiles) {
    const relativeFile = path.relative(repoPath, file).replace(/\\/g, '/');
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Match import ... from 'package' or require('package')
        const importMatch = line.match(/(?:import\s+.*?from\s+['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\))/);
        if (importMatch) {
          const specifier = importMatch[1] || importMatch[2];
          if (!specifier) continue;

          // Ignore relative imports and absolute alias imports
          if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('@/')) {
            continue;
          }

          // Extract base package name (e.g. '@types/node' or 'axios' or 'lodash/get')
          const packageName = getBasePackageName(specifier);

          if (!BUILTIN_NODE_MODULES.has(packageName) && !declaredDeps.has(packageName)) {
            if (!foundMissing.has(packageName)) {
              foundMissing.set(packageName, { file: relativeFile, line: i + 1 });
            }
          }
        }
      }
    } catch {
      // Ignore read errors for inaccessible files
    }
  }

  for (const [pkgName, loc] of Array.from(foundMissing.entries())) {
    issues.push({
      id: `dep_missing_${pkgName.replace(/[^a-zA-Z0-9]/g, '_')}`,
      category: 'dependency',
      severity: 'high',
      title: `Missing dependency: ${pkgName}`,
      description: `Package '${pkgName}' is imported in '${loc.file}' but is not declared in package.json dependencies.`,
      filePath: loc.file,
      lineNumber: loc.line,
      evidence: [
        `${loc.file}:${loc.line} imports '${pkgName}'`,
        `package.json dependencies do not declare '${pkgName}'`,
      ],
      confidence: 0.96,
      rootCause: `Package '${pkgName}' required by source code was never installed or added to dependencies.`,
    });
  }

  return issues;
}

function getBasePackageName(specifier: string): string {
  if (specifier.startsWith('@')) {
    const parts = specifier.split('/');
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : specifier;
  }
  return specifier.split('/')[0];
}

function findSourceFiles(dir: string, files: string[] = []): string[] {
  if (files.length > 500) return files;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (['node_modules', '.git', '.next', 'dist', 'out', '.workspaces', 'build'].includes(entry.name)) {
        continue;
      }
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        findSourceFiles(full, files);
      } else if (/\.(js|jsx|ts|tsx|mjs|cjs)$/.test(entry.name)) {
        files.push(full);
      }
    }
  } catch {
    // Ignore access errors
  }
  return files;
}
