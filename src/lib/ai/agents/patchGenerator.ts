import { aiProvider } from '../providers/openaiProvider';
import { PatchInput, PatchOutput } from '../providers/interface';
import { logger } from '../../logger';

export class PatchGeneratorAgent {
  async generatePatch(input: PatchInput): Promise<PatchOutput> {
    logger.ai(`PatchGeneratorAgent synthesizing unified patch for ${input.filePath}`);
    const patch = await aiProvider.generatePatch(input);

    logger.ai(`Patch generated. File operation: ${patch.operation} on ${patch.filePath}`);
    return patch;
  }
}

export const patchGeneratorAgent = new PatchGeneratorAgent();
