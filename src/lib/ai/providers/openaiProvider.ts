import {
  AIProvider,
  DiagnosisInput,
  DiagnosisOutput,
  PlanningInput,
  PlanningOutput,
  PatchInput,
  PatchOutput,
  PatchReviewInput,
  PatchReviewOutput,
} from './interface';
import { HeuristicAIProvider } from './heuristicProvider';
import { DIAGNOSIS_PROMPT, PLANNING_PROMPT, PATCH_PROMPT, REVIEW_PROMPT } from '../prompts';
import { createUnifiedDiff } from '../diffUtil';
import { logger } from '../../logger';

export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private baseURL: string;
  private model: string;
  private fallback: HeuristicAIProvider;

  constructor() {
    this.apiKey = process.env.AI_API_KEY || '';
    this.baseURL = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
    this.model = process.env.AI_MODEL || 'gpt-4o-mini';
    this.fallback = new HeuristicAIProvider();
  }

  private hasLiveApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  private async callChatCompletion(systemPrompt: string, userPrompt: string): Promise<any> {
    const res = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    return JSON.parse(content);
  }

  async diagnose(input: DiagnosisInput): Promise<DiagnosisOutput> {
    if (!this.hasLiveApiKey()) {
      return this.fallback.diagnose(input);
    }

    try {
      logger.ai(`Querying live LLM for diagnosis...`);
      const userMessage = JSON.stringify({
        issue: input.issue,
        fileContentSnippet: input.fileContent ? input.fileContent.slice(0, 1500) : undefined,
        packageJsonSnippet: input.packageJson ? JSON.stringify(input.packageJson).slice(0, 1000) : undefined,
        previousAttempts: input.previousAttempts,
      });

      const parsed = await this.callChatCompletion(DIAGNOSIS_PROMPT, userMessage);
      return {
        rootCause: parsed.rootCause || input.issue.description,
        severity: parsed.severity || (input.issue.severity as any),
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.95,
        affectedFiles: Array.isArray(parsed.affectedFiles) ? parsed.affectedFiles : [input.issue.filePath || 'package.json'],
        evidence: Array.isArray(parsed.evidence) ? parsed.evidence : input.issue.evidence,
        recommendedStrategy: parsed.recommendedStrategy || 'patch_code',
      };
    } catch (err: any) {
      logger.ai(`Live LLM call failed (${err.message}). Falling back to heuristic engine.`);
      return this.fallback.diagnose(input);
    }
  }

  async plan(input: PlanningInput): Promise<PlanningOutput> {
    if (!this.hasLiveApiKey()) {
      return this.fallback.plan(input);
    }

    try {
      logger.ai(`Querying live LLM for planning...`);
      const userMessage = JSON.stringify(input);
      const parsed = await this.callChatCompletion(PLANNING_PROMPT, userMessage);
      return {
        strategy: parsed.strategy || input.diagnosis.recommendedStrategy,
        steps: Array.isArray(parsed.steps) ? parsed.steps : ['Apply patch', 'Run verification'],
        risk: parsed.risk || 'low',
        expectedOutcome: parsed.expectedOutcome || 'Build and test verification pass',
      };
    } catch (err: any) {
      logger.ai(`Live LLM planning failed (${err.message}). Falling back to heuristic engine.`);
      return this.fallback.plan(input);
    }
  }

  async generatePatch(input: PatchInput): Promise<PatchOutput> {
    if (!this.hasLiveApiKey()) {
      return this.fallback.generatePatch(input);
    }

    try {
      logger.ai(`Querying live LLM for patch generation...`);
      const userMessage = JSON.stringify({
        diagnosis: input.diagnosis,
        plan: input.plan,
        filePath: input.filePath,
        fileContent: input.fileContent,
      });

      const parsed = await this.callChatCompletion(PATCH_PROMPT, userMessage);
      const newContent = parsed.newContent || input.fileContent;
      const diff = createUnifiedDiff(input.filePath, input.fileContent, newContent);

      return {
        filePath: input.filePath,
        operation: input.fileContent ? 'modify' : 'create',
        oldContent: input.fileContent,
        newContent,
        diff,
        reason: parsed.reason || 'Minimal AI patch addressing verified root cause',
      };
    } catch (err: any) {
      logger.ai(`Live LLM patch generation failed (${err.message}). Falling back to heuristic engine.`);
      return this.fallback.generatePatch(input);
    }
  }

  async reviewPatch(input: PatchReviewInput): Promise<PatchReviewOutput> {
    if (!this.hasLiveApiKey()) {
      return this.fallback.reviewPatch(input);
    }

    try {
      logger.ai(`Querying live LLM for patch review...`);
      const userMessage = JSON.stringify({
        diagnosis: input.diagnosis,
        diff: input.patch.diff,
        reason: input.patch.reason,
      });

      const parsed = await this.callChatCompletion(REVIEW_PROMPT, userMessage);
      return {
        approved: typeof parsed.approved === 'boolean' ? parsed.approved : true,
        risk: parsed.risk || 'low',
        reason: parsed.reason || 'Patch safely approved by AI review.',
      };
    } catch (err: any) {
      logger.ai(`Live LLM review failed (${err.message}). Falling back to heuristic engine.`);
      return this.fallback.reviewPatch(input);
    }
  }
}

export const aiProvider = new OpenAIProvider();
