import fs from 'fs';
import path from 'path';
import { ScanIssue } from '../types';
import { redactSecrets } from '../../logger';

interface SecretRule {
  name: string;
  pattern: RegExp;
  severity: 'critical' | 'high' | 'medium';
  confidence: number;
}

const SECRET_RULES: SecretRule[] = [
  {
    name: 'OpenAI Secret Key',
    pattern: /sk-[a-zA-Z0-9_-]{20,}/g,
    severity: 'critical',
    confidence: 0.98,
  },
  {
    name: 'GitHub Personal Access Token',
    pattern: /(?:ghp_[a-zA-Z0-9]{30,}|github_pat_[a-zA-Z0-9_-]{22,})/g,
    severity: 'critical',
    confidence: 0.99,
  },
  {
    name: 'Hardcoded Private Key',
    pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g,
    severity: 'critical',
    confidence: 0.99,
  },
  {
    name: 'AWS Access Key ID',
    pattern: /(?:AKIA[0-9A-Z]{16})/g,
    severity: 'high',
    confidence: 0.95,
  },
  {
    name: 'Hardcoded API Secret Pattern',
    pattern: /(?:api_secret|app_secret|secret_key|auth_token)\s*[:=]\s*['"][a-zA-Z0-9_-]{16,}['"]/gi,
    severity: 'high',
    confidence: 0.88,
  },
];

export function scanSecurity(repoPath: string): ScanIssue[] {
  const issues: ScanIssue[] = [];
  const files = findTrackedFiles(repoPath);

  for (const file of files) {
    const relativePath = path.relative(repoPath, file).replace(/\\/g, '/');
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        for (const rule of SECRET_RULES) {
          rule.pattern.lastIndex = 0;
          if (rule.pattern.test(line)) {
            // Mask the evidence completely!
            const redactedLine = redactSecrets(line.trim());

            issues.push({
              id: `sec_${rule.name.toLowerCase().replace(/\s+/g, '_')}_${issues.length}`,
              category: 'security',
              severity: rule.severity,
              title: `Probable hardcoded credential: ${rule.name}`,
              description: `A likely hardcoded credential (${rule.name}) was detected in '${relativePath}'. This poses a security risk if committed to version control. [CodeMedic MVP Scanner]`,
              filePath: relativePath,
              lineNumber: i + 1,
              evidence: [
                `File: ${relativePath}:${i + 1}`,
                `Pattern matched: ${rule.name}`,
                `Masked snippet: ${redactedLine}`,
              ],
              confidence: rule.confidence,
              rootCause: 'Sensitive credential committed directly in source code instead of environment variables.',
            });
          }
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  return issues;
}

function findTrackedFiles(dir: string, files: string[] = []): string[] {
  if (files.length > 300) return files;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (['node_modules', '.git', '.next', 'dist', 'out', '.workspaces', 'coverage', 'build'].includes(entry.name)) {
        continue;
      }
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        findTrackedFiles(full, files);
      } else if (/\.(js|jsx|ts|tsx|json|env|yml|yaml|md|txt)$/.test(entry.name)) {
        files.push(full);
      }
    }
  } catch {
    // Ignore
  }
  return files;
}
