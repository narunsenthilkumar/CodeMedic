import { aiProvider } from '../providers/openaiProvider';
import { PatchReviewInput, PatchReviewOutput } from '../providers/interface';
import { logger } from '../../logger';

export class PatchReviewAgent {
  async review(input: PatchReviewInput): Promise<PatchReviewOutput> {
    logger.ai(`PatchReviewAgent performing pre-approval safety audit on ${input.patch.filePath}`);
    const review = await aiProvider.reviewPatch(input);

    logger.ai(`Patch review result: ${review.approved ? 'APPROVED' : 'REJECTED'} (Risk: ${review.risk}) - ${review.reason}`);
    return review;
  }
}

export const patchReviewAgent = new PatchReviewAgent();
