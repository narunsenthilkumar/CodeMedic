import { aiProvider } from '../providers/openaiProvider';
import { PlanningInput, PlanningOutput } from '../providers/interface';
import { logger } from '../../logger';

export class PlannerAgent {
  async plan(input: PlanningInput): Promise<PlanningOutput> {
    logger.ai(`PlannerAgent constructing minimal reversible steps for strategy: ${input.diagnosis.recommendedStrategy}`);
    const plan = await aiProvider.plan(input);

    if (!plan.steps || plan.steps.length === 0) {
      plan.steps = ['Apply targeted fix', 'Run verification test suite', 'Verify build'];
    }

    logger.ai(`Planner produced ${plan.steps.length} steps (Risk: ${plan.risk})`);
    return plan;
  }
}

export const plannerAgent = new PlannerAgent();
