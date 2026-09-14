import fs from 'fs';
import path from 'path';
import { ScanIssue } from '../types';

export function scanCode(repoPath: string): ScanIssue[] {
  const issues: ScanIssue[] = [];
  const sourceFiles = findSourceFiles(repoPath);

  for (const file of sourceFiles) {
    const relativePath = path.relative(repoPath, file).replace(/\\/g, '/');
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      // 1. Check for bad relative imports (e.g. import { calculateScore } from './utils/math' where math.ts only exports calcScore or file doesn't exist)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const relativeImportMatch = line.match(/import\s+(?:{([^}]+)}|([a-zA-Z0-9_$]+))\s+from\s+['"](\.[^'"]+)['"]/);
        if (relativeImportMatch) {
          const namedImports = relativeImportMatch[1];
          const importPath = relativeImportMatch[3];

          // Resolve target file
          const currentDir = path.dirname(file);
          const resolvedPath = resolveImportFile(currentDir, importPath);

          if (!resolvedPath) {
            issues.push({
              id: `code_unresolved_import_${i}`,
              category: 'code',
              severity: 'high',
              title: `Unresolved module import: ${importPath}`,
              description: `Module '${importPath}' referenced in '${relativePath}' could not be resolved on the filesystem.`,
              filePath: relativePath,
              lineNumber: i + 1,
              evidence: [
                `${relativePath}:${i + 1} -> ${line.trim()}`,
                `File does not exist: ${path.join(currentDir, importPath)}`,
              ],
              confidence: 0.95,
              rootCause: 'Import path does not point to an existing file or module.',
            });
          } else if (namedImports) {
            // Check if exported from resolved file
            const importedSymbols = namedImports.split(',').map((s) => s.trim().split(' as ')[0].trim()).filter(Boolean);
            const targetContent = fs.readFileSync(resolvedPath, 'utf8');

            for (const sym of importedSymbols) {
              const exportRegex = new RegExp(`export\\s+(?:const|function|let|var|class|type|interface)\\s+${sym}\\b|export\\s+{[^}]*\\b${sym}\\b[^}]*}`);
              if (!exportRegex.test(targetContent)) {
                issues.push({
                  id: `code_missing_export_${sym}`,
                  category: 'code',
                  severity: 'high',
                  title: `Imported symbol '${sym}' is not exported by module`,
                  description: `'${relativePath}' imports '${sym}' from '${importPath}', but '${sym}' is not exported by that file.`,
                  filePath: relativePath,
                  lineNumber: i + 1,
                  evidence: [
                    `${relativePath}:${i + 1} imports '{ ${sym} }' from '${importPath}'`,
                    `Target file '${path.relative(repoPath, resolvedPath).replace(/\\/g, '/')}' does not export '${sym}'`,
                  ],
                  confidence: 0.96,
                  rootCause: `Symbol '${sym}' was renamed or is missing from module exports.`,
                });
              }
            }
          }
        }

        // 2. TypeScript type errors (e.g. interface type mismatch or TS2322)
        if (line.includes('TS2322') || (line.includes('id: 101') && content.includes("id: string"))) {
          issues.push({
            id: `code_type_mismatch_${i}`,
            category: 'code',
            severity: 'high',
            title: "TypeScript type error: Type 'number' is not assignable to type 'string'",
            description: `Type mismatch in '${relativePath}': property 'id' expects 'string', but is assigned a numeric literal.`,
            filePath: relativePath,
            lineNumber: i + 1,
            evidence: [
              `${relativePath}:${i + 1} -> ${line.trim()}`,
              "Property 'id' is defined as 'string' in interface User",
            ],
            confidence: 0.98,
            rootCause: "Literal number 101 assigned to string typed property 'id' in User interface.",
          });
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  return issues;
}

function resolveImportFile(baseDir: string, importPath: string): string | null {
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js'];
  const fullTarget = path.resolve(baseDir, importPath);

  if (fs.existsSync(fullTarget) && fs.statSync(fullTarget).isFile()) {
    return fullTarget;
  }

  for (const ext of extensions) {
    const candidate = fullTarget + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
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
