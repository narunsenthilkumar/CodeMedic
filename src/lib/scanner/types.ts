export type IssueCategory =
  | 'build'
  | 'dependency'
  | 'code'
  | 'security'
  | 'test'
  | 'configuration';

export type IssueSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'info';

export interface ScanIssue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  filePath?: string;
  lineNumber?: number;
  evidence: string[];
  confidence: number; // 0.0 to 1.0
  rootCause?: string;
  priority?: number; // 0 to 100
}

export interface ProjectMetadata {
  language: string;
  framework: string;
  packageManager: 'npm' | 'yarn' | 'pnpm';
  hasTypeScript: boolean;
  testFramework?: 'vitest' | 'jest' | 'mocha' | 'none';
  buildScript?: string;
  testScript?: string;
  lintScript?: string;
  hasEnvExample: boolean;
  totalFiles: number;
  dependenciesCount: number;
  packageJsonRaw?: any;
}

export interface HealthScoreBreakdown {
  overall: number;
  build: number;
  dependencies: number;
  codeQuality: number;
  security: number;
  tests: number;
  formulaDescription: string;
}

export interface ScannerResult {
  category: IssueCategory;
  issues: ScanIssue[];
  rawOutput?: string;
  durationMs: number;
}
