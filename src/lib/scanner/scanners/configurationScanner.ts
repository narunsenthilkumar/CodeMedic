import fs from 'fs';
import path from 'path';
import { ScanIssue } from '../types';

export function scanConfiguration(repoPath: string): ScanIssue[] {
  const issues: ScanIssue[] = [];

  // 1. Check for .env.example
  const hasEnvExample =
    fs.existsSync(path.join(repoPath, '.env.example')) ||
    fs.existsSync(path.join(repoPath, '.env.sample')) ||
    fs.existsSync(path.join(repoPath, '.env.template'));

  // Scan source code for references to process.env.XYZ
  const envReferences = new Set<string>();
  const sourceFiles = findSourceFiles(repoPath);

  for (const file of sourceFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.matchAll(/process\.env\.([A-Z0-9_]+)/g);
      for (const m of matches) {
        if (m[1] && !['NODE_ENV', 'PORT', 'PATH'].includes(m[1])) {
          envReferences.add(m[1]);
        }
      }
    } catch {
      // Ignore
    }
  }

  // If environment variables are used in code, check if documented in .env.example
  if (envReferences.size > 0 && !hasEnvExample) {
    issues.push({
      id: 'cfg_missing_env_example',
      category: 'configuration',
      severity: 'medium',
      title: 'Missing .env.example template',
      description: `The project references environment variables (${Array.from(envReferences).slice(0, 3).join(', ')}...) in code, but lacks a .env.example file documenting them for developers.`,
      evidence: [
        'No .env.example found in repository root',
        `Variables detected in code: ${Array.from(envReferences).join(', ')}`,
      ],
      confidence: 0.95,
      rootCause: 'Repository lacks documentation for required environment configuration variables.',
    });
  }

  // 2. Check for committed raw .env file with secrets
  const committedEnv = path.join(repoPath, '.env');
  if (fs.existsSync(committedEnv)) {
    // Check if .env is in .gitignore
    const gitignorePath = path.join(repoPath, '.gitignore');
    const isIgnored =
      fs.existsSync(gitignorePath) &&
      fs.readFileSync(gitignorePath, 'utf8').includes('.env');

    if (!isIgnored) {
      issues.push({
        id: 'cfg_uncommitted_env_in_git',
        category: 'configuration',
        severity: 'high',
        title: 'Tracked .env file in repository',
        description: 'A .env file is present and not excluded in .gitignore, risking accidental credential leakage.',
        filePath: '.env',
        evidence: [
          '.env file exists in repository root',
          '.gitignore does not contain .env exclusion',
        ],
        confidence: 0.92,
        rootCause: '.env configuration file is not protected in .gitignore.',
      });
    }
  }

  return issues;
}

function findSourceFiles(dir: string, files: string[] = []): string[] {
  if (files.length > 300) return files;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (['node_modules', '.git', '.next', 'dist', 'out', '.workspaces', 'build'].includes(entry.name)) {
        continue;
      }
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        findSourceFiles(full, files);
      } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
        files.push(full);
      }
    }
  } catch {
    // Ignore
  }
  return files;
}
