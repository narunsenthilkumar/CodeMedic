import { aiProvider } from '../providers/openaiProvider';
import { DiagnosisInput, DiagnosisOutput } from '../providers/interface';
import { logger } from '../../logger';

export class DiagnosticianAgent {
  async diagnose(input: DiagnosisInput): Promise<DiagnosisOutput> {
    logger.ai(`DiagnosticianAgent initiating root cause analysis for ${input.issue.title}`);
    const result = await aiProvider.diagnose(input);

    // Sanitize confidence
    result.confidence = Math.max(0.1, Math.min(1.0, result.confidence));

    // Ensure affected files is not empty
    if (!result.affectedFiles || result.affectedFiles.length === 0) {
      result.affectedFiles = input.issue.filePath ? [input.issue.filePath] : ['package.json'];
    }

    logger.ai(`Diagnostician identified root cause with ${(result.confidence * 100).toFixed(0)}% confidence: ${result.rootCause}`);
    return result;
  }
}

export const diagnosticianAgent = new DiagnosticianAgent();
