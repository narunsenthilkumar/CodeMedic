export interface DiagnosisInput {
  issue: {
    id: string;
    category: string;
    severity: string;
    title: string;
    description: string;
    filePath?: string;
    lineNumber?: number;
    evidence: string[];
    confidence: number;
    rootCause?: string;
  };
  fileContent?: string;
  packageJson?: any;
  buildLogs?: string;
  testLogs?: string;
  previousAttempts?: Array<{
    patch: string;
    verificationError: string;
  }>;
}

export interface DiagnosisOutput {
  rootCause: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  affectedFiles: string[];
  evidence: string[];
  recommendedStrategy: string;
}

export interface PlanningInput {
  diagnosis: DiagnosisOutput;
  repositoryContext: {
    language: string;
    framework: string;
    packageManager: string;
  };
}

export interface PlanningOutput {
  strategy: string;
  steps: string[];
  risk: 'low' | 'medium' | 'high';
  expectedOutcome: string;
}

export interface PatchInput {
  diagnosis: DiagnosisOutput;
  plan: PlanningOutput;
  filePath: string;
  fileContent: string;
  packageJsonContent?: string;
}

export interface PatchOutput {
  filePath: string;
  operation: 'modify' | 'create';
  oldContent: string;
  newContent: string;
  diff: string;
  reason: string;
}

export interface PatchReviewInput {
  diagnosis: DiagnosisOutput;
  patch: PatchOutput;
}

export interface PatchReviewOutput {
  approved: boolean;
  risk: 'low' | 'medium' | 'high';
  reason: string;
}

export interface AIProvider {
  diagnose(input: DiagnosisInput): Promise<DiagnosisOutput>;
  plan(input: PlanningInput): Promise<PlanningOutput>;
  generatePatch(input: PatchInput): Promise<PatchOutput>;
  reviewPatch(input: PatchReviewInput): Promise<PatchReviewOutput>;
}
